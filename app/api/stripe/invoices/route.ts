import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createMiddlewareSupabaseClient } from '@/lib/supabase-middleware'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover',
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customer_id')
    const limit = parseInt(searchParams.get('limit') || '10')

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

    // Retrieve invoices from Stripe
    const invoices = await stripe.invoices.list({
      customer: customerId,
      limit: Math.min(limit, 100), // Max 100 invoices
      expand: ['data.subscription'],
    })

    // Format invoices for frontend
    const invoiceData = invoices.data.map(invoice => {
      // Safely access subscription property (may not be in type definition but exists when expanded)
      const subscription = (invoice as any).subscription
      const subscriptionId = subscription 
        ? (typeof subscription === 'string' ? subscription : subscription.id)
        : undefined

      return {
        id: invoice.id,
        number: invoice.number || '',
        amount_due: invoice.amount_due,
        amount_paid: invoice.amount_paid,
        currency: invoice.currency,
        status: invoice.status,
        created: invoice.created,
        due_date: invoice.due_date || undefined,
        paid_at: invoice.status_transitions.paid_at || undefined,
        invoice_pdf: invoice.invoice_pdf || undefined,
        hosted_invoice_url: invoice.hosted_invoice_url || undefined,
        subscription: subscriptionId,
        period_start: invoice.period_start || undefined,
        period_end: invoice.period_end || undefined,
        line_items: invoice.lines.data.map(line => ({
          description: line.description || '',
          amount: line.amount,
          currency: invoice.currency,
        })),
      }
    })

    return NextResponse.json(invoiceData)
  } catch (error: any) {
    console.error('Error retrieving invoices:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve invoices', details: error.message },
      { status: 500 }
    )
  }
}

