'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/components/providers/auth-provider'
import { apiClient } from '@/lib/api'
import type { GoogleShoppingFeedStats } from '@/types/feeds'

interface FeedUrlDisplayProps {
  organizationId: string
  feedId?: string
  lang?: number
  feedStats?: GoogleShoppingFeedStats
}

export default function FeedUrlDisplay({ organizationId, feedId, lang = 1, feedStats }: FeedUrlDisplayProps) {
  const { session } = useAuth()
  const [copiedFormat, setCopiedFormat] = useState<'xml' | 'txt' | null>(null)

  // Check if feed has valid products
  const hasValidProducts = feedStats ? feedStats.validProducts > 0 : true
  const hasProducts = feedStats ? feedStats.totalProducts > 0 : true

  // Fetch dynamic feed URL if feedId is provided
  const { data: feedUrlData } = useQuery({
    queryKey: ['feed-url', feedId],
    queryFn: () => apiClient.getFeedUrl(feedId!, session?.access_token),
    enabled: !!feedId && !!session?.access_token,
    retry: 1,
  })

  // Fallback to static URLs if no feedId or no data
  const xmlUrl = (feedUrlData as any)?.feed_xml_url || `${process.env.NEXT_PUBLIC_API_URL}/api/v1/google-shopping/feed/${organizationId}?format=xml&lang=${lang}`
  const txtUrl = (feedUrlData as any)?.feed_url || `${process.env.NEXT_PUBLIC_API_URL}/api/v1/google-shopping/feed/${organizationId}?format=txt&lang=${lang}`

  const copyToClipboard = async (url: string, format: 'xml' | 'txt') => {
    try {
      await navigator.clipboard.writeText(url)
      setCopiedFormat(format)
      setTimeout(() => setCopiedFormat(null), 2000)
    } catch (err) {
      console.error('Failed to copy URL:', err)
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Your Feed URLs</h3>
          <p className="text-sm text-gray-600 mt-1">
            Use these URLs to connect your products to Google Merchant Center
          </p>
        </div>
        <a
          href="https://merchants.google.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-suede-primary hover:text-suede-accent font-medium flex items-center"
        >
          Open Merchant Center
          <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>

      {/* Warning for empty/invalid feeds */}
      {!hasValidProducts && hasProducts && (
        <div className="mb-4 bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="ml-3 flex-1">
              <h4 className="text-sm font-semibold text-orange-900">Feed Currently Empty</h4>
              <p className="mt-1 text-sm text-orange-800">
                Your feed contains no valid products because all {feedStats?.totalProducts} {feedStats?.totalProducts === 1 ? 'product has' : 'products have'} validation errors.
                <strong className="block mt-1">Do not submit this feed URL to Google Merchant Center yet.</strong>
              </p>
              <p className="mt-2 text-sm text-orange-800">
                Fix the validation errors shown below in your PrestaShop store, then your feed will automatically include the corrected products.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {/* XML Feed URL */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">XML Feed (Recommended)</label>
            <span className="text-xs text-gray-500">Google Shopping format</span>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={xmlUrl}
              readOnly
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm font-mono text-gray-700"
            />
            <button
              onClick={() => copyToClipboard(xmlUrl, 'xml')}
              className="px-4 py-2 bg-suede-primary text-white rounded-lg hover:bg-suede-accent transition-colors flex items-center space-x-2"
            >
              {copiedFormat === 'xml' ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* TXT Feed URL */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">TXT Feed (Alternative)</label>
            <span className="text-xs text-gray-500">Tab-separated format</span>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={txtUrl}
              readOnly
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm font-mono text-gray-700"
            />
            <button
              onClick={() => copyToClipboard(txtUrl, 'txt')}
              className="px-4 py-2 bg-suede-primary text-white rounded-lg hover:bg-suede-accent transition-colors flex items-center space-x-2"
            >
              {copiedFormat === 'txt' ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Setup Instructions */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="ml-3">
            <h4 className="text-sm font-medium text-blue-900">Setup Instructions</h4>
            <ol className="mt-2 text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>Copy one of the feed URLs above (XML recommended)</li>
              <li>Go to Google Merchant Center and navigate to Products → Feeds</li>
              <li>Click "Add Feed" and select "Scheduled fetch"</li>
              <li>Paste your feed URL and configure sync schedule</li>
              <li>Google will validate and import your products automatically</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}
