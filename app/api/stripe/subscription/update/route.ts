import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createMiddlewareSupabaseClient } from '@/lib/supabase-middleware'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover',
})

// Price ID mapping based on plan and billing period
function getPriceId(planId: string, billingPeriod: 'monthly' | 'annual'): string | null {
  const envKey = `NEXT_PUBLIC_STRIPE_${planId.toUpperCase()}_${billingPeriod.toUpperCase()}_PRICE_ID`
  return process.env[envKey] || null
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { subscriptionId, planId, billingPeriod } = body

    if (!subscriptionId || !planId || !billingPeriod) {
      return NextResponse.json(
        { error: 'Missing required fields: subscriptionId, planId, billingPeriod' },
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

    // Get the new price ID
    const newPriceId = getPriceId(planId, billingPeriod)
    if (!newPriceId) {
      return NextResponse.json(
        { error: `Price ID not found for plan: ${planId} (${billingPeriod})` },
        { status: 400 }
      )
    }

    // Retrieve current subscription
    const subscription = await stripe.subscriptions.retrieve(subscriptionId)

    // Get the current price item ID
    const currentPriceItemId = subscription.items.data[0]?.id

    if (!currentPriceItemId) {
      return NextResponse.json(
        { error: 'Could not find current subscription item' },
        { status: 400 }
      )
    }

    // Determine if this is an upgrade or downgrade by comparing plan tiers
    const planTiers: Record<string, number> = { hobby: 1, starter: 2, professional: 3, business: 4 }
    const currentPlanId = subscription.metadata?.planId || ''
    const currentTier = planTiers[currentPlanId] || 0
    const newTier = planTiers[planId] || 0
    const isUpgrade = newTier > currentTier
    const isDowngrade = newTier < currentTier

    // Update subscription with new price
    // For upgrades: immediate proration and charge
    // For downgrades: change at period end (no immediate charge, schedule for next cycle)
    const updateParams: Stripe.SubscriptionUpdateParams = {
      items: [{
        id: currentPriceItemId,
        price: newPriceId,
      }],
      metadata: {
        planId,
        billingPeriod,
        hasTrial: 'false',
      },
    }

    if (isUpgrade) {
      // Immediate proration for upgrades (user pays prorated amount)
      updateParams.proration_behavior = 'always_invoice'
    } else if (isDowngrade) {
      // Immediate change for downgrades (user gets credit for unused time)
      updateParams.proration_behavior = 'always_invoice'
      // Downgrades will credit the user for the remaining time
    } else {
      // Same tier, just change billing period - prorate
      updateParams.proration_behavior = 'always_invoice'
    }

    const updatedSubscription = await stripe.subscriptions.update(subscriptionId, updateParams)

    // Check if immediate payment is required (for upgrades or billing period changes)
    if (updatedSubscription.latest_invoice) {
      const invoice = await stripe.invoices.retrieve(
        typeof updatedSubscription.latest_invoice === 'string' 
          ? updatedSubscription.latest_invoice 
          : updatedSubscription.latest_invoice.id,
        { expand: ['payment_intent'] }
      )

      // If invoice is open and needs payment, redirect to invoice payment page
      if (invoice.status === 'open' && invoice.amount_due > 0) {
        // Try to pay with default payment method first
        if (invoice.payment_intent) {
          const paymentIntent = typeof invoice.payment_intent === 'string'
            ? await stripe.paymentIntents.retrieve(invoice.payment_intent)
            : invoice.payment_intent

          // If payment intent requires action, return the invoice hosted URL
          if (paymentIntent.status === 'requires_action' || paymentIntent.status === 'requires_payment_method') {
            return NextResponse.json({ 
              url: invoice.hosted_invoice_url || invoice.invoice_pdf,
              requiresPayment: true
            })
          }
        }

        // Return invoice URL for payment
        return NextResponse.json({ 
          url: invoice.hosted_invoice_url,
          requiresPayment: true
        })
      }
    }

    // If no immediate payment needed, return success
    return NextResponse.json({
      success: true,
      subscription: {
        id: updatedSubscription.id,
        status: updatedSubscription.status,
      }
    })
  } catch (error: any) {
    console.error('Error updating subscription:', error)
    return NextResponse.json(
      { error: 'Failed to update subscription', details: error.message },
      { status: 500 }
    )
  }
}

