# Webhook Setup Guide

## Quick Setup (Using ngrok)

1. **Start your development server:**
   ```bash
   npm run dev
   ```

2. **In another terminal, expose your local server:**
   ```bash
   npx ngrok http 3000
   ```

3. **Copy the HTTPS URL from ngrok output:**
   ```
   Forwarding    https://abc123.ngrok.io -> http://localhost:3000
   ```

4. **Create webhook in Stripe Dashboard:**
   - Go to https://dashboard.stripe.com/test/webhooks
   - Click "Add endpoint"
   - Endpoint URL: `https://abc123.ngrok.io/api/stripe/webhook`
   - Select events: `checkout.session.completed`, `customer.subscription.*`, `invoice.payment_*`
   - Click "Add endpoint"

5. **Copy the webhook secret:**
   - Click on your new webhook
   - Copy the "Signing secret" (starts with `whsec_`)

6. **Add to .env.local:**
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_your_secret_here
   ```

7. **Test the webhook:**
   ```bash
   curl http://localhost:3000/api/stripe/test-webhook
   ```

## Alternative: Using Stripe CLI

1. **Install Stripe CLI:**
   - Download from https://stripe.com/docs/stripe-cli
   - Or install via package manager

2. **Login to Stripe:**
   ```bash
   stripe login
   ```

3. **Forward webhooks to local server:**
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

4. **Copy the webhook secret from the output:**
   ```
   Ready! Your webhook signing secret is whsec_...
   ```

5. **Add to .env.local:**
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_your_secret_here
   ```

## Testing Your Webhook

Once configured, you can test by:

1. **Visit the test endpoint:**
   ```
   http://localhost:3000/api/stripe/test-webhook
   ```

2. **Create a test subscription:**
   - Go to your signup page
   - Select a plan
   - Use Stripe test card: `4242 4242 4242 4242`
   - Complete the checkout

3. **Check your webhook logs:**
   - In Stripe Dashboard → Webhooks
   - Click on your webhook
   - View "Recent deliveries" to see events

## Troubleshooting

- **Webhook secret not found:** Make sure it's in `.env.local` and starts with `whsec_`
- **Webhook not receiving events:** Check that your ngrok URL is correct and accessible
- **Signature verification failed:** Ensure the webhook secret matches exactly
- **Events not showing:** Make sure you selected the right events when creating the webhook

