import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createMiddlewareSupabaseClient } from '@/lib/supabase-middleware'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover',
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { subscriptionId, cancelImmediately = false } = body

    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'Subscription ID is required' },
        { status: 400 }
      )
    }

    // Verify user is authenticated
    const { supabase } = createMiddlewareSupabaseClient(request)
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify subscription ownership
    const backendUrl = process.env.NEXT_PUBLIC_API_URL
    if (backendUrl) {
      try {
        const orgResponse = await fetch(`${backendUrl}/api/v1/organizations/list`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        })

        if (orgResponse.ok) {
          const organizations = await orgResponse.json()
          const hasAccess = organizations.some(
            (org: any) => org.stripe_subscription_id === subscriptionId
          )

          if (!hasAccess) {
            return NextResponse.json(
              { error: 'Forbidden: Subscription does not belong to your account' },
              { status: 403 }
            )
          }
        }
      } catch (error) {
        console.error('Error verifying subscription ownership:', error)
      }
    }

    if (cancelImmediately) {
      // Cancel immediately
      const canceledSubscription = await stripe.subscriptions.cancel(subscriptionId)
      return NextResponse.json({
        success: true,
        canceled: true,
        subscription: {
          id: canceledSubscription.id,
          status: canceledSubscription.status,
        }
      })
    } else {
      // Cancel at period end
      const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      })
      // Access current_period_end safely (exists at runtime but may not be in type definition)
      const subscription = updatedSubscription as any
      return NextResponse.json({
        success: true,
        canceled: false,
        cancel_at_period_end: true,
        subscription: {
          id: updatedSubscription.id,
          status: updatedSubscription.status,
          cancel_at_period_end: updatedSubscription.cancel_at_period_end,
          current_period_end: subscription.current_period_end,
        }
      })
    }
  } catch (error: any) {
    console.error('Error canceling subscription:', error)
    return NextResponse.json(
      { error: 'Failed to cancel subscription', details: error.message },
      { status: 500 }
    )
  }
}

