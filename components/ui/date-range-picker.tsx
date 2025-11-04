'use client'

import { useState } from 'react'

interface DateRangePickerProps {
  onDateRangeChange: (fromDate: string, toDate: string) => void
  className?: string
}

export default function DateRangePicker({ onDateRangeChange, className = '' }: DateRangePickerProps) {
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [isOpen, setIsOpen] = useState(false)

  const handleApply = () => {
    if (fromDate && toDate) {
      // Convert to ISO 8601 format with time
      const fromDateTime = new Date(fromDate + 'T00:00:00Z').toISOString()
      const toDateTime = new Date(toDate + 'T23:59:59Z').toISOString()

      console.log('Custom date range selected:', { fromDate: fromDateTime, toDate: toDateTime })
      onDateRangeChange(fromDateTime, toDateTime)
      setIsOpen(false)
    }
  }

  const handleClear = () => {
    setFromDate('')
    setToDate('')
    setIsOpen(false)
  }

  // Get today's date in YYYY-MM-DD format for max attribute
  const today = new Date().toISOString().split('T')[0]

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 bg-gray-700/30 text-gray-300 hover:bg-gray-700/50 hover:text-white border border-gray-600"
        aria-label="Select custom date range"
      >
        <div className="flex items-center space-x-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>Custom Range</span>
        </div>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute right-0 mt-2 z-50 bg-gray-800 border border-gray-700 rounded-lg shadow-xl p-4 min-w-[300px]">
            <div className="space-y-4">
              <div>
                <label htmlFor="from-date" className="block text-sm font-medium text-gray-300 mb-2">
                  From Date
                </label>
                <input
                  type="date"
                  id="from-date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  max={toDate || today}
                  className="w-full px-3 py-2 bg-gray-900/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-headrest-teal"
                />
              </div>

              <div>
                <label htmlFor="to-date" className="block text-sm font-medium text-gray-300 mb-2">
                  To Date
                </label>
                <input
                  type="date"
                  id="to-date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  min={fromDate}
                  max={today}
                  className="w-full px-3 py-2 bg-gray-900/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-headrest-teal"
                />
              </div>

              {/* Validation message */}
              {fromDate && toDate && new Date(fromDate) > new Date(toDate) && (
                <p className="text-sm text-red-400">From date must be before To date</p>
              )}

              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={handleClear}
                  className="px-3 py-1 text-sm text-gray-400 hover:text-white transition-colors"
                >
                  Clear
                </button>

                <button
                  onClick={handleApply}
                  disabled={!fromDate || !toDate || new Date(fromDate) > new Date(toDate)}
                  className="px-4 py-2 bg-headrest-teal text-white rounded-lg text-sm font-medium hover:bg-headrest-teal-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
