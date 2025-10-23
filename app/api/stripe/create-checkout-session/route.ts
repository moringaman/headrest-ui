import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover',
})

export async function POST(request: NextRequest) {
  console.log('=== CHECKOUT SESSION REQUEST START ===')
  
  let priceId, planId, billingPeriod, successUrl, cancelUrl
  
  try {
    const body = await request.json()
    console.log('Request body received:', body)
    
    priceId = body.priceId
    planId = body.planId
    billingPeriod = body.billingPeriod
    successUrl = body.successUrl
    cancelUrl = body.cancelUrl

    // Debug logging
    console.log('Checkout session request:', {
      priceId,
      planId,
      billingPeriod,
      successUrl,
      cancelUrl
    })

    if (!priceId) {
      console.error('Missing priceId in request')
      return NextResponse.json({ 
        error: 'Price ID is required',
        details: 'No priceId provided in request body'
      }, { status: 400 })
    }

    // Validate Stripe configuration
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('STRIPE_SECRET_KEY not configured')
      return NextResponse.json({ 
        error: 'Stripe configuration error',
        details: 'STRIPE_SECRET_KEY environment variable not set'
      }, { status: 500 })
    }

    // Calculate trial end date
    const getTrialEnd = () => {
      const now = Math.floor(Date.now() / 1000)
      const trialDays = 28 // 28 days trial period
      return now + (trialDays * 24 * 60 * 60)
    }

    // Determine if this plan should have a trial period
    const hasTrial = planId === 'hobby' && billingPeriod === 'monthly'

        // Create checkout session
        console.log('Creating checkout session with success_url:', `${successUrl}&session_id={CHECKOUT_SESSION_ID}&trial=${hasTrial}`)
        const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${successUrl}&session_id={CHECKOUT_SESSION_ID}&trial=${hasTrial}`,
      cancel_url: cancelUrl,
      metadata: {
        planId,
        billingPeriod,
        hasTrial: hasTrial.toString(),
      },
      subscription_data: {
        metadata: {
          planId,
          billingPeriod,
          hasTrial: hasTrial.toString(),
        },
        // Add trial period for Hobby monthly plan
        ...(hasTrial && { trial_end: getTrialEnd() }),
      },
      // Collect billing address
      billing_address_collection: 'required',
      // Allow promotion codes
      allow_promotion_codes: true,
    })

    console.log('Checkout session created successfully:', session.id)
    console.log('=== CHECKOUT SESSION REQUEST SUCCESS ===')
    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('=== CHECKOUT SESSION REQUEST ERROR ===')
    console.error('Error creating checkout session:', error)
    
    // More detailed error logging
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }
    
    console.log('=== CHECKOUT SESSION REQUEST END ===')
    return NextResponse.json(
      { 
        error: 'Failed to create checkout session',
        details: error instanceof Error ? error.message : 'Unknown error',
        priceId: priceId || 'undefined'
      },
      { status: 500 }
    )
  }
}
