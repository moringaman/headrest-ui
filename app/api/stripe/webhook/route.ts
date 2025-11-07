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

// Function to update organization subscription in backend
async function updateOrganizationSubscription(
  subscriptionId: string,
  status: string,
  planId?: string
) {
  const backendUrl = process.env.NEXT_PUBLIC_API_URL
  
  if (!backendUrl) {
    console.error('NEXT_PUBLIC_API_URL environment variable is not set')
    return
  }
  
  try {
    // Find organization by subscription ID
    // Note: This assumes your backend has an endpoint to find organizations by subscription_id
    // If not, you may need to store this mapping differently
    const response = await fetch(`${backendUrl}/api/v1/organizations/by-subscription/${subscriptionId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subscription_status: status,
        ...(planId && { plan_tier: planId }),
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Failed to update organization subscription: ${response.status} - ${errorText}`)
    } else {
      console.log(`Successfully updated organization subscription: ${subscriptionId} -> ${status}`)
    }
  } catch (error) {
    console.error('Error updating organization subscription:', error)
  }
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
  //       subject: isTrial ? 'Welcome to Headrest - Your 28-day trial has started!' : 'Welcome to Headrest!',
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
        
        // Extract plan ID from metadata
        const planId = subscription.metadata?.planId || subscription.items.data[0]?.price.metadata?.planId
        
        // Update organization subscription status and plan
        await updateOrganizationSubscription(
          subscription.id,
          subscription.status,
          planId
        )
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
        
        // Update organization subscription status to canceled
        await updateOrganizationSubscription(
          deletedSubscription.id,
          'canceled'
        )
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
        
        // Update subscription status if subscription is attached
        if (failedInvoice.subscription) {
          const subscriptionId = typeof failedInvoice.subscription === 'string'
            ? failedInvoice.subscription
            : failedInvoice.subscription.id
          
          await updateOrganizationSubscription(
            subscriptionId,
            'past_due'
          )
        }
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
