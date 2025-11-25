import Link from 'next/link'
import { GoogleShoppingFeed } from '@/types/feeds'
import FeedSyncStatus from './FeedSyncStatus'
import ComingSoonBadge from './ComingSoonBadge'

interface FeedCardProps {
  feed: GoogleShoppingFeed
  isMock?: boolean
}

export default function FeedCard({ feed, isMock = false }: FeedCardProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow relative">
      {isMock && (
        <div className="absolute top-4 right-4">
          <ComingSoonBadge size="sm" />
        </div>
      )}

      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{feed.name}</h3>
            {feed.description && (
              <p className="text-sm text-gray-500">{feed.description}</p>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Status:</span>
          <FeedSyncStatus status={feed.sync_status} lastSync={feed.last_sync_at} />
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Target:</span>
          <span className="font-medium text-gray-900">{feed.target_country} / {feed.target_language}</span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Products:</span>
          <span className="font-medium text-gray-900">
            {feed.successful_products} / {feed.total_products}
          </span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Sync Frequency:</span>
          <span className="font-medium text-gray-900 capitalize">{feed.sync_frequency}</span>
        </div>
      </div>

      <div className="flex space-x-2 pt-4 border-t border-gray-100">
        <Link
          href={`/dashboard/feeds/google-shopping/${feed.id}`}
          className="flex-1 text-center px-4 py-2 bg-suede-primary text-white rounded-md hover:bg-suede-accent transition-colors text-sm font-medium"
        >
          Manage
        </Link>
        <button
          onClick={() => alert('Feed sync feature coming soon!')}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-sm font-medium"
        >
          Sync Now
        </button>
      </div>
    </div>
  )
}
