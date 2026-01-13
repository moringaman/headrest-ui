'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useAuth } from '@/components/providers/auth-provider'
import { useQuery } from '@tanstack/react-query'
import { apiClient, type Organization } from '@/lib/api'
import FeedList from '@/components/feeds/FeedList'
import FeedUrlDisplay from '@/components/feeds/FeedUrlDisplay'
import ValidationErrors from '@/components/feeds/ValidationErrors'
import ComingSoonBadge from '@/components/feeds/ComingSoonBadge'
import { GoogleShoppingFeed } from '@/types/feeds'
import { useFeatureFlag } from '@/hooks/use-feature-flag'

export default function FeedsPage() {
  const { user, session } = useAuth()
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null)

  // Feature flags
  const { value: googleShoppingFeedEnabled } = useFeatureFlag('google_shopping_feed', false)

  // Fetch feeds from API
  const { data: feedsData, isLoading: feedsLoading, refetch: refetchFeeds } = useQuery({
    queryKey: ['feeds', selectedOrg?.id],
    queryFn: () => apiClient.getFeeds(session?.access_token, { page: 1, limit: 50 }),
    enabled: !!selectedOrg?.id && !!session?.access_token && googleShoppingFeedEnabled,
    retry: 1,
  })

  const feeds = (feedsData as any)?.feeds || []
  const totalFeeds = (feedsData as any)?.pagination?.total || feeds.length || 0

  // Fetch organizations for the current user
  const { data: organizations = [] } = useQuery({
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

  // Fetch Google Shopping feed statistics
  const { data: feedStats, isLoading: statsLoading } = useQuery({
    queryKey: ['google-shopping-stats', selectedOrg?.id],
    queryFn: () => apiClient.getGoogleShoppingFeedStats(selectedOrg!.id, 1, session?.access_token),
    enabled: !!selectedOrg?.id && !!session?.access_token && googleShoppingFeedEnabled,
    retry: 1,
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Product Feeds</h1>
              <p className="mt-2 text-gray-600">
                Manage your multi-channel product feeds and sync settings
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {!googleShoppingFeedEnabled && <ComingSoonBadge />}
              {googleShoppingFeedEnabled ? (
                <Link
                  href="/dashboard/feeds/google-shopping/new"
                  className="bg-suede-primary text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-suede-accent transition-colors flex items-center shadow-sm"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create Feed
                </Link>
              ) : (
                <button
                  onClick={() => alert('Feed creation will be available soon! The backend API is currently in development.')}
                  className="bg-suede-primary text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-suede-accent transition-colors flex items-center shadow-sm"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create Feed
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Feed Types Tabs */}
        <div className="bg-white rounded-lg border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Feed types">
              {googleShoppingFeedEnabled ? (
                <button
                  className="border-b-2 border-suede-primary py-4 px-1 text-sm font-medium text-suede-primary"
                >
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Google Shopping
                    <span className="ml-2 bg-suede-primary text-white text-xs px-2 py-0.5 rounded-full">
                      {totalFeeds}
                    </span>
                  </div>
                </button>
              ) : (
                <button
                  disabled
                  className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-400 cursor-not-allowed"
                >
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Google Shopping
                    <span className="ml-2 bg-gray-200 text-gray-600 text-xs px-2 py-0.5 rounded-full">Coming Soon</span>
                  </div>
                </button>
              )}
              <button
                disabled
                className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-400 cursor-not-allowed"
              >
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  Facebook / Instagram
                  <span className="ml-2 bg-gray-200 text-gray-600 text-xs px-2 py-0.5 rounded-full">Coming Soon</span>
                </div>
              </button>
            </nav>
          </div>

          {/* Google Shopping Tab Content */}
          {googleShoppingFeedEnabled && (
            <div className="p-6">
              {/* Google Shopping Stats Cards */}
              <div className="grid md:grid-cols-4 gap-6 mb-6">
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Total Products</p>
                      {statsLoading ? (
                        <div className="h-9 w-16 bg-gray-200 rounded animate-pulse"></div>
                      ) : (
                        <p className="text-3xl font-bold text-gray-900">
                          {feedStats?.totalProducts?.toLocaleString() || '0'}
                        </p>
                      )}
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Valid Products</p>
                      {statsLoading ? (
                        <div className="h-9 w-16 bg-gray-200 rounded animate-pulse"></div>
                      ) : (
                        <p className="text-3xl font-bold text-green-600">
                          {feedStats?.validProducts?.toLocaleString() || '0'}
                        </p>
                      )}
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">In Stock</p>
                      {statsLoading ? (
                        <div className="h-9 w-16 bg-gray-200 rounded animate-pulse"></div>
                      ) : (
                        <p className="text-3xl font-bold text-gray-900">
                          {feedStats?.productsInStock?.toLocaleString() || '0'}
                        </p>
                      )}
                    </div>
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">With GTIN</p>
                      {statsLoading ? (
                        <div className="h-9 w-16 bg-gray-200 rounded animate-pulse"></div>
                      ) : (
                        <p className="text-3xl font-bold text-gray-900">
                          {feedStats?.productsWithGTIN?.toLocaleString() || '0'}
                        </p>
                      )}
                    </div>
                    <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Feed URL Display */}
              {selectedOrg && (
                <div className="mb-6">
                  <FeedUrlDisplay organizationId={selectedOrg.id} feedStats={feedStats} />
                </div>
              )}

              {/* Validation Errors */}
              {feedStats && feedStats.errors && feedStats.errors.length > 0 && (
                <div className="mb-6">
                  <ValidationErrors stats={feedStats} />
                </div>
              )}

              {/* Feeds List */}
              <FeedList feeds={feeds} isLoading={feedsLoading} onRefetch={refetchFeeds} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
