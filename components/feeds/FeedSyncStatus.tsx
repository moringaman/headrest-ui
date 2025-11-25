import { GoogleShoppingFeed } from '@/types/feeds'

interface FeedSyncStatusProps {
  status: GoogleShoppingFeed['sync_status']
  lastSync?: string
}

export default function FeedSyncStatus({ status, lastSync }: FeedSyncStatusProps) {
  const statusConfig = {
    pending: {
      color: 'text-gray-600 bg-gray-100',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      label: 'Pending'
    },
    syncing: {
      color: 'text-blue-600 bg-blue-100',
      icon: (
        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ),
      label: 'Syncing'
    },
    completed: {
      color: 'text-green-600 bg-green-100',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ),
      label: 'Synced'
    },
    failed: {
      color: 'text-red-600 bg-red-100',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      ),
      label: 'Failed'
    }
  }

  const config = statusConfig[status]

  return (
    <div className="flex items-center space-x-2">
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.icon}
        <span className="ml-1.5">{config.label}</span>
      </span>
      {lastSync && status === 'completed' && (
        <span className="text-xs text-gray-500">
          {new Date(lastSync).toLocaleString()}
        </span>
      )}
    </div>
  )
}
