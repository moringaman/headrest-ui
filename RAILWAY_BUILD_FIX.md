# Railway Build Fix Summary

## Problem
Railway build was failing with npm cache errors:
- `EBUSY: resource busy or locked, rmdir '/app/node_modules/.cache'`
- `npm install` exit code 1
- Nixpacks cache mounting conflicts

## Solution
Switched from Nixpacks to a custom multi-stage Dockerfile.

## Changes Made

### 1. Created Custom Dockerfile
- Multi-stage build (deps → builder → runner)
- Uses Node.js 18 Alpine
- Installs dependencies with `--legacy-peer-deps` fallback
- Implements Next.js standalone mode
- Non-root user for security
- Optimized layer caching

### 2. Updated next.config.js
- Added `output: 'standalone'` for Docker deployment
- Enables Next.js standalone server mode

### 3. Updated railway.toml
```toml
[build]
builder = "DOCKERFILE"
dockerfilePath = "Dockerfile"
```

### 4. Optimized .npmrc
- Disabled audit and fund messages
- Set error-only logging
- Disabled progress for faster builds

## Deploy to Railway

```bash
# Commit and push
git push origin main

# Railway will automatically:
# 1. Detect the Dockerfile
# 2. Build multi-stage image
# 3. Deploy the standalone Next.js app
```

## Environment Variables Still Needed

Add these in Railway Dashboard → Variables:
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `NEXTAUTH_SECRET`
- `ENCRYPTION_KEY`

## Benefits of Dockerfile Approach

1. **No Cache Conflicts** - Full control over build process
2. **Faster Builds** - Better layer caching
3. **Smaller Image** - Multi-stage build reduces final size
4. **More Secure** - Non-root user in production
5. **Predictable** - Same build locally and on Railway

## Build Time
- First build: ~3-5 minutes
- Subsequent builds: ~1-2 minutes (cached layers)

## Troubleshooting

If build still fails:
1. Check Railway build logs for specific error
2. Verify all environment variables are set
3. Test Dockerfile locally:
   ```bash
   docker build -t headrest-frontend .
   docker run -p 3000:3000 headrest-frontend
   ```

## Alternative: Nixpacks Fallback

If you prefer Nixpacks, the `nixpacks.toml` has been updated with:
```toml
[phases.install]
cmds = ['npm ci --legacy-peer-deps || npm install --legacy-peer-deps']
```

To use Nixpacks again, update `railway.toml`:
```toml
[build]
builder = "NIXPACKS"
```
