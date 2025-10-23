# Railway Deployment Guide

This guide provides step-by-step instructions for deploying the Headrest frontend to Railway.

## Prerequisites

- Railway account ([sign up here](https://railway.app))
- Railway CLI installed (optional): `npm i -g @railway/cli`
- All environment variables ready (see Environment Variables section)
- GitHub/GitLab repository connected

## Quick Deployment

### Option 1: Deploy via Railway Dashboard (Recommended)

1. **Push your code to GitHub**
   ```bash
   git add .
   git commit -m "Add Railway configuration"
   git push origin main
   ```

2. **Create a new project on Railway**
   - Go to [Railway Dashboard](https://railway.app/dashboard)
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository

3. **Railway will auto-detect Next.js**
   - Railway automatically detects Next.js projects
   - Uses the `railway.toml` configuration for build settings

4. **Configure Environment Variables**
   - In Railway project settings, add all environment variables
   - See detailed list below

5. **Deploy**
   - Railway will automatically build and deploy
   - You'll get a public URL like: `https://your-app.up.railway.app`

### Option 2: Deploy via Railway CLI

```bash
# Login to Railway
railway login

# Link to existing project or create new one
railway link

# Add environment variables
railway variables set NEXT_PUBLIC_API_URL=https://your-api-url.com

# Deploy
railway up
```

## Environment Variables

Add these in Railway Dashboard → Project → Variables:

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
NODE_ENV=production
```

### Railway-Specific Variables (Auto-configured)
```
PORT=3000
NODE_VERSION=18
NEXT_TELEMETRY_DISABLED=1
```

### Important Notes:
- **Never** commit `.env` or `.env.local` files
- Use **production keys** (not test keys) for production deployment
- Generate secure random strings for `NEXTAUTH_SECRET` and `ENCRYPTION_KEY`
- Update `NEXT_PUBLIC_API_URL` to your production API endpoint

## Post-Deployment Configuration

### 1. Configure Custom Domain (Optional)

1. Go to Railway Dashboard → Settings → Domains
2. Click "Add Custom Domain"
3. Add your domain (e.g., `app.headrest.com`)
4. Configure DNS records as instructed by Railway:
   - Add CNAME record pointing to Railway domain
5. SSL certificate is automatically provisioned

### 2. Configure Stripe Webhooks

After deployment, configure Stripe webhook endpoint:

1. Go to [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks)
2. Add endpoint: `https://your-app.up.railway.app/api/stripe/webhook`
3. Select events to listen:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy the webhook signing secret
5. Update `STRIPE_WEBHOOK_SECRET` in Railway variables
6. Redeploy if needed

### 3. Update Supabase Redirect URLs

1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Add your Railway domain to allowed redirect URLs:
   - `https://your-app.up.railway.app`
   - `https://your-app.up.railway.app/auth/callback`

### 4. Update CORS Settings

If your API is separate, update CORS to allow Railway domain:
```
https://your-app.up.railway.app
```

## Build Configuration

Railway uses the following configuration from `railway.toml`:

```toml
[build]
builder = "NIXPACKS"
buildCommand = "npm ci && npm run build"

[deploy]
startCommand = "npm run start"
healthcheckPath = "/"
restartPolicyType = "ON_FAILURE"
```

### Build Process:
1. Install dependencies: `npm ci`
2. Build Next.js app: `npm run build`
3. Start production server: `npm run start`

## Monitoring & Logs

### View Logs
```bash
# Via CLI
railway logs

# Via Dashboard
# Go to Project → Deployments → Click on deployment → View logs
```

### Metrics
- Railway provides built-in metrics for:
  - CPU usage
  - Memory usage
  - Network traffic
  - Response times

### Set Up Alerts (Optional)
1. Go to Project Settings → Notifications
2. Configure alerts for:
   - Deployment failures
   - High resource usage
   - Crashes

## Performance Optimization

### Railway-Specific Optimizations:

1. **Enable Build Cache**
   - Railway automatically caches `node_modules`
   - Speeds up subsequent deployments

2. **Resource Scaling**
   - Railway auto-scales based on traffic
   - Configure in Project Settings → Resources

3. **Health Checks**
   - Configured in `railway.toml`
   - Ensures app is running correctly

## CI/CD Pipeline

Railway automatically sets up CI/CD:

- **Auto Deployments**: Every push to `main` branch triggers deployment
- **Preview Deployments**: Pull requests get preview URLs
- **Rollback**: One-click rollback to previous deployment
- **Build Logs**: Available in deployment details

### Branch Strategy
```
main          → Production deployment
staging       → Staging environment (create new Railway project)
feature/*     → Preview deployments
```

## Deployment Checklist

Before deploying to production:

- [ ] All environment variables configured in Railway
- [ ] API endpoint updated in `NEXT_PUBLIC_API_URL`
- [ ] Stripe webhook endpoint configured and tested
- [ ] Supabase redirect URLs updated
- [ ] Custom domain configured (if applicable)
- [ ] Build succeeds locally: `npm run build`
- [ ] Type checking passes: `npm run type-check`
- [ ] All images optimized
- [ ] Error tracking configured (Sentry, LogRocket, etc.)

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

1. Check build logs in Railway Dashboard
2. Verify all environment variables are set
3. Test build locally: `npm run build`
4. Check for TypeScript errors: `npm run type-check`

### Environment Variables Not Working

1. Ensure `NEXT_PUBLIC_*` prefix for client-side variables
2. Redeploy after adding/changing variables
3. Check Railway logs for missing variables

### App Crashes After Deployment

1. Check Railway logs: `railway logs`
2. Verify `PORT` environment variable (Railway sets this automatically)
3. Ensure `npm run start` works locally
4. Check memory limits in Railway settings

### Stripe Webhook Issues

1. Verify webhook URL is correct
2. Check `STRIPE_WEBHOOK_SECRET` matches Stripe Dashboard
3. Review webhook logs in Stripe Dashboard
4. Test webhook locally with Stripe CLI first

### Supabase Connection Issues

1. Verify Supabase URL and keys are correct
2. Check Supabase project is active
3. Verify redirect URLs include Railway domain
4. Check RLS policies allow necessary operations

## Rollback Strategy

To rollback to a previous deployment:

### Via Dashboard:
1. Go to Railway Dashboard → Deployments
2. Find the stable deployment
3. Click "..." → "Redeploy"

### Via CLI:
```bash
railway status
railway rollback
```

## Cost Optimization

Railway pricing:
- **Free Tier**: $5 of usage credits per month
- **Developer Plan**: $5/month + usage
- **Team Plan**: $20/month + usage

### Tips to Reduce Costs:
1. Remove unused deployments
2. Optimize build times (faster builds = lower costs)
3. Use Railway's sleep mode for staging environments
4. Monitor resource usage in dashboard

## Advanced Configuration

### Custom Build Command

Edit `railway.toml` to customize:
```toml
[build]
buildCommand = "npm ci && npm run build && npm run post-build"
```

### Custom Start Command

```toml
[deploy]
startCommand = "npm run start -- -p $PORT"
```

### Multiple Environments

Create separate Railway projects for:
- Production (main branch)
- Staging (staging branch)
- Development (dev branch)

## Support & Resources

- [Railway Documentation](https://docs.railway.app)
- [Next.js on Railway](https://docs.railway.app/guides/nextjs)
- [Railway Discord](https://discord.gg/railway)
- [Railway Status Page](https://status.railway.app)

## Security Best Practices

- **Never expose secret keys** in client-side code
- **Use environment variables** for all sensitive data
- **Enable HTTPS** (automatic with Railway)
- **Rotate secrets regularly**
- **Implement rate limiting** on API routes
- **Keep dependencies updated**: `npm audit` and `npm update`
- **Review Railway logs** regularly for suspicious activity
- **Enable 2FA** on Railway account

## Maintenance

Regular maintenance tasks:

- **Weekly**: Review error logs and performance metrics
- **Monthly**: Update dependencies and security patches
- **Quarterly**: Review and optimize bundle size
- **Annually**: Audit security configurations and access controls

---

## Quick Start Commands

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Deploy
railway up

# View logs
railway logs

# Open in browser
railway open
```

Your Headrest frontend is now ready for Railway deployment! 🚂
