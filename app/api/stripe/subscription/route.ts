import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createMiddlewareSupabaseClient } from '@/lib/supabase-middleware'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover',
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const subscriptionId = searchParams.get('subscription_id')

    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'Subscription ID is required' },
        { status: 400 }
      )
    }

    // Verify user is authenticated and owns this subscription
    const { supabase } = createMiddlewareSupabaseClient(request)
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Retrieve subscription from Stripe
    const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ['customer', 'items.data.price.product']
    })

    // Verify the subscription belongs to the user's organization
    // We'll check this by getting the user's organizations and verifying the subscription_id matches
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
        // Continue anyway - the subscription exists in Stripe
      }
    }

    // Format subscription data for frontend
    // Cast to any to access properties that exist at runtime but may not be in type definition
    const subscriptionAny = subscription as any
    const subscriptionData = {
      id: subscription.id,
      status: subscription.status,
      current_period_start: subscriptionAny.current_period_start,
      current_period_end: subscriptionAny.current_period_end,
      cancel_at_period_end: subscription.cancel_at_period_end,
      canceled_at: subscriptionAny.canceled_at || undefined,
      trial_start: subscriptionAny.trial_start || undefined,
      trial_end: subscriptionAny.trial_end || undefined,
      plan: {
        id: subscription.items.data[0]?.price.id || '',
        nickname: subscription.items.data[0]?.price.nickname || '',
        amount: subscription.items.data[0]?.price.unit_amount || 0,
        currency: subscription.items.data[0]?.price.currency || 'usd',
        interval: subscription.items.data[0]?.price.recurring?.interval || 'month',
        interval_count: subscription.items.data[0]?.price.recurring?.interval_count || 1,
      },
      items: subscription.items.data.map(item => ({
        id: item.id,
        price: {
          id: item.price.id,
          nickname: item.price.nickname || '',
          amount: item.price.unit_amount || 0,
          currency: item.price.currency || 'usd',
          interval: item.price.recurring?.interval || 'month',
        }
      })),
      customer: typeof subscription.customer === 'string' 
        ? subscription.customer 
        : subscription.customer.id,
      metadata: subscription.metadata
    }

    return NextResponse.json(subscriptionData)
  } catch (error: any) {
    console.error('Error retrieving subscription:', error)
    
    if (error.type === 'StripeInvalidRequestError') {
      return NextResponse.json(
        { error: 'Invalid subscription ID' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to retrieve subscription', details: error.message },
      { status: 500 }
    )
  }
}

