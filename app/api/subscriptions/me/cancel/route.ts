import { NextRequest, NextResponse } from 'next/server'
import { createMiddlewareSupabaseClient } from '@/lib/supabase-middleware'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://prestashop-api-staging.up.railway.app'

export async function POST(request: NextRequest) {
  try {
    const { supabase } = createMiddlewareSupabaseClient(request)
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { cancel_immediately = false } = body

    // Base64 encode Stripe secret key (server-side only)
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY
    if (!stripeSecretKey) {
      return NextResponse.json(
        { error: 'Stripe secret key not configured' },
        { status: 500 }
      )
    }

    const encodedStripeKey = Buffer.from(stripeSecretKey).toString('base64')

    const response = await fetch(`${API_BASE_URL}/api/v1/subscriptions/me/cancel`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        cancel_immediately,
        stripe_secret_key: encodedStripeKey,
      }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to cancel subscription' }))
      return NextResponse.json(
        { error: error.message || 'Failed to cancel subscription' },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Error canceling subscription:', error)
    return NextResponse.json(
      { error: 'Failed to cancel subscription', details: error.message },
      { status: 500 }
    )
  }
}

