'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { UsageStats } from '@/lib/api'

interface UsageChartProps {
  usageStats: UsageStats | null
}

export default function UsageChart({ usageStats }: UsageChartProps) {
  if (!usageStats?.daily_usage || usageStats.daily_usage.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
          </svg>
          <p className="mt-2 text-sm text-white">No usage data available</p>
          <p className="text-xs text-gray-400">Usage data will appear here once you start making API calls</p>
        </div>
      </div>
    )
  }

  // Format the data for the chart
  const chartData = usageStats.daily_usage.map(item => ({
    date: new Date(item.date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    }),
    calls: item.count,
    fullDate: item.date
  }))


  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-800 p-3 border border-gray-700 rounded-lg shadow-xl">
          <p className="font-medium text-white">{`Date: ${label}`}</p>
          <p className="text-blue-400">
            {`API Calls: ${payload[0].value.toLocaleString()}`}
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            dataKey="date"
            stroke="#9ca3af"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#9ca3af"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => value.toLocaleString()}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="calls"
            stroke="#60a5fa"
            strokeWidth={2}
            dot={{ fill: '#60a5fa', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: '#60a5fa', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
