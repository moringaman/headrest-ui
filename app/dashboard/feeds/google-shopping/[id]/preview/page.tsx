'use client'

import { use } from 'react'
import Link from 'next/link'
import { useAuth } from '@/components/providers/auth-provider'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'

export default function FeedPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { session } = useAuth()

  // Fetch feed details
  const { data: feedData, isLoading: feedLoading } = useQuery({
    queryKey: ['feed', id],
    queryFn: () => apiClient.getFeed(id, session?.access_token),
    enabled: !!id && !!session?.access_token,
  })
  const feed = feedData as any

  // Fetch feed preview
  const { data: previewDataRaw, isLoading: previewLoading } = useQuery({
    queryKey: ['feed-preview', id],
    queryFn: () => apiClient.previewFeed(id, session?.access_token, 20),
    enabled: !!id && !!session?.access_token,
  })
  const previewData = previewDataRaw as any

  const products = previewData?.products || []

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard/feeds"
            className="text-suede-primary hover:text-suede-accent font-medium flex items-center mb-4"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Feeds
          </Link>

          <h1 className="text-3xl font-bold text-gray-900">Feed Preview</h1>
          {feed && (
            <p className="mt-2 text-gray-600">
              {feed.name} - Showing first {products.length} products
            </p>
          )}
        </div>

        {/* Loading State */}
        {(feedLoading || previewLoading) ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <div className="animate-spin h-12 w-12 border-4 border-suede-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Loading preview...</p>
          </div>
        ) : null}

        {/* Products Preview */}
        {!previewLoading && products.length > 0 ? (
          <div className="space-y-4">
            {products.map((product: any, index: number) => (
              <div key={index} className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-start space-x-4">
                  {/* Product Image */}
                  {product.image_link && (
                    <div className="flex-shrink-0">
                      <img
                        src={product.image_link}
                        alt={product.title}
                        className="w-24 h-24 object-cover rounded-md border border-gray-200"
                        onError={(e) => {
                          e.currentTarget.src = '/placeholder-product.png'
                        }}
                      />
                    </div>
                  )}

                  {/* Product Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {product.title}
                        </h3>
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {product.description}
                        </p>
                      </div>
                      <div className="flex-shrink-0 ml-4">
                        <p className="text-2xl font-bold text-gray-900">{product.price}</p>
                      </div>
                    </div>

                    {/* Product Attributes Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">ID</p>
                        <p className="text-sm font-medium text-gray-900">{product.id}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Availability</p>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          product.availability === 'in stock'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {product.availability}
                        </span>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Condition</p>
                        <p className="text-sm font-medium text-gray-900 capitalize">{product.condition}</p>
                      </div>
                      {product.brand && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Brand</p>
                          <p className="text-sm font-medium text-gray-900">{product.brand}</p>
                        </div>
                      )}
                      {product.gtin && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1">GTIN</p>
                          <p className="text-sm font-medium text-gray-900 font-mono">{product.gtin}</p>
                        </div>
                      )}
                      {product.google_product_category && (
                        <div className="col-span-2">
                          <p className="text-xs text-gray-500 mb-1">Google Category</p>
                          <p className="text-sm font-medium text-gray-900">{product.google_product_category}</p>
                        </div>
                      )}
                      {product.link && (
                        <div className="col-span-2">
                          <p className="text-xs text-gray-500 mb-1">Product Link</p>
                          <a
                            href={product.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-suede-primary hover:text-suede-accent truncate block"
                          >
                            {product.link}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {/* Empty State */}
        {!previewLoading && products.length === 0 ? (
          <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Products Found</h3>
            <p className="text-gray-600">
              This feed doesn't have any products yet. Try syncing the feed first.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  )
}
