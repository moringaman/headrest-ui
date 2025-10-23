'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import MobileNav from '@/components/ui/mobile-nav'
import { usePaymentData, PaymentData } from '@/lib/use-payment-data'
import { useAuth } from '@/components/providers/auth-provider'

function AccountCreationForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { paymentData, clearPaymentData, hasPaymentData } = usePaymentData()
  const { setSession } = useAuth()
  
  const [sessionData, setSessionData] = useState<any>(null)
  
  // Get data from URL parameters, session data, or localStorage
  const sessionId = searchParams.get('session_id')
  const rawEmail = searchParams.get('email') || sessionData?.customer_email || paymentData?.email
  const email = rawEmail ? decodeURIComponent(rawEmail) : rawEmail
  
  // Check if we have placeholder strings (old format)
  const hasPlaceholders = rawEmail?.includes('{CHECKOUT_SESSION_EMAIL}') || 
                         searchParams.get('customer_id')?.includes('{CHECKOUT_SESSION_CUSTOMER}') ||
                         searchParams.get('subscription_id')?.includes('{CHECKOUT_SESSION_SUBSCRIPTION}')
  const planId = searchParams.get('plan') || sessionData?.metadata?.planId || paymentData?.planId
  const stripeCustomerId = searchParams.get('customer_id') || sessionData?.customer_id || paymentData?.stripeCustomerId
  const subscriptionId = searchParams.get('subscription_id') || sessionData?.subscription_id || paymentData?.subscriptionId
  const isTrial = searchParams.get('trial') === 'true' || sessionData?.metadata?.hasTrial === 'true' || paymentData?.isTrial
  
  console.log('Email extraction:', {
    sessionId,
    sessionData,
    rawEmail: rawEmail,
    urlEmail: searchParams.get('email'),
    paymentDataEmail: paymentData?.email,
    finalEmail: email,
    emailType: typeof email,
    hasPlaceholders,
    allParams: Object.fromEntries(searchParams.entries())
  })
  
  const [formData, setFormData] = useState({
    firstname: '',
    lastname: '',
    email: email || '', // Add email to form data as fallback
    password: '',
    confirmPassword: ''
  })
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [isLoadingSession, setIsLoadingSession] = useState(false)

  // Fetch Stripe session data if we have a session_id
  useEffect(() => {
    if (sessionId && !sessionData) {
      setIsLoadingSession(true)
      const fetchSessionData = async () => {
        try {
          const response = await fetch(`/api/stripe/get-session?session_id=${sessionId}`)
          if (response.ok) {
            const data = await response.json()
            setSessionData(data)
            console.log('Stripe session data:', data)
          }
        } catch (error) {
          console.error('Error fetching session data:', error)
        } finally {
          setIsLoadingSession(false)
        }
      }
      fetchSessionData()
    }
  }, [sessionId, sessionData])

  // Redirect if missing required parameters (only if we don't have payment data in localStorage)
  useEffect(() => {
    console.log('Redirect check:', {
      email,
      planId,
      stripeCustomerId,
      subscriptionId,
      hasPaymentData,
      sessionId,
      sessionData
    })
    
    // Only redirect if we don't have any payment data and no session data is being fetched
    if (!email && !planId && !stripeCustomerId && !subscriptionId && !hasPaymentData && !sessionId && !isLoadingSession) {
      console.log('Redirecting to plans - no payment data found')
      router.push('/signup/plans')
    }
  }, [email, planId, stripeCustomerId, subscriptionId, router, hasPaymentData, sessionId, sessionData, isLoadingSession])

  // Store payment data in localStorage if coming from URL parameters
  useEffect(() => {
    if (searchParams.get('email') && searchParams.get('customer_id')) {
      const paymentData: PaymentData = {
        email: searchParams.get('email')!,
        planId: searchParams.get('plan')!,
        stripeCustomerId: searchParams.get('customer_id')!,
        subscriptionId: searchParams.get('subscription_id')!,
        billingPeriod: 'monthly', // Default, could be enhanced
        isTrial: searchParams.get('trial') === 'true',
        timestamp: Date.now()
      }
      localStorage.setItem('suede_payment_data', JSON.stringify(paymentData))
    }
  }, [searchParams])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    console.log('Form input changed:', { name, value, currentFormData: formData })
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Use form email as fallback if URL email is not available
    const finalEmail = email || formData.email

    // Check for required payment details
    if (!finalEmail || !planId || !stripeCustomerId || !subscriptionId) {
      if (hasPlaceholders) {
        setError('Payment data not fully loaded. Please ensure you entered your email address and try again.')
      } else {
        setError('Missing payment details. Please try signing up again.')
      }
      setLoading(false)
      return
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(finalEmail)) {
      setError(`Invalid email format: ${finalEmail}`)
      setLoading(false)
      return
    }

    // Validation
    if (!formData.firstname.trim()) {
      setError('First name is required')
      setLoading(false)
      return
    }

    if (!formData.lastname.trim()) {
      setError('Last name is required')
      setLoading(false)
      return
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      setLoading(false)
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    console.log('Account creation request:', {
      email,
      finalEmail,
      planId,
      stripeCustomerId,
      subscriptionId,
      isTrial,
      formData
    })

    try {
      const response = await fetch('/api/stripe/create-customer-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstname: formData.firstname.trim(),
          lastname: formData.lastname.trim(),
          email: finalEmail,
          passwd: formData.password,
          plan_tier: planId,
          stripe_customer_id: stripeCustomerId,
          stripe_subscription_id: subscriptionId,
          is_trial: isTrial
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        // Handle specific error cases
        if (response.status === 409 && data.error === 'Account already exists') {
          setError('An account with this email already exists. Please try logging in instead.')
          return
        }
        
        throw new Error(data.error || 'Failed to create account')
      }

      setSuccess(true)
      
      // Clear payment data from localStorage
      clearPaymentData()
      
      // Check if auto-login is available
      if (data.autoLogin && data.access_token && data.organization) {
        // Store tokens in localStorage
        localStorage.setItem('access_token', data.access_token)
        if (data.refresh_token) {
          localStorage.setItem('refresh_token', data.refresh_token)
        }
        
        // Set the session with the access token and org details
        setSession({
          access_token: data.access_token,
          user: {
            ...data.user,
            user_metadata: {
              ...data.user.user_metadata,
              firstname: data.organization.name.split("'s")[0], // Extract name from "John Doe's Store"
              lastname: ""
            }
          }
        } as any)
        
        // Fetch additional user data from /organizations/me
        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://prestashop-api-staging.up.railway.app'
          const meResponse = await fetch(`${apiUrl}/api/v1/organizations/me`, {
            headers: {
              'Authorization': `Bearer ${data.access_token}`,
            },
          })
          
          if (meResponse.ok) {
            const meData = await meResponse.json()
            console.log('User data fetched:', meData)
            // Update session with complete user data if needed
          }
        } catch (error) {
          console.error('Error fetching user data:', error)
          // Continue with login even if this fails
        }
        
        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          router.push('/dashboard')
        }, 2000)
      } else {
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push('/login?message=account-created')
        }, 3000)
      }

    } catch (error) {
      console.error('Account creation error:', error)
      setError(error instanceof Error ? error.message : 'Failed to create account')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-suede-background flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-suede-text mb-2">Welcome to Headrest!</h1>
          <p className="text-suede-text mb-4">
            Your {planId} account has been created successfully.
            {isTrial && ' Your 28-day trial has started!'}
          </p>
          <p className="text-sm text-gray-600">
            Logging you in and redirecting to your dashboard...
          </p>
        </div>
      </div>
    )
  }

  // Show loading state while fetching session data
  if (isLoadingSession) {
    return (
      <div className="min-h-screen bg-suede-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-suede-text text-lg">Loading payment details...</p>
          <p className="text-suede-text text-sm mt-2">Fetching session data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-suede-background">
      {/* Navigation */}
      <nav className="bg-suede-background shadow-sm border-b border-suede-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-3 focus:outline-none focus:ring-2 focus:ring-suede-primary focus:ring-offset-2 rounded">
                <Image
                  src="/assets/suede-logo-transparent.png"
                  alt="Headrest"
                  width={120}
                  height={40}
                  className="h-8 w-auto"
                  priority
                />
                <span className="text-xl font-bold text-suede-text">Headrest</span>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <MobileNav currentPage="signup" />
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-md mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-suede-text mb-2">Create Your Account</h1>
            <p className="text-suede-text">
              Complete your account setup for your {planId} plan
              {isTrial && ' (28-day trial)'}
            </p>
            <p className="text-sm text-gray-600 mt-2">
              Email: {email || 'Please enter your email below'}
            </p>
            {paymentData && (
              <div className="mt-3 bg-blue-50 border border-blue-200 rounded-md p-3">
                <p className="text-sm text-blue-800">
                  💳 Payment completed! Complete your account setup to access your dashboard.
                </p>
              </div>
            )}
            {hasPlaceholders && (
              <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-md p-3">
                <p className="text-sm text-yellow-800">
                  ⚠️ Payment data not fully loaded. Please enter your email address manually below.
                </p>
              </div>
            )}
            {error && error.includes('already exists') && (
              <div className="mt-3 bg-blue-50 border border-blue-200 rounded-md p-3">
                <p className="text-sm text-blue-800 mb-2">
                  💡 It looks like you already have an account with this email address.
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Link 
                    href="/login" 
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-suede-primary hover:bg-suede-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-suede-primary"
                  >
                    Login to your account instead
                  </Link>
                  <button
                    onClick={() => setError('')}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-suede-primary"
                  >
                    Use different email
                  </button>
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstname" className="block text-sm font-medium text-suede-text mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  id="firstname"
                  name="firstname"
                  value={formData.firstname}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-suede-primary focus:border-suede-primary"
                  placeholder="Enter your first name"
                />
              </div>
              <div>
                <label htmlFor="lastname" className="block text-sm font-medium text-suede-text mb-2">
                  Last Name *
                </label>
                <input
                  type="text"
                  id="lastname"
                  name="lastname"
                  value={formData.lastname}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-suede-primary focus:border-suede-primary"
                  placeholder="Enter your last name"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-suede-text mb-2">
                Email Address *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-suede-primary focus:border-suede-primary"
                placeholder="Enter your email address"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-suede-text mb-2">
                Password *
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                minLength={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-suede-primary focus:border-suede-primary"
                placeholder="Create a secure password (min 6 characters)"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-suede-text mb-2">
                Confirm Password *
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                required
                minLength={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-suede-primary focus:border-suede-primary"
                placeholder="Confirm your password"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-suede-primary text-white py-3 px-4 rounded-md hover:bg-suede-accent focus:outline-none focus:ring-2 focus:ring-suede-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link href="/login" className="text-suede-primary hover:text-suede-accent font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AccountCreationPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AccountCreationForm />
    </Suspense>
  )
}
