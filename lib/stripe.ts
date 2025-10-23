import { loadStripe } from '@stripe/stripe-js'

export const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
)

export const PRICING_PLANS = {
  starter: {
    name: 'Starter',
    price: 29,
    priceId: 'price_starter_monthly', // Replace with actual Stripe price IDs
    features: [
      '1 PrestaShop store',
      '10,000 API calls/month',
      'Basic React template',
      'Community support',
      'SSL included'
    ],
    limits: {
      stores: 1,
      apiCalls: 10000,
      templates: 1
    }
  },
  professional: {
    name: 'Professional',
    price: 99,
    priceId: 'price_professional_monthly',
    features: [
      '3 PrestaShop stores',
      '100,000 API calls/month',
      '5 premium templates',
      'Email support',
      'Custom domain support',
      'Advanced analytics'
    ],
    limits: {
      stores: 3,
      apiCalls: 100000,
      templates: 5
    }
  },
  business: {
    name: 'Business',
    price: 199,
    priceId: 'price_business_monthly',
    features: [
      '10 PrestaShop stores',
      '500,000 API calls/month',
      'Unlimited templates',
      'Priority support',
      'Multi-currency support',
      'A/B testing',
      'Mobile app builder'
    ],
    limits: {
      stores: 10,
      apiCalls: 500000,
      templates: -1 // unlimited
    }
  },
  enterprise: {
    name: 'Enterprise',
    price: 499,
    priceId: 'price_enterprise_monthly',
    features: [
      'Unlimited stores',
      'Unlimited API calls',
      'White-label solution',
      'Dedicated account manager',
      '1hr support SLA',
      'Custom development',
      'On-premise deployment'
    ],
    limits: {
      stores: -1, // unlimited
      apiCalls: -1, // unlimited
      templates: -1 // unlimited
    }
  }
} as const

export type PricingPlan = keyof typeof PRICING_PLANS