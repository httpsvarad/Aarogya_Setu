# 📞 Twilio Call Testing Guide

## Why You Didn't Get a Call

The Twilio call system is **fully configured and ready**, but calls are **NOT automatic** by default. Here's why:

### The Missing Piece: Scheduler

The system has:
- ✅ Reminder database with scheduled times
- ✅ Twilio Edge Function that can make calls
- ✅ Hindi voice script with DTMF detection
- ✅ Frontend UI to manage reminders

What's missing:
- ❌ **Automated scheduler** that checks reminders and triggers calls

## How to Test Calls Right Now

### Option 1: Use the Test Call Button (Easiest)

1. Go to **रिमाइंडर प्रबंधन** (Reminders Page)
2. Click the **floating blue phone button** (bottom right)
3. Enter your phone number with country code (e.g., `+919876543210`)
4. Click **टेस्ट कॉल करें**
5. Your phone should ring within seconds!

### Option 2: Manual API Call

Open browser console and run:

```javascript
const testCall = async () => {
  const { data: { session } } = await (await fetch('/api/auth/session')).json();
  
  const response = await fetch('YOUR_SUPABASE_URL/functions/v1/make-server-b3c2a063/twilio/make-call', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      phoneNumber: '+919876543210',  // Your phone number
      medicationName: 'Paracetamol',
      reminderId: 'test-123'
    })
  });
  
  const data = await response.json();
  console.log('Call initiated:', data);
};

testCall();
```

## Setting Up Automatic Calls

To make calls happen automatically at reminder times, you need a **scheduler**. Here are your options:

### Option A: Supabase Cron (Coming Soon)

Supabase is adding native cron support. When available:

```sql
-- Create a scheduled function that runs every minute
SELECT cron.schedule(
  'check-reminders',
  '* * * * *', -- Every minute
  $$
  SELECT check_and_call_reminders();
  $$
);
```

### Option B: External Cron Service (Available Now)

Use a service like [cron-job.org](https://cron-job.org) or [EasyCron](https://www.easycron.com/):

1. Create a Supabase Edge Function:

```typescript
// supabase/functions/check-reminders/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // Get current time and day
  const now = new Date();
  const currentTime = now.toTimeString().slice(0, 5); // "HH:MM"
  const currentDay = now.getDay();

  // Find due reminders
  const { data: reminders } = await supabase
    .from('reminders')
    .select('*, user:profiles(phone)')
    .eq('enabled', true)
    .eq('scheduled_time', currentTime)
    .contains('days_of_week', [currentDay]);

  // Call each user
  const results = [];
  for (const reminder of reminders || []) {
    if (reminder.call_enabled && reminder.user?.phone) {
      // Call Twilio make-call endpoint
      const callResult = await makeCall(
        reminder.user.phone,
        reminder.medication_name,
        reminder.id
      );
      results.push(callResult);
    }
  }

  return new Response(
    JSON.stringify({ checked: reminders?.length, called: results.length }),
    { headers: { 'Content-Type': 'application/json' } }
  );
});
```

2. Deploy the function:
```bash
supabase functions deploy check-reminders
```

3. Set up cron job at [cron-job.org](https://cron-job.org):
   - URL: `https://YOUR_PROJECT.supabase.co/functions/v1/check-reminders`
   - Schedule: Every minute
   - Method: POST
   - Headers: Add `Authorization: Bearer YOUR_ANON_KEY`

### Option C: Vercel Cron (If hosting on Vercel)

Create `/api/cron/check-reminders.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';

export const config = {
  // Run every minute
  schedule: '* * * * *'
};

export default async function handler(req: any, res: any) {
  // Similar logic as Option B
  // Check reminders and trigger calls
  
  res.status(200).json({ success: true });
}
```

Add to `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/check-reminders",
    "schedule": "* * * * *"
  }]
}
```

## Troubleshooting

### "Twilio credentials not configured"
- Add credentials in Supabase Dashboard > Edge Functions > Secrets
- Required: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`

### Call doesn't ring
- Check phone number format (must include country code: `+919876543210`)
- Verify Twilio account has funds
- Check Twilio Console > Calls for error logs

### DTMF not working
- Ensure phone is not on silent/vibrate
- Try pressing keys firmly and slowly
- Check Twilio logs for "Digits" parameter

## What Happens During a Call

1. **Twilio calls your number**
2. **Hindi voice greeting**: "नमस्ते। यह आपकी दवाई का रिमाइंडर है।"
3. **Medicine name**: "आपको [दवाई] लेने का समय हो गया है।"
4. **Prompt for input**:
   - Press `1` → Medication taken ✅
   - Press `9` → Snooze for 15 minutes ⏰
5. **Confirmation message**
6. **Call ends**

## Summary

- ✅ Twilio integration is working
- ✅ Test button available in UI
- ❌ Automatic scheduler needs to be set up
- 📚 Follow Option B or C above to enable automatic calls

## Quick Test Right Now

1. Open app
2. Go to Reminders page
3. Click blue phone button (bottom right)
4. Enter your phone number
5. Click test call
6. Answer and test DTMF (press 1 or 9)

That's it! Your Twilio system is ready, just needs the scheduler. 🎉
