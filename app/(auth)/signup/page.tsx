'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function SignupPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to plan selection page
    router.push('/signup/plans')
  }, [router])

  return (
    <div className="min-h-screen bg-suede-background flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-suede-primary mx-auto mb-4"></div>
        <p className="text-suede-text">Redirecting to plan selection...</p>
      </div>
    </div>
  )
}