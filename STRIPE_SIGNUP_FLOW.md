# Stripe Signup Flow Documentation

## Overview

This document outlines the complete Stripe-powered tier plan signup flow implemented for the Headrest application. The flow allows users to select a subscription plan, process payments through Stripe, and complete onboarding.

## Architecture

### User Flow
1. User clicks "Get Started" → Redirects to `/signup/plans`
2. User selects plan → Stripe checkout session created
3. User completes payment → Stripe webhook processes subscription
4. User redirected to success page → Clear next steps provided
5. User accesses dashboard → Full onboarding experience

### File Structure
```
app/
├── signup/
│   ├── plans/page.tsx          # Plan selection page
│   └── success/page.tsx        # Success/onboarding page
├── (auth)/
│   └── signup/page.tsx         # Redirects to plan selection
└── api/
    └── stripe/
        ├── create-checkout-session/route.ts  # Checkout API
        └── webhook/route.ts                  # Webhook handler
```

## Environment Variables

### Required Environment Variables

Add these to your `.env.local` file:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...                    # Stripe secret key
STRIPE_WEBHOOK_SECRET=whsec_...                  # Webhook endpoint secret

# Backend API Configuration
NEXT_PUBLIC_API_URL=https://your-prestashop-api.com     # Your backend API URL (no auth needed)

# Email Service (Optional)
RESEND_API_KEY=re_...                           # For sending welcome emails

# Stripe Price IDs (create these in Stripe Dashboard)
# Monthly Plans
NEXT_PUBLIC_STRIPE_HOBBY_MONTHLY_PRICE_ID=price_...     # Hobby monthly price ID
NEXT_PUBLIC_STRIPE_STARTER_MONTHLY_PRICE_ID=price_...   # Starter monthly price ID
NEXT_PUBLIC_STRIPE_PROFESSIONAL_MONTHLY_PRICE_ID=price_... # Professional monthly price ID
NEXT_PUBLIC_STRIPE_BUSINESS_MONTHLY_PRICE_ID=price_...  # Business monthly price ID

# Annual Plans (20% discount)
NEXT_PUBLIC_STRIPE_HOBBY_ANNUAL_PRICE_ID=price_...     # Hobby annual price ID
NEXT_PUBLIC_STRIPE_STARTER_ANNUAL_PRICE_ID=price_...   # Starter annual price ID
NEXT_PUBLIC_STRIPE_PROFESSIONAL_ANNUAL_PRICE_ID=price_... # Professional annual price ID
NEXT_PUBLIC_STRIPE_BUSINESS_ANNUAL_PRICE_ID=price_...  # Business annual price ID
```

### Stripe Dashboard Setup

1. **Create Products and Prices in Stripe Dashboard:**

   **Option A: Separate Products (Recommended)**
   
   **Monthly Products:**
   - Product: "Headrest Hobby - Monthly" → Price: $4.99/month (recurring)
   - Product: "Headrest Starter - Monthly" → Price: $19/month (recurring)
   - Product: "Headrest Professional - Monthly" → Price: $79/month (recurring)
   - Product: "Headrest Business - Monthly" → Price: $149/month (recurring)
   
   **Annual Products:**
   - Product: "Headrest Hobby - Annual" → Price: $47.90/year (recurring)
   - Product: "Headrest Starter - Annual" → Price: $182.40/year (recurring)
   - Product: "Headrest Professional - Annual" → Price: $758.40/year (recurring)
   - Product: "Headrest Business - Annual" → Price: $1,430.40/year (recurring)

   **Option B: Single Product with Multiple Prices**
   
   **Headrest Hobby:**
   - Monthly Price: $4.99/month (recurring)
   - Annual Price: $47.90/year (recurring)
   
   **Headrest Starter:**
   - Monthly Price: $19/month (recurring)
   - Annual Price: $182.40/year (recurring)
   
   **Headrest Professional:**
   - Monthly Price: $79/month (recurring)
   - Annual Price: $758.40/year (recurring)
   
   **Headrest Business:**
   - Monthly Price: $149/month (recurring)
   - Annual Price: $1,430.40/year (recurring)

2. **Step-by-Step Stripe Setup:**

   **Step 1: Create Monthly Products**
   ```
   1. Go to Stripe Dashboard → Products
   2. Click "Add product"
   3. Product name: "Headrest Hobby - Monthly"
   4. Description: "Perfect for developers and hobbyists"
   5. Pricing model: "Recurring"
   6. Price: $4.99
   7. Billing period: "Monthly"
   8. Click "Save product"
   9. Copy the Price ID (starts with price_...)
   ```

   **Step 2: Create Annual Products**
   ```
   1. Go to Stripe Dashboard → Products
   2. Click "Add product"
   3. Product name: "Headrest Hobby - Annual"
   4. Description: "Perfect for developers and hobbyists (Annual - Save 20%)"
   5. Pricing model: "Recurring"
   6. Price: $47.90
   7. Billing period: "Yearly"
   8. Click "Save product"
   9. Copy the Price ID (starts with price_...)
   ```

   **Step 3: Repeat for All Plans**
   - Create monthly and annual versions for Starter, Professional, and Business
   - Use the pricing table below for reference

   **Alternative: Use the Automated Script**
   ```bash
   # Set your Stripe secret key
   export STRIPE_SECRET_KEY=sk_test_...
   
   # Run the script to create all products and prices
   npm run create-stripe-products
   ```
   
   This script will:
   - Create all 8 products (4 plans × 2 billing periods)
   - Generate all price IDs
   - Output the environment variables you need
   - Save you time and reduce errors

   **Complete Pricing Reference Table:**
   ```
   | Plan | Monthly Price | Annual Price | Annual Savings |
   |------|---------------|--------------|----------------|
   | Hobby | $4.99/month | $47.90/year | $12.88 (20%) |
   | Starter | $19/month | $182.40/year | $45.60 (20%) |
   | Professional | $79/month | $758.40/year | $189.60 (20%) |
   | Business | $149/month | $1,430.40/year | $357.60 (20%) |
   ```

3. **Pricing Details:**
   - **Monthly Plans:** Standard pricing
   - **Annual Plans:** 20% discount applied
   - **Trial Period:** 28 days for Hobby monthly only
   - **Billing:** Automatic recurring billing

4. **Set up Webhook Endpoint:**
   - URL: `https://yourdomain.com/api/stripe/webhook`
   - Events to listen for:
     - `checkout.session.completed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `customer.subscription.trial_will_end`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`

## API Endpoints

### POST `/api/stripe/create-checkout-session`

Creates a Stripe checkout session for plan selection.

**Request Body:**
```json
{
  "priceId": "price_1234567890",
  "planId": "hobby",
  "billingPeriod": "monthly",
  "successUrl": "https://yourdomain.com/signup/success?plan=hobby",
  "cancelUrl": "https://yourdomain.com/signup/plans"
}
```

**Response:**
```json
{
  "url": "https://checkout.stripe.com/c/pay/cs_1234567890"
}
```

### POST `/api/stripe/webhook`

Handles Stripe webhook events for subscription management.

**Supported Events:**
- `checkout.session.completed` - New subscription created
- `customer.subscription.updated` - Plan changes
- `customer.subscription.deleted` - Subscription cancelled
- `customer.subscription.trial_will_end` - Trial ending soon (3 days before)
- `invoice.payment_succeeded` - Successful payment
- `invoice.payment_failed` - Failed payment

## Plan Configuration

### Plan Details

| Plan | Monthly Price | Annual Price | Features |
|------|---------------|--------------|----------|
| Hobby | $4.99 | $47.90 | 1 store, 1K calls, 1 template |
| Starter | $19 | $182.40 | 1 store, 10K calls, 3 templates |
| Professional | $79 | $758.40 | 3 stores, 100K calls, 5 templates |
| Business | $149 | $1,430.40 | 10 stores, 500K calls, unlimited |

### Plan Features

**Hobby Plan:**
- 1 PrestaShop store connection
- 1,000 API calls/month
- 1 React template
- Community support
- SSL included
- **28-day free trial** (monthly billing only)

**Starter Plan:**
- 1 PrestaShop store connection
- 10,000 API calls/month
- 3 React templates
- Email support (48hr)
- Custom domain

**Professional Plan:**
- 3 PrestaShop stores
- 100,000 API calls/month
- 5 premium templates
- Email support (24hr)
- Advanced analytics

**Business Plan:**
- 10 PrestaShop stores
- 500,000 API calls/month
- Unlimited templates
- Priority support (4hr)
- Mobile app builder

## Trial Period Implementation

### Trial Configuration
- **Trial Duration:** 28 days (4 weeks)
- **Eligible Plans:** Hobby plan with monthly billing only
- **Trial End Calculation:** `trial_end = current_timestamp + (28 * 24 * 60 * 60)`

### Trial Logic
```typescript
// Calculate trial end date
const getTrialEnd = () => {
  const now = Math.floor(Date.now() / 1000)
  const trialDays = 28 // 28 days trial period
  return now + (trialDays * 24 * 60 * 60)
}

// Determine if this plan should have a trial period
const hasTrial = planId === 'hobby' && billingPeriod === 'monthly'
```

### Trial Webhook Events
- **`checkout.session.completed`:** Trial subscription created
- **`customer.subscription.trial_will_end`:** Trial ending in 3 days
- **`invoice.payment_succeeded`:** Trial converted to paid subscription

### Trial User Experience
1. **Signup:** User selects Hobby monthly plan
2. **Checkout:** No payment required, 28-day trial starts
3. **Dashboard:** Full access during trial period
4. **Trial Ending:** Notification 3 days before trial ends
5. **Conversion:** Automatic billing starts after trial

## Backend Integration

### User Account Creation

When a user completes payment, the webhook automatically creates an account in your PrestaShop API backend:

**Backend API Endpoint Required:**
```
POST /api/v1/organizations
```

**Request Body:**
```json
{
  "email": "jane@company.com",
  "password": "generated_secure_password",
  "firstname": "Jane",
  "lastname": "Customer",
  "plan_tier": "professional",
  "stripe_customer_id": "cus_1234567890",
  "stripe_subscription_id": "sub_1234567890"
}
```

**Response Expected:**
```json
{
  "id": "uuid-here",
  "name": "Jane Customer's Store",
  "slug": "jane-customer",
  "plan_tier": "professional",
  "api_calls_limit": 100000,
  "api_calls_used": 0,
  "is_active": true,
  "created_at": "2025-01-15T10:30:00.000Z",
  "updated_at": "2025-01-15T10:30:00.000Z",
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_at": 1642248000,
  "user": {
    "id": "supabase-user-uuid",
    "email": "jane@company.com",
    "full_name": "Jane Customer"
  }
}
```

**Additional API Call:**
After account creation, the frontend will call:
```
GET /organizations/me
Authorization: Bearer {access_token}
```

This fetches the complete user data for the dashboard.

### Plan Limits

| Plan | API Calls Limit | Store Connections |
|------|------------------|-------------------|
| Hobby | 1,000/month | 1 |
| Starter | 10,000/month | 1 |
| Professional | 100,000/month | 3 |
| Business | 500,000/month | 10 |

### Webhook Flow

1. **User completes payment** → Stripe checkout
2. **Stripe sends webhook** → `checkout.session.completed`
3. **Frontend webhook handler** → Calls your backend API
4. **Backend creates user** → With plan limits and trial status
5. **Welcome email sent** → User gets onboarding email
6. **User can login** → Access dashboard with their plan

## Implementation Details

### Plan Selection Page (`/signup/plans`)

- **Features:**
  - Monthly/Annual billing toggle with 20% discount
  - Visual plan comparison
  - Stripe checkout integration
  - Mobile-responsive design
  - Navigation with mobile drawer

- **Key Components:**
  - Plan cards with feature lists
  - Billing toggle with discount display
  - Stripe checkout session creation
  - Mobile navigation integration

### Success Page (`/signup/success`)

- **Features:**
  - Welcome message with plan details
  - Step-by-step onboarding guide
  - Direct links to dashboard and docs
  - Loading state during setup

- **Onboarding Steps:**
  1. Check email for welcome message
  2. Access dashboard to get started
  3. Connect PrestaShop store
  4. Configure API keys

### Webhook Processing

The webhook handler processes the following events:

1. **`checkout.session.completed`:**
   - Create user account
   - Set up organization with selected plan
   - Send welcome email
   - Generate initial API keys

2. **`customer.subscription.updated`:**
   - Handle plan upgrades/downgrades
   - Update user permissions
   - Send confirmation email

3. **`customer.subscription.deleted`:**
   - Handle subscription cancellation
   - Update account status
   - Send cancellation email

4. **`invoice.payment_succeeded`:**
   - Send receipt email
   - Update billing status
   - Extend service period

5. **`invoice.payment_failed`:**
   - Send payment failure notification
   - Update account status
   - Provide retry instructions

## Security Considerations

### Webhook Security
- Webhook signature verification using `STRIPE_WEBHOOK_SECRET`
- Secure event processing with error handling
- Idempotency for duplicate events

### Data Protection
- No sensitive data stored in frontend
- Secure API key handling
- PCI compliance through Stripe

## Testing

### Test Cards (Stripe Test Mode)

| Card Number | Description |
|-------------|-------------|
| 4242424242424242 | Successful payment |
| 4000000000000002 | Declined payment |
| 4000000000009995 | Insufficient funds |
| 4000000000009987 | Lost card |
| 4000000000009979 | Stolen card |

### Test Scenarios
1. **Successful Signup:** Use test card 4242424242424242
2. **Payment Failure:** Use test card 4000000000000002
3. **Webhook Testing:** Use Stripe CLI for local testing
4. **Plan Changes:** Test upgrade/downgrade flows

## Deployment Checklist

### Pre-deployment
- [ ] Set up Stripe products and prices
- [ ] Configure webhook endpoints
- [ ] Add environment variables
- [ ] Test webhook signature verification
- [ ] Verify SSL certificates

### Post-deployment
- [ ] Test complete signup flow
- [ ] Verify webhook processing
- [ ] Test email notifications
- [ ] Monitor error logs
- [ ] Set up monitoring alerts

## Troubleshooting

### Common Issues

1. **Webhook Not Receiving Events:**
   - Check webhook URL is accessible
   - Verify webhook secret is correct
   - Ensure SSL certificate is valid

2. **Checkout Session Creation Fails:**
   - Verify Stripe secret key is correct
   - Check price IDs exist in Stripe
   - Ensure API version compatibility

3. **Payment Processing Issues:**
   - Check Stripe dashboard for errors
   - Verify webhook event processing
   - Review error logs for details

### Debug Commands

```bash
# Test webhook locally
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Test checkout session
curl -X POST http://localhost:3000/api/stripe/create-checkout-session \
  -H "Content-Type: application/json" \
  -d '{"priceId":"price_test","planId":"hobby","billingPeriod":"monthly"}'
```

## Future Enhancements

### Planned Features
- [ ] Proration handling for plan changes
- [ ] Usage-based billing integration
- [ ] Multi-currency support
- [ ] Enterprise custom pricing
- [ ] Automated dunning management

### Integration Points
- [ ] User management system
- [ ] Email notification service
- [ ] Analytics and reporting
- [ ] Customer support integration
- [ ] Usage tracking and billing

## Support

For issues related to:
- **Stripe Integration:** Check Stripe documentation and dashboard
- **Webhook Processing:** Review server logs and webhook events
- **Payment Issues:** Verify Stripe account status and configuration
- **Plan Management:** Check database integration and user accounts

## Changelog

### v1.0.0 (Current)
- Initial Stripe integration
- Plan selection page
- Checkout session creation
- Webhook processing
- Success page with onboarding
- Mobile-responsive design
- Security implementation
