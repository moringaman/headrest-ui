'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import MobileNav from '@/components/ui/mobile-nav'
import { useAuth } from '@/components/providers/auth-provider'
import { useAppStore } from '@/lib/store'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  apiClient,
  type Organization,
  type FirebaseAuthConfig,
  type UpdateFirebaseAuthConfigData
} from '@/lib/api'

export default function AuthSettingsPage() {
  const { user, session } = useAuth()
  const { addNotification } = useAppStore()
  const queryClient = useQueryClient()

  // Form state
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

  // Fetch current organization
  const { data: organization, isLoading: orgLoading } = useQuery<Organization>({
    queryKey: ['current-organization'],
    queryFn: () => apiClient.getCurrentOrganization(session?.access_token),
    enabled: !!session?.access_token,
  })

  // Load existing configuration
  useEffect(() => {
    if (organization) {
      if (organization.firebase_project_id) {
        setProjectId(organization.firebase_project_id)
      }
      if (organization.firebase_web_api_key) {
        setWebApiKey(organization.firebase_web_api_key)
      }
      if (organization.firebase_service_account) {
        setServiceAccount(organization.firebase_service_account)
        setFileName('service-account.json')
      }
      if (organization.oauth_enabled !== undefined) {
        setOauthEnabled(organization.oauth_enabled)
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
      return apiClient.updateFirebaseAuthConfig(data, session?.access_token)
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
      return apiClient.deleteFirebaseAuthConfig(session?.access_token)
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
        <div className="text-gray-400">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <MobileNav />

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
        {/* Info Banner */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-3">
            <svg className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-blue-400 mb-1">Firebase Authentication Configuration</h3>
              <p className="text-sm text-blue-300/80">
                Configure Firebase authentication for your organization. This allows your users to authenticate using Firebase Auth providers.
                All credentials are encrypted and stored securely.
              </p>
            </div>
          </div>
        </div>

        {/* Main Form */}
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
      </div>
    </div>
  )
}
