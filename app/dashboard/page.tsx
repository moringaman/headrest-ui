'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/components/providers/auth-provider'
import { useAppStore } from '@/lib/store'
import { useQuery, useMutation } from '@tanstack/react-query'
import { apiClient, type Organization, type ApiKey, type UsageStats, type Credentials } from '@/lib/api'
import MobileNav from '@/components/ui/mobile-nav'
import UsageChart from '@/components/ui/usage-chart'
import TopEndpoints from '@/components/ui/top-endpoints'

export default function DashboardPage() {
  const { user, signOut, session } = useAuth()
  const { addNotification } = useAppStore()
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null)
  const [connectionStatuses, setConnectionStatuses] = useState<Record<string, 'connected' | 'disconnected' | 'testing' | 'unknown'>>({})

  // Fetch organizations for the current user
  const { data: organizations = [], isLoading: organizationsLoading, error: organizationsError } = useQuery({
    queryKey: ['organizations', user?.id],
    queryFn: () => apiClient.getOrganizations(session?.access_token),
    enabled: !!user?.id && !!session?.access_token,
  })

  // Auto-select the first organization if none is selected
  useEffect(() => {
    if (organizations && organizations.length > 0 && !selectedOrg) {
      setSelectedOrg(organizations[0])
    }
  }, [organizations, selectedOrg])

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

  // Test connections for all organizations when they're loaded
  useEffect(() => {
    if (organizations && organizations.length > 0) {
      organizations.forEach(org => {
        // Only test if we haven't already tested this organization
        if (connectionStatuses[org.id] === undefined) {
          setConnectionStatuses(prev => ({
            ...prev,
            [org.id]: 'testing'
          }))
          testOrganizationConnection.mutate(org.id)
        }
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
      console.log('Dashboard - Organization details received:', organizationDetails)
      console.log('Dashboard - Database fields:', {
        prestashop_db_host: organizationDetails.prestashop_db_host,
        prestashop_db_name: organizationDetails.prestashop_db_name,
        prestashop_db_username: organizationDetails.prestashop_db_username,
        prestashop_db_port: organizationDetails.prestashop_db_port,
        prestashop_db_prefix: organizationDetails.prestashop_db_prefix
      })
      console.log('Dashboard - PrestaShop URL:', organizationDetails.prestashop_url)
    }
  }, [organizationDetails])

  // Fetch usage stats for current organization
  const { data: usageStats } = useQuery({
    queryKey: ['usage-stats'],
    queryFn: () => apiClient.getUsageStats(session?.access_token),
    enabled: !!session?.access_token,
  })


  // Fetch decrypted credentials for selected organization
  const { data: credentials } = useQuery({
    queryKey: ['credentials', selectedOrg?.id],
    queryFn: () => selectedOrg ? 
      apiClient.getOrganizationCredentials(selectedOrg.id, session?.access_token) : 
      apiClient.getCredentials(session?.access_token),
    enabled: !!session?.access_token,
  })

  // Test connection mutation
  const testConnectionMutation = useMutation({
    mutationFn: () => selectedOrg ? 
      apiClient.testOrganizationConnection(selectedOrg.id, session?.access_token) : 
      apiClient.testConnection(session?.access_token),
    onSuccess: (data) => {
      addNotification({
        type: 'success',
        title: 'Connection Test Successful',
        message: `Successfully connected to ${selectedOrg?.name || 'PrestaShop'} database. Found ${Array.isArray(data) ? data.length : 0} products.`
      })
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Connection Test Failed',
        message: `Failed to connect to ${selectedOrg?.name || 'PrestaShop'} database: ${error.message}`
      })
    }
  })

  const handleSignOut = async () => {
    try {
      await signOut()
      addNotification({
        type: 'success',
        title: 'Signed Out',
        message: 'Signed out successfully'
      })
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Sign Out Error',
        message: 'Error signing out'
      })
    }
  }

  // Function to get API calls color based on usage percentage
  const getApiCallsColor = () => {
    if (!usageStats) return 'purple'
    
    const usagePercentage = (usageStats.total_calls / usageStats.calls_limit) * 100
    
    if (usagePercentage === 0) return 'purple'      // None used
    if (usagePercentage < 50) return 'green'        // Some used
    if (usagePercentage < 75) return 'amber'       // More than half
    return 'red'                                     // 75% or more
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="px-4 sm:px-6 lg:px-8">
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
                <span className="text-xl font-bold text-suede-text">Headrest</span>
              </Link>
              <div className="h-6 w-px bg-gray-300"></div>
              <h1 className="text-xl font-semibold text-suede-text">Dashboard</h1>
            </div>
                <div className="flex items-center space-x-4">
                  {/* Desktop navigation - hidden on mobile */}
                  <div className="hidden lg:flex items-center space-x-4">
                    <Link
                      href={selectedOrg ? `/dashboard/stores?selected=${selectedOrg.id}` : '/dashboard/stores'}
                      className="bg-suede-primary hover:bg-suede-accent text-white px-4 py-2 rounded-md text-sm font-medium"
                    >
                      Manage Stores
                    </Link>
                    <Link
                      href="/dashboard/api-keys"
                      className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                    >
                      API Keys
                    </Link>
                    <Link
                      href="/docs"
                      className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                    >
                      Documentation
                    </Link>
                    <span className="text-sm text-gray-500">
                      Welcome, {user?.email}
                    </span>
                    <button
                      onClick={handleSignOut}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                    >
                      Sign out
                    </button>
                  </div>
              
              {/* Mobile navigation */}
              <MobileNav 
                currentPage="dashboard" 
                user={user} 
                onSignOut={handleSignOut}
                selectedOrg={selectedOrg}
                organizations={organizations}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0 bg-gray-50 rounded-lg p-6">

              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Quick Stats Overview */}
                <div className="lg:col-span-3">
                  <div className="bg-white shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                        Overview
                      </h3>
                
                  {organizationsLoading && (
                    <div className="text-center py-8">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                      <p className="mt-2 text-gray-600">Loading your data...</p>
                    </div>
                  )}

                  {!organizationsLoading && organizations.length === 0 && (
                    <div className="text-center py-8">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"></path>
                      </svg>
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No stores connected</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Get started by connecting your first PrestaShop store.
                      </p>
                      <div className="mt-6">
                        <Link
                          href="/dashboard/stores?create=true"
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                        >
                          Connect Your First Store
                        </Link>
                      </div>
                    </div>
                  )}

                  {!organizationsLoading && organizations.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                            </svg>
                          </div>
                          <div className="ml-4">
                            <p className="text-sm font-medium text-blue-600">Total Stores</p>
                            <p className="text-2xl font-semibold text-blue-900">{organizations.length}</p>
                          </div>
                        </div>
                      </div>

                          <div className={`rounded-lg p-4 ${
                            getApiCallsColor() === 'purple' ? 'bg-purple-50' :
                            getApiCallsColor() === 'green' ? 'bg-green-50' :
                            getApiCallsColor() === 'amber' ? 'bg-amber-50' :
                            'bg-red-50'
                          }`}>
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <svg className={`h-8 w-8 ${
                              getApiCallsColor() === 'purple' ? 'text-purple-600' :
                              getApiCallsColor() === 'green' ? 'text-green-600' :
                              getApiCallsColor() === 'amber' ? 'text-amber-600' :
                              'text-red-600'
                            }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                            </svg>
                          </div>
                          <div className="ml-4">
                            <p className={`text-sm font-medium ${
                              getApiCallsColor() === 'purple' ? 'text-purple-600' :
                              getApiCallsColor() === 'green' ? 'text-green-600' :
                              getApiCallsColor() === 'amber' ? 'text-amber-600' :
                              'text-red-600'
                            }`}>API Calls Used</p>
                            <p className={`text-2xl font-semibold ${
                              getApiCallsColor() === 'purple' ? 'text-purple-900' :
                              getApiCallsColor() === 'green' ? 'text-green-900' :
                              getApiCallsColor() === 'amber' ? 'text-amber-900' :
                              'text-red-900'
                            }`}>
                              {usageStats ? usageStats.total_calls.toLocaleString() : '0'}
                            </p>
                          </div>
                        </div>
                      </div>

                          <div className="bg-purple-50 rounded-lg p-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <svg className="h-8 w-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                            </svg>
                          </div>
                          <div className="ml-4">
                            <p className="text-sm font-medium text-purple-600">Plan Tier</p>
                            <p className="text-2xl font-semibold text-purple-900 capitalize">
                              {organizations[0]?.plan_tier || 'N/A'}
                            </p>
                          </div>
                        </div>
                      </div>

                          <div className="bg-green-50 rounded-lg p-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path>
                            </svg>
                          </div>
                          <div className="ml-4">
                            <p className="text-sm font-medium text-green-600">Connected Stores</p>
                            <p className="text-2xl font-semibold text-green-900">
                              {Object.values(connectionStatuses).filter(status => status === 'connected').length}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Analytics within Overview */}
                  {!organizationsLoading && organizations.length > 0 && (
                    <div className="mt-8 space-y-6">
                      {/* Top Endpoints */}
                      <div className="bg-white rounded-lg">
                        <div className="px-4 py-5 sm:p-6">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg leading-6 font-medium text-gray-900">
                              Top API Endpoints
                            </h3>
                            <div className="text-sm text-gray-500">
                              Most frequently used
                            </div>
                          </div>
                          <TopEndpoints usageStats={usageStats || null} />
                        </div>
                      </div>

                      {/* Usage Trends */}
                      <div className="bg-white rounded-lg">
                        <div className="py-5 sm:p-6">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg leading-6 font-medium text-gray-900">
                              API Usage Trends
                            </h3>
                            <div className="text-sm text-gray-500">
                              Last 30 days
                            </div>
                          </div>
                          <UsageChart usageStats={usageStats || null} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

                {/* Quick Actions & Store List */}
                <div className="lg:col-span-1 space-y-6">
              {/* Quick Actions */}
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    Quick Actions
                  </h3>
                  <div className="space-y-3">
                    <Link
                      href="/dashboard/stores"
                      className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium text-center block"
                    >
                      Manage Stores
                    </Link>
                    <Link
                      href="/dashboard/api-keys"
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium text-center block"
                    >
                      API Keys
                    </Link>
                  </div>
                </div>
              </div>

              {/* Store List */}
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    Your Stores
                  </h3>
                  
                  {organizationsLoading && (
                    <div className="text-center py-4">
                      <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                    </div>
                  )}

                  {!organizationsLoading && organizations.length === 0 && (
                    <div className="text-center py-4">
                      <p className="text-sm text-gray-500">No stores connected</p>
                    </div>
                  )}

                  {!organizationsLoading && organizations.length > 0 && (
                    <div className="space-y-2">
                      {organizations.slice(0, 3).map((org: Organization) => (
                        <div
                          key={org.id}
                          className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                        >
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-gray-900">{org.name}</h4>
                            <p className="text-xs text-gray-500 capitalize">{org.plan_tier}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              connectionStatuses[org.id] === 'connected' 
                                ? 'bg-green-100 text-green-800' 
                                : connectionStatuses[org.id] === 'disconnected'
                                ? 'bg-red-100 text-red-800'
                                : connectionStatuses[org.id] === 'testing'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {connectionStatuses[org.id] === 'connected' ? '✓' :
                               connectionStatuses[org.id] === 'disconnected' ? '✗' :
                               connectionStatuses[org.id] === 'testing' ? '⏳' : '?'}
                            </span>
                          </div>
                        </div>
                      ))}
                      
                      {organizations.length > 3 && (
                        <div className="text-center pt-2">
                          <Link
                            href="/dashboard/stores"
                            className="text-sm text-blue-600 hover:text-blue-800"
                          >
                            View all {organizations.length} stores →
                          </Link>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Current Plan Tier */}
              {organizations.length > 0 && (
                <div className="bg-white shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                      Current Plan
                    </h3>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Plan Tier</p>
                        <p className="text-lg font-semibold text-gray-900 capitalize">
                          {organizations[0]?.plan_tier || 'N/A'}
                        </p>
                      </div>
                      <Link
                        href="/pricing"
                        className="bg-suede-primary hover:bg-suede-accent text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                      >
                        Upgrade
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>

        </div>
      </div>
    </div>
  )
}