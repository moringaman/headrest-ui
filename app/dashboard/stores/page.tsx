'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import MobileNav from '@/components/ui/mobile-nav'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '@/components/providers/auth-provider'
import { useAppStore } from '@/lib/store'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  apiClient,
  type Organization,
  type CreateOrganizationData,
  type UpdateOrganizationData,
  type CreatePrestaShopCredentialsData,
  type UpdatePrestaShopCredentialsData,
  type UsageStats,
  type Credentials
} from '@/lib/api'

function StoresContent() {
  const { user, session } = useAuth()
  const { addNotification } = useAppStore()
  const queryClient = useQueryClient()
  const searchParams = useSearchParams()
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isCredentialsModalOpen, setIsCredentialsModalOpen] = useState(false)
  const [connectionStatuses, setConnectionStatuses] = useState<Record<string, 'connected' | 'disconnected' | 'testing' | 'unknown'>>({})

  // Fetch organizations
  const { data: organizations = [], isLoading: organizationsLoading, error: organizationsError } = useQuery<Organization[]>({
    queryKey: ['organizations', user?.id],
    queryFn: () => apiClient.getOrganizations(session?.access_token),
    enabled: !!user?.id && !!session?.access_token,
  })

  // Auto-select organization based on URL parameter or first organization
  useEffect(() => {
    if (organizations && organizations.length > 0 && !selectedOrg) {
      const selectedId = searchParams.get('selected')
      if (selectedId) {
        // Find organization by ID from URL parameter
        const org = organizations.find(org => org.id === selectedId)
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

  // Auto-open create modal when create=true and no organizations exist
  useEffect(() => {
    const shouldCreate = searchParams.get('create') === 'true'
    if (shouldCreate && !organizationsLoading && organizations.length === 0 && !isCreateModalOpen) {
      setIsCreateModalOpen(true)
    }
  }, [searchParams, organizationsLoading, organizations.length, isCreateModalOpen])

  // Test connections for all organizations when they're loaded
  useEffect(() => {
    if (organizations && organizations.length > 0) {
      organizations.forEach(org => {
        setConnectionStatuses(prev => ({
          ...prev,
          [org.id]: 'testing'
        }))
        testOrganizationConnection.mutate(org.id)
      })
    }
  }, [organizations])

  // Fetch detailed organization data when one is selected
  const { data: organizationDetails, isLoading: detailsLoading } = useQuery({
    queryKey: ['organization', selectedOrg?.id],
    queryFn: () => apiClient.getOrganization(selectedOrg!.id, session?.access_token),
    enabled: !!selectedOrg?.id && !!session?.access_token,
  })

  // Debug organization details
  useEffect(() => {
    if (organizationDetails) {
      console.log('Stores - Organization details received:', organizationDetails)
      console.log('Stores - PrestaShop URL:', organizationDetails.prestashop_url)
    }
  }, [organizationDetails])

  // Fetch usage stats
  const { data: usageStats } = useQuery<UsageStats>({
    queryKey: ['usage-stats'],
    queryFn: () => apiClient.getUsageStats(session?.access_token),
    enabled: !!session?.access_token,
  })

  // Fetch decrypted credentials for selected organization
  const { data: credentials } = useQuery<Credentials>({
    queryKey: ['credentials', selectedOrg?.id],
    queryFn: () => apiClient.getOrganizationCredentials(selectedOrg!.id, session?.access_token),
    enabled: !!session?.access_token && !!selectedOrg?.id,
  })

  // Test connection mutation
  const testConnectionMutation = useMutation({
    mutationFn: () => apiClient.testOrganizationConnection(selectedOrg!.id, session?.access_token),
    onSuccess: (data) => {
      addNotification({
        type: 'success',
        title: 'Connection Test Successful',
        message: `Successfully connected to ${selectedOrg?.name} database. Found ${data?.length || 0} products.`
      })
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Connection Test Failed',
        message: `Failed to connect to ${selectedOrg?.name} database: ${error.message}`
      })
    }
  })

  // Test connection for a specific organization
  const testOrganizationConnection = useMutation({
    mutationFn: (organizationId: string) => 
      apiClient.testOrganizationConnection(organizationId, session?.access_token),
    onSuccess: (data, organizationId) => {
      setConnectionStatuses(prev => ({
        ...prev,
        [organizationId]: 'connected'
      }))
    },
    onError: (error: any, organizationId) => {
      setConnectionStatuses(prev => ({
        ...prev,
        [organizationId]: 'disconnected'
      }))
    }
  })

  // Create organization mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateOrganizationData) => 
      apiClient.createOrganization(data, session?.access_token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] })
      setIsCreateModalOpen(false)
      addNotification({
        type: 'success',
        title: 'Success',
        message: 'Store connection created successfully'
      })
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Error',
        message: `Failed to create store connection: ${error.message}`
      })
    }
  })

  // Update organization mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: UpdateOrganizationData }) => 
      apiClient.updateOrganization(id, data, session?.access_token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] })
      queryClient.invalidateQueries({ queryKey: ['organization', selectedOrg?.id] })
      setIsEditModalOpen(false)
      addNotification({
        type: 'success',
        title: 'Success',
        message: 'Organization updated successfully'
      })
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Error',
        message: `Failed to update organization: ${error.message}`
      })
    }
  })

  // Create credentials mutation (POST - for first-time setup or reset)
  const createCredentialsMutation = useMutation({
    mutationFn: (credentials: CreatePrestaShopCredentialsData) =>
      apiClient.createCredentials(credentials, session?.access_token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credentials', selectedOrg?.id] })
      queryClient.invalidateQueries({ queryKey: ['organizations'] })
      queryClient.invalidateQueries({ queryKey: ['organization', selectedOrg?.id] })
      setIsCredentialsModalOpen(false)
      addNotification({
        type: 'success',
        title: 'Success',
        message: 'Database credentials created successfully'
      })
    },
    onError: (error: any) => {
      const isEncryptionError = error.message?.includes('encryption key') ||
                               error.message?.includes('decrypt') ||
                               error.message?.includes('Failed to decrypt')
      addNotification({
        type: 'error',
        title: 'Error',
        message: `Failed to create credentials: ${error.message}${
          isEncryptionError ? '\n\nPlease try resetting your credentials.' : ''
        }`
      })
    }
  })

  // Update credentials mutation (PATCH - for partial updates)
  const updateCredentialsMutation = useMutation({
    mutationFn: (credentials: UpdatePrestaShopCredentialsData) =>
      apiClient.updateCredentials(credentials, session?.access_token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credentials', selectedOrg?.id] })
      queryClient.invalidateQueries({ queryKey: ['organizations'] })
      queryClient.invalidateQueries({ queryKey: ['organization', selectedOrg?.id] })
      setIsCredentialsModalOpen(false)
      addNotification({
        type: 'success',
        title: 'Success',
        message: 'Database credentials updated successfully'
      })
    },
    onError: (error: any) => {
      const isEncryptionError = error.message?.includes('encryption key') ||
                               error.message?.includes('decrypt') ||
                               error.message?.includes('Failed to decrypt')
      addNotification({
        type: 'error',
        title: 'Error',
        message: `Failed to update credentials: ${error.message}${
          isEncryptionError ? '\n\nYour credentials need to be reset. Please create new credentials using the form.' : ''
        }`
      })
    }
  })

  // Delete organization mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.deleteOrganization(id, session?.access_token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] })
      setSelectedOrg(null)
      addNotification({
        type: 'success',
        title: 'Success',
        message: 'Organization deleted successfully'
      })
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Error',
        message: `Failed to delete organization: ${error.message}`
      })
    }
  })

  const handleDelete = (org: Organization) => {
    if (confirm(`Are you sure you want to delete the connection to "${org.name}"? This action cannot be undone.`)) {
      deleteMutation.mutate(org.id)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Navigation */}
      <div className="bg-gray-900/50 backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center space-x-3 focus:outline-none focus:ring-2 focus:ring-suede-primary focus:ring-offset-2 rounded">
                <Image
                  src="/assets/suede-logo-transparent.png"
                  alt="Headrest"
                  width={120}
                  height={40}
                  className="h-8 w-auto"
                  priority
                />
                <span className="text-xl font-bold text-white">Headrest</span>
              </Link>
              <div className="h-6 w-px bg-gray-700"></div>
              <h1 className="text-xl font-semibold text-white">Store Connections</h1>
            </div>
            <div className="flex items-center space-x-4">
              {/* Desktop navigation - hidden on mobile */}
              <div className="hidden lg:flex items-center space-x-4">
                <Link
                  href="/dashboard"
                  className="bg-suede-primary hover:bg-suede-accent text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  Dashboard
                </Link>
                <Link
                  href="/dashboard/api-keys"
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  API Keys
                </Link>
                <Link
                  href="/dashboard/auth-settings"
                  className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  Auth Settings
                </Link>
                <Link
                  href="/docs"
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  Documentation
                </Link>
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  Connect New Store
                </button>
              </div>
              
              {/* Mobile navigation */}
              <MobileNav 
                currentPage="stores" 
                user={user} 
                selectedOrg={selectedOrg}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Organizations List */}
            <div className="lg:col-span-1">
              <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg shadow-xl">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-white mb-4">
                    Your Stores
                  </h3>

                  {organizationsLoading && (
                    <div className="text-center py-8">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400"></div>
                      <p className="mt-2 text-gray-400">Loading stores...</p>
                    </div>
                  )}

                  {organizationsError && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-md p-4 mb-4">
                      <p className="text-red-400">Error loading stores: {organizationsError.message}</p>
                    </div>
                  )}

                  {!organizationsLoading && !organizationsError && organizations.length === 0 && (
                    <div className="text-center py-8">
                      <svg className="mx-auto h-12 w-12 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"></path>
                      </svg>
                      <h3 className="mt-2 text-sm font-medium text-white">No stores connected</h3>
                      <p className="mt-1 text-sm text-gray-400">
                        Connect your first PrestaShop store to get started.
                      </p>
                    </div>
                  )}

                  {!organizationsLoading && organizations.length > 0 && (
                    <div className="space-y-2">
                      {organizations.map((org: Organization) => (
                        <div
                          key={org.id}
                          className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                            selectedOrg?.id === org.id
                              ? 'border-blue-500 bg-blue-500/10'
                              : 'border-gray-700 hover:border-gray-600 bg-gray-800/30'
                          }`}
                          onClick={() => setSelectedOrg(org)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h4 className="text-sm font-medium text-white">{org.name}</h4>
                              <p className="text-xs text-gray-400">{org.slug}</p>
                            </div>
                            <div className="flex items-center space-x-1">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-500/10 border border-green-500/20 text-green-400">
                                Active
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Organization Details */}
            <div className="lg:col-span-2">
              {selectedOrg ? (
                <div className="space-y-6">
                  {/* Connection Details */}
                  <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg shadow-xl">
                    <div className="px-4 py-5 sm:p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg leading-6 font-medium text-white">
                          {selectedOrg.name}
                        </h3>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => setIsCredentialsModalOpen(true)}
                            className="bg-suede-primary hover:bg-suede-accent text-white px-3 py-1 rounded-md text-sm font-medium"
                          >
                            Update Credentials
                          </button>
                          <button
                            onClick={() => setIsEditModalOpen(true)}
                            className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded-md text-sm font-medium"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(selectedOrg)}
                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md text-sm font-medium"
                          >
                            Delete
                          </button>
                        </div>
                      </div>

                      {detailsLoading ? (
                        <div className="text-center py-4">
                          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-gray-400"></div>
                          <p className="mt-2 text-gray-400">Loading details...</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300">Organization Name</label>
                          <p className="mt-1 text-sm text-white">{selectedOrg.name}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300">Slug</label>
                          <p className="mt-1 text-sm text-white">{selectedOrg.slug}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300">Plan Tier</label>
                          <p className="mt-1 text-sm text-white">{selectedOrg.plan_tier}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300">Status</label>
                          <p className="mt-1 text-sm text-white">{selectedOrg.is_active ? 'Active' : 'Inactive'}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300">API Calls Used</label>
                          <p className="mt-1 text-sm text-white">{selectedOrg.api_calls_used.toLocaleString()}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300">API Calls Limit</label>
                          <p className="mt-1 text-sm text-white">{selectedOrg.api_calls_limit.toLocaleString()}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300">Created</label>
                          <p className="mt-1 text-sm text-white">
                            {new Date(selectedOrg.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      {/* PrestaShop URL Configuration */}
                      <div className="border-t border-gray-700 pt-6 mt-4">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-lg font-medium text-white">PrestaShop URL</h4>
                          <button
                            onClick={() => setIsEditModalOpen(true)}
                            className="bg-suede-primary hover:bg-suede-accent text-white px-3 py-1 rounded-md text-sm font-medium"
                          >
                            Update URL
                          </button>
                        </div>
                        {(organizationDetails?.prestashop_url || selectedOrg.prestashop_url) ? (
                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-2">Current PrestaShop URL</label>
                              <div className="flex items-center space-x-2">
                                <code className="flex-1 bg-gray-900/50 border border-gray-600 px-3 py-2 rounded-md text-sm font-mono text-white break-all">
                                  {organizationDetails?.prestashop_url || selectedOrg.prestashop_url}
                                </code>
                                <button
                                  onClick={() => {
                                    const url = organizationDetails?.prestashop_url || selectedOrg.prestashop_url
                                    navigator.clipboard.writeText(url!)
                                    addNotification({
                                      type: 'success',
                                      title: 'URL Copied',
                                      message: 'PrestaShop URL copied to clipboard'
                                    })
                                  }}
                                  className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-md text-sm font-medium"
                                >
                                  Copy
                                </button>
                              </div>
                            </div>
                            <div className="bg-green-500/10 border border-green-500/20 rounded-md p-4">
                              <div className="flex">
                                <div className="flex-shrink-0">
                                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                  </svg>
                                </div>
                                <div className="ml-3">
                                  <h3 className="text-sm font-medium text-green-400">
                                    Images Enabled
                                  </h3>
                                  <div className="mt-2 text-sm text-green-300">
                                    <p>Product images will be returned by the API using this URL as the base.</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-md p-4">
                            <div className="flex">
                              <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                              </div>
                              <div className="ml-3">
                                <h3 className="text-sm font-medium text-yellow-400">
                                  PrestaShop URL Not Configured
                                </h3>
                                <div className="mt-2 text-sm text-yellow-300">
                                  <p>Configure your PrestaShop URL to enable product images in API responses.</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Database Connection Details (if available) */}
                      {credentials ? (
                        <div className="border-t border-gray-700 pt-6 mt-4">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="text-lg font-medium text-white">Database Connection</h4>
                            <button
                              onClick={() => testConnectionMutation.mutate()}
                              disabled={testConnectionMutation.isPending}
                              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {testConnectionMutation.isPending ? (
                                <>
                                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                  Testing...
                                </>
                              ) : (
                                <>
                                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  Test Connection
                                </>
                              )}
                            </button>
                          </div>

                          <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              <div className="space-y-1">
                                <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide">Database Host</label>
                                <p className="text-sm font-mono text-white bg-gray-900/50 border border-gray-600 px-2 py-1 rounded">{credentials.prestashop_db_host}</p>
                              </div>
                              <div className="space-y-1">
                                <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide">Database Name</label>
                                <p className="text-sm font-mono text-white bg-gray-900/50 border border-gray-600 px-2 py-1 rounded">{credentials.prestashop_db_name}</p>
                              </div>
                              <div className="space-y-1">
                                <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide">Database User</label>
                                <p className="text-sm font-mono text-white bg-gray-900/50 border border-gray-600 px-2 py-1 rounded">{credentials.prestashop_db_username}</p>
                              </div>
                              <div className="space-y-1">
                                <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide">Port</label>
                                <p className="text-sm font-mono text-white bg-gray-900/50 border border-gray-600 px-2 py-1 rounded">{credentials.prestashop_db_port}</p>
                              </div>
                              <div className="space-y-1">
                                <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide">Table Prefix</label>
                                <p className="text-sm font-mono text-white bg-gray-900/50 border border-gray-600 px-2 py-1 rounded">{credentials.prestashop_db_prefix}</p>
                              </div>
                              <div className="space-y-1">
                                <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide">Status</label>
                                <div className="flex items-center">
                                  <div className={`w-2 h-2 rounded-full mr-2 ${
                                    connectionStatuses[selectedOrg.id] === 'connected'
                                      ? 'bg-green-400'
                                      : connectionStatuses[selectedOrg.id] === 'disconnected'
                                      ? 'bg-red-400'
                                      : connectionStatuses[selectedOrg.id] === 'testing'
                                      ? 'bg-yellow-400'
                                      : 'bg-gray-400'
                                  }`}></div>
                                  <span className="text-sm text-white">
                                    {connectionStatuses[selectedOrg.id] === 'connected' ? 'Connected' :
                                     connectionStatuses[selectedOrg.id] === 'disconnected' ? 'Disconnected' :
                                     connectionStatuses[selectedOrg.id] === 'testing' ? 'Testing...' : 'Unknown'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : null}

                      {/* Connection Strings */}
                      {credentials && (
                        <div className="border-t border-gray-700 pt-6 mt-4">
                          <h4 className="text-lg font-medium text-white mb-4">Connection Strings</h4>
                          <div className="space-y-4">
                            {/* Database Connection String */}
                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-2">Database Connection String</label>
                              <div className="flex items-center space-x-2">
                                <code className="flex-1 bg-gray-900/50 border border-gray-600 px-3 py-2 rounded-md text-sm font-mono text-white break-all">
                                  mysql://{credentials.prestashop_db_username}:{credentials.prestashop_db_password ? '•••••••• (password)' : ''}@{credentials.prestashop_db_host}:{credentials.prestashop_db_port}/{credentials.prestashop_db_name}
                                </code>
                                <button
                                  onClick={() => {
                                    const connectionString = `mysql://${credentials.prestashop_db_username}:${credentials.prestashop_db_password}@${credentials.prestashop_db_host}:${credentials.prestashop_db_port}/${credentials.prestashop_db_name}`
                                    navigator.clipboard.writeText(connectionString)
                                    addNotification({
                                      type: 'success',
                                      title: 'Copied!',
                                      message: 'Database connection string copied to clipboard'
                                    })
                                  }}
                                  className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
                                >
                                  Copy
                                </button>
                              </div>
                            </div>

                            {/* API Base URL */}
                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-2">API Base URL</label>
                              <div className="flex items-center space-x-2">
                                <code className="flex-1 bg-gray-900/50 border border-gray-600 px-3 py-2 rounded-md text-sm font-mono text-white break-all">
                                  {process.env.NEXT_PUBLIC_API_URL || 'https://prestashop-api-staging.up.railway.app'}/api/v1
                                </code>
                                <button
                                  onClick={() => {
                                    const apiBaseUrl = `${process.env.NEXT_PUBLIC_API_URL || 'https://prestashop-api-staging.up.railway.app'}/api/v1`
                                    navigator.clipboard.writeText(apiBaseUrl)
                                    addNotification({
                                      type: 'success',
                                      title: 'Copied!',
                                      message: 'API base URL copied to clipboard'
                                    })
                                  }}
                                  className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
                                >
                                  Copy
                                </button>
                              </div>
                            </div>

                            {/* Available API Routes */}
                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-2">Available API Routes</label>
                              <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-4">
                                <div className="space-y-2 text-sm">
                                  <div className="flex items-center justify-between">
                                    <code className="font-mono text-white">GET /organizations/{selectedOrg?.id}/products</code>
                                    <span className="text-gray-400 text-xs">Fetch products</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <code className="font-mono text-white">GET /organizations/{selectedOrg?.id}/categories</code>
                                    <span className="text-gray-400 text-xs">Fetch categories</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <code className="font-mono text-white">GET /organizations/{selectedOrg?.id}/customers</code>
                                    <span className="text-gray-400 text-xs">Fetch customers</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <code className="font-mono text-white">GET /organizations/{selectedOrg?.id}/orders</code>
                                    <span className="text-gray-400 text-xs">Fetch orders</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <code className="font-mono text-white">GET /organizations/{selectedOrg?.id}/products/&#123;id&#125;</code>
                                    <span className="text-gray-400 text-xs">Get single product</span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Code Examples */}
                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-2">Quick Start Examples</label>
                              <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-4 space-y-3">
                                <div>
                                  <h5 className="text-sm font-medium text-white mb-1">JavaScript/Node.js</h5>
                                  <pre className="bg-gray-900 text-green-400 p-3 rounded text-xs overflow-x-auto">
{`const baseUrl = '${process.env.NEXT_PUBLIC_API_URL || 'https://prestashop-api-staging.up.railway.app'}/api/v1';
const response = await fetch(\`\${baseUrl}/organizations/${selectedOrg?.id}/products\`, {
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  }
});
const products = await response.json();`}
                                  </pre>
                                </div>
                                <div>
                                  <h5 className="text-sm font-medium text-white mb-1">Python</h5>
                                  <pre className="bg-gray-900 text-green-400 p-3 rounded text-xs overflow-x-auto">
{`import requests

base_url = '${process.env.NEXT_PUBLIC_API_URL || 'https://prestashop-api-staging.up.railway.app'}/api/v1'
response = requests.get(
    f'{base_url}/organizations/${selectedOrg?.id}/products',
    headers={'Authorization': 'Bearer YOUR_API_KEY'}
)
products = response.json()`}
                                  </pre>
                                </div>
                                <div>
                                  <h5 className="text-sm font-medium text-white mb-1">cURL</h5>
                                  <pre className="bg-gray-900 text-green-400 p-3 rounded text-xs overflow-x-auto">
{`curl -X GET \\
  '${process.env.NEXT_PUBLIC_API_URL || 'https://prestashop-api-staging.up.railway.app'}/api/v1/organizations/${selectedOrg?.id}/products' \\
  -H 'Authorization: Bearer YOUR_API_KEY' \\
  -H 'Content-Type: application/json'`}
                                  </pre>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {!credentials && (
                        <div className="border-t border-gray-700 pt-4 mt-4">
                          <h4 className="text-md font-medium text-white mb-3">Database Connection</h4>
                          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-md p-4">
                            <div className="flex">
                              <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                              </div>
                              <div className="ml-3">
                                <h3 className="text-sm font-medium text-yellow-400">
                                  No Database Connection Configured
                                </h3>
                                <div className="mt-2 text-sm text-yellow-300">
                                  <p>This organization doesn't have a PrestaShop database connection configured yet.</p>
                                  <p className="mt-1">Click "Update Credentials" to set up the database connection.</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Usage Statistics */}
                  {usageStats && (
                    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg shadow-xl">
                      <div className="px-4 py-5 sm:p-6">
                        <h3 className="text-lg leading-6 font-medium text-white mb-4">
                          Usage Statistics
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-400">{usageStats.total_calls.toLocaleString()}</div>
                            <div className="text-sm text-gray-400">API Calls Used</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-400">{usageStats.calls_remaining.toLocaleString()}</div>
                            <div className="text-sm text-gray-400">Remaining</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-purple-400">{usageStats.calls_limit.toLocaleString()}</div>
                            <div className="text-sm text-gray-400">Total Limit</div>
                          </div>
                        </div>
                        <div className="mt-4 text-center">
                          <div className="text-sm text-gray-400">
                            Period: {new Date(usageStats.period_start).toLocaleDateString()} - {new Date(usageStats.period_end).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg shadow-xl">
                  <div className="px-4 py-5 sm:p-6">
                    <div className="text-center py-8">
                      <svg className="mx-auto h-12 w-12 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"></path>
                      </svg>
                      <h3 className="mt-2 text-sm font-medium text-white">Select a store</h3>
                      <p className="mt-1 text-sm text-gray-400">
                        Choose a store from the list to view its details and manage its connection.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Create Store Modal */}
      {isCreateModalOpen && (
        <CreateStoreModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={(data) => createMutation.mutate(data)}
          isLoading={createMutation.isPending}
          canClose={organizations.length > 0}
        />
      )}

      {/* Edit Store Modal */}
      {isEditModalOpen && selectedOrg && (
        <EditStoreModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSubmit={(data) => updateMutation.mutate({ id: selectedOrg.id, data })}
          isLoading={updateMutation.isPending}
          organization={organizationDetails || selectedOrg}
        />
      )}

      {/* Update Credentials Modal */}
      {isCredentialsModalOpen && (
        <UpdateCredentialsModal
          isOpen={isCredentialsModalOpen}
          onClose={() => setIsCredentialsModalOpen(false)}
          onSubmit={(creds) => {
            // If credentials exist, update (PATCH). If not, create (POST)
            if (credentials) {
              updateCredentialsMutation.mutate(creds)
            } else {
              createCredentialsMutation.mutate(creds as CreatePrestaShopCredentialsData)
            }
          }}
          isLoading={updateCredentialsMutation.isPending || createCredentialsMutation.isPending}
          credentials={credentials}
          mode={credentials ? 'update' : 'create'}
        />
      )}
    </div>
  )
}

// Create Store Modal Component
function CreateStoreModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  isLoading,
  canClose = true
}: { 
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CreateOrganizationData) => void
  isLoading: boolean
  canClose?: boolean
}) {
  const [formData, setFormData] = useState<CreateOrganizationData>({
    name: '',
    slug: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border border-gray-700 w-96 shadow-xl rounded-md bg-gray-800">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-white mb-4">Connect New Store</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300">Organization Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1 block w-full border border-gray-600 rounded-md px-3 py-2 text-sm bg-gray-900/50 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="My Organization"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300">Slug (optional)</label>
              <input
                type="text"
                value={formData.slug || ''}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                className="mt-1 block w-full border border-gray-600 rounded-md px-3 py-2 text-sm bg-gray-900/50 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="my-organization"
              />
            </div>
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={!canClose}
                className={`px-4 py-2 text-sm font-medium rounded-md ${
                  canClose
                    ? 'text-gray-300 bg-gray-700 hover:bg-gray-600'
                    : 'text-gray-500 bg-gray-800 cursor-not-allowed'
                }`}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-green-400 rounded-md"
              >
                {isLoading ? 'Creating...' : 'Create Organization'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

// Edit Store Modal Component
function EditStoreModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  isLoading, 
  organization 
}: { 
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: UpdateOrganizationData) => void
  isLoading: boolean
  organization: Organization
}) {
  const [formData, setFormData] = useState<UpdateOrganizationData>({
    name: organization.name,
    slug: organization.slug,
    prestashop_url: organization.prestashop_url || ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Update form data when organization prop changes
  useEffect(() => {
    setFormData({
      name: organization.name,
      slug: organization.slug,
      prestashop_url: organization.prestashop_url || ''
    })
  }, [organization])

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      // Focus the first input when modal opens
      const firstInput = document.getElementById('edit-name')
      if (firstInput) {
        (firstInput as HTMLInputElement).focus()
      }
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    // Name validation
    if (!formData.name || !formData.name.trim()) {
      newErrors.name = 'Organization name is required'
    } else if (formData.name.length < 2) {
      newErrors.name = 'Name must be at least 2 characters'
    }

    // Slug validation (optional but if provided, must be valid)
    if (formData.slug && formData.slug.trim()) {
      const slug = formData.slug.trim()
      if (slug.length < 2) {
        newErrors.slug = 'Slug must be at least 2 characters'
      } else if (slug.length > 50) {
        newErrors.slug = 'Slug must be less than 50 characters'
      } else if (!/^[a-z0-9-]+$/.test(slug)) {
        newErrors.slug = 'Slug can only contain lowercase letters, numbers, and hyphens'
      } else if (slug.startsWith('-') || slug.endsWith('-')) {
        newErrors.slug = 'Slug cannot start or end with a hyphen'
      } else if (slug.includes('--')) {
        newErrors.slug = 'Slug cannot contain consecutive hyphens'
      }
    }

    // URL validation (optional but if provided, must be valid)
    if (formData.prestashop_url && formData.prestashop_url.trim()) {
      try {
        new URL(formData.prestashop_url)
        if (!formData.prestashop_url.startsWith('http://') && !formData.prestashop_url.startsWith('https://')) {
          newErrors.prestashop_url = 'URL must start with http:// or https://'
        }
      } catch {
        newErrors.prestashop_url = 'Please enter a valid URL'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      onSubmit(formData)
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm overflow-y-auto h-full w-full z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div className="relative top-20 mx-auto p-5 border border-gray-700 w-96 shadow-xl rounded-md bg-gray-800">
        <div className="mt-3">
          <h3 id="edit-modal-title" className="text-lg font-medium text-white mb-4">Edit Organization</h3>
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label htmlFor="edit-name" className="block text-sm font-medium text-gray-300">
                Organization Name *
              </label>
              <input
                id="edit-name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`mt-1 block w-full border rounded-md px-3 py-2 text-sm bg-gray-900/50 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.name ? 'border-red-500' : 'border-gray-600'
                }`}
                aria-describedby={errors.name ? 'edit-name-error' : undefined}
                aria-invalid={!!errors.name}
              />
              {errors.name && (
                <p id="edit-name-error" className="mt-1 text-sm text-red-400" role="alert">
                  {errors.name}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="edit-slug" className="block text-sm font-medium text-gray-300">
                Slug
              </label>
              <input
                id="edit-slug"
                name="slug"
                type="text"
                value={formData.slug || ''}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                className={`mt-1 block w-full border rounded-md px-3 py-2 text-sm bg-gray-900/50 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.slug ? 'border-red-500' : 'border-gray-600'
                }`}
                placeholder="my-organization"
                aria-describedby={errors.slug ? 'edit-slug-error' : 'edit-slug-help'}
                aria-invalid={!!errors.slug}
                maxLength={50}
                pattern="[a-z0-9-]+"
                title="URL-friendly identifier (lowercase letters, numbers, hyphens only)"
              />
              {errors.slug && (
                <p id="edit-slug-error" className="mt-1 text-sm text-red-400" role="alert">
                  {errors.slug}
                </p>
              )}
              <p id="edit-slug-help" className="mt-1 text-xs text-gray-400">
                Optional: URL-friendly identifier (2-50 characters, lowercase letters, numbers, hyphens only)
              </p>
            </div>
            <div>
              <label htmlFor="edit-prestashop-url" className="block text-sm font-medium text-gray-300">
                PrestaShop URL
              </label>
              <input
                id="edit-prestashop-url"
                name="prestashop_url"
                type="url"
                value={formData.prestashop_url || ''}
                onChange={(e) => setFormData({ ...formData, prestashop_url: e.target.value })}
                placeholder="https://your-store.com"
                className={`mt-1 block w-full border rounded-md px-3 py-2 text-sm bg-gray-900/50 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.prestashop_url ? 'border-red-500' : 'border-gray-600'
                }`}
                aria-describedby={errors.prestashop_url ? 'edit-prestashop-url-error' : 'edit-prestashop-url-help'}
                aria-invalid={!!errors.prestashop_url}
              />
              {errors.prestashop_url && (
                <p id="edit-prestashop-url-error" className="mt-1 text-sm text-red-400" role="alert">
                  {errors.prestashop_url}
                </p>
              )}
              <p id="edit-prestashop-url-help" className="mt-1 text-xs text-gray-400">
                The base URL of your PrestaShop store (e.g., https://wildmansherbs.co.uk)
              </p>
            </div>
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 rounded-md transition-colors"
                aria-label="Cancel editing organization"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-suede-primary hover:bg-suede-accent disabled:bg-blue-400 focus:outline-none focus:ring-2 focus:ring-suede-primary focus:ring-offset-2 rounded-md transition-colors"
                aria-label={isLoading ? 'Updating organization...' : 'Update organization'}
              >
                {isLoading ? 'Updating...' : 'Update Organization'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

// Update Credentials Modal Component
function UpdateCredentialsModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  credentials,
  mode = 'update'
}: {
  isOpen: boolean
  onClose: () => void
  onSubmit: (credentials: UpdatePrestaShopCredentialsData | CreatePrestaShopCredentialsData) => void
  isLoading: boolean
  credentials?: Credentials
  mode?: 'create' | 'update'
}) {
  const [formData, setFormData] = useState<UpdatePrestaShopCredentialsData>({
    prestashop_db_host: credentials?.prestashop_db_host || '',
    prestashop_db_name: credentials?.prestashop_db_name || '',
    prestashop_db_username: credentials?.prestashop_db_username || '',
    prestashop_db_password: '',
    prestashop_db_port: credentials?.prestashop_db_port || 3306,
    prestashop_db_prefix: credentials?.prestashop_db_prefix || 'ps_'
  })
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    // Host validation
    if (!formData.prestashop_db_host || !formData.prestashop_db_host.trim()) {
      newErrors.prestashop_db_host = 'Database host is required'
    } else if (!/^[a-zA-Z0-9.-]+$/.test(formData.prestashop_db_host)) {
      newErrors.prestashop_db_host = 'Invalid host format'
    }

    // Database name validation
    if (!formData.prestashop_db_name || !formData.prestashop_db_name.trim()) {
      newErrors.prestashop_db_name = 'Database name is required'
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.prestashop_db_name)) {
      newErrors.prestashop_db_name = 'Database name can only contain letters, numbers, and underscores'
    }

    // Username validation
    if (!formData.prestashop_db_username || !formData.prestashop_db_username.trim()) {
      newErrors.prestashop_db_username = 'Database username is required'
    } else if (formData.prestashop_db_username.length < 3) {
      newErrors.prestashop_db_username = 'Username must be at least 3 characters'
    }

    // Password validation
    if (!formData.prestashop_db_password || !formData.prestashop_db_password.trim()) {
      newErrors.prestashop_db_password = 'Database password is required'
    } else if (formData.prestashop_db_password.length < 6) {
      newErrors.prestashop_db_password = 'Password must be at least 6 characters'
    }

    // Port validation
    if (!formData.prestashop_db_port || formData.prestashop_db_port < 1 || formData.prestashop_db_port > 65535) {
      newErrors.prestashop_db_port = 'Port must be between 1 and 65535'
    }

    // Prefix validation
    if (!formData.prestashop_db_prefix || !formData.prestashop_db_prefix.trim()) {
      newErrors.prestashop_db_prefix = 'Table prefix is required'
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.prestashop_db_prefix)) {
      newErrors.prestashop_db_prefix = 'Prefix can only contain letters, numbers, and underscores'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      onSubmit(formData)
    }
  }

  if (!isOpen) return null

  const modalTitle = mode === 'create' ? 'Setup Database Credentials' : 'Update Database Credentials'

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm overflow-y-auto h-full w-full z-50" role="dialog" aria-modal="true" aria-labelledby="credentials-modal-title">
      <div className="relative top-20 mx-auto p-5 border border-gray-700 w-96 shadow-xl rounded-md bg-gray-800">
        <div className="mt-3">
          <h3 id="credentials-modal-title" className="text-lg font-medium text-white mb-4">{modalTitle}</h3>
          {mode === 'create' && (
            <div className="mb-4 bg-blue-500/10 border border-blue-500/20 rounded-md p-3">
              <p className="text-sm text-blue-300">
                Set up your PrestaShop database connection to start using the API.
              </p>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label htmlFor="prestashop_db_host" className="block text-sm font-medium text-gray-300">
                Database Host *
              </label>
              <input
                id="prestashop_db_host"
                name="prestashop_db_host"
                type="text"
                required
                value={formData.prestashop_db_host}
                onChange={(e) => setFormData({ ...formData, prestashop_db_host: e.target.value })}
                className={`mt-1 block w-full border rounded-md px-3 py-2 text-sm bg-gray-900/50 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.prestashop_db_host ? 'border-red-500' : 'border-gray-600'
                }`}
                placeholder="localhost"
                aria-describedby={errors.prestashop_db_host ? 'prestashop_db_host-error' : undefined}
                aria-invalid={!!errors.prestashop_db_host}
              />
              {errors.prestashop_db_host && (
                <p id="prestashop_db_host-error" className="mt-1 text-sm text-red-400" role="alert">
                  {errors.prestashop_db_host}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="prestashop_db_name" className="block text-sm font-medium text-gray-300">
                Database Name *
              </label>
              <input
                id="prestashop_db_name"
                name="prestashop_db_name"
                type="text"
                required
                value={formData.prestashop_db_name}
                onChange={(e) => setFormData({ ...formData, prestashop_db_name: e.target.value })}
                className={`mt-1 block w-full border rounded-md px-3 py-2 text-sm bg-gray-900/50 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.prestashop_db_name ? 'border-red-500' : 'border-gray-600'
                }`}
                placeholder="prestashop_db"
                aria-describedby={errors.prestashop_db_name ? 'prestashop_db_name-error' : undefined}
                aria-invalid={!!errors.prestashop_db_name}
              />
              {errors.prestashop_db_name && (
                <p id="prestashop_db_name-error" className="mt-1 text-sm text-red-400" role="alert">
                  {errors.prestashop_db_name}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="prestashop_db_username" className="block text-sm font-medium text-gray-300">
                Database User *
              </label>
              <input
                id="prestashop_db_username"
                name="prestashop_db_username"
                type="text"
                required
                value={formData.prestashop_db_username}
                onChange={(e) => setFormData({ ...formData, prestashop_db_username: e.target.value })}
                className={`mt-1 block w-full border rounded-md px-3 py-2 text-sm bg-gray-900/50 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.prestashop_db_username ? 'border-red-500' : 'border-gray-600'
                }`}
                placeholder="prestashop_user"
                aria-describedby={errors.prestashop_db_username ? 'prestashop_db_username-error' : undefined}
                aria-invalid={!!errors.prestashop_db_username}
              />
              {errors.prestashop_db_username && (
                <p id="prestashop_db_username-error" className="mt-1 text-sm text-red-400" role="alert">
                  {errors.prestashop_db_username}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="prestashop_db_password" className="block text-sm font-medium text-gray-300">
                Database Password *
              </label>
              <div className="relative">
                <input
                  id="prestashop_db_password"
                  name="prestashop_db_password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={formData.prestashop_db_password}
                  onChange={(e) => setFormData({ ...formData, prestashop_db_password: e.target.value })}
                  className={`mt-1 block w-full border rounded-md px-3 py-2 pr-10 text-sm bg-gray-900/50 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.prestashop_db_password ? 'border-red-500' : 'border-gray-600'
                  }`}
                  placeholder="••••••••"
                  aria-describedby={errors.prestashop_db_password ? 'prestashop_db_password-error' : undefined}
                  aria-invalid={!!errors.prestashop_db_password}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.prestashop_db_password && (
                <p id="prestashop_db_password-error" className="mt-1 text-sm text-red-400" role="alert">
                  {errors.prestashop_db_password}
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="prestashop_db_port" className="block text-sm font-medium text-gray-300">
                  Port *
                </label>
                <input
                  id="prestashop_db_port"
                  name="prestashop_db_port"
                  type="number"
                  required
                  min="1"
                  max="65535"
                  value={formData.prestashop_db_port}
                  onChange={(e) => setFormData({ ...formData, prestashop_db_port: parseInt(e.target.value) })}
                  className={`mt-1 block w-full border rounded-md px-3 py-2 text-sm bg-gray-900/50 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.prestashop_db_port ? 'border-red-500' : 'border-gray-600'
                  }`}
                  aria-describedby={errors.prestashop_db_port ? 'prestashop_db_port-error' : undefined}
                  aria-invalid={!!errors.prestashop_db_port}
                />
                {errors.prestashop_db_port && (
                  <p id="prestashop_db_port-error" className="mt-1 text-sm text-red-400" role="alert">
                    {errors.prestashop_db_port}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="prestashop_db_prefix" className="block text-sm font-medium text-gray-300">
                  Table Prefix *
                </label>
                <input
                  id="prestashop_db_prefix"
                  name="prestashop_db_prefix"
                  type="text"
                  required
                  value={formData.prestashop_db_prefix}
                  onChange={(e) => setFormData({ ...formData, prestashop_db_prefix: e.target.value })}
                  className={`mt-1 block w-full border rounded-md px-3 py-2 text-sm bg-gray-900/50 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.prestashop_db_prefix ? 'border-red-500' : 'border-gray-600'
                  }`}
                  placeholder="ps_"
                  aria-describedby={errors.prestashop_db_prefix ? 'prestashop_db_prefix-error' : undefined}
                  aria-invalid={!!errors.prestashop_db_prefix}
                />
                {errors.prestashop_db_prefix && (
                  <p id="prestashop_db_prefix-error" className="mt-1 text-sm text-red-400" role="alert">
                    {errors.prestashop_db_prefix}
                  </p>
                )}
              </div>
            </div>
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 rounded-md"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-suede-primary hover:bg-suede-accent disabled:bg-blue-400 rounded-md"
              >
                {isLoading
                  ? (mode === 'create' ? 'Creating...' : 'Updating...')
                  : (mode === 'create' ? 'Create Credentials' : 'Update Credentials')
                }
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function StoresPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <StoresContent />
    </Suspense>
  )
}
