'use client'

import { UsagePeriod } from '@/lib/api'

interface PeriodSelectorProps {
  selectedPeriod: UsagePeriod
  onPeriodChange: (period: UsagePeriod) => void
  className?: string
}

export default function PeriodSelector({ selectedPeriod, onPeriodChange, className = '' }: PeriodSelectorProps) {
  const periods: Array<{ value: UsagePeriod; label: string; description: string }> = [
    { value: 'day', label: 'Last 24 Hours', description: 'Today' },
    { value: 'week', label: 'Last 7 Days', description: 'Past week' },
    { value: 'month', label: 'Last 30 Days', description: 'Past month' },
  ]

  const handlePeriodChange = (newPeriod: UsagePeriod) => {
    console.log('Period selector clicked:', newPeriod)
    onPeriodChange(newPeriod)
  }

  return (
    <div className={`flex gap-2 ${className}`}>
      {periods.map((period) => (
        <button
          key={period.value}
          onClick={() => handlePeriodChange(period.value)}
          className={`
            px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
            ${
              selectedPeriod === period.value
                ? 'bg-headrest-teal text-white shadow-md'
                : 'bg-gray-700/30 text-gray-300 hover:bg-gray-700/50 hover:text-white'
            }
          `}
          aria-label={`View usage for ${period.description}`}
          aria-pressed={selectedPeriod === period.value}
        >
          <div className="flex flex-col items-center">
            <span className="font-semibold">{period.label}</span>
            <span className="text-xs opacity-75">{period.description}</span>
          </div>
        </button>
      ))}
    </div>
  )
}
