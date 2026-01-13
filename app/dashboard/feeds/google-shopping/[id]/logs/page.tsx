'use client'

import { use, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/components/providers/auth-provider'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import { GoogleShoppingFeedLog } from '@/types/feeds'

export default function FeedLogsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { session } = useAuth()
  const [selectedLog, setSelectedLog] = useState<string | null>(null)

  // Fetch feed details
  const { data: feed } = useQuery({
    queryKey: ['feed', id],
    queryFn: () => apiClient.getFeed(id, session?.access_token),
    enabled: !!id && !!session?.access_token,
  })

  // Fetch feed logs
  const { data: logsData, isLoading: logsLoading } = useQuery({
    queryKey: ['feed-logs', id],
    queryFn: () => apiClient.getFeedLogs(id, session?.access_token, { page: 1, limit: 50 }),
    enabled: !!id && !!session?.access_token,
  })

  // Fetch detailed log if one is selected
  const { data: logDetail } = useQuery({
    queryKey: ['feed-log-detail', id, selectedLog],
    queryFn: () => apiClient.getFeedLog(id, selectedLog!, session?.access_token),
    enabled: !!id && !!selectedLog && !!session?.access_token,
  })

  const logs = ((logsData as any)?.logs as GoogleShoppingFeedLog[]) || []

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      case 'partial':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatDuration = (startDate: string, endDate?: string) => {
    if (!endDate) return 'In progress...'
    const start = new Date(startDate).getTime()
    const end = new Date(endDate).getTime()
    const seconds = Math.floor((end - start) / 1000)
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds}s`
  }

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

          <h1 className="text-3xl font-bold text-gray-900">Sync History</h1>
          {feed && (
            <p className="mt-2 text-gray-600">{(feed as any).name}</p>
          )}
        </div>

        {/* Loading State */}
        {logsLoading && (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <div className="animate-spin h-12 w-12 border-4 border-suede-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Loading sync history...</p>
          </div>
        )}

        {/* Logs List */}
        {!logsLoading && logs.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Started
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Products
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Success Rate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {logs.map((log) => {
                    const successRate = log.products_processed > 0
                      ? Math.round((log.products_succeeded / log.products_processed) * 100)
                      : 0

                    return (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(log.status)}`}>
                            {log.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(log.sync_started_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDuration(log.sync_started_at, log.sync_completed_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center space-x-2">
                            <span className="text-green-600 font-medium">{log.products_succeeded}</span>
                            <span className="text-gray-400">/</span>
                            <span>{log.products_processed}</span>
                            {log.products_failed > 0 && (
                              <>
                                <span className="text-gray-400">·</span>
                                <span className="text-red-600">{log.products_failed} failed</span>
                              </>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                              <div
                                className={`h-2 rounded-full ${
                                  successRate >= 90 ? 'bg-green-500' :
                                  successRate >= 70 ? 'bg-yellow-500' :
                                  'bg-red-500'
                                }`}
                                style={{ width: `${successRate}%` }}
                              ></div>
                            </div>
                            <span className="text-sm text-gray-900">{successRate}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => setSelectedLog(log.id)}
                            className="text-suede-primary hover:text-suede-accent"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!logsLoading && logs.length === 0 && (
          <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Sync History Yet</h3>
            <p className="text-gray-600">
              This feed hasn't been synced yet. Sync it to see the history here.
            </p>
          </div>
        )}

        {/* Log Detail Modal */}
        {selectedLog && logDetail && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-3xl w-full max-h-[80vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 sticky top-0 bg-white">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">Sync Details</h2>
                  <button
                    onClick={() => setSelectedLog(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Status and Timestamps */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Status</p>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor((logDetail as any).status)}`}>
                      {(logDetail as any).status}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Duration</p>
                    <p className="text-sm font-medium text-gray-900">
                      {formatDuration((logDetail as any).sync_started_at, (logDetail as any).sync_completed_at)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Started</p>
                    <p className="text-sm font-medium text-gray-900">
                      {formatDate((logDetail as any).sync_started_at)}
                    </p>
                  </div>
                  {(logDetail as any).sync_completed_at && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Completed</p>
                      <p className="text-sm font-medium text-gray-900">
                        {formatDate((logDetail as any).sync_completed_at)}
                      </p>
                    </div>
                  )}
                </div>

                {/* Product Statistics */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Product Statistics</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{(logDetail as any).products_processed}</p>
                      <p className="text-sm text-gray-600">Processed</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-green-600">{(logDetail as any).products_succeeded}</p>
                      <p className="text-sm text-gray-600">Succeeded</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-red-600">{(logDetail as any).products_failed}</p>
                      <p className="text-sm text-gray-600">Failed</p>
                    </div>
                  </div>
                </div>

                {/* Error Message */}
                {(logDetail as any).error_message && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-red-900 mb-2">Error Message</h3>
                    <p className="text-sm text-red-800">{(logDetail as any).error_message}</p>
                  </div>
                )}

                {/* Error Details */}
                {(logDetail as any).error_details && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-2">Error Details</h3>
                    <pre className="bg-gray-100 rounded-lg p-4 text-xs overflow-x-auto">
                      {JSON.stringify((logDetail as any).error_details, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
