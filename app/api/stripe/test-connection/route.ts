import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover',
})

export async function GET(request: NextRequest) {
  try {
    // Test Stripe connection by listing products
    const products = await stripe.products.list({ limit: 5 })
    
    return NextResponse.json({
      status: 'Stripe connection successful',
      productsCount: products.data.length,
      products: products.data.map(p => ({
        id: p.id,
        name: p.name,
        active: p.active
      }))
    })
  } catch (error) {
    console.error('Stripe connection test failed:', error)
    return NextResponse.json(
      { 
        error: 'Stripe connection failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

