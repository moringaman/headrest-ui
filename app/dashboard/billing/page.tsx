'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '@/components/providers/auth-provider'
import { useAppStore } from '@/lib/store'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient, type Organization } from '@/lib/api'
import type { Subscription, Invoice } from '@/types'
import MobileNav from '@/components/ui/mobile-nav'

function BillingContent() {
  const { user, session, loading: authLoading } = useAuth()
  const { addNotification } = useAppStore()
  const queryClient = useQueryClient()
  const searchParams = useSearchParams()
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null)
  const [isCancellationModalOpen, setIsCancellationModalOpen] = useState(false)
  const [cancelImmediately, setCancelImmediately] = useState(false)
  const [cancellationReason, setCancellationReason] = useState('')

  // Fetch organizations
  const { data: organizations = [], isLoading: organizationsLoading } = useQuery({
    queryKey: ['organizations', user?.id],
    queryFn: () => apiClient.getOrganizations(session?.access_token),
    enabled: !!user?.id && !!session?.access_token && !authLoading,
  })

  // Auto-select first organization
  useEffect(() => {
    if (organizations && organizations.length > 0 && !selectedOrg) {
      setSelectedOrg(organizations[0])
    }
  }, [organizations, selectedOrg])

  // Fetch subscription details from backend API
  const { data: subscription, isLoading: subscriptionLoading, error: subscriptionError } = useQuery({
    queryKey: ['subscription', selectedOrg?.id],
    queryFn: () => apiClient.getSubscription(session?.access_token),
    enabled: !!selectedOrg && !!session?.access_token && !authLoading,
    retry: false,
  })

  // Fetch invoices
  const { data: invoices = [], isLoading: invoicesLoading } = useQuery<Invoice[]>({
    queryKey: ['invoices', selectedOrg?.stripe_customer_id],
    queryFn: () => apiClient.getInvoices(selectedOrg!.stripe_customer_id!),
    enabled: !!selectedOrg?.stripe_customer_id,
    retry: false,
  })

  // Debug: Log state changes to help diagnose redirect issue
  useEffect(() => {
    console.log('Billing page state:', {
      hasUser: !!user,
      hasSession: !!session,
      organizationsCount: organizations.length,
      selectedOrgId: selectedOrg?.id,
      hasSubscriptionId: !!selectedOrg?.stripe_subscription_id,
      subscriptionLoading,
      subscriptionError: subscriptionError?.message,
    })
  }, [user, session, organizations, selectedOrg, subscriptionLoading, subscriptionError])

  // Plan definitions
  const plans = [
    {
      id: 'hobby',
      name: 'Hobby',
      monthlyPrice: 4.99,
      annualPrice: 47.90,
      features: ['1 PrestaShop store', '1,000 API calls/month', '1 React template', 'Community support'],
    },
    {
      id: 'starter',
      name: 'Starter',
      monthlyPrice: 19,
      annualPrice: 182.40,
      features: ['1 PrestaShop store', '10,000 API calls/month', '3 React templates', 'Email support (48hr)'],
    },
    {
      id: 'professional',
      name: 'Professional',
      monthlyPrice: 79,
      annualPrice: 758.40,
      features: ['3 PrestaShop stores', '100,000 API calls/month', '5 premium templates', 'Email support (24hr)'],
    },
    {
      id: 'business',
      name: 'Business',
      monthlyPrice: 149,
      annualPrice: 1430.40,
      features: ['10 PrestaShop stores', '500,000 API calls/month', 'Unlimited templates', 'Priority support (4hr)'],
    },
  ]

  // Determine current plan and billing period from subscription
  const currentPlanId = subscription?.plan_tier || selectedOrg?.plan_tier || 'hobby'
  // Default to monthly, can be enhanced if billing period is stored in subscription
  const currentBillingPeriod = ('monthly' as 'monthly' | 'annual')

  // Determine if plan change is upgrade or downgrade
  const getPlanTier = (planId: string): number => {
    const tiers: Record<string, number> = { hobby: 1, starter: 2, professional: 3, business: 4 }
    return tiers[planId] || 0
  }

  // Upgrade subscription mutation
  const upgradeSubscriptionMutation = useMutation({
    mutationFn: ({ planId, billingPeriod }: { planId: string; billingPeriod: 'monthly' | 'annual' }) =>
      apiClient.upgradeSubscription(planId, billingPeriod, undefined, session?.access_token),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['subscription'] })
      queryClient.invalidateQueries({ queryKey: ['organizations'] })
      addNotification({
        type: 'success',
        title: 'Subscription Upgraded',
        message: data.message || 'Your subscription has been upgraded successfully'
      })
    },
    onError: (error: any) => {
      console.error('Upgrade subscription error:', error)
      console.error('Error details:', {
        message: error.message,
        response: error.response,
        stack: error.stack
      })
      addNotification({
        type: 'error',
        title: 'Upgrade Failed',
        message: error.message || 'Failed to upgrade subscription'
      })
    }
  })

  // Downgrade subscription mutation
  const downgradeSubscriptionMutation = useMutation({
    mutationFn: ({ planId, billingPeriod }: { planId: string; billingPeriod: 'monthly' | 'annual' }) =>
      apiClient.downgradeSubscription(planId, billingPeriod, undefined, session?.access_token),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['subscription'] })
      queryClient.invalidateQueries({ queryKey: ['organizations'] })
      addNotification({
        type: 'success',
        title: 'Subscription Downgraded',
        message: data.message || 'Your subscription will be downgraded at the end of the billing period'
      })
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Downgrade Failed',
        message: error.message || 'Failed to downgrade subscription'
      })
    }
  })

  // Cancel subscription mutation
  const cancelSubscriptionMutation = useMutation({
    mutationFn: (cancelImmediately: boolean) =>
      apiClient.cancelSubscription(cancelImmediately, session?.access_token),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['subscription'] })
      queryClient.invalidateQueries({ queryKey: ['organizations'] })
      setIsCancellationModalOpen(false)
      addNotification({
        type: 'success',
        title: 'Subscription Canceled',
        message: data.message || (cancelImmediately
          ? 'Your subscription has been canceled immediately'
          : 'Your subscription will be canceled at the end of the billing period')
      })
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Cancellation Failed',
        message: error.message || 'Failed to cancel subscription'
      })
    }
  })

  // Create portal session mutation
  const portalSessionMutation = useMutation({
    mutationFn: () =>
      apiClient.createPortalSession(
        selectedOrg!.stripe_customer_id!,
        `${window.location.origin}/dashboard/billing`
      ),
    onSuccess: (data) => {
      window.location.href = data.url
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Portal Access Failed',
        message: error.message || 'Failed to access billing portal'
      })
    }
  })

  // Handle plan change
  const handlePlanChange = (newPlanId: string, billingPeriod: 'monthly' | 'annual') => {
    if (!subscription && !selectedOrg?.stripe_subscription_id) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'No active subscription found. Please subscribe to a plan first.'
      })
      return
    }

    if (newPlanId === currentPlanId) {
      addNotification({
        type: 'info',
        title: 'Already on this plan',
        message: 'You are already subscribed to this plan'
      })
      return
    }

    // Determine if upgrade or downgrade
    const currentTier = getPlanTier(currentPlanId)
    const newTier = getPlanTier(newPlanId)
    
    if (newTier > currentTier) {
      upgradeSubscriptionMutation.mutate({ planId: newPlanId, billingPeriod })
    } else if (newTier < currentTier) {
      downgradeSubscriptionMutation.mutate({ planId: newPlanId, billingPeriod })
    } else {
      // Same tier, just change billing period - treat as upgrade
      upgradeSubscriptionMutation.mutate({ planId: newPlanId, billingPeriod })
    }
  }

  // Handle cancellation
  const handleCancel = () => {
    if (!subscription && !selectedOrg?.stripe_subscription_id) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'No active subscription found'
      })
      return
    }
    cancelSubscriptionMutation.mutate(cancelImmediately)
  }

  // Format currency
  const formatCurrency = (amount: number, currency: string = 'usd') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100) // Stripe amounts are in cents
  }

  // Format date (handles both ISO strings and Unix timestamps)
  const formatDate = (date: string | number | Date) => {
    let dateObj: Date
    if (typeof date === 'string') {
      dateObj = new Date(date)
    } else if (typeof date === 'number') {
      // Check if it's a Unix timestamp (seconds) or milliseconds
      dateObj = new Date(date > 1000000000000 ? date : date * 1000)
    } else {
      dateObj = date
    }
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  // Get subscription status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'green'
      case 'trialing': return 'blue'
      case 'past_due': return 'yellow'
      case 'canceled': return 'red'
      case 'unpaid': return 'red'
      default: return 'gray'
    }
  }

  // Check success/cancel from URL params
  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      addNotification({
        type: 'success',
        title: 'Payment Successful',
        message: 'Your subscription has been updated successfully'
      })
      queryClient.invalidateQueries({ queryKey: ['subscription'] })
    }
    if (searchParams.get('canceled') === 'true') {
      addNotification({
        type: 'info',
        title: 'Payment Canceled',
        message: 'You canceled the payment process'
      })
    }
  }, [searchParams, addNotification, queryClient])

  // Show loading state while auth is loading
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400"></div>
          <p className="mt-4 text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  // Show message if not authenticated (middleware should handle redirect, but just in case)
  if (!user || !session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400">Please log in to access billing</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Navigation */}
      <div className="bg-gray-900/50 backdrop-blur-sm border-b border-gray-800">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center space-x-3 focus:outline-none focus:ring-2 focus:ring-suede-primary focus:ring-offset-2 rounded">
                <Image
                  src="/assets/suede-logo-transparent.png"
                  alt="Headrest"
                  width={120}
                  height={40}
                  className="h-8 w-auto"
                  priority
                />
                <span className="text-xl font-bold text-white">Headrest</span>
              </Link>
              <div className="h-6 w-px bg-gray-700"></div>
              <h1 className="text-xl font-semibold text-white">Billing</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="hidden lg:flex items-center space-x-4">
                <Link
                  href="/dashboard"
                  className="bg-suede-primary hover:bg-suede-accent text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  Dashboard
                </Link>
                <Link
                  href="/dashboard/stores"
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  Stores
                </Link>
                <Link
                  href="/dashboard/api-keys"
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  API Keys
                </Link>
                <Link
                  href="/dashboard/settings"
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  Settings
                </Link>
              </div>
              <MobileNav
                currentPage="billing"
                user={user}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {organizationsLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400"></div>
              <p className="mt-2 text-gray-400">Loading billing information...</p>
            </div>
          ) : !selectedOrg ? (
            <div className="text-center py-12">
              <p className="text-gray-400">No organization found</p>
            </div>
          ) : !selectedOrg.stripe_subscription_id && !selectedOrg.plan_tier ? (
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg shadow-xl p-8 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-white">No Active Subscription</h3>
              <p className="mt-2 text-gray-400">You don&apos;t have an active subscription yet.</p>
              <div className="mt-6">
                <Link
                  href="/signup/plans"
                  className="bg-suede-primary hover:bg-suede-accent text-white px-6 py-3 rounded-lg font-semibold inline-block"
                >
                  Choose a Plan
                </Link>
              </div>
            </div>
          ) : !selectedOrg.stripe_subscription_id ? (
            // Show plan info from organization even if Stripe subscription ID is missing
            <div className="space-y-6">
              <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg shadow-xl">
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white">Current Plan</h2>
                  </div>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Current Plan</label>
                        <p className="text-xl font-semibold text-white capitalize">
                          {selectedOrg.plan_tier || 'No plan'}
                        </p>
                        <p className="text-sm text-gray-400 mt-1">
                          Plan information from organization
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">API Calls</label>
                        <p className="text-lg font-semibold text-white">
                          {selectedOrg.api_calls_used?.toLocaleString() || 0} / {selectedOrg.api_calls_limit?.toLocaleString() || 0}
                        </p>
                        <p className="text-sm text-gray-400 mt-1">
                          {selectedOrg.api_calls_limit ? Math.round((selectedOrg.api_calls_used || 0) / selectedOrg.api_calls_limit * 100) : 0}% used
                        </p>
                      </div>
                    </div>
                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-md p-4">
                      <div className="flex items-center">
                        <svg className="w-5 h-5 text-yellow-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <div>
                          <p className="text-sm font-medium text-yellow-400">Stripe Subscription Not Linked</p>
                          <p className="text-sm text-yellow-300/80 mt-1">
                            Your organization has a plan tier but no Stripe subscription ID. This may happen if your account was created before the Stripe integration, or if the subscription hasn&apos;t been synced yet.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Plan Management - Still show even without Stripe subscription */}
              <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg shadow-xl">
                <div className="px-4 py-5 sm:p-6">
                  <h2 className="text-2xl font-bold text-white mb-6">Change Plan</h2>
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-md p-4 mb-6">
                    <p className="text-sm text-blue-300">
                      To change your plan, you&apos;ll need to set up a Stripe subscription. Please contact support or create a new subscription to link your account.
                    </p>
                  </div>
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {plans.map((plan) => {
                      const isCurrentPlan = plan.id === selectedOrg.plan_tier?.toLowerCase()
                      
                      return (
                        <div
                          key={plan.id}
                          className={`bg-gray-900/50 border-2 rounded-lg p-4 ${
                            isCurrentPlan ? 'border-blue-500' : 'border-gray-700'
                          }`}
                        >
                          <div className="text-center mb-4">
                            <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
                            <div className="mt-2">
                              <span className="text-2xl font-bold text-white">
                                ${currentBillingPeriod === 'annual' ? plan.annualPrice : plan.monthlyPrice}
                              </span>
                              <span className="text-sm text-gray-400">
                                /{currentBillingPeriod === 'annual' ? 'year' : 'mo'}
                              </span>
                            </div>
                          </div>
                          <ul className="space-y-2 mb-4 text-sm text-gray-300">
                            {plan.features.slice(0, 3).map((feature, idx) => (
                              <li key={idx} className="flex items-start">
                                <svg className="w-4 h-4 text-green-400 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                <span>{feature}</span>
                              </li>
                            ))}
                          </ul>
                          {isCurrentPlan ? (
                            <button
                              disabled
                              className="w-full bg-gray-700 text-gray-400 px-4 py-2 rounded-md text-sm font-medium cursor-not-allowed"
                            >
                              Current Plan
                            </button>
                          ) : (
                            <Link
                              href="/signup/plans"
                              className="w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium text-center block"
                            >
                              Subscribe
                            </Link>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Current Subscription Overview */}
              <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg shadow-xl">
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white">Current Subscription</h2>
                    <button
                      onClick={() => portalSessionMutation.mutate()}
                      disabled={portalSessionMutation.isPending}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
                    >
                      {portalSessionMutation.isPending ? 'Loading...' : 'Manage in Stripe Portal'}
                    </button>
                  </div>

                  {subscriptionLoading ? (
                    <div className="text-center py-8">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400"></div>
                      <p className="mt-2 text-gray-400">Loading subscription...</p>
                    </div>
                  ) : subscriptionError ? (
                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-md p-4">
                      <p className="text-yellow-400">Unable to load subscription details. This may be normal if your subscription is still being set up.</p>
                      <p className="text-sm text-yellow-300/80 mt-2">Please try refreshing the page or contact support if this persists.</p>
                    </div>
                  ) : subscription ? (
                    <div className="space-y-6">
                      {/* Plan Info */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-400 mb-1">Current Plan</label>
                          <p className="text-xl font-semibold text-white capitalize">
                            {subscription.plan_tier || currentPlanId}
                          </p>
                          <p className="text-sm text-gray-400 mt-1">
                            {currentBillingPeriod === 'annual' ? 'Annual' : 'Monthly'} billing
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-400 mb-1">Status</label>
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                            getStatusColor(subscription.status) === 'green' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                            getStatusColor(subscription.status) === 'blue' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                            getStatusColor(subscription.status) === 'yellow' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                            'bg-red-500/10 text-red-400 border border-red-500/20'
                          }`}>
                            {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
                          </span>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-400 mb-1">Next Billing Date</label>
                          <p className="text-lg font-semibold text-white">
                            {formatDate(subscription.current_period_end)}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-400 mb-1">Period Start</label>
                          <p className="text-lg font-semibold text-white">
                            {formatDate(subscription.current_period_start)}
                          </p>
                        </div>
                      </div>

                      {/* Cancellation Notice */}
                      {subscription.cancel_at && (
                        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-md p-4">
                          <div className="flex items-center">
                            <svg className="w-5 h-5 text-yellow-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <div>
                              <p className="text-sm font-medium text-yellow-400">Subscription Will Cancel</p>
                              <p className="text-sm text-yellow-300/80 mt-1">
                                Your subscription will be canceled on {formatDate(subscription.cancel_at)}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Plan Management */}
              <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg shadow-xl">
                <div className="px-4 py-5 sm:p-6">
                  <h2 className="text-2xl font-bold text-white mb-6">Change Plan</h2>
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {plans.map((plan) => {
                      const isCurrentPlan = plan.id === currentPlanId
                      const isUpgrade = getPlanTier(plan.id) > getPlanTier(currentPlanId)
                      const isDowngrade = getPlanTier(plan.id) < getPlanTier(currentPlanId)
                      const displayPrice = currentBillingPeriod === 'annual' ? plan.annualPrice : plan.monthlyPrice

                      return (
                        <div
                          key={plan.id}
                          className={`bg-gray-900/50 border-2 rounded-lg p-4 ${
                            isCurrentPlan ? 'border-blue-500' : 'border-gray-700'
                          }`}
                        >
                          <div className="text-center mb-4">
                            <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
                            <div className="mt-2">
                              <span className="text-2xl font-bold text-white">
                                ${displayPrice}
                              </span>
                              <span className="text-sm text-gray-400">
                                /{currentBillingPeriod === 'annual' ? 'year' : 'mo'}
                              </span>
                            </div>
                          </div>
                          <ul className="space-y-2 mb-4 text-sm text-gray-300">
                            {plan.features.slice(0, 3).map((feature, idx) => (
                              <li key={idx} className="flex items-start">
                                <svg className="w-4 h-4 text-green-400 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                <span>{feature}</span>
                              </li>
                            ))}
                          </ul>
                          {isCurrentPlan ? (
                            <button
                              disabled
                              className="w-full bg-gray-700 text-gray-400 px-4 py-2 rounded-md text-sm font-medium cursor-not-allowed"
                            >
                              Current Plan
                            </button>
                          ) : (
                            <button
                              onClick={() => handlePlanChange(plan.id, currentBillingPeriod as 'monthly' | 'annual')}
                              disabled={upgradeSubscriptionMutation.isPending || downgradeSubscriptionMutation.isPending}
                              className={`w-full px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                isUpgrade
                                  ? 'bg-green-600 hover:bg-green-700 text-white'
                                  : 'bg-gray-600 hover:bg-gray-700 text-white'
                              } disabled:opacity-50`}
                            >
                              {(upgradeSubscriptionMutation.isPending || downgradeSubscriptionMutation.isPending) 
                              ? 'Updating...' 
                              : isUpgrade 
                                ? 'Upgrade' 
                                : 'Downgrade'}
                            </button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Billing History */}
              <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg shadow-xl">
                <div className="px-4 py-5 sm:p-6">
                  <h2 className="text-2xl font-bold text-white mb-6">Billing History</h2>
                  {invoicesLoading ? (
                    <div className="text-center py-8">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400"></div>
                      <p className="mt-2 text-gray-400">Loading invoices...</p>
                    </div>
                  ) : !invoices || invoices.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-400">No invoices found</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-700">
                        <thead>
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Invoice</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Amount</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                          {(invoices as Invoice[]).map((invoice: Invoice) => (
                            <tr key={invoice.id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                                {formatDate(invoice.created)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                {invoice.number || invoice.id.slice(0, 12)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                                {formatCurrency(invoice.amount_due, invoice.currency)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  invoice.status === 'paid' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                                  invoice.status === 'open' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                                  'bg-red-500/10 text-red-400 border border-red-500/20'
                                }`}>
                                  {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                {invoice.hosted_invoice_url && (
                                  <a
                                    href={invoice.hosted_invoice_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-400 hover:text-blue-300"
                                  >
                                    View
                                  </a>
                                )}
                                {invoice.invoice_pdf && (
                                  <a
                                    href={invoice.invoice_pdf}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-400 hover:text-blue-300 ml-4"
                                  >
                                    Download PDF
                                  </a>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              {/* Subscription Management */}
              <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg shadow-xl">
                <div className="px-4 py-5 sm:p-6">
                  <h2 className="text-2xl font-bold text-white mb-6">Subscription Management</h2>
                  <div className="space-y-4">
                    {subscription?.cancel_at ? (
                      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-md p-4">
                        <p className="text-yellow-400 mb-3">Your subscription is scheduled to cancel on {subscription && formatDate(subscription.cancel_at)}</p>
                        <button
                          onClick={() => {
                            // Reactivate subscription by canceling the cancellation
                            if (selectedOrg?.stripe_subscription_id) {
                              // This would require updating the subscription to remove cancel_at_period_end
                              // For now, we'll show a message that they need to contact support or use Stripe portal
                              addNotification({
                                type: 'info',
                                title: 'Reactivate Subscription',
                                message: 'Please use the Stripe Portal to reactivate your subscription'
                              })
                              portalSessionMutation.mutate()
                            }
                          }}
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                        >
                          Reactivate Subscription
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setIsCancellationModalOpen(true)}
                        className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-md font-medium"
                      >
                        Cancel Subscription
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Cancellation Modal */}
      {isCancellationModalOpen && subscription && selectedOrg && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-700">
              <h3 className="text-lg font-medium text-white">Cancel Subscription</h3>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  When should we cancel?
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={!cancelImmediately}
                      onChange={() => setCancelImmediately(false)}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-300">
                      At the end of billing period ({subscription ? formatDate(subscription.current_period_end) : 'N/A'})
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={cancelImmediately}
                      onChange={() => setCancelImmediately(true)}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-300">Immediately</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Reason for canceling (optional)
                </label>
                <textarea
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-900/50 border border-gray-600 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Help us improve by sharing your reason..."
                />
              </div>
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-md p-3">
                <p className="text-sm text-yellow-300">
                  <strong>Note:</strong> Canceling will revoke access to all premium features at the selected time.
                </p>
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-800/30 border-t border-gray-700 flex justify-end space-x-3">
              <button
                onClick={() => setIsCancellationModalOpen(false)}
                className="px-4 py-2 text-gray-300 bg-gray-700 hover:bg-gray-600 rounded-md text-sm font-medium"
              >
                Keep Subscription
              </button>
              <button
                onClick={handleCancel}
                disabled={cancelSubscriptionMutation.isPending}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium disabled:opacity-50"
              >
                {cancelSubscriptionMutation.isPending ? 'Canceling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function BillingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-gray-400">Loading...</p>
        </div>
      </div>
    }>
      <BillingContent />
    </Suspense>
  )
}

