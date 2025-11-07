import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createMiddlewareSupabaseClient } from '@/lib/supabase-middleware'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover',
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { customerId, returnUrl } = body

    if (!customerId) {
      return NextResponse.json(
        { error: 'Customer ID is required' },
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

    // Verify customer ownership
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
            (org: any) => org.stripe_customer_id === customerId
          )

          if (!hasAccess) {
            return NextResponse.json(
              { error: 'Forbidden: Customer does not belong to your account' },
              { status: 403 }
            )
          }
        }
      } catch (error) {
        console.error('Error verifying customer ownership:', error)
      }
    }

    // Create billing portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl || `${request.headers.get('origin') || 'http://localhost:3000'}/dashboard/billing`,
    })

    return NextResponse.json({ url: portalSession.url })
  } catch (error: any) {
    console.error('Error creating billing portal session:', error)
    return NextResponse.json(
      { error: 'Failed to create billing portal session', details: error.message },
      { status: 500 }
    )
  }
}

