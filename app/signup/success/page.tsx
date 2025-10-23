'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import MobileNav from '@/components/ui/mobile-nav'

export default function SignupSuccessPage() {
  const searchParams = useSearchParams()
  const plan = searchParams.get('plan')
  const [isLoading, setIsLoading] = useState(true)

  const planDetails = {
    hobby: {
      name: 'Hobby',
      description: 'Perfect for developers and hobbyists',
      features: ['1 PrestaShop store', '1,000 API calls/month', '1 React template']
    },
    starter: {
      name: 'Starter',
      description: 'Most popular for growing businesses',
      features: ['1 PrestaShop store', '10,000 API calls/month', '3 React templates']
    },
    professional: {
      name: 'Professional',
      description: 'For established businesses',
      features: ['3 PrestaShop stores', '100,000 API calls/month', '5 premium templates']
    },
    business: {
      name: 'Business',
      description: 'For large enterprises',
      features: ['10 PrestaShop stores', '500,000 API calls/month', 'Unlimited templates']
    }
  }

  const selectedPlan = plan ? planDetails[plan as keyof typeof planDetails] : null

  useEffect(() => {
    // Simulate loading while we verify the subscription
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-suede-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-suede-primary mx-auto mb-4"></div>
          <p className="text-suede-text">Setting up your account...</p>
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

      {/* Success Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          {/* Success Icon */}
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
            <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          {/* Success Message */}
          <h1 className="text-4xl font-bold text-suede-text mb-4">
            Welcome to Suede! 🎉
          </h1>
          <p className="text-xl text-suede-text mb-8">
            Your account has been created successfully and your subscription is active.
          </p>

          {/* Plan Details */}
          {selectedPlan && (
            <div className="bg-white rounded-lg shadow-sm border p-6 mb-8 text-left">
              <h2 className="text-2xl font-bold text-suede-text mb-2">{selectedPlan.name} Plan</h2>
              <p className="text-gray-600 mb-4">{selectedPlan.description}</p>
              <ul className="space-y-2">
                {selectedPlan.features.map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <svg className="w-5 h-5 text-suede-primary mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-suede-text">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Next Steps */}
          <div className="bg-suede-background rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-suede-text mb-4">What's Next?</h3>
            <div className="space-y-3 text-left">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="w-6 h-6 bg-suede-primary text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">1</div>
                </div>
                <div>
                  <p className="text-suede-text font-medium">Check your email</p>
                  <p className="text-gray-600 text-sm">We've sent you a welcome email with your account details and next steps.</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="w-6 h-6 bg-suede-primary text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">2</div>
                </div>
                <div>
                  <p className="text-suede-text font-medium">Access your dashboard</p>
                  <p className="text-gray-600 text-sm">Log in to start connecting your PrestaShop store and managing your API keys.</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="w-6 h-6 bg-suede-primary text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">3</div>
                </div>
                <div>
                  <p className="text-suede-text font-medium">Connect your store</p>
                  <p className="text-gray-600 text-sm">Add your PrestaShop database credentials to start using the API.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/login"
              className="bg-suede-primary text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-suede-accent focus:outline-none focus:ring-2 focus:ring-suede-primary focus:ring-offset-2 transition-colors"
            >
              Go to Dashboard
            </Link>
            <Link
              href="/docs"
              className="border border-suede-primary text-suede-primary px-8 py-3 rounded-lg text-lg font-semibold hover:bg-suede-background focus:outline-none focus:ring-2 focus:ring-suede-primary focus:ring-offset-2 transition-colors"
            >
              Read Documentation
            </Link>
          </div>
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

