'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import MobileNav from '@/components/ui/mobile-nav'

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(false)

  const calculatePrice = (monthlyPrice: number) => {
    if (isAnnual) {
      const annualPrice = monthlyPrice * 12 * 0.8 // 20% discount
      return Math.round(annualPrice)
    }
    return monthlyPrice
  }

  const formatPrice = (price: number) => {
    if (isAnnual) {
      return `$${price}/year`
    }
    return `$${price}/mo`
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
                <Link href="/docs" className="text-suede-text hover:text-suede-accent">Docs</Link>
                <Link href="/login" className="text-suede-text hover:text-suede-accent">Login</Link>
                <Link href="/signup" className="bg-suede-primary text-white px-4 py-2 rounded-md hover:bg-suede-accent">
                  Get Started
                </Link>
              </div>
              
              {/* Mobile navigation */}
              <MobileNav 
                currentPage="pricing" 
              />
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-suede-text mb-6">
            Choose Your Perfect Plan
          </h1>
          <p className="text-xl text-suede-text mb-8 max-w-3xl mx-auto">
            Start free with our Hobby plan, or jump straight into our most popular Starter plan. 
            All plans include SSL, 99% uptime SLA, and our powerful React templates.
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="grid lg:grid-cols-4 gap-6">
          
          {/* Hobby Plan */}
          <div className="bg-white rounded-2xl shadow-sm border-2 border-suede-primary p-8 flex flex-col">
            <div className="text-center mb-8">
              <h3 className="text-xl font-bold text-suede-text mb-2">Hobby</h3>
              <div className="text-3xl font-bold text-suede-primary mb-2">
                {formatPrice(calculatePrice(4.99))}
                {isAnnual && <span className="text-base text-suede-text">/year</span>}
                {!isAnnual && <span className="text-base text-suede-text">/mo</span>}
              </div>
              {isAnnual && (
                <p className="text-sm text-suede-secondary line-through mb-2">$59.88/year</p>
              )}
              {!isAnnual && (
                <p className="text-suede-primary font-medium mb-4">FREE first month 🎁</p>
              )}
              <p className="text-sm text-suede-text">Perfect for developers and hobbyists</p>
            </div>
            
            <div className="flex-grow">
              <ul className="space-y-4 mb-8">
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-suede-primary mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-suede-text">1 PrestaShop store connection</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-suede-primary mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-suede-text">1,000 API calls per month</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-suede-primary mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-suede-text">1 basic React template</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-suede-primary mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-suede-text">Community support</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-suede-primary mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-suede-text">SSL certificate included</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-suede-primary mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-suede-text">99% uptime SLA</span>
                </li>
              </ul>
            </div>
            
            <Link 
              href="/signup?plan=hobby"
              className="w-full bg-primary-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-primary-700 transition-colors text-center block mt-auto"
            >
              Start Free Trial
            </Link>
          </div>

          {/* Starter Plan */}
          <div className="bg-white rounded-2xl shadow-lg border-2 border-primary-600 p-8 relative flex flex-col">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <span className="bg-primary-600 text-white text-xs font-semibold px-4 py-1 rounded-full">Most Popular</span>
            </div>
            <div className="text-center mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Starter</h3>
              <div className="text-3xl font-bold text-primary-600 mb-2">
                {formatPrice(calculatePrice(19))}
                {isAnnual && <span className="text-base text-gray-600">/year</span>}
                {!isAnnual && <span className="text-base text-gray-600">/mo</span>}
              </div>
              {isAnnual && (
                <p className="text-sm text-gray-500 line-through mb-2">$228/year</p>
              )}
              {!isAnnual && (
                <p className="text-sm text-gray-500 line-through mb-4">$29/mo</p>
              )}
              <p className="text-sm text-gray-600">Perfect for small merchants</p>
            </div>
            
            <div className="flex-grow">
              <ul className="space-y-4 mb-8">
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-suede-primary mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-suede-text">1 PrestaShop store connection</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-suede-primary mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-suede-text">10,000 API calls per month</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-suede-primary mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-suede-text">3 React templates</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-suede-primary mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-suede-text">Email support (48hr response)</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-suede-primary mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-suede-text">Custom domain support</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-suede-primary mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-suede-text">Basic analytics dashboard</span>
                </li>
              </ul>
            </div>
            
            <Link 
              href="/signup?plan=starter"
              className="w-full bg-primary-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-primary-700 transition-colors text-center block mt-auto"
            >
              Get Started
            </Link>
          </div>

          {/* Professional Plan */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 flex flex-col">
            <div className="text-center mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Professional</h3>
              <div className="text-3xl font-bold text-primary-600 mb-2">
                {formatPrice(calculatePrice(79))}
                {isAnnual && <span className="text-base text-gray-600">/year</span>}
                {!isAnnual && <span className="text-base text-gray-600">/mo</span>}
              </div>
              {isAnnual && (
                <p className="text-sm text-gray-500 line-through mb-2">$948/year</p>
              )}
              {!isAnnual && (
                <p className="text-sm text-gray-500 line-through mb-4">$99/mo</p>
              )}
              <p className="text-sm text-gray-600">Perfect for growing businesses</p>
            </div>
            
            <div className="flex-grow">
              <ul className="space-y-4 mb-8">
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-suede-primary mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-suede-text">3 PrestaShop store connections</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-suede-primary mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-suede-text">100,000 API calls per month</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-suede-primary mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-suede-text">5 premium React templates</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-suede-primary mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-suede-text">Email support (24hr response)</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-suede-primary mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-suede-text">Advanced analytics dashboard</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-suede-primary mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-suede-text">Payment processing (Stripe integration)</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-suede-primary mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-suede-text">Cart abandonment recovery</span>
                </li>
              </ul>
            </div>
            
            <Link 
              href="/signup?plan=professional"
              className="w-full bg-primary-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-primary-700 transition-colors text-center block mt-auto"
            >
              Get Started
            </Link>
          </div>

          {/* Business Plan */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 flex flex-col">
            <div className="text-center mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Business</h3>
              <div className="text-3xl font-bold text-primary-600 mb-2">
                {formatPrice(calculatePrice(149))}
                {isAnnual && <span className="text-base text-gray-600">/year</span>}
                {!isAnnual && <span className="text-base text-gray-600">/mo</span>}
              </div>
              {isAnnual && (
                <p className="text-sm text-gray-500 line-through mb-2">$1,788/year</p>
              )}
              {!isAnnual && (
                <p className="text-sm text-gray-500 line-through mb-4">$199/mo</p>
              )}
              <p className="text-sm text-gray-600">Perfect for established online stores</p>
            </div>
            
            <div className="flex-grow">
              <ul className="space-y-4 mb-8">
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-suede-primary mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-suede-text">10 PrestaShop store connections</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-suede-primary mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-suede-text">500,000 API calls per month</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-suede-primary mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-suede-text">Unlimited premium templates</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-suede-primary mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-suede-text">Priority support (4hr response)</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-suede-primary mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-suede-text">Multi-currency support</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-suede-primary mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-suede-text">Advanced SEO tools</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-suede-primary mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-suede-text">A/B testing capabilities</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-suede-primary mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-suede-text">Mobile app builder (React Native)</span>
                </li>
              </ul>
            </div>
            
            <Link 
              href="/signup?plan=business"
              className="w-full bg-primary-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-primary-700 transition-colors text-center block mt-auto"
            >
              Get Started
            </Link>
          </div>

          {/* Enterprise Plan */}
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-lg border border-gray-700 p-8 text-white flex flex-col">
            <div className="text-center mb-8">
              <h3 className="text-xl font-bold text-white mb-2">Enterprise</h3>
              <div className="text-3xl font-bold text-white mb-2">
                Custom
                {isAnnual && <span className="text-base text-gray-300">/year</span>}
                {!isAnnual && <span className="text-base text-gray-300">/mo</span>}
              </div>
              {isAnnual && (
                <p className="text-sm text-gray-400 line-through mb-2">$4,788/year</p>
              )}
              {!isAnnual && (
                <p className="text-sm text-gray-400 line-through mb-4">$499/mo</p>
              )}
              <p className="text-sm text-gray-300">Perfect for large retailers</p>
            </div>
            
            <div className="flex-grow">
              <ul className="space-y-4 mb-8">
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-200">Unlimited PrestaShop stores</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-200">Unlimited API calls</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-200">White-label solution</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-200">Dedicated account manager</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-200">1hr support SLA</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-200">Custom development hours</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-200">On-premise deployment option</span>
                </li>
              </ul>
            </div>
            
            <Link 
              href="/contact?plan=enterprise"
              className="w-full bg-white text-gray-900 py-3 px-6 rounded-lg font-semibold hover:bg-gray-100 transition-colors text-center block mt-auto"
            >
              Contact Sales
            </Link>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
            <p className="text-lg text-gray-600">Everything you need to know about our pricing</p>
          </div>
          
          <div className="max-w-3xl mx-auto">
            <div className="space-y-8">
              <div className="bg-white rounded-lg p-6 shadow-sm border">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Can I change plans anytime?</h3>
                <p className="text-gray-600">Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate any billing differences.</p>
              </div>
              
              <div className="bg-white rounded-lg p-6 shadow-sm border">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">What happens if I exceed my API limits?</h3>
                <p className="text-gray-600">We'll notify you when you're approaching your limit. You can upgrade your plan or purchase additional API calls. We never cut off service without warning.</p>
              </div>
              
              <div className="bg-white rounded-lg p-6 shadow-sm border">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Do you offer refunds?</h3>
                <p className="text-gray-600">Yes! We offer a 30-day money-back guarantee on all plans. If you're not satisfied, we'll refund your payment in full.</p>
              </div>
              
              <div className="bg-white rounded-lg p-6 shadow-sm border">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Is there a free trial?</h3>
                <p className="text-gray-600">Absolutely! Our Hobby plan includes a FREE first month, and all other plans come with a 14-day free trial. No credit card required for the trial.</p>
              </div>
            </div>
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
