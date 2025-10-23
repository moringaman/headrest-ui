import { useState, useEffect } from 'react'

export interface PaymentData {
  email: string
  planId: string
  stripeCustomerId: string
  subscriptionId: string
  billingPeriod: string
  isTrial: boolean
  timestamp: number
}

const PAYMENT_DATA_KEY = 'suede_payment_data'

export function usePaymentData() {
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for stored payment data on mount
    const stored = localStorage.getItem(PAYMENT_DATA_KEY)
    if (stored) {
      try {
        const data = JSON.parse(stored)
        // Check if data is not too old (24 hours)
        const isExpired = Date.now() - data.timestamp > 24 * 60 * 60 * 1000
        if (!isExpired) {
          setPaymentData(data)
        } else {
          // Remove expired data
          localStorage.removeItem(PAYMENT_DATA_KEY)
        }
      } catch (error) {
        console.error('Failed to parse stored payment data:', error)
        localStorage.removeItem(PAYMENT_DATA_KEY)
      }
    }
    setIsLoading(false)
  }, [])

  const storePaymentData = (data: PaymentData) => {
    localStorage.setItem(PAYMENT_DATA_KEY, JSON.stringify(data))
    setPaymentData(data)
  }

  const clearPaymentData = () => {
    localStorage.removeItem(PAYMENT_DATA_KEY)
    setPaymentData(null)
  }

  const hasPaymentData = () => {
    return paymentData !== null
  }

  return {
    paymentData,
    isLoading,
    storePaymentData,
    clearPaymentData,
    hasPaymentData
  }
}

