import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover',
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('session_id')

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 })
    }

    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['customer', 'subscription']
    })

    console.log('Retrieved session:', session.id)

    // Extract the data we need
    const sessionData = {
      id: session.id,
      customer_email: session.customer_email,
      customer_id: session.customer,
      subscription_id: session.subscription,
      payment_status: session.payment_status,
      metadata: session.metadata
    }

    return NextResponse.json(sessionData)
  } catch (error: any) {
    console.error('Error retrieving session:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve session data' },
      { status: 500 }
    )
  }
}


