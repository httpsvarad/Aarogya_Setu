# Aarogya Setu - Production Deployment Guide

This guide provides step-by-step instructions for deploying Aarogya Setu to production.

## Pre-Deployment Checklist

Before deploying, ensure you have:

- [ ] Supabase project created
- [ ] Gemini API key obtained
- [ ] Database schema and RLS policies set up
- [ ] Edge Functions deployed
- [ ] Storage buckets configured
- [ ] VAPID keys generated for push notifications
- [ ] Custom domain registered (optional but recommended)
- [ ] SSL certificate (handled by hosting platform)

## Quick Start (5 Minutes)

### 1. Clone and Install

```bash
git clone <your-repo>
cd aarogya-setu
npm install
```

### 2. Configure Environment

Create `.env.local`:
```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Test Locally

```bash
npm run dev
```

Visit http://localhost:3000

### 4. Build for Production

```bash
npm run build
```

This creates an optimized build in `dist/`

### 5. Deploy

Choose your hosting platform:

#### Option A: Vercel (Recommended)

```bash
npm i -g vercel
vercel
```

#### Option B: Netlify

```bash
npm i -g netlify-cli
netlify deploy --prod
```

#### Option C: Cloudflare Pages

```bash
npm i -g wrangler
wrangler pages publish dist
```

---

## Detailed Deployment Steps

## Step 1: Supabase Setup

### 1.1 Create Supabase Project

1. Go to https://supabase.com
2. Click "New Project"
3. Choose organization and region (choose closest to your users)
4. Set database password (save this securely)
5. Wait for project provisioning (~2 minutes)

### 1.2 Set Up Database

1. In Supabase Dashboard, go to SQL Editor
2. Copy the schema from `SUPABASE_SETUP.md`
3. Run each section:
   - Tables
   - Indexes
   - RLS Policies
   - Storage Policies

### 1.3 Create Storage Buckets

1. Go to Storage in Supabase Dashboard
2. Create bucket: `prescriptions`
   - Public: No
   - File size limit: 10 MB
   - Allowed types: `image/jpeg, image/png, image/heic`

3. Create bucket: `pill-verifications`
   - Public: No
   - File size limit: 5 MB
   - Allowed types: `image/jpeg, image/png`

### 1.4 Enable Authentication

1. Go to Authentication > Settings
2. Enable Phone provider
3. Configure Twilio (for OTP):
   - Add Twilio Account SID
   - Add Twilio Auth Token
   - Add Twilio Phone Number

Alternatively, use Supabase's built-in phone auth (free tier limits apply)

## Step 2: Gemini API Setup

### 2.1 Get API Key

1. Go to https://ai.google.dev/
2. Click "Get API Key"
3. Create new API key
4. Copy key (keep secure, never commit to git)

### 2.2 Test API Key

```bash
curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=YOUR_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"contents":[{"parts":[{"text":"Hello"}]}]}'
```

## Step 3: Deploy Edge Functions

### 3.1 Install Supabase CLI

```bash
npm install -g supabase
```

### 3.2 Login and Link Project

```bash
supabase login
supabase link --project-ref your-project-ref
```

Get project ref from Supabase Dashboard URL: `https://app.supabase.com/project/[YOUR-PROJECT-REF]`

### 3.3 Create Edge Functions

Create directory structure:
```
supabase/
└── functions/
    ├── parse-prescription/
    │   └── index.ts
    ├── verify-pill/
    │   └── index.ts
    ├── agent-recommendation/
    │   └── index.ts
    ├── send-push/
    │   └── index.ts
    └── _cron/
        └── check-reminders/
            └── index.ts
```

Copy Edge Function code from `SUPABASE_SETUP.md` into respective files.

### 3.4 Set Environment Variables

```bash
supabase secrets set GEMINI_API_KEY=your_gemini_key_here
supabase secrets set TWILIO_ACCOUNT_SID=your_twilio_sid
supabase secrets set TWILIO_AUTH_TOKEN=your_twilio_token
supabase secrets set TWILIO_PHONE_NUMBER=your_twilio_number
```

### 3.5 Deploy Functions

```bash
cd supabase/functions

# Deploy individual functions
supabase functions deploy parse-prescription
supabase functions deploy verify-pill
supabase functions deploy agent-recommendation
supabase functions deploy send-push

# Or deploy all at once
supabase functions deploy
```

### 3.6 Set Up Cron Jobs

1. Go to Supabase Dashboard > Database > Cron Jobs
2. Create new job:
   - Name: `check-reminders`
   - Schedule: `*/5 * * * *` (every 5 minutes)
   - Command: `SELECT supabase.functions.invoke('check-reminders')`

## Step 4: Web Push Setup

### 4.1 Generate VAPID Keys

```bash
npx web-push generate-vapid-keys
```

Output:
```
Public Key: BNxN...
Private Key: oFj...
```

### 4.2 Add to Edge Functions

```bash
supabase secrets set VAPID_PUBLIC_KEY=your_public_key
supabase secrets set VAPID_PRIVATE_KEY=your_private_key
```

### 4.3 Update Frontend Code

In `/hooks/useNotifications.ts`, replace:
```typescript
const vapidPublicKey = 'YOUR_VAPID_PUBLIC_KEY';
```

With your actual public key:
```typescript
const vapidPublicKey = 'BNxN...your-actual-key...';
```

## Step 5: Frontend Deployment

### Option A: Deploy to Vercel

#### 5.1 Install Vercel CLI

```bash
npm i -g vercel
```

#### 5.2 Deploy

```bash
# From project root
vercel

# Follow prompts:
# - Set up and deploy? Y
# - Which scope? (select your account)
# - Link to existing project? N
# - Project name: aarogya-setu
# - Directory: ./
# - Override settings? N
```

#### 5.3 Set Environment Variables

In Vercel Dashboard:
1. Go to Project Settings > Environment Variables
2. Add:
   - `VITE_SUPABASE_URL` = `https://xxxxx.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `your-anon-key`

#### 5.4 Redeploy

```bash
vercel --prod
```

#### 5.5 Custom Domain (Optional)

1. In Vercel Dashboard, go to Domains
2. Add your custom domain
3. Follow DNS configuration instructions
4. Wait for SSL certificate (automatic, ~5 minutes)

### Option B: Deploy to Netlify

#### 5.1 Install Netlify CLI

```bash
npm i -g netlify-cli
```

#### 5.2 Login

```bash
netlify login
```

#### 5.3 Create netlify.toml

Already created in project root. Verify contents:
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/sw.js"
  [headers.values]
    Cache-Control = "no-cache"
```

#### 5.4 Deploy

```bash
netlify deploy --prod
```

#### 5.5 Set Environment Variables

```bash
netlify env:set VITE_SUPABASE_URL "https://xxxxx.supabase.co"
netlify env:set VITE_SUPABASE_ANON_KEY "your-anon-key"
```

### Option C: Deploy to Cloudflare Pages

#### 5.1 Install Wrangler

```bash
npm i -g wrangler
```

#### 5.2 Login

```bash
wrangler login
```

#### 5.3 Deploy

```bash
wrangler pages publish dist --project-name=aarogya-setu
```

#### 5.4 Set Environment Variables

In Cloudflare Dashboard:
1. Go to Pages > aarogya-setu > Settings > Environment Variables
2. Add variables (production)

## Step 6: Post-Deployment Configuration

### 6.1 Update Supabase CORS

1. Go to Supabase Dashboard > Settings > API
2. Add your deployment URL to allowed origins:
   - `https://your-app.vercel.app`
   - `https://yourdomain.com`

### 6.2 Update Storage CORS

In SQL Editor, run:
```sql
-- Update CORS for storage buckets
UPDATE storage.buckets
SET allowed_headers = ARRAY['*']
WHERE id IN ('prescriptions', 'pill-verifications');
```

### 6.3 Test PWA Installation

1. Visit your deployed URL on mobile
2. Check for "Add to Home Screen" prompt
3. Install and verify offline functionality
4. Test push notifications

### 6.4 Configure Analytics (Optional)

Add Google Analytics or Plausible:

```html
<!-- In index.html, before </head> -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

## Step 7: Monitoring Setup

### 7.1 Enable Supabase Logs

1. Go to Supabase Dashboard > Logs
2. Monitor:
   - Database queries
   - Edge Function invocations
   - Authentication events
   - Storage access

### 7.2 Set Up Error Tracking (Optional)

Install Sentry:
```bash
npm install @sentry/react
```

Configure in `src/main.tsx`:
```typescript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "your-sentry-dsn",
  environment: "production",
  tracesSampleRate: 0.1,
});
```

### 7.3 Set Up Uptime Monitoring

Use free services:
- UptimeRobot (https://uptimerobot.com)
- Pingdom (https://pingdom.com)
- Better Uptime (https://betteruptime.com)

Monitor:
- Main app URL
- `/manifest.json` endpoint
- Health check endpoint (create one)

## Step 8: Performance Optimization

### 8.1 Run Lighthouse Audit

```bash
npx lighthouse https://your-app.vercel.app --view
```

Target scores:
- Performance: > 90
- Accessibility: > 95
- Best Practices: > 95
- SEO: > 90
- PWA: 100

### 8.2 Enable CDN (if not using Vercel/Netlify/CF)

For custom hosting:
1. Configure CloudFlare in front
2. Enable Brotli compression
3. Set up caching rules

### 8.3 Optimize Images

Run image optimization:
```bash
npm install -g sharp-cli
sharp-cli --input public/*.png --output public/ --format webp
```

## Step 9: Security Hardening

### 9.1 Add Security Headers

In `netlify.toml`:
```toml
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Permissions-Policy = "camera=(), microphone=(), geolocation=()"
```

### 9.2 Enable CSP

In `index.html`:
```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' 'unsafe-inline'; 
               style-src 'self' 'unsafe-inline'; 
               img-src 'self' data: https:; 
               connect-src 'self' https://*.supabase.co;">
```

### 9.3 Regular Security Updates

```bash
# Check for vulnerabilities
npm audit

# Fix automatically
npm audit fix

# Update dependencies
npm update
```

## Step 10: Testing in Production

### 10.1 Smoke Tests

- [ ] Can register new user
- [ ] Can upload prescription
- [ ] OCR extracts medication correctly
- [ ] Can log dose
- [ ] Push notifications work
- [ ] Offline mode works
- [ ] Service worker updates
- [ ] PWA installs correctly

### 10.2 Load Testing (Optional)

Use Artillery:
```bash
npm install -g artillery
artillery quick --count 10 --num 100 https://your-app.vercel.app
```

### 10.3 Cross-Browser Testing

Test on:
- Chrome (Android & Desktop)
- Safari (iOS & Mac)
- Firefox (Desktop)
- Edge (Desktop)
- Samsung Internet (Android)

## Rollback Procedure

If deployment fails:

### Vercel
```bash
vercel rollback
```

### Netlify
1. Go to Deploys
2. Click on previous successful deploy
3. Click "Publish deploy"

### Cloudflare Pages
1. Go to Deployments
2. Click "..." on previous deployment
3. Click "Retry deployment"

## Troubleshooting

### Issue: PWA not installing

**Solution:**
1. Check manifest.json is accessible: `https://your-app.com/manifest.json`
2. Verify HTTPS is enabled
3. Check service worker registers: DevTools > Application > Service Workers
4. Clear browser cache and retry

### Issue: Push notifications not working

**Solution:**
1. Verify VAPID keys are set correctly
2. Check subscription is saved to database
3. Test with web-push CLI:
   ```bash
   npx web-push send-notification \
     --endpoint="https://..." \
     --key="..." \
     --auth="..." \
     --payload="Test"
   ```

### Issue: Images not loading

**Solution:**
1. Check CORS settings in Supabase Storage
2. Verify signed URLs are generated correctly
3. Check Storage bucket policies
4. Ensure RLS allows access

### Issue: Edge Functions timing out

**Solution:**
1. Increase function timeout in Supabase
2. Optimize Gemini API calls
3. Add retry logic
4. Check function logs for errors

## Cost Estimation

### Free Tier (Supabase + Vercel)
- Users: Up to 50,000 MAU
- Database: 500MB
- Storage: 1GB
- Edge Functions: 500K invocations
- Bandwidth: 5GB
- **Cost: $0/month**

### Paid Tier (Growing)
- Supabase Pro: $25/month
- Vercel Pro: $20/month
- Gemini API: Pay-as-you-go (~$0.002/image)
- Twilio: Pay-as-you-go (~$0.0075/SMS)
- **Estimated: $50-100/month for 1000 active users**

## Maintenance Schedule

### Daily
- Monitor error logs
- Check uptime status
- Review user feedback

### Weekly
- Review analytics
- Check adherence metrics
- Update content if needed

### Monthly
- Update dependencies
- Review security advisories
- Optimize database queries
- Analyze costs

### Quarterly
- Security audit
- Performance review
- User research
- Feature planning

---

## Support

For issues during deployment:
1. Check [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md)
2. Review [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)
3. Check Supabase docs: https://supabase.com/docs
4. Open GitHub issue

**Deployment Date**: _______________
**Deployed By**: _______________
**Production URL**: _______________
