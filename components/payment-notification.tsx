'use client'

import { useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'

function PaymentNotificationContent() {
  const searchParams = useSearchParams()
  const success = searchParams.get('success')
  const canceled = searchParams.get('canceled')

  useEffect(() => {
    if (success) {
      // Handle successful payment
      const timer = setTimeout(() => {
        // Remove query params after showing notification
        const url = new URL(window.location.href)
        url.searchParams.delete('success')
        window.history.replaceState({}, '', url.toString())
      }, 5000)
      return () => clearTimeout(timer)
    }
    if (canceled) {
      // Handle canceled payment
      const timer = setTimeout(() => {
        const url = new URL(window.location.href)
        url.searchParams.delete('canceled')
        window.history.replaceState({}, '', url.toString())
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [success, canceled])

  if (!success && !canceled) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 shadow-lg flex items-start gap-3">
          <CheckCircleIcon className="h-6 w-6 text-green-600 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-green-900">Payment Successful!</h3>
            <p className="text-sm text-green-700 mt-1">
              Your payment has been processed successfully. Thank you for your purchase!
            </p>
          </div>
        </div>
      )}
      {canceled && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 shadow-lg flex items-start gap-3">
          <XCircleIcon className="h-6 w-6 text-amber-600 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-amber-900">Payment Canceled</h3>
            <p className="text-sm text-amber-700 mt-1">
              Your payment was canceled. You can try again whenever you&apos;re ready.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default function PaymentNotification() {
  return (
    <Suspense fallback={null}>
      <PaymentNotificationContent />
    </Suspense>
  )
}
