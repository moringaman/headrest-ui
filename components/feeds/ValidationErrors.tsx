'use client'

import { useState } from 'react'
import type { GoogleShoppingFeedStats } from '@/types/feeds'

interface ValidationErrorsProps {
  stats: GoogleShoppingFeedStats
}

export default function ValidationErrors({ stats }: ValidationErrorsProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const { errors, invalidProducts } = stats

  if (!errors || errors.length === 0) {
    return null
  }

  // Show first 5 errors by default
  const displayedErrors = isExpanded ? errors : errors.slice(0, 5)
  const hasMoreErrors = errors.length > 5

  return (
    <div className="bg-white rounded-lg border border-red-200 p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-semibold text-gray-900">Product Validation Issues</h3>
            <p className="text-sm text-gray-600 mt-1">
              {invalidProducts} {invalidProducts === 1 ? 'product has' : 'products have'} validation errors that need to be fixed
            </p>
          </div>
        </div>
        {hasMoreErrors && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm text-suede-primary hover:text-suede-accent font-medium flex items-center"
          >
            {isExpanded ? (
              <>
                Show Less
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              </>
            ) : (
              <>
                Show All ({errors.length})
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </>
            )}
          </button>
        )}
      </div>

      <div className="space-y-4">
        {displayedErrors.map((error, index) => (
          <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center">
                <span className="text-sm font-medium text-gray-900">Product ID:</span>
                <span className="ml-2 text-sm font-mono text-gray-700 bg-white px-2 py-0.5 rounded border border-gray-200">
                  {error.productId}
                </span>
              </div>
              <span className="text-xs text-red-600 bg-red-100 px-2 py-1 rounded-full">
                {error.errors.length} {error.errors.length === 1 ? 'issue' : 'issues'}
              </span>
            </div>
            <ul className="space-y-1">
              {error.errors.map((errorMessage, errorIndex) => (
                <li key={errorIndex} className="flex items-start text-sm text-red-800">
                  <svg className="w-4 h-4 text-red-600 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  {errorMessage}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Common Fixes Section */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="ml-3">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Common Fixes</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span><strong>Missing GTIN:</strong> Add EAN-13, UPC, or ISBN to product in PrestaShop</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span><strong>Missing Brand:</strong> Set manufacturer in PrestaShop product settings</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span><strong>Missing Image:</strong> Ensure product has at least one image uploaded</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span><strong>Invalid Description:</strong> Product description must be at least 10 characters</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span><strong>Invalid Price:</strong> Product must have a valid price greater than 0</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Documentation Link */}
      <div className="mt-4 flex items-center justify-between text-sm">
        <span className="text-gray-600">
          After fixing products in PrestaShop, Google will re-validate your feed automatically
        </span>
        <a
          href="https://support.google.com/merchants/answer/7052112"
          target="_blank"
          rel="noopener noreferrer"
          className="text-suede-primary hover:text-suede-accent font-medium flex items-center"
        >
          View Google's Requirements
          <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>
    </div>
  )
}
