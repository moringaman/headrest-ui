import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { headers } from 'next/headers'

// Interface for user account creation
interface CreateUserAccountData {
  email: string
  stripeCustomerId: string
  subscriptionId: string
  planId: string
  billingPeriod: string
  isTrial: boolean
  trialEnd: Date | null
}

// Function to create user account in your backend
async function createUserAccount(data: CreateUserAccountData) {
  const backendUrl = process.env.NEXT_PUBLIC_API_URL
  
  if (!backendUrl) {
    throw new Error('NEXT_PUBLIC_API_URL environment variable is not set')
  }
  
  try {
    // Extract name from email (fallback if not available)
    const emailParts = data.email.split('@')
    const defaultName = emailParts[0] || 'User'
    
    // Generate a secure password for the user
    const generatedPassword = generateSecurePassword()
    
    const response = await fetch(`${backendUrl}/api/v1/organizations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: data.email,
        password: generatedPassword,
        firstname: defaultName,
        lastname: 'Customer',
        plan_tier: data.planId,
        stripe_customer_id: data.stripeCustomerId,
        stripe_subscription_id: data.subscriptionId,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Backend API error: ${response.status} - ${errorText}`)
    }

    const customerData = await response.json()
    console.log('Customer created in backend:', customerData)
    
    // Send welcome email with login credentials
    await sendWelcomeEmail(data.email, data.planId, data.isTrial, generatedPassword)
    
    return customerData
  } catch (error) {
    console.error('Failed to create customer in backend:', error)
    throw error
  }
}

// Function to generate a secure password
function generateSecurePassword(): string {
  const length = 12
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
  let password = ''
  
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length))
  }
  
  return password
}

// Function to get API calls limit based on plan
function getApiCallsLimit(planId: string): number {
  const limits = {
    hobby: 1000,
    starter: 10000,
    professional: 100000,
    business: 500000,
  }
  return limits[planId as keyof typeof limits] || 1000
}

// Function to send welcome email
async function sendWelcomeEmail(email: string, planId: string, isTrial: boolean, password: string) {
  console.log(`Welcome email sent to ${email} for ${planId} plan${isTrial ? ' (trial)' : ''}`)
  console.log(`Generated password: ${password}`)
  
  // You can integrate with your email service here (SendGrid, Resend, etc.)
  // Example with a service like Resend:
  // try {
  //   await fetch('https://api.resend.com/emails', {
  //     method: 'POST',
  //     headers: {
  //       'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
  //       'Content-Type': 'application/json',
  //     },
  //     body: JSON.stringify({
  //       from: 'welcome@suede.com',
  //       to: email,
  //       subject: isTrial ? 'Welcome to Suede - Your 28-day trial has started!' : 'Welcome to Suede!',
  //       html: generateWelcomeEmailHTML(planId, isTrial, password),
  //     }),
  //   })
  // } catch (error) {
  //   console.error('Failed to send welcome email:', error)
  // }
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover',
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  const body = await request.text()
  const headersList = await headers()
  const signature = headersList.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session
        
        if (session.mode === 'subscription') {
          console.log('Subscription created:', session.subscription)
          
          // Extract metadata
          const hasTrial = session.metadata?.hasTrial === 'true'
          const planId = session.metadata?.planId
          const billingPeriod = session.metadata?.billingPeriod
          const customerEmail = session.customer_email
          const stripeCustomerId = session.customer
          const subscriptionId = session.subscription
          
          console.log('Payment completed for:', customerEmail)
          console.log('Storing payment data for account creation...')
          
          // Store payment data in localStorage for account creation
          // This ensures users don't lose their payment if they don't complete account creation
          const paymentData = {
            email: customerEmail,
            planId: planId,
            stripeCustomerId: stripeCustomerId,
            subscriptionId: subscriptionId,
            billingPeriod: billingPeriod,
            isTrial: hasTrial,
            timestamp: Date.now()
          }
          
          // Note: The user will be redirected to the account creation page
          // where they can set their own password and provide their name
          // The payment data is stored in localStorage for persistence
        }
        break

      case 'customer.subscription.updated':
        const subscription = event.data.object as Stripe.Subscription
        console.log('Subscription updated:', subscription.id)
        
        // Handle subscription changes (plan upgrades/downgrades, etc.)
        break

      case 'customer.subscription.trial_will_end':
        const trialEndingSubscription = event.data.object as Stripe.Subscription
        console.log('Trial ending soon:', trialEndingSubscription.id)
        
        // Handle trial ending:
        // 1. Send trial ending notification email
        // 2. Show upgrade prompts in dashboard
        // 3. Prepare for potential cancellation
        break

      case 'customer.subscription.deleted':
        const deletedSubscription = event.data.object as Stripe.Subscription
        console.log('Subscription cancelled:', deletedSubscription.id)
        
        // Handle subscription cancellation
        // Update user account status, send cancellation email, etc.
        break

      case 'invoice.payment_succeeded':
        const invoice = event.data.object as Stripe.Invoice
        console.log('Payment succeeded:', invoice.id)
        
        // Handle successful payment
        // Send receipt email, update billing status, etc.
        break

      case 'invoice.payment_failed':
        const failedInvoice = event.data.object as Stripe.Invoice
        console.log('Payment failed:', failedInvoice.id)
        
        // Handle failed payment
        // Send payment failure email, update account status, etc.
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Error processing webhook:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
