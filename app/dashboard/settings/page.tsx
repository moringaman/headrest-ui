'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/components/providers/auth-provider'
import { useAppStore } from '@/lib/store'
import { useQuery } from '@tanstack/react-query'
import { apiClient, type Organization } from '@/lib/api'
import MobileNav from '@/components/ui/mobile-nav'

export default function SettingsPage() {
  const { user, session, signOut } = useAuth()
  const { addNotification } = useAppStore()
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null)

  // Fetch organizations
  const { data: organizations = [], isLoading: organizationsLoading } = useQuery({
    queryKey: ['organizations', user?.id],
    queryFn: () => apiClient.getOrganizations(session?.access_token),
    enabled: !!user?.id && !!session?.access_token,
  })

  // Auto-select first organization
  useEffect(() => {
    if (organizations && organizations.length > 0 && !selectedOrg) {
      setSelectedOrg(organizations[0])
    }
  }, [organizations, selectedOrg])

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

  const settingsSections = [
    {
      id: 'billing',
      title: 'Billing & Subscription',
      description: 'Manage your subscription, payment methods, and billing history',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      ),
      href: '/dashboard/billing',
      color: 'bg-green-500/10 border-green-500/20 text-green-400 hover:bg-green-500/20',
    },
    {
      id: 'auth',
      title: 'Authentication Settings',
      description: 'Configure Firebase, Google, and Apple authentication providers',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
      href: '/dashboard/auth-settings',
      color: 'bg-blue-500/10 border-blue-500/20 text-blue-400 hover:bg-blue-500/20',
    },
    {
      id: 'api-keys',
      title: 'API Keys',
      description: 'Manage your API keys for accessing the PrestaShop API',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
        </svg>
      ),
      href: '/dashboard/api-keys',
      color: 'bg-purple-500/10 border-purple-500/20 text-purple-400 hover:bg-purple-500/20',
    },
    {
      id: 'stores',
      title: 'Store Connections',
      description: 'Manage your connected PrestaShop stores',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      href: '/dashboard/stores',
      color: 'bg-orange-500/10 border-orange-500/20 text-orange-400 hover:bg-orange-500/20',
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <MobileNav
        currentPage="settings"
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
              <h1 className="text-2xl font-bold text-white">Account Settings</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* User Profile Section */}
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg shadow-xl mb-6">
          <div className="p-6 border-b border-gray-700">
            <h2 className="text-lg font-semibold text-white">Profile Information</h2>
            <p className="text-sm text-gray-400 mt-1">Your account details</p>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Email Address</label>
                <div className="text-white font-medium">{user?.email || 'N/A'}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">User ID</label>
                <div className="text-gray-300 text-sm font-mono">{user?.id || 'N/A'}</div>
              </div>
              {user?.email_confirmed_at && (
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Email Verified</label>
                  <div className="flex items-center space-x-2">
                    <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-green-400">Verified</span>
                  </div>
                </div>
              )}
              {user?.last_sign_in_at && (
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Last Sign In</label>
                  <div className="text-gray-300 text-sm">
                    {new Date(user.last_sign_in_at).toLocaleString()}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Organization Info */}
        {organizations.length > 0 && (
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg shadow-xl mb-6">
            <div className="p-6 border-b border-gray-700">
              <h2 className="text-lg font-semibold text-white">Organization</h2>
              <p className="text-sm text-gray-400 mt-1">Current organization details</p>
            </div>
            <div className="p-6">
              {organizations.length > 1 && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-400 mb-2">Select Organization</label>
                  <select
                    value={selectedOrg?.id || ''}
                    onChange={(e) => {
                      const org = organizations.find(o => o.id === e.target.value)
                      if (org) setSelectedOrg(org)
                    }}
                    className="w-full bg-gray-900/50 border border-gray-600 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {organizations.map(org => (
                      <option key={org.id} value={org.id}>
                        {org.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {selectedOrg && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Organization Name</label>
                    <div className="text-white font-medium">{selectedOrg.name}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Plan Tier</label>
                    <div className="text-blue-400 font-medium capitalize">{selectedOrg.plan_tier || 'N/A'}</div>
                  </div>
                  {selectedOrg.created_at && (
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Created</label>
                      <div className="text-gray-300 text-sm">
                        {new Date(selectedOrg.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Settings Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {settingsSections.map((section) => (
            <Link
              key={section.id}
              href={section.href}
              className={`group border-2 rounded-lg p-6 transition-all hover:scale-[1.02] ${section.color}`}
            >
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 mt-1">
                  {section.icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-2">{section.title}</h3>
                  <p className="text-sm opacity-80">{section.description}</p>
                  <div className="mt-4 flex items-center text-sm font-medium opacity-60 group-hover:opacity-100 transition-opacity">
                    Manage
                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mt-6 bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg shadow-xl">
          <div className="p-6 border-b border-gray-700">
            <h2 className="text-lg font-semibold text-white">Quick Actions</h2>
            <p className="text-sm text-gray-400 mt-1">Common account actions</p>
          </div>
          <div className="p-6">
            <div className="flex flex-wrap gap-4">
              <Link
                href="/dashboard"
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Go to Dashboard
              </Link>
              <Link
                href="/docs"
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors"
              >
                View Documentation
              </Link>
              <Link
                href="/pricing"
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors"
              >
                View Pricing Plans
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

