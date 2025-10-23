import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Check environment variables (without exposing secrets)
    const envCheck = {
      hasStripeSecretKey: !!process.env.STRIPE_SECRET_KEY,
      hasWebhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
      stripeKeyPrefix: process.env.STRIPE_SECRET_KEY?.substring(0, 7) + '...',
      webhookSecretPrefix: process.env.STRIPE_WEBHOOK_SECRET?.substring(0, 10) + '...',
      
      // Check price IDs
      hobbyMonthly: !!process.env.NEXT_PUBLIC_STRIPE_HOBBY_MONTHLY_PRICE_ID,
      hobbyAnnual: !!process.env.NEXT_PUBLIC_STRIPE_HOBBY_ANNUAL_PRICE_ID,
      starterMonthly: !!process.env.NEXT_PUBLIC_STRIPE_STARTER_MONTHLY_PRICE_ID,
      starterAnnual: !!process.env.NEXT_PUBLIC_STRIPE_STARTER_ANNUAL_PRICE_ID,
      professionalMonthly: !!process.env.NEXT_PUBLIC_STRIPE_PROFESSIONAL_MONTHLY_PRICE_ID,
      professionalAnnual: !!process.env.NEXT_PUBLIC_STRIPE_PROFESSIONAL_ANNUAL_PRICE_ID,
      businessMonthly: !!process.env.NEXT_PUBLIC_STRIPE_BUSINESS_MONTHLY_PRICE_ID,
      businessAnnual: !!process.env.NEXT_PUBLIC_STRIPE_BUSINESS_ANNUAL_PRICE_ID,
      
      // Show actual price IDs (first 10 chars only)
      hobbyMonthlyId: process.env.NEXT_PUBLIC_STRIPE_HOBBY_MONTHLY_PRICE_ID?.substring(0, 10) + '...',
      hobbyAnnualId: process.env.NEXT_PUBLIC_STRIPE_HOBBY_ANNUAL_PRICE_ID?.substring(0, 10) + '...',
    }

    return NextResponse.json({
      status: 'Environment check',
      environment: envCheck,
      message: 'Check if all required environment variables are set'
    })
  } catch (error) {
    console.error('Debug env error:', error)
    return NextResponse.json(
      { error: 'Failed to check environment' },
      { status: 500 }
    )
  }
}

