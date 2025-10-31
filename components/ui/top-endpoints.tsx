'use client'

import { UsageStats } from '@/lib/api'

interface TopEndpointsProps {
  usageStats: UsageStats | null
}

export default function TopEndpoints({ usageStats }: TopEndpointsProps) {
  if (!usageStats?.top_endpoints || usageStats.top_endpoints.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-gray-400">
        <div className="text-center">
          <svg className="mx-auto h-8 w-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
          </svg>
          <p className="mt-1 text-sm text-white">No endpoint data available</p>
          <p className="text-xs text-gray-400">Endpoint usage will appear here once you start making API calls</p>
        </div>
      </div>
    )
  }

  // Get top 5 endpoints
  const topEndpoints = usageStats.top_endpoints.slice(0, 5)

  // Calculate total calls for percentage calculation
  const totalCalls = topEndpoints.reduce((sum, endpoint) => sum + endpoint.count, 0)

  return (
    <div className="space-y-3">
      {topEndpoints.map((endpoint, index) => {
        const percentage = totalCalls > 0 ? (endpoint.count / totalCalls) * 100 : 0

        return (
          <div key={`${endpoint.endpoint}-${endpoint.method}`} className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-500/10 border border-blue-500/20 text-blue-400">
                  {endpoint.method}
                </span>
                <p className="text-sm font-medium text-white truncate">
                  {endpoint.endpoint}
                </p>
              </div>
              <div className="mt-1 flex items-center space-x-2">
                <div className="flex-1 bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="text-xs text-gray-400 min-w-0">
                  {percentage.toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="ml-4 text-right">
              <p className="text-sm font-semibold text-white">
                {endpoint.count.toLocaleString()}
              </p>
              <p className="text-xs text-gray-400">calls</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}





