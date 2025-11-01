'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import MobileNav from '@/components/ui/mobile-nav'
import { useAuth } from '@/components/providers/auth-provider'
import { useFeatureFlag } from '@/hooks/use-feature-flag'
import { useAppStore } from '@/lib/store'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  apiClient,
  type Organization,
  type FirebaseAuthConfig,
  type UpdateFirebaseAuthConfigData
} from '@/lib/api'

type AuthProvider = 'firebase' | 'google' | 'apple'

function AuthSettingsContent() {
  const { user, session, signOut } = useAuth()
  const { addNotification } = useAppStore()
  const queryClient = useQueryClient()
  const searchParams = useSearchParams()
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null)
  const [activeProvider, setActiveProvider] = useState<AuthProvider>('firebase')

  // Feature flags for auth providers
  const { value: googleAuthEnabled } = useFeatureFlag('googleAuthConfig', false)
  const { value: appleAuthEnabled } = useFeatureFlag('appleAuthConfig', false)

  // Firebase form state
  const [projectId, setProjectId] = useState('')
  const [webApiKey, setWebApiKey] = useState('')
  const [serviceAccount, setServiceAccount] = useState('')
  const [oauthEnabled, setOauthEnabled] = useState(false)
  const [showApiKey, setShowApiKey] = useState(false)
  const [isDirty, setIsDirty] = useState(false)

  // File upload
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [fileName, setFileName] = useState<string>('')

  // Validation state
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSaving, setIsSaving] = useState(false)
  const [configStatus, setConfigStatus] = useState<'none' | 'partial' | 'complete'>('none')

  // Fetch all organizations
  const { data: organizations = [], isLoading: organizationsLoading } = useQuery<Organization[]>({
    queryKey: ['organizations', user?.id],
    queryFn: () => apiClient.getOrganizations(session?.access_token),
    enabled: !!user?.id && !!session?.access_token,
  })

  // Auto-select organization based on URL parameter or first organization
  useEffect(() => {
    if (organizations && organizations.length > 0 && !selectedOrg) {
      const selectedId = searchParams.get('org')
      if (selectedId) {
        // Find organization by ID from URL parameter
        const org = organizations.find(o => o.id === selectedId)
        if (org) {
          setSelectedOrg(org)
        } else {
          // Fallback to first organization if ID not found
          setSelectedOrg(organizations[0])
        }
      } else {
        // No URL parameter, select first organization
        setSelectedOrg(organizations[0])
      }
    }
  }, [organizations, selectedOrg, searchParams])

  // Fetch the full organization details with Firebase fields for selected org
  const { data: organization, isLoading: orgLoading, error: orgError } = useQuery({
    queryKey: ['auth-settings-organization', selectedOrg?.id],
    queryFn: async (): Promise<Organization> => {
      if (!selectedOrg?.id) {
        throw new Error('No organization selected')
      }
      console.log('Fetching organization data for ID:', selectedOrg.id)
      const org = await apiClient.getOrganization(selectedOrg.id, session?.access_token)
      console.log('Raw organization response:', org)
      return org
    },
    enabled: !!session?.access_token && !!selectedOrg?.id,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    staleTime: 0, // Always fetch fresh data
    gcTime: 0, // Don't cache
  })

  // Debug organization data
  useEffect(() => {
    if (organization) {
      console.log('Organization state updated:', {
        fullObject: organization,
        hasFirebaseProjectId: !!organization.firebase_project_id,
        hasFirebaseWebApiKey: !!organization.firebase_web_api_key,
        hasFirebaseServiceAccount: !!organization.firebase_service_account,
        hasOauthEnabled: organization.oauth_enabled !== undefined
      })
    }
    if (orgError) {
      console.error('Organization fetch error:', orgError)
    }
  }, [organization, orgError])

  // Load existing configuration
  useEffect(() => {
    if (organization) {
      console.log('Loading Firebase config from organization:', {
        firebase_project_id: organization.firebase_project_id,
        firebase_web_api_key: organization.firebase_web_api_key,
        firebase_service_account: organization.firebase_service_account ? 'Present' : 'Missing',
        oauth_enabled: organization.oauth_enabled
      })

      // Always set values from organization (use empty string if undefined)
      setProjectId(organization.firebase_project_id || '')
      setWebApiKey(organization.firebase_web_api_key || '')
      setServiceAccount(organization.firebase_service_account || '')
      setOauthEnabled(organization.oauth_enabled || false)

      if (organization.firebase_service_account) {
        setFileName('service-account.json')
      } else {
        setFileName('')
      }

      // Determine configuration status
      const hasProjectId = !!organization.firebase_project_id
      const hasWebApiKey = !!organization.firebase_web_api_key
      const hasServiceAccount = !!organization.firebase_service_account

      if (hasProjectId && hasWebApiKey && hasServiceAccount) {
        setConfigStatus('complete')
      } else if (hasProjectId || hasWebApiKey || hasServiceAccount) {
        setConfigStatus('partial')
      } else {
        setConfigStatus('none')
      }
    }
  }, [organization])

  // Track form changes
  useEffect(() => {
    if (organization) {
      const hasChanges =
        projectId !== (organization.firebase_project_id || '') ||
        webApiKey !== (organization.firebase_web_api_key || '') ||
        serviceAccount !== (organization.firebase_service_account || '') ||
        oauthEnabled !== (organization.oauth_enabled || false)

      setIsDirty(hasChanges)
    }
  }, [projectId, webApiKey, serviceAccount, oauthEnabled, organization])

  // File upload handler
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.json')) {
      setErrors(prev => ({
        ...prev,
        serviceAccount: 'Please upload a valid JSON file'
      }))
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const parsed = JSON.parse(content)

        // Validate required Firebase service account fields
        if (!parsed.type || !parsed.project_id || !parsed.private_key || !parsed.client_email) {
          setErrors(prev => ({
            ...prev,
            serviceAccount: 'Invalid Firebase service account JSON. Missing required fields.'
          }))
          return
        }

        setServiceAccount(content)
        setFileName(file.name)
        setErrors(prev => {
          const newErrors = { ...prev }
          delete newErrors.serviceAccount
          return newErrors
        })

        // Auto-fill project ID if empty
        if (!projectId && parsed.project_id) {
          setProjectId(parsed.project_id)
        }
      } catch (error) {
        setErrors(prev => ({
          ...prev,
          serviceAccount: 'Invalid JSON format'
        }))
      }
    }
    reader.readAsText(file)
  }

  // Validation
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (projectId && !/^[a-z0-9-]+$/.test(projectId)) {
      newErrors.projectId = 'Project ID must contain only lowercase letters, numbers, and hyphens'
    }

    if (projectId && projectId.length < 6) {
      newErrors.projectId = 'Project ID must be at least 6 characters'
    }

    if (webApiKey && webApiKey.length < 20) {
      newErrors.webApiKey = 'Web API Key appears to be invalid (too short)'
    }

    if (serviceAccount) {
      try {
        JSON.parse(serviceAccount)
      } catch {
        newErrors.serviceAccount = 'Service account must be valid JSON'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Update mutation
  const updateConfigMutation = useMutation({
    mutationFn: async (data: UpdateFirebaseAuthConfigData) => {
      if (!organization?.id) {
        throw new Error('No organization selected')
      }
      return apiClient.updateFirebaseAuthConfig(organization.id, data, session?.access_token)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-organization'] })
      addNotification({
        type: 'success',
        title: 'Configuration Updated',
        message: 'Firebase authentication configuration updated successfully'
      })
      setIsDirty(false)
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Update Failed',
        message: error.message || 'Failed to update Firebase configuration'
      })
    }
  })

  // Delete mutation
  const deleteConfigMutation = useMutation({
    mutationFn: async () => {
      if (!organization?.id) {
        throw new Error('No organization selected')
      }
      return apiClient.deleteFirebaseAuthConfig(organization.id, session?.access_token)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-organization'] })
      setProjectId('')
      setWebApiKey('')
      setServiceAccount('')
      setOauthEnabled(false)
      setFileName('')
      setConfigStatus('none')
      addNotification({
        type: 'success',
        title: 'Configuration Removed',
        message: 'Firebase authentication configuration removed'
      })
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Removal Failed',
        message: error.message || 'Failed to remove Firebase configuration'
      })
    }
  })

  const handleSave = async () => {
    if (!validateForm()) return

    setIsSaving(true)

    const data: UpdateFirebaseAuthConfigData = {}

    if (projectId) data.firebase_project_id = projectId
    if (webApiKey) data.firebase_web_api_key = webApiKey
    if (serviceAccount) data.firebase_service_account = serviceAccount
    data.oauth_enabled = oauthEnabled

    await updateConfigMutation.mutateAsync(data)
    setIsSaving(false)
  }

  const handleReset = () => {
    if (organization) {
      setProjectId(organization.firebase_project_id || '')
      setWebApiKey(organization.firebase_web_api_key || '')
      setServiceAccount(organization.firebase_service_account || '')
      setOauthEnabled(organization.oauth_enabled || false)
      setFileName(organization.firebase_service_account ? 'service-account.json' : '')
      setErrors({})
      setIsDirty(false)
    }
  }

  const handleRemoveConfig = async () => {
    if (confirm('Are you sure you want to remove the Firebase authentication configuration? This action cannot be undone.')) {
      await deleteConfigMutation.mutateAsync()
    }
  }

  if (orgLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="text-gray-400">Loading organization...</div>
      </div>
    )
  }

  if (orgError || !organization) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="text-center">
          <div className="text-red-400 mb-2">Failed to load organization</div>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      addNotification({
        type: 'success',
        title: 'Signed Out',
        message: 'You have been signed out successfully'
      })
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Sign Out Failed',
        message: 'Failed to sign out. Please try again.'
      })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <MobileNav
        currentPage="auth-settings"
        user={user}
        onSignOut={handleSignOut}
      />

      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Link>
              <h1 className="text-2xl font-bold text-white">Authentication Settings</h1>

              {/* Organization Selector */}
              {organizations.length > 1 && (
                <div className="relative">
                  <select
                    value={selectedOrg?.id || ''}
                    onChange={(e) => {
                      const org = organizations.find(o => o.id === e.target.value)
                      if (org) {
                        setSelectedOrg(org)
                      }
                    }}
                    className="bg-gray-800 border border-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none pr-10"
                  >
                    {organizations.map(org => (
                      <option key={org.id} value={org.id}>
                        {org.name}
                      </option>
                    ))}
                  </select>
                  <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              )}
            </div>

            {/* Configuration Status Badge */}
            <div className="flex items-center space-x-2">
              {configStatus === 'complete' && (
                <span className="px-3 py-1 bg-green-500/10 border border-green-500/20 text-green-400 rounded-full text-sm font-medium">
                  Configured
                </span>
              )}
              {configStatus === 'partial' && (
                <span className="px-3 py-1 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 rounded-full text-sm font-medium">
                  Incomplete
                </span>
              )}
              {configStatus === 'none' && (
                <span className="px-3 py-1 bg-gray-500/10 border border-gray-500/20 text-gray-400 rounded-full text-sm font-medium">
                  Not Configured
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Organization Display */}
        <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Configuring authentication for</p>
              <p className="text-lg font-semibold text-white">{selectedOrg?.name}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-400">Plan</p>
              <p className="text-sm font-medium text-blue-400 capitalize">{selectedOrg?.plan_tier}</p>
            </div>
          </div>
        </div>

        {/* Provider Tabs */}
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg shadow-xl mb-6">
          <div className="border-b border-gray-700">
            <nav className="flex space-x-1 p-2" aria-label="Auth Providers">
              <button
                onClick={() => setActiveProvider('firebase')}
                className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeProvider === 'firebase'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                }`}
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3.89 15.672L6.255.461A.542.542 0 017.27.288l2.543 4.771zm16.794 3.692l-2.25-14a.54.54 0 00-.919-.295L3.316 19.365l7.856 4.427a1.621 1.621 0 001.588 0zM14.3 7.147l-1.82-3.482a.542.542 0 00-.96 0L3.53 17.984z"/>
                </svg>
                Firebase
                {organization?.firebase_project_id && (
                  <span className="ml-2 w-2 h-2 bg-green-400 rounded-full"></span>
                )}
              </button>

              {googleAuthEnabled && (
                <button
                  onClick={() => setActiveProvider('google')}
                  className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeProvider === 'google'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                  }`}
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Google
                  <span className="ml-2 px-2 py-0.5 bg-gray-700 text-gray-400 text-xs rounded-full">Coming Soon</span>
                </button>
              )}

              {appleAuthEnabled && (
                <button
                  onClick={() => setActiveProvider('apple')}
                  className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeProvider === 'apple'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                  }`}
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                  </svg>
                  Apple
                  <span className="ml-2 px-2 py-0.5 bg-gray-700 text-gray-400 text-xs rounded-full">Coming Soon</span>
                </button>
              )}
            </nav>
          </div>

          {/* Info Banner - Dynamic based on provider */}
          <div className="p-4 bg-blue-500/10 border-b border-gray-700">
            <div className="flex items-start space-x-3">
              <svg className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                {activeProvider === 'firebase' && (
                  <>
                    <h3 className="text-sm font-medium text-blue-400 mb-1">Firebase Authentication</h3>
                    <p className="text-sm text-blue-300/80">
                      Configure Firebase authentication for this organization. This allows your users to authenticate using Firebase Auth providers including email/password, phone, and social logins.
                    </p>
                  </>
                )}
                {activeProvider === 'google' && (
                  <>
                    <h3 className="text-sm font-medium text-blue-400 mb-1">Google Sign-In</h3>
                    <p className="text-sm text-blue-300/80">
                      Enable users to sign in with their Google accounts. This provider will be available soon.
                    </p>
                  </>
                )}
                {activeProvider === 'apple' && (
                  <>
                    <h3 className="text-sm font-medium text-blue-400 mb-1">Sign in with Apple</h3>
                    <p className="text-sm text-blue-300/80">
                      Enable users to sign in with their Apple ID. This provider will be available soon.
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Provider Configuration Forms */}
        {activeProvider === 'firebase' && (
          <>
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg shadow-xl">
            <div className="p-6 border-b border-gray-700">
              <h2 className="text-lg font-semibold text-white">Firebase Configuration</h2>
              <p className="text-sm text-gray-400 mt-1">
                Configure your Firebase project settings for authentication
              </p>
            </div>

          <div className="p-6 space-y-6">
            {/* Firebase Project ID */}
            <div>
              <label htmlFor="projectId" className="block text-sm font-medium text-gray-300 mb-2">
                Firebase Project ID
                <span className="text-red-400 ml-1">*</span>
              </label>
              <input
                type="text"
                id="projectId"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value.toLowerCase())}
                className={`w-full px-4 py-2 bg-gray-900/50 border ${
                  errors.projectId ? 'border-red-500' : 'border-gray-600'
                } rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
                placeholder="my-firebase-project"
                aria-invalid={!!errors.projectId}
                aria-describedby={errors.projectId ? 'projectId-error' : undefined}
              />
              {errors.projectId && (
                <p id="projectId-error" className="mt-1 text-sm text-red-400">
                  {errors.projectId}
                </p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Your Firebase project ID (found in Firebase Console → Project Settings)
              </p>
            </div>

            {/* Web API Key */}
            <div>
              <label htmlFor="webApiKey" className="block text-sm font-medium text-gray-300 mb-2">
                Web API Key
                <span className="text-red-400 ml-1">*</span>
              </label>
              <div className="relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  id="webApiKey"
                  value={webApiKey}
                  onChange={(e) => setWebApiKey(e.target.value)}
                  className={`w-full px-4 py-2 pr-12 bg-gray-900/50 border ${
                    errors.webApiKey ? 'border-red-500' : 'border-gray-600'
                  } rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
                  placeholder="AIza..."
                  aria-invalid={!!errors.webApiKey}
                  aria-describedby={errors.webApiKey ? 'webApiKey-error' : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  aria-label={showApiKey ? 'Hide API key' : 'Show API key'}
                >
                  {showApiKey ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.webApiKey && (
                <p id="webApiKey-error" className="mt-1 text-sm text-red-400">
                  {errors.webApiKey}
                </p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Your Firebase web API key for frontend authentication
              </p>
            </div>

            {/* Service Account JSON */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Service Account JSON
                <span className="text-red-400 ml-1">*</span>
              </label>
              <div className="space-y-2">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative border-2 border-dashed ${
                    errors.serviceAccount ? 'border-red-500' : 'border-gray-600'
                  } rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 transition-colors`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="hidden"
                    aria-describedby={errors.serviceAccount ? 'serviceAccount-error' : undefined}
                  />
                  <svg className="mx-auto h-12 w-12 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  {fileName ? (
                    <p className="mt-2 text-sm text-green-400 font-medium">
                      {fileName}
                    </p>
                  ) : (
                    <p className="mt-2 text-sm text-gray-400">
                      Click to upload or drag and drop
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Firebase service account JSON file
                  </p>
                </div>
                {errors.serviceAccount && (
                  <p id="serviceAccount-error" className="text-sm text-red-400">
                    {errors.serviceAccount}
                  </p>
                )}
                {serviceAccount && (
                  <div className="bg-gray-900/50 border border-gray-600 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm text-gray-300">Service account configured</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setServiceAccount('')
                          setFileName('')
                          if (fileInputRef.current) {
                            fileInputRef.current.value = ''
                          }
                        }}
                        className="text-xs text-red-400 hover:text-red-300 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Download from Firebase Console → Project Settings → Service Accounts
              </p>
            </div>

            {/* OAuth Enabled Toggle */}
            <div className="flex items-center justify-between p-4 bg-gray-900/30 rounded-lg border border-gray-600">
              <div>
                <label htmlFor="oauthEnabled" className="text-sm font-medium text-gray-300">
                  Enable OAuth Authentication
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  Allow users to authenticate using OAuth providers configured in Firebase
                </p>
              </div>
              <button
                type="button"
                id="oauthEnabled"
                role="switch"
                aria-checked={oauthEnabled}
                onClick={() => setOauthEnabled(!oauthEnabled)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 ${
                  oauthEnabled ? 'bg-blue-600' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    oauthEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-6 bg-gray-800/30 border-t border-gray-700 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {configStatus !== 'none' && (
                <button
                  type="button"
                  onClick={handleRemoveConfig}
                  disabled={deleteConfigMutation.isPending}
                  className="px-4 py-2 bg-red-600/10 border border-red-600/20 text-red-400 rounded-lg hover:bg-red-600/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deleteConfigMutation.isPending ? 'Removing...' : 'Remove Configuration'}
                </button>
              )}
            </div>

            <div className="flex items-center space-x-3">
              {isDirty && (
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={isSaving}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Reset
                </button>
              )}
              <button
                type="button"
                onClick={handleSave}
                disabled={!isDirty || isSaving || Object.keys(errors).length > 0}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {isSaving ? 'Saving...' : 'Save Configuration'}
              </button>
            </div>
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-6 bg-gray-800/30 border border-gray-700 rounded-lg p-6">
          <h3 className="text-sm font-semibold text-white mb-3">Configuration Guide</h3>
          <div className="space-y-3 text-sm text-gray-400">
            <div className="flex items-start space-x-2">
              <span className="text-blue-400 mt-0.5">1.</span>
              <p>Create a Firebase project at <a href="https://console.firebase.google.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">console.firebase.google.com</a></p>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-blue-400 mt-0.5">2.</span>
              <p>Navigate to Project Settings → General to find your Project ID and Web API Key</p>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-blue-400 mt-0.5">3.</span>
              <p>Go to Project Settings → Service Accounts and click "Generate new private key"</p>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-blue-400 mt-0.5">4.</span>
              <p>Upload the downloaded JSON file using the service account field above</p>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-blue-400 mt-0.5">5.</span>
              <p>Enable OAuth providers in Firebase Console → Authentication → Sign-in method</p>
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <svg className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-yellow-400 mb-1">Security Notice</h3>
              <p className="text-sm text-yellow-300/80">
                All credentials are encrypted at rest and in transit. Never share your service account JSON or API keys publicly.
              </p>
            </div>
          </div>
        </div>
          </>
        )}

        {/* Google Provider Configuration */}
        {activeProvider === 'google' && (
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg shadow-xl p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Google Sign-In</h3>
              <p className="text-gray-400 text-sm">
                Google authentication provider configuration will be available soon. This will allow your users to sign in using their Google accounts.
              </p>
            </div>
          </div>
        )}

        {/* Apple Provider Configuration */}
        {activeProvider === 'apple' && (
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg shadow-xl p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Sign in with Apple</h3>
              <p className="text-gray-400 text-sm">
                Apple authentication provider configuration will be available soon. This will allow your users to sign in using their Apple ID.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function AuthSettingsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <p className="mt-4 text-gray-400">Loading...</p>
          </div>
        </div>
      </div>
    }>
      <AuthSettingsContent />
    </Suspense>
  )
}
