# Aarogya Setu - Quick Reference Card

## 🚀 5-Minute Setup

```bash
# Clone & Install
npm install

# Configure
echo "VITE_SUPABASE_URL=https://xxx.supabase.co" > .env.local
echo "VITE_SUPABASE_ANON_KEY=xxx" >> .env.local

# Run
npm run dev
```

## 📁 Project Structure

```
/
├── App.tsx                  # Main app router
├── components/
│   ├── OnboardingFlow.tsx   # User registration
│   ├── Dashboard.tsx        # Patient home
│   ├── UploadPrescription.tsx
│   ├── VerificationFlow.tsx
│   ├── EditMedication.tsx
│   ├── CaregiverDashboard.tsx
│   ├── ProviderDashboard.tsx
│   └── Settings.tsx
├── hooks/
│   ├── useAuth.ts           # Authentication
│   ├── useNotifications.ts  # Web Push
│   ├── useOfflineSync.ts    # IndexedDB
│   ├── useSpeech.ts         # TTS/STT
│   └── useServiceWorker.ts  # PWA
├── public/
│   ├── manifest.json        # PWA manifest
│   └── sw.js               # Service worker
└── styles/
    └── globals.css         # Tailwind config
```

## 🔑 Key Files to Edit

### Connect to Supabase

**`/lib/supabase.ts`** (create this)
```typescript
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)
```

**`/hooks/useAuth.ts`** (update line 11+)
```typescript
// Replace localStorage with Supabase Auth
const { data: { session } } = await supabase.auth.getSession()
```

### Add Gemini API Integration

**`/components/UploadPrescription.tsx`** (line 50+)
```typescript
const { data } = await supabase.functions.invoke('parse-prescription', {
  body: { imageUrl: fileName }
})
```

### Enable Push Notifications

**`/hooks/useNotifications.ts`** (line 42)
```typescript
const vapidPublicKey = 'YOUR_ACTUAL_VAPID_PUBLIC_KEY'
```

## 🗄️ Database Quick Reference

### Main Tables
```sql
profiles              -- Users (id, role, name, phone)
medications           -- Meds (id, user_id, name, dosage, timing)
dose_events           -- Logs (id, medication_id, taken_at, status)
caregivers            -- Links (patient_id, caregiver_id)
web_push_subscriptions -- Push (user_id, endpoint, keys)
```

### Key Queries

**Get User Medications:**
```sql
SELECT * FROM medications 
WHERE user_id = '...' AND active = true
```

**Log Dose Event:**
```sql
INSERT INTO dose_events (medication_id, scheduled_time, taken_at, status)
VALUES ('...', '2024-01-15 08:00', NOW(), 'taken')
```

**Get Adherence Rate:**
```sql
SELECT 
  COUNT(*) FILTER (WHERE status = 'taken') * 100.0 / COUNT(*) as adherence
FROM dose_events
WHERE medication_id IN (
  SELECT id FROM medications WHERE user_id = '...'
)
```

## 🎯 Common Tasks

### Add New Screen

1. Create component in `/components/NewScreen.tsx`
2. Import in `App.tsx`
3. Add to `renderScreen()` switch
4. Add state for navigation

### Add New Hook

1. Create `/hooks/useFeature.ts`
2. Define state and functions
3. Add cleanup in `useEffect`
4. Export hook

### Modify Database Schema

1. Write SQL in Supabase Dashboard
2. Update TypeScript types
3. Adjust RLS policies if needed
4. Run migration

### Deploy Edge Function

```bash
cd supabase/functions
supabase functions deploy function-name
```

## 🔧 Environment Variables

### Frontend (.env.local)
```env
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

### Backend (Supabase Secrets)
```bash
supabase secrets set GEMINI_API_KEY=xxx
supabase secrets set VAPID_PUBLIC_KEY=xxx
supabase secrets set VAPID_PRIVATE_KEY=xxx
supabase secrets set TWILIO_ACCOUNT_SID=xxx
supabase secrets set TWILIO_AUTH_TOKEN=xxx
```

## 📱 Testing PWA

### Install on Android
1. Open Chrome
2. Visit app URL
3. Tap menu → "Install app"

### Install on iOS
1. Open Safari
2. Tap Share
3. "Add to Home Screen"

### Test Offline
1. Open DevTools
2. Network tab → "Offline"
3. Refresh page (should load)

### Test Push
```javascript
// In browser console
Notification.requestPermission().then(permission => {
  if (permission === 'granted') {
    new Notification('Test', { body: 'It works!' })
  }
})
```

## 🐛 Debugging Tips

### Service Worker Not Updating
```javascript
// DevTools > Application > Service Workers
// Click "Unregister" then refresh
```

### IndexedDB Inspect
```javascript
// DevTools > Application > IndexedDB > aarogya-db
// Expand to see all stores
```

### Check Supabase Connection
```javascript
const { data, error } = await supabase.from('profiles').select('*')
console.log({ data, error })
```

### View Push Subscriptions
```javascript
navigator.serviceWorker.ready.then(reg => {
  reg.pushManager.getSubscription().then(sub => {
    console.log('Subscription:', sub)
  })
})
```

## 🎨 Styling Guide

### Colors (Tailwind)
- Primary: `emerald-600` (#059669)
- Secondary: `teal-600`
- Background: `emerald-50` to `teal-50` gradient
- Text: `emerald-900`
- Error: `red-600`
- Warning: `amber-500`

### Common Classes
```tsx
// Large button
className="h-16 px-8 text-2xl bg-emerald-600"

// Card
className="bg-white rounded-2xl p-6 shadow-md"

// Input
className="h-14 text-lg"

// Icon button
className="h-14 w-14 rounded-full"
```

### Responsive
```tsx
// Mobile-first
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
```

## 📊 Analytics Events to Track

```typescript
// Track these in production
trackEvent('prescription_uploaded', { userId, success: true })
trackEvent('dose_logged', { userId, medicationId, verified: true })
trackEvent('pill_verified', { userId, match: true, confidence: 0.95 })
trackEvent('notification_clicked', { userId, medicationId })
trackEvent('offline_event_synced', { userId, eventCount: 3 })
```

## 🔐 Security Checklist

- [ ] Environment variables not committed
- [ ] Supabase anon key is safe (public-facing)
- [ ] Service role key never in frontend
- [ ] RLS policies tested
- [ ] Image URLs are signed (short-lived)
- [ ] HTTPS enabled in production
- [ ] CSP header configured
- [ ] Input validation on forms

## 📝 Common Errors & Fixes

### "Supabase client not initialized"
**Fix:** Create `/lib/supabase.ts` and import client

### "Permission denied for table"
**Fix:** Check RLS policies in Supabase

### "Push subscription failed"
**Fix:** Verify VAPID keys are set correctly

### "Service worker not found"
**Fix:** Ensure `/public/sw.js` exists and is served

### "IndexedDB operation failed"
**Fix:** Check browser supports IndexedDB, clear storage

## 🚢 Deployment Checklist

- [ ] Build passes: `npm run build`
- [ ] Environment variables set
- [ ] Supabase RLS tested
- [ ] Edge Functions deployed
- [ ] VAPID keys configured
- [ ] CORS allowed for domain
- [ ] PWA manifest accessible
- [ ] Service worker registers
- [ ] HTTPS enabled
- [ ] Lighthouse score > 90

## 📞 Getting Help

1. **Documentation**: Start with README.md
2. **Setup Issues**: Check IMPLEMENTATION_GUIDE.md
3. **Deployment**: See DEPLOYMENT.md
4. **Architecture**: Review ARCHITECTURE.md
5. **Supabase**: Check SUPABASE_SETUP.md

## 💡 Quick Tips

- Use `npm run dev` for hot reload
- Press Ctrl+Shift+I for DevTools
- Use Application tab for PWA debugging
- Network tab for API calls
- Console tab for errors
- Use Lighthouse for performance

## 🎯 Performance Targets

- First Contentful Paint: < 1.5s
- Time to Interactive: < 3.5s
- Lighthouse Performance: > 90
- Bundle size: < 500KB (gzipped)
- IndexedDB ops: < 100ms
- Service worker install: < 2s

## 📱 Device Testing Priority

1. **High**: Android Chrome (most users)
2. **High**: iPhone Safari
3. **Medium**: Desktop Chrome
4. **Medium**: Samsung Internet
5. **Low**: Desktop Safari/Firefox

---

**Keep this card handy while developing!**

For detailed information, see the comprehensive documentation files.
