import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://prestashop-api-staging.up.railway.app'

export async function POST(request: NextRequest) {
  console.log('=== CHECKOUT SESSION REQUEST START ===')

  try {
    const body = await request.json()
    console.log('Request body received:', body)

    const { planId, billingPeriod, successUrl, cancelUrl } = body

    // Debug logging
    console.log('Checkout session request:', {
      planId,
      billingPeriod,
      successUrl,
      cancelUrl
    })

    if (!planId || !billingPeriod) {
      console.error('Missing required fields in request')
      return NextResponse.json({
        error: 'Missing required fields',
        details: 'planId and billingPeriod are required'
      }, { status: 400 })
    }

    // Call backend API to create checkout session
    const response = await fetch(`${API_BASE_URL}/api/v1/subscriptions/create-checkout-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        plan_tier: planId,
        billing_period: billingPeriod,
        success_url: successUrl,
        cancel_url: cancelUrl
      })
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to create checkout session' }))
      console.error('Backend API error:', error)
      return NextResponse.json(
        {
          error: 'Failed to create checkout session',
          details: error.message || error.error || 'Unknown error'
        },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log('Checkout session created successfully:', data.session_id)
    console.log('=== CHECKOUT SESSION REQUEST SUCCESS ===')

    // Return both url and session_id for compatibility
    return NextResponse.json({
      url: data.checkout_url,
      session_id: data.session_id
    })
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
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
