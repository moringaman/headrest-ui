import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover',
})

export async function GET(request: NextRequest) {
  try {
    // Test webhook endpoint configuration
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
    
    if (!webhookSecret) {
      return NextResponse.json({
        error: 'Webhook secret not configured',
        message: 'Please add STRIPE_WEBHOOK_SECRET to your .env.local file'
      }, { status: 400 })
    }

    return NextResponse.json({
      status: 'Webhook endpoint configured correctly',
      webhookSecret: webhookSecret.substring(0, 10) + '...', // Show first 10 chars only
      message: 'Your webhook is ready to receive events from Stripe'
    })
  } catch (error) {
    console.error('Webhook test error:', error)
    return NextResponse.json(
      { error: 'Failed to test webhook configuration' },
      { status: 500 }
    )
  }
}

