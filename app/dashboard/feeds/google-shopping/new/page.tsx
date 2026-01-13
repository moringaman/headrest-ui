'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/auth-provider'
import { useMutation } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import { useAppStore } from '@/lib/store'
import ComingSoonBadge from '@/components/feeds/ComingSoonBadge'
import FeedMappingPreview from '@/components/feeds/FeedMappingPreview'
import type { CreateGoogleShoppingFeedData } from '@/types/feeds'

export default function NewGoogleShoppingFeedPage() {
  const router = useRouter()
  const { session } = useAuth()
  const { addNotification } = useAppStore()
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    target_country: 'US',
    target_language: 'en',
    currency: 'USD',
    sync_frequency: 'daily' as 'hourly' | 'daily' | 'weekly' | 'manual',
    only_in_stock: true,
    include_categories: [] as number[],
    min_price: '',
    max_price: ''
  })

  const steps = [
    { number: 1, name: 'Basic Info', description: 'Feed name and target market' },
    { number: 2, name: 'Product Filters', description: 'Choose which products to include' },
    { number: 3, name: 'Field Mapping', description: 'Map PrestaShop to Google Shopping' },
    { number: 4, name: 'Sync Settings', description: 'Configure sync frequency' }
  ]

  // Create feed mutation
  const createFeedMutation = useMutation({
    mutationFn: (data: CreateGoogleShoppingFeedData) =>
      apiClient.createFeed(data, session?.access_token),
    onSuccess: () => {
      addNotification({
        type: 'success',
        title: 'Success',
        message: 'Google Shopping feed created successfully!'
      })
      router.push('/dashboard/feeds')
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Error',
        message: error.message || 'Failed to create feed. Please try again.'
      })
    }
  })

  const handleSubmit = () => {
    // Validate required fields
    if (!formData.name.trim()) {
      addNotification({
        type: 'error',
        title: 'Validation Error',
        message: 'Please enter a feed name'
      })
      setCurrentStep(1)
      return
    }

    // Prepare feed data with default field mappings
    const feedData: CreateGoogleShoppingFeedData = {
      name: formData.name,
      description: formData.description || undefined,
      target_country: formData.target_country,
      target_language: formData.target_language,
      currency: formData.currency,
      sync_frequency: formData.sync_frequency,
      only_in_stock: formData.only_in_stock,
      include_categories: formData.include_categories.length > 0 ? formData.include_categories : undefined,
      min_price: formData.min_price ? parseFloat(formData.min_price) : undefined,
      max_price: formData.max_price ? parseFloat(formData.max_price) : undefined,
      field_mappings: {
        title: {
          source: 'product_name',
          max_length: 150
        },
        description: {
          source: 'description',
          max_length: 5000
        },
        image_link: {
          source: 'cover_image',
          size: 'large'
        },
        condition: 'new',
        brand: {
          source: 'manufacturer'
        },
        gtin: {
          source: 'ean13'
        },
        availability: {
          in_stock_value: 'in stock',
          out_of_stock_value: 'out of stock'
        },
        price: {
          include_tax: true
        }
      }
    }

    createFeedMutation.mutate(feedData)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard/feeds"
                className="text-gray-600 hover:text-gray-900"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Create Google Shopping Feed</h1>
                <p className="mt-1 text-gray-600">
                  Set up automated product sync to Google Merchant Center
                </p>
              </div>
            </div>
            <ComingSoonBadge />
          </div>
        </div>

        {/* Progress Steps */}
        <div className="bg-white rounded-lg border border-gray-200 p-8 mb-6">
          <nav aria-label="Progress">
            <ol className="flex items-center justify-between">
              {steps.map((step, stepIdx) => (
                <li key={step.name} className={`relative ${stepIdx !== steps.length - 1 ? 'pr-8 sm:pr-20 flex-1' : ''}`}>
                  <div className="flex items-center">
                    <div className="relative flex items-center justify-center">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full ${
                          step.number === currentStep
                            ? 'bg-suede-primary text-white'
                            : step.number < currentStep
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-200 text-gray-600'
                        }`}
                      >
                        {step.number < currentStep ? (
                          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <span className="text-sm font-medium">{step.number}</span>
                        )}
                      </div>
                    </div>
                    {stepIdx !== steps.length - 1 && (
                      <div className="ml-4 hidden sm:block flex-1">
                        <div className={`h-0.5 ${step.number < currentStep ? 'bg-green-600' : 'bg-gray-200'}`}></div>
                      </div>
                    )}
                  </div>
                  <div className="mt-2">
                    <p className="text-sm font-medium text-gray-900">{step.name}</p>
                    <p className="text-xs text-gray-500">{step.description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </nav>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-lg border border-gray-200 p-8 mb-6">
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Basic Information</h2>

              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Feed Name *
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-suede-primary focus:border-transparent"
                  placeholder="e.g., US Google Shopping Feed"
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-suede-primary focus:border-transparent"
                  placeholder="Optional description for this feed"
                />
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-2">
                    Target Country *
                  </label>
                  <select
                    id="country"
                    value={formData.target_country}
                    onChange={(e) => setFormData({ ...formData, target_country: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-suede-primary focus:border-transparent"
                  >
                    <option value="US">United States</option>
                    <option value="GB">United Kingdom</option>
                    <option value="DE">Germany</option>
                    <option value="FR">France</option>
                    <option value="ES">Spain</option>
                    <option value="IT">Italy</option>
                    <option value="CA">Canada</option>
                    <option value="AU">Australia</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-2">
                    Language *
                  </label>
                  <select
                    id="language"
                    value={formData.target_language}
                    onChange={(e) => setFormData({ ...formData, target_language: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-suede-primary focus:border-transparent"
                  >
                    <option value="en">English</option>
                    <option value="de">German</option>
                    <option value="fr">French</option>
                    <option value="es">Spanish</option>
                    <option value="it">Italian</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-2">
                    Currency *
                  </label>
                  <select
                    id="currency"
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-suede-primary focus:border-transparent"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="CAD">CAD ($)</option>
                    <option value="AUD">AUD ($)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Product Filters</h2>
              <p className="text-gray-600">Choose which products to include in this feed</p>

              <div className="flex items-center">
                <input
                  id="only_in_stock"
                  type="checkbox"
                  checked={formData.only_in_stock}
                  onChange={(e) => setFormData({ ...formData, only_in_stock: e.target.checked })}
                  className="h-4 w-4 text-suede-primary focus:ring-suede-primary border-gray-300 rounded"
                />
                <label htmlFor="only_in_stock" className="ml-2 block text-sm text-gray-900">
                  Only include products in stock
                </label>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="min_price" className="block text-sm font-medium text-gray-700 mb-2">
                    Minimum Price
                  </label>
                  <input
                    type="number"
                    id="min_price"
                    value={formData.min_price}
                    onChange={(e) => setFormData({ ...formData, min_price: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-suede-primary focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label htmlFor="max_price" className="block text-sm font-medium text-gray-700 mb-2">
                    Maximum Price
                  </label>
                  <input
                    type="number"
                    id="max_price"
                    value={formData.max_price}
                    onChange={(e) => setFormData({ ...formData, max_price: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-suede-primary focus:border-transparent"
                    placeholder="999999.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categories (Coming Soon)
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                  <p className="mt-2 text-sm text-gray-600">
                    Category selection will be available once connected to your PrestaShop store
                  </p>
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Field Mapping</h2>
                <p className="text-gray-600">
                  Preview how your PrestaShop fields will be mapped to Google Shopping attributes
                </p>
              </div>

              <FeedMappingPreview />
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Sync Settings</h2>
              <p className="text-gray-600">Configure how often your products should sync to Google Shopping</p>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sync Frequency *
                </label>
                <div className="space-y-3">
                  {[
                    { value: 'manual', label: 'Manual Only', description: 'Sync only when triggered manually' },
                    { value: 'daily', label: 'Daily', description: 'Automatic sync once per day' },
                    { value: 'hourly', label: 'Hourly', description: 'Automatic sync every hour (Professional plan)' },
                    { value: 'realtime', label: 'Real-time', description: 'Instant sync on product changes (Business plan)' }
                  ].map((option) => (
                    <div key={option.value} className="flex items-start">
                      <input
                        id={option.value}
                        name="sync_frequency"
                        type="radio"
                        checked={formData.sync_frequency === option.value}
                        onChange={(e) => setFormData({ ...formData, sync_frequency: e.target.value as 'manual' | 'daily' | 'hourly' | 'weekly' })}
                        disabled={option.value === 'hourly' || option.value === 'realtime'}
                        className="h-4 w-4 text-suede-primary focus:ring-suede-primary border-gray-300 mt-1"
                      />
                      <label htmlFor={option.value} className="ml-3 block">
                        <span className="text-sm font-medium text-gray-900">{option.label}</span>
                        <p className="text-sm text-gray-500">{option.description}</p>
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex">
                  <svg className="h-5 w-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-900">Sync frequency limits</h3>
                    <p className="mt-1 text-sm text-blue-700">
                      Your current plan allows daily syncs. Upgrade to Professional for hourly syncs or Business for real-time syncing.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <button
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1}
            className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          {currentStep < 4 ? (
            <button
              onClick={() => setCurrentStep(Math.min(4, currentStep + 1))}
              className="px-6 py-2.5 bg-suede-primary text-white rounded-lg font-semibold hover:bg-suede-accent transition-colors"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={createFeedMutation.isPending}
              className="px-6 py-2.5 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createFeedMutation.isPending ? (
                <>
                  <svg className="w-5 h-5 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Creating Feed...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Create Feed
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
