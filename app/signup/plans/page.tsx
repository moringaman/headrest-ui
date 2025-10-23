'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import MobileNav from '@/components/ui/mobile-nav'

export default function PlanSelectionPage() {
  const [isAnnual, setIsAnnual] = useState(false)
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)

  const calculatePrice = (monthlyPrice: number) => {
    return isAnnual ? monthlyPrice * 12 * 0.8 : monthlyPrice // 20% discount for annual
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price)
  }

  const plans = [
    {
      id: 'hobby',
      name: 'Hobby',
      description: 'Perfect for developers and hobbyists',
      monthlyPrice: 4.99,
      features: [
        '1 PrestaShop store connection',
        '1,000 API calls/month',
        '1 React template',
        'Community support',
        'SSL included'
      ],
      stripePriceId: {
        monthly: process.env.NEXT_PUBLIC_STRIPE_HOBBY_MONTHLY_PRICE_ID,
        annual: process.env.NEXT_PUBLIC_STRIPE_HOBBY_ANNUAL_PRICE_ID
      },
      popular: false,
      freeTrial: true
    },
    {
      id: 'starter',
      name: 'Starter',
      description: 'Most popular for growing businesses',
      monthlyPrice: 19,
      features: [
        '1 PrestaShop store connection',
        '10,000 API calls/month',
        '3 React templates',
        'Email support (48hr)',
        'Custom domain'
      ],
      stripePriceId: {
        monthly: process.env.NEXT_PUBLIC_STRIPE_STARTER_MONTHLY_PRICE_ID,
        annual: process.env.NEXT_PUBLIC_STRIPE_STARTER_ANNUAL_PRICE_ID
      },
      popular: true,
      freeTrial: false
    },
    {
      id: 'professional',
      name: 'Professional',
      description: 'For established businesses',
      monthlyPrice: 79,
      features: [
        '3 PrestaShop stores',
        '100,000 API calls/month',
        '5 premium templates',
        'Email support (24hr)',
        'Advanced analytics'
      ],
      stripePriceId: {
        monthly: process.env.NEXT_PUBLIC_STRIPE_PROFESSIONAL_MONTHLY_PRICE_ID,
        annual: process.env.NEXT_PUBLIC_STRIPE_PROFESSIONAL_ANNUAL_PRICE_ID
      },
      popular: false,
      freeTrial: false
    },
    {
      id: 'business',
      name: 'Business',
      description: 'For large enterprises',
      monthlyPrice: 149,
      features: [
        '10 PrestaShop stores',
        '500,000 API calls/month',
        'Unlimited templates',
        'Priority support (4hr)',
        'Mobile app builder'
      ],
      stripePriceId: {
        monthly: process.env.NEXT_PUBLIC_STRIPE_BUSINESS_MONTHLY_PRICE_ID,
        annual: process.env.NEXT_PUBLIC_STRIPE_BUSINESS_ANNUAL_PRICE_ID
      },
      popular: false,
      freeTrial: false
    }
  ]

  const handlePlanSelect = async (plan: typeof plans[0]) => {
    setLoadingPlan(plan.id)
    try {
      const priceId = isAnnual ? plan.stripePriceId.annual : plan.stripePriceId.monthly
      
      console.log('Creating checkout session with:', {
        priceId,
        planId: plan.id,
        billingPeriod: isAnnual ? 'annual' : 'monthly',
        isAnnual
      })
      
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: priceId,
          planId: plan.id,
          billingPeriod: isAnnual ? 'annual' : 'monthly',
          successUrl: `${window.location.origin}/signup/account-creation?plan=${plan.id}`,
          cancelUrl: `${window.location.origin}/signup/plans`,
        }),
      })

      let data
      try {
        data = await response.json()
      } catch (jsonError) {
        console.error('Failed to parse JSON response:', jsonError)
        console.error('Response status:', response.status)
        console.error('Response text:', await response.text())
        alert(`Server error: Invalid response from server (Status: ${response.status})`)
        setLoadingPlan(null)
        return
      }
      
      if (!response.ok) {
        console.error('API Error:', data)
        alert(`Error: ${data.error}\nDetails: ${data.details || 'No details available'}`)
        setLoadingPlan(null)
        return
      }

      if (data.url) {
        window.location.href = data.url
      } else {
        console.error('No URL returned from API:', data)
        alert('Error: No checkout URL received from server')
        setLoadingPlan(null)
      }
    } catch (error) {
      console.error('Error creating checkout session:', error)
      alert(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoadingPlan(null)
    }
  }

  return (
    <div className="min-h-screen bg-suede-background relative">
      {/* Loading overlay */}
      {loadingPlan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md mx-4 text-center">
            <div className="flex items-center justify-center mb-4">
              <svg className="animate-spin h-8 w-8 text-suede-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-suede-text mb-2">Creating your checkout session...</h3>
            <p className="text-suede-text text-sm">
              Please wait while we prepare your payment details with Stripe.
            </p>
          </div>
        </div>
      )}
      {/* Navigation */}
      <nav className="bg-suede-background shadow-sm border-b border-suede-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-3 focus:outline-none focus:ring-2 focus:ring-suede-primary focus:ring-offset-2 rounded">
                <Image
                  src="/assets/suede-logo-transparent.png"
                  alt="Suede"
                  width={120}
                  height={40}
                  className="h-8 w-auto"
                  priority
                />
                <span className="text-xl font-bold text-suede-text">Suede</span>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              {/* Desktop navigation - hidden on mobile */}
              <div className="hidden lg:flex items-center space-x-4">
                <Link href="/" className="text-suede-text hover:text-suede-accent">Home</Link>
                <Link href="/pricing" className="text-suede-text hover:text-suede-accent">Pricing</Link>
                <Link href="/docs" className="text-suede-text hover:text-suede-accent">Docs</Link>
                <Link href="/login" className="text-suede-text hover:text-suede-accent">Login</Link>
              </div>
              
              {/* Mobile navigation */}
              <MobileNav 
                currentPage="signup" 
              />
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-suede-text mb-6">
            Choose Your Plan
          </h1>
          <p className="text-xl text-suede-text mb-8 max-w-3xl mx-auto">
            Start your free trial today. No credit card required for the Hobby plan.
          </p>
          
          {/* Billing Toggle */}
          <div className="flex items-center justify-center mb-12">
            <span className={`mr-3 transition-colors ${!isAnnual ? 'text-suede-text font-semibold' : 'text-suede-secondary'}`}>Monthly</span>
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              className="relative focus:outline-none focus:ring-2 focus:ring-suede-primary focus:ring-offset-2 rounded-full"
              aria-label={`Switch to ${isAnnual ? 'monthly' : 'annual'} billing`}
            >
              <div className={`w-12 h-6 rounded-full shadow-inner transition-colors ${isAnnual ? 'bg-suede-primary' : 'bg-suede-secondary'}`}></div>
              <div className={`absolute top-0 w-6 h-6 bg-white rounded-full shadow transition-transform ${isAnnual ? 'translate-x-6' : 'translate-x-0'}`}></div>
            </button>
            <span className={`ml-3 transition-colors ${isAnnual ? 'text-suede-text font-semibold' : 'text-suede-secondary'}`}>
              Annual <span className="text-suede-primary font-semibold">(Save 20%)</span>
            </span>
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid lg:grid-cols-4 gap-8">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`bg-white rounded-2xl shadow-sm border-2 p-8 flex flex-col ${
                plan.popular 
                  ? 'border-suede-primary relative' 
                  : 'border-gray-200'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-suede-primary text-white px-3 py-1 rounded-full text-xs">
                  Popular
                </div>
              )}
              
              <div className="text-center mb-8">
                <h3 className="text-xl font-bold text-suede-text mb-2">{plan.name}</h3>
                <p className="text-gray-600 mb-4">{plan.description}</p>
                <div className="text-3xl font-bold text-suede-primary mb-2">
                  {formatPrice(calculatePrice(plan.monthlyPrice))}
                  {isAnnual && <span className="text-base text-suede-text">/year</span>}
                  {!isAnnual && <span className="text-base text-suede-text">/mo</span>}
                </div>
                {isAnnual && (
                  <p className="text-sm text-suede-secondary line-through mb-2">
                    {formatPrice(plan.monthlyPrice * 12)}/year
                  </p>
                )}
                {plan.freeTrial && !isAnnual && (
                  <p className="text-suede-primary font-medium mb-4">FREE first month 🎁</p>
                )}
              </div>
              
              <div className="flex-grow">
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <svg className="w-5 h-5 text-suede-primary mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-suede-text">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <button
                onClick={() => handlePlanSelect(plan)}
                disabled={loadingPlan === plan.id}
                className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors text-center block mt-auto ${
                  plan.popular
                    ? 'bg-suede-primary text-white hover:bg-suede-accent'
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                } ${loadingPlan === plan.id ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {loadingPlan === plan.id ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating checkout session...
                  </div>
                ) : (
                  plan.freeTrial && !isAnnual ? 'Start Free Trial' : 'Get Started'
                )}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-suede-accent text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex justify-center items-center space-x-3 mb-4">
              <Image
                src="/assets/suede-logo-transparent.png"
                alt="Suede"
                width={120}
                height={40}
                className="h-8 w-auto"
              />
              <span className="text-xl font-bold text-white">Suede</span>
            </div>
            <p className="text-suede-background mb-4">Modern APIs for PrestaShop Stores</p>
            <div className="flex justify-center space-x-6">
              <Link href="/docs" className="text-suede-background hover:text-white">Documentation</Link>
              <Link href="/support" className="text-suede-background hover:text-white">Support</Link>
              <Link href="/privacy" className="text-suede-background hover:text-white">Privacy</Link>
              <Link href="/terms" className="text-suede-background hover:text-white">Terms</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
