# Aarogya Setu - Complete Implementation Guide

This guide walks you through integrating Supabase backend with the frontend application.

## Table of Contents
1. [Quick Start](#quick-start)
2. [Supabase Integration](#supabase-integration)
3. [Edge Functions](#edge-functions)
4. [Web Push Notifications](#web-push-notifications)
5. [Offline Sync](#offline-sync)
6. [Testing](#testing)
7. [Deployment](#deployment)

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Supabase

Follow [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) to:
- Create database tables
- Set up RLS policies
- Create storage buckets
- Deploy Edge Functions

### 3. Configure Environment

Create `.env.local`:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Run Development Server
```bash
npm run dev
```

## Supabase Integration

### Creating Supabase Client

Replace the mock implementations in hooks with real Supabase calls:

**File: `/lib/supabase.ts`**
```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          role: 'patient' | 'caregiver' | 'provider'
          name: string
          phone: string | null
          preferred_language: string
          emergency_contact: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
      // ... other tables
    }
  }
}
```

### Update useAuth Hook

**File: `/hooks/useAuth.ts`**
```typescript
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '../App';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadUserProfile(session.user.id);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          await loadUserProfile(session.user.id);
        } else {
          setUser(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const loadUserProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (data && !error) {
      setUser({
        id: data.id,
        role: data.role,
        name: data.name,
        phone: data.phone || '',
        preferredLanguage: data.preferred_language
      });
    }
  };

  const signUp = async (name: string, phone: string, role: string, emergencyContact?: string) => {
    // 1. Sign up with phone OTP
    const { data: authData, error: authError } = await supabase.auth.signUp({
      phone,
      password: Math.random().toString(36) // Temporary, use OTP instead
    });

    if (authError) throw authError;

    // 2. Create profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user!.id,
        name,
        phone,
        role: role as any,
        emergency_contact: emergencyContact,
        preferred_language: 'hi'
      });

    if (profileError) throw profileError;

    await loadUserProfile(authData.user!.id);
  };

  const signIn = async (phone: string, otp: string) => {
    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token: otp,
      type: 'sms'
    });

    if (error) throw error;
    if (data.user) {
      await loadUserProfile(data.user.id);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return { user, loading, signIn, signUp, signOut };
}
```

### Update Prescription Upload

**File: `/components/UploadPrescription.tsx`** (replace processImage function):
```typescript
const processImage = async (file: File) => {
  setStep('processing');
  setProcessing(true);

  try {
    // 1. Upload to Supabase Storage
    const fileName = `${user.id}/${Date.now()}.jpg`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('prescriptions')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    // 2. Call Edge Function to parse with Gemini
    const { data, error } = await supabase.functions.invoke('parse-prescription', {
      body: { imageUrl: fileName }
    });

    if (error) throw error;

    // 3. Set extracted data
    setExtractedData(data.medications.map((med: any) => ({
      ...med,
      id: Date.now().toString() + Math.random(),
      imageUrl: fileName
    })));

    setStep('confirm');
    speak('दवाइयां मिल गईं। कृपया जांच लें।');
  } catch (error) {
    console.error('Error processing image:', error);
    speak('फोटो प्रोसेस करने में समस्या हुई। कृपया फिर से कोशिश करें।');
    setStep('capture');
  } finally {
    setProcessing(false);
  }
};
```

### Update Offline Sync

**File: `/hooks/useOfflineSync.ts`** (add sync function):
```typescript
const syncPendingEvents = async () => {
  if (!db || !navigator.onLine) return;

  setSyncStatus('syncing');

  try {
    const tx = db.transaction('doseEvents', 'readonly');
    const index = tx.store.index('by-synced');
    const pending = await index.getAll(false);

    for (const event of pending) {
      // Upload to Supabase
      const { error } = await supabase
        .from('dose_events')
        .insert({
          medication_id: event.medicationId,
          scheduled_time: event.scheduledTime,
          taken_at: event.takenAt,
          status: event.status,
          verification_image_url: event.verificationImageUrl,
          notes: event.notes
        });

      if (!error) {
        // Mark as synced locally
        const writeTx = db.transaction('doseEvents', 'readwrite');
        await writeTx.store.put({ ...event, synced: true });
        await writeTx.done;
      }
    }

    await checkPendingEvents(db);
    setSyncStatus('idle');
  } catch (error) {
    console.error('Sync error:', error);
    setSyncStatus('error');
  }
};
```

## Edge Functions

### Deploying Edge Functions

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link project
supabase link --project-ref your-project-ref

# Deploy all functions
supabase functions deploy parse-prescription
supabase functions deploy verify-pill
supabase functions deploy agent-recommendation
supabase functions deploy send-push
```

### Setting Environment Variables

```bash
supabase secrets set GEMINI_API_KEY=your_key_here
supabase secrets set TWILIO_ACCOUNT_SID=your_sid
supabase secrets set TWILIO_AUTH_TOKEN=your_token
supabase secrets set VAPID_PUBLIC_KEY=your_vapid_public
supabase secrets set VAPID_PRIVATE_KEY=your_vapid_private
```

### Testing Edge Functions Locally

```bash
# Start local Supabase
supabase start

# Serve functions locally
supabase functions serve

# Test with curl
curl -i --location --request POST 'http://localhost:54321/functions/v1/parse-prescription' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"imageUrl":"test/prescription.jpg"}'
```

## Web Push Notifications

### 1. Generate VAPID Keys

```bash
npx web-push generate-vapid-keys
```

### 2. Create Send Push Edge Function

**File: `supabase/functions/send-push/index.ts`**
```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY')!
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')!

serve(async (req) => {
  try {
    const { userId, title, body, data } = await req.json()
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Get user's push subscriptions
    const { data: subscriptions } = await supabase
      .from('web_push_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('active', true)

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(JSON.stringify({ sent: 0 }))
    }

    // Send push to all subscriptions
    const results = await Promise.all(
      subscriptions.map(async (sub) => {
        try {
          const payload = JSON.stringify({ title, body, data })
          
          // Use web-push library (you'll need to import it)
          // For now, this is a placeholder
          // In production, use: await webpush.sendNotification(subscription, payload, options)
          
          return { success: true, endpoint: sub.endpoint }
        } catch (error) {
          // If subscription is invalid, mark as inactive
          if (error.statusCode === 410) {
            await supabase
              .from('web_push_subscriptions')
              .update({ active: false })
              .eq('id', sub.id)
          }
          return { success: false, endpoint: sub.endpoint, error: error.message }
        }
      })
    )

    return new Response(
      JSON.stringify({ 
        sent: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        results 
      })
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500 }
    )
  }
})
```

### 3. Schedule Reminders with Cron

**File: `supabase/functions/_cron/check-reminders/index.ts`**
```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // Get reminders for next 15 minutes
  const now = new Date()
  const future = new Date(now.getTime() + 15 * 60 * 1000)

  const { data: reminders } = await supabase
    .from('dose_schedules')
    .select(`
      *,
      medication:medications(name, user_id)
    `)
    .gte('scheduled_time', now.toISOString())
    .lte('scheduled_time', future.toISOString())
    .eq('notified', false)

  // Send push notifications
  for (const reminder of reminders || []) {
    await supabase.functions.invoke('send-push', {
      body: {
        userId: reminder.medication.user_id,
        title: 'दवाई का समय',
        body: reminder.reminder_message,
        data: {
          medicationId: reminder.medication_id,
          scheduleId: reminder.id
        }
      }
    })

    // Mark as notified
    await supabase
      .from('dose_schedules')
      .update({ notified: true })
      .eq('id', reminder.id)
  }

  return new Response(
    JSON.stringify({ processed: reminders?.length || 0 })
  )
})
```

Set up cron job in Supabase Dashboard to run every 5 minutes.

## Offline Sync

The app uses a sophisticated offline-first architecture:

### Architecture
1. **Write** → IndexedDB immediately (instant feedback)
2. **Background Sync** → Attempt to sync with Supabase
3. **Service Worker** → Retry failed syncs when online
4. **Conflict Resolution** → Server timestamp wins

### Sync Flow

```
User Action
    ↓
IndexedDB (local)
    ↓
[Online?] ─No─→ Queue for sync
    ↓ Yes
Supabase (cloud)
    ↓
Mark as synced
```

### Handling Conflicts

If a dose event is modified on the server while offline:
1. Server version takes precedence
2. Local version is backed up to conflict table
3. User is notified of discrepancy

## Testing

### Manual Test Checklist

#### PWA Installation
- [ ] Install prompt appears
- [ ] App installs successfully
- [ ] Icon appears on home screen
- [ ] Opens in standalone mode
- [ ] No address bar visible

#### Offline Functionality
- [ ] App loads while offline
- [ ] Can log doses offline
- [ ] Events sync when back online
- [ ] Offline indicator shows
- [ ] Cached data displays correctly

#### Push Notifications
- [ ] Permission prompt appears
- [ ] Notifications deliver on time
- [ ] Works when browser is closed
- [ ] Clicking opens app
- [ ] Sound/vibration works

#### Camera & AI
- [ ] Camera permission requested
- [ ] Can capture prescription
- [ ] OCR extracts correctly
- [ ] Pill verification works
- [ ] Confidence scores accurate

#### Voice
- [ ] TTS speaks in Hindi
- [ ] STT recognizes Hindi
- [ ] Voice clear on low-end devices
- [ ] Handles background noise

### Automated Testing

Create test files in `/tests`:

```typescript
// tests/offline-sync.test.ts
import { describe, it, expect } from 'vitest'
import { useOfflineSync } from '../hooks/useOfflineSync'

describe('Offline Sync', () => {
  it('should save events to IndexedDB', async () => {
    // Test implementation
  })

  it('should sync when coming online', async () => {
    // Test implementation
  })
})
```

## Deployment

### Option 1: Vercel

1. **Install Vercel CLI**
```bash
npm i -g vercel
```

2. **Deploy**
```bash
vercel
```

3. **Set Environment Variables** in Vercel Dashboard
```
VITE_SUPABASE_URL=your_url
VITE_SUPABASE_ANON_KEY=your_key
```

### Option 2: Netlify

1. **Create `netlify.toml`**
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

[[headers]]
  for = "/manifest.json"
  [headers.values]
    Content-Type = "application/manifest+json"
```

2. **Deploy**
```bash
netlify deploy --prod
```

### Option 3: Cloudflare Pages

```bash
npx wrangler pages publish dist
```

### Post-Deployment Checklist

- [ ] HTTPS enabled
- [ ] Custom domain configured
- [ ] PWA manifest accessible
- [ ] Service worker registers
- [ ] Push notifications work
- [ ] Supabase connection works
- [ ] Edge Functions callable
- [ ] Storage accessible (with CORS)
- [ ] Performance optimized
- [ ] Lighthouse score > 90

## Performance Optimization

### 1. Image Optimization
- Use WebP format
- Compress prescriptions before upload
- Generate thumbnails server-side

### 2. Code Splitting
Already configured in `vite.config.ts`:
- React vendor bundle
- UI vendor bundle
- Radix vendor bundle

### 3. Caching Strategy
- App shell: Cache-first
- Images: Cache-first (30 days)
- API calls: Network-first
- Fonts: Cache-first (1 year)

### 4. Database Optimization
- Create indexes (see SUPABASE_SETUP.md)
- Use pagination for large lists
- Implement virtual scrolling
- Cache frequently accessed data

## Monitoring & Analytics

### Add Error Tracking (Optional)

```typescript
// lib/monitoring.ts
export function logError(error: Error, context?: any) {
  // Send to your error tracking service
  // e.g., Sentry, LogRocket, etc.
  console.error('Error:', error, context)
}
```

### Track Key Metrics
- Dose adherence rate
- App engagement time
- Notification click-through rate
- Pill verification accuracy
- Offline event queue size

## Security Hardening

### 1. Content Security Policy

Add to `index.html`:
```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' 'unsafe-inline'; 
               style-src 'self' 'unsafe-inline'; 
               img-src 'self' data: https:; 
               connect-src 'self' https://*.supabase.co;">
```

### 2. Rate Limiting

Implement in Edge Functions:
```typescript
// Check rate limit
const { count } = await supabase
  .from('api_requests')
  .select('*', { count: 'exact' })
  .eq('user_id', userId)
  .gte('created_at', new Date(Date.now() - 60000).toISOString())

if (count > 60) {
  return new Response('Rate limit exceeded', { status: 429 })
}
```

### 3. Input Validation

Always validate user input:
```typescript
import { z } from 'zod'

const medicationSchema = z.object({
  name: z.string().min(1).max(100),
  strength: z.string().min(1).max(50),
  dosage: z.string().min(1).max(50),
  // ... other fields
})

const validated = medicationSchema.parse(userInput)
```

## Troubleshooting

### Service Worker Not Updating
```javascript
// Force update
navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(reg => reg.update())
})
```

### Push Notifications Not Working
1. Check VAPID keys are correct
2. Verify subscription is saved to database
3. Test with web-push npm package
4. Check browser console for errors

### Offline Sync Failing
1. Check IndexedDB is accessible
2. Verify online event listener is working
3. Test Background Sync API support
4. Check Supabase RLS policies

---

**Need Help?** Open an issue on GitHub or check the documentation.
