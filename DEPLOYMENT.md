# Vercel Deployment Guide

This guide provides step-by-step instructions for deploying the headless shop frontend to Vercel.

## Prerequisites

- Vercel account ([sign up here](https://vercel.com/signup))
- Vercel CLI installed: `npm i -g vercel`
- All environment variables ready (see Environment Variables section)

## Quick Deployment

### Option 1: Deploy via Vercel Dashboard (Recommended)

1. **Push your code to GitHub/GitLab/Bitbucket**
   ```bash
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push origin main
   ```

2. **Import project to Vercel**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "Add New..." → "Project"
   - Import your repository
   - Vercel will auto-detect Next.js framework

3. **Configure Environment Variables**
   - In the Vercel project settings, add all environment variables from `.env.example`
   - See detailed list below

4. **Deploy**
   - Click "Deploy"
   - Vercel will build and deploy your application

### Option 2: Deploy via CLI

```bash
# Login to Vercel
vercel login

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

## Environment Variables

Configure these in Vercel Dashboard (Settings → Environment Variables):

### Public Variables (Available to Browser)
```
NEXT_PUBLIC_API_URL=https://your-api-domain.com/api/v1
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key
```

### Server-Only Variables (Build & Runtime Secrets)
```
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
NEXTAUTH_SECRET=generate_a_random_secret_key
ENCRYPTION_KEY=generate_a_32_character_key
```

### Important Notes:
- **Never** commit `.env` or `.env.local` files to version control
- Use **production keys** (not test keys) for production deployment
- Generate secure random strings for `NEXTAUTH_SECRET` and `ENCRYPTION_KEY`
- Update `NEXT_PUBLIC_API_URL` to your production API endpoint

## Post-Deployment Configuration

### 1. Configure Stripe Webhooks

After deployment, configure Stripe webhook endpoint:

1. Go to [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks)
2. Add endpoint: `https://your-domain.vercel.app/api/stripe/webhook`
3. Select events to listen:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy the webhook signing secret
5. Update `STRIPE_WEBHOOK_SECRET` in Vercel environment variables
6. Redeploy if needed

### 2. Update Supabase Redirect URLs

1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Add your Vercel domain to allowed redirect URLs:
   - `https://your-domain.vercel.app`
   - `https://your-domain.vercel.app/auth/callback`

### 3. Configure Custom Domain (Optional)

1. Go to Vercel Dashboard → Settings → Domains
2. Add your custom domain
3. Configure DNS records as instructed by Vercel
4. Update `NEXTAUTH_URL` environment variable if using custom domain

## Optimization Features Enabled

The following production optimizations are configured:

- **Image Optimization**: Automatic WebP/AVIF conversion
- **Compression**: Gzip/Brotli enabled
- **Security Headers**: HSTS, CSP, X-Frame-Options, etc.
- **SWC Minification**: Fast JavaScript minification
- **Package Optimization**: Tree-shaking for lucide-react and @heroicons/react
- **No Source Maps**: Disabled in production for security

## Monitoring & Analytics

### Enable Vercel Analytics

1. Go to Vercel Dashboard → Analytics
2. Enable Web Analytics
3. Optionally enable Speed Insights

### Set up Error Tracking

Consider integrating:
- [Sentry](https://sentry.io/) for error tracking
- [LogRocket](https://logrocket.com/) for session replay
- Vercel's built-in logging

## CI/CD Pipeline

Vercel automatically sets up CI/CD:

- **Preview Deployments**: Every push to non-production branches
- **Production Deployments**: Every push to `main` branch
- **Automatic Rollbacks**: Instant rollback to previous deployment
- **Build Logs**: Available in Vercel Dashboard

### Branch Strategy

```
main          → Production deployment
staging       → Staging environment (optional)
feature/*     → Preview deployments
```

## Performance Checklist

Before deploying to production:

- [ ] All images optimized and using Next.js Image component
- [ ] API routes are efficient and cached appropriately
- [ ] Database queries optimized (use indexes)
- [ ] Environment variables properly configured
- [ ] Stripe webhook endpoint configured
- [ ] Custom domain configured (if applicable)
- [ ] Analytics enabled
- [ ] Error tracking configured
- [ ] Build succeeds locally: `npm run build`
- [ ] Type checking passes: `npm run type-check`
- [ ] Linting passes: `npm run lint`

## Testing the Build Locally

Before deploying, test the production build:

```bash
# Install dependencies
npm install

# Run type check
npm run type-check

# Run linting
npm run lint

# Build for production
npm run build

# Test production build locally
npm run start
```

Visit `http://localhost:3000` to verify everything works.

## Troubleshooting

### Build Fails

1. Check build logs in Vercel Dashboard
2. Verify all environment variables are set
3. Test build locally: `npm run build`
4. Check for TypeScript errors: `npm run type-check`

### Environment Variables Not Working

1. Ensure `NEXT_PUBLIC_*` prefix for client-side variables
2. Redeploy after adding/changing environment variables
3. Clear Vercel cache: `vercel --force`

### Stripe Webhook Issues

1. Verify webhook URL is correct
2. Check `STRIPE_WEBHOOK_SECRET` matches Stripe Dashboard
3. Review webhook logs in Stripe Dashboard
4. Ensure webhook endpoint is publicly accessible

### Supabase Connection Issues

1. Verify Supabase URL and keys are correct
2. Check Supabase project is active
3. Verify redirect URLs are configured in Supabase
4. Check RLS policies allow necessary operations

## Rollback Strategy

To rollback to a previous deployment:

1. Go to Vercel Dashboard → Deployments
2. Find the stable deployment
3. Click "..." → "Promote to Production"

Or via CLI:
```bash
vercel rollback
```

## Security Considerations

- **Never expose secret keys** in client-side code
- **Use environment variables** for all sensitive data
- **Enable HTTPS** (automatic with Vercel)
- **Configure CORS** in API routes if needed
- **Implement rate limiting** on API routes
- **Keep dependencies updated**: `npm audit` and `npm update`
- **Review Vercel logs** regularly for suspicious activity

## Support & Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment Docs](https://nextjs.org/docs/deployment)
- [Vercel Support](https://vercel.com/support)
- [Next.js Discord](https://discord.gg/nextjs)

## Costs

Vercel pricing tiers:
- **Hobby**: Free for personal projects (includes custom domains, SSL)
- **Pro**: $20/month for commercial projects
- **Enterprise**: Custom pricing for large-scale applications

Monitor your usage in the Vercel Dashboard to avoid unexpected costs.

## Maintenance

Regular maintenance tasks:

- **Weekly**: Review error logs and performance metrics
- **Monthly**: Update dependencies and security patches
- **Quarterly**: Review and optimize bundle size
- **Annually**: Audit security configurations and access controls
