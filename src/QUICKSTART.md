# 🚀 Aarogya Setu - Quick Start Guide

Get your medication adherence system up and running in **5 minutes**!

---

## ⚡ Super Quick Setup (TL;DR)

```bash
# 1. Setup Database (2 minutes)
Open Supabase → SQL Editor → Paste /supabase-schema.sql → Run

# 2. Test Connection (1 minute)
Login to app → Click "Add Test Medication" → Check Supabase Table Editor

# 3. Upload Prescription (2 minutes)
Dashboard → Upload Prescription → Confirm medications → Done!
```

---

## 📋 Detailed Step-by-Step

### Step 1: Database Setup (Required)

1. **Open your Supabase project**
   - Go to https://supabase.com/dashboard
   - Select your project
   
2. **Create tables**
   - Click **SQL Editor** in left sidebar
   - Click **"+ New Query"**
   - Open `/supabase-schema.sql` in your code editor
   - Copy ALL contents
   - Paste into Supabase SQL Editor
   - Click **"Run"** (or press Ctrl+Enter)

3. **Verify tables created**
   - Go to **Table Editor**
   - You should see 6 tables:
     - ✅ medications
     - ✅ reminders
     - ✅ dose_history
     - ✅ call_logs
     - ✅ prescriptions
     - ✅ caregiver_relationships

**✅ Database setup complete!**

---

### Step 2: Test the App

1. **Sign up / Login**
   - Open the app
   - Create a new account or login
   - You should be redirected to Dashboard

2. **Add test medications**
   - Click **"रिमाइंडर प्रबंधन"** (Reminder Management)
   - Click **"टेस्ट दवाई जोड़ें"** (Add Test Medication)
   - Wait for medications to be added
   - Click **"🔄 रीफ्रेश करें"** (Refresh)
   
3. **Verify in database**
   - Go to Supabase Dashboard
   - Open **Table Editor** → **medications**
   - You should see 3 test medications!

**✅ Connection verified!**

---

### Step 3: Upload Your First Prescription

1. **From Dashboard**
   - Click **"प्रिस्क्रिप्शन अपलोड करें"** (Upload Prescription)
   - Choose camera or gallery

2. **Capture prescription**
   - Take a clear photo
   - Make sure text is readable
   - Wait for AI processing

3. **Review extracted data**
   - Check medication names
   - Verify dosages
   - Edit if needed (coming soon)
   - Click **"✓ सब सही है, सहेजें"**

4. **Verify in database**
   - Go to Supabase → medications table
   - Your prescriptions should appear!

**✅ First prescription uploaded!**

---

### Step 4: Create Your First Reminder

1. **Navigate to Reminders**
   - From Dashboard, click **"रिमाइंडर प्रबंधन"**

2. **Create reminder**
   - Click **"+ नया रिमाइंडर"**
   - Select medication from dropdown
   - Set time (e.g., 09:00 AM)
   - Select days of week
   - Enable notification methods:
     - ✅ Phone Call (recommended)
     - ☐ SMS
     - ✅ Push Notification
   - Click **"बनाएं"**

3. **Verify in database**
   - Supabase → reminders table
   - Your reminder should be there!

**✅ First reminder created!**

---

## 🔍 Quick Verification Checklist

### Database Check
```bash
✅ 6 tables created in Supabase
✅ RLS policies enabled (check Table Editor → Policies tab)
✅ Indexes created (check Database → Indexes)
✅ Triggers working (check Database → Triggers)
```

### App Check
```bash
✅ Can login/signup
✅ Can see Dashboard
✅ Can upload prescription
✅ Can add medications
✅ Can create reminders
✅ Medications show in dropdown
```

### Console Check (F12)
```bash
✅ No errors in console
✅ See "[useMedications] Loading medications from Supabase..."
✅ See "[useMedications] Loaded medications: X"
✅ See "[useReminders] Loading reminders from Supabase..."
```

---

## 🎯 What's Working Now

| Feature | Status | Notes |
|---------|--------|-------|
| User Authentication | ✅ Working | Sign up, login, logout |
| Prescription Upload | ✅ Working | Camera + gallery support |
| Gemini OCR | 🔧 Needs API key | Mock data for now |
| Medication Storage | ✅ Working | Supabase database |
| Reminder Creation | ✅ Working | Full CRUD operations |
| Reminder Scheduling | ✅ Working | Time + days of week |
| Dose History | ✅ Working | Track adherence |
| Call Logs | ✅ Working | Track Twilio calls |
| Caregiver Dashboard | ✅ Working | View patient data |

---

## 🔧 What Needs Configuration

### 1. Gemini API (for prescription OCR)
```typescript
// File: Supabase Edge Function
const GEMINI_API_KEY = 'YOUR_API_KEY_HERE';
```
📖 See: `GEMINI_SETUP.md` (to be created)

### 2. Twilio (for phone calls)
```typescript
// File: Supabase Edge Function
const TWILIO_ACCOUNT_SID = 'YOUR_SID_HERE';
const TWILIO_AUTH_TOKEN = 'YOUR_TOKEN_HERE';
const TWILIO_PHONE_NUMBER = 'YOUR_NUMBER_HERE';
```
📖 See: `TWILIO_SETUP.md` (to be created)

### 3. Web Push Notifications
```typescript
// File: service worker
const VAPID_PUBLIC_KEY = 'YOUR_KEY_HERE';
```
📖 See: `PUSH_NOTIFICATIONS_SETUP.md` (to be created)

---

## 🐛 Common Issues & Solutions

### Issue: "No medications showing in dropdown"

**Check:**
```bash
1. Browser console - any errors?
2. Supabase Table Editor - any medications?
3. Is user logged in? (check auth state)
4. Click the refresh button
```

**Solution:**
```bash
1. Add test medications using the button
2. Check Supabase logs for errors
3. Verify RLS policies are enabled
4. Check user_id matches in database
```

---

### Issue: "Cannot create reminder"

**Check:**
```bash
1. Do you have medications in database?
2. Is medication dropdown populated?
3. Is medication_id selected?
```

**Solution:**
```bash
1. Upload prescription first
2. Add test medications
3. Select medication from dropdown
4. Check validation errors in console
```

---

### Issue: "Prescription upload stuck on processing"

**Check:**
```bash
1. Network tab - API call failing?
2. Gemini API key configured?
3. Edge Function deployed?
```

**Solution:**
```bash
1. Configure Gemini API key in Edge Function
2. Deploy Edge Function to Supabase
3. Check Supabase logs for errors
4. For now, use test medications instead
```

---

## 📱 Test the Full Flow

### Scenario: New User Journey

1. **Sign Up**
   ```
   ✅ Enter email + password
   ✅ Receive confirmation (if email verification enabled)
   ✅ Redirected to Dashboard
   ```

2. **Upload First Prescription**
   ```
   ✅ Click "Upload Prescription"
   ✅ Take photo
   ✅ AI extracts medications
   ✅ Confirm and save
   ✅ See medications in Dashboard
   ```

3. **Create First Reminder**
   ```
   ✅ Go to Reminder Management
   ✅ Click "New Reminder"
   ✅ Select medication
   ✅ Set time (e.g., 9:00 AM)
   ✅ Enable phone call
   ✅ Save reminder
   ```

4. **Wait for Reminder**
   ```
   ✅ At 9:00 AM, receive phone call
   ✅ Hear medication name in Hindi
   ✅ Press 1 to confirm taken
   ✅ Dose recorded in history
   ```

---

## 🎨 UI Overview

### Dashboard (Home Screen)
```
- Welcome message
- Today's medication summary
- Upcoming doses
- Quick actions:
  - Upload Prescription
  - Manage Reminders
  - View History
  - Settings
```

### Reminder Management
```
- Active reminders list
- Stats cards (taken, missed, pending)
- Tabs:
  - Reminders (create/edit/delete)
  - History (dose adherence)
  - Call Logs (Twilio calls)
```

### Upload Prescription
```
- Camera capture
- Gallery upload
- AI processing
- Review extracted data
- Confirm and save
```

---

## 📊 Database Overview

### Core Tables

```
medications
├── id (UUID)
├── user_id (UUID)
├── name (TEXT) ← Medication name
├── strength (TEXT)
├── dosage (TEXT)
└── ... 10 more fields

reminders
├── id (UUID)
├── medication_id (UUID) → medications.id
├── scheduled_time (TIME)
├── days_of_week (INTEGER[])
└── ... notification settings

dose_history
├── id (UUID)
├── reminder_id (UUID) → reminders.id
├── status (TEXT) ← 'taken' | 'missed'
└── ... verification fields

call_logs
├── id (UUID)
├── reminder_id (UUID)
├── dtmf_response (TEXT) ← '1' or '9'
└── ... Twilio metadata
```

---

## 🔐 Security

### Row Level Security (RLS)
```sql
-- Example policy
CREATE POLICY "Users can view their own medications"
  ON medications FOR SELECT
  USING (auth.uid() = user_id);
```

**What this means:**
- ✅ You can only see YOUR medications
- ❌ You CANNOT see other users' medications
- ✅ Database enforces this automatically

---

## 🚀 Next Steps

After basic setup:

1. **Configure APIs**
   - Set up Gemini API for OCR
   - Set up Twilio for phone calls
   - Set up web push notifications

2. **Test Features**
   - Upload real prescriptions
   - Create multiple reminders
   - Test phone call flow
   - Verify adherence tracking

3. **Add Caregivers**
   - Invite family members
   - Share medication info
   - Receive alerts

4. **Customize**
   - Adjust reminder times
   - Change notification methods
   - Set medication preferences

---

## 💡 Pro Tips

1. **Use test medications** to understand the flow before uploading real prescriptions

2. **Check browser console** (F12) for detailed logs - very helpful for debugging

3. **Supabase Table Editor** is your friend - verify all data there

4. **Start with one medication** and one reminder to test the complete flow

5. **Enable phone calls** for best adherence (elderly-friendly!)

---

## 📞 Support

### Where to Get Help

1. **Browser Console** - Check for error messages
2. **Supabase Logs** - Check API and database logs
3. **Setup Guides** - Read SETUP_DATABASE.md and MIGRATION_NOTICE.md
4. **Code Comments** - Read inline comments in /hooks/*.ts files

### Debugging Checklist

```bash
□ User logged in? (check auth state)
□ Database tables created? (Supabase Table Editor)
□ RLS policies enabled? (Table Editor → Policies)
□ Medications exist? (medications table)
□ Console errors? (F12 → Console tab)
□ Network errors? (F12 → Network tab)
□ Supabase errors? (Supabase → Logs)
```

---

## ✅ Success Criteria

You've successfully set up the system when:

- ✅ Database tables created and RLS enabled
- ✅ Can sign up and login
- ✅ Can add medications (upload or test data)
- ✅ Medications appear in Supabase Table Editor
- ✅ Can create reminders
- ✅ Reminders appear in database
- ✅ No errors in browser console
- ✅ Can view dose history
- ✅ Can view call logs

---

## 🎉 You're All Set!

Congratulations! Your Aarogya Setu medication adherence system is ready to use.

**What's Next?**
- Configure Gemini API for real prescription OCR
- Set up Twilio for automated phone calls
- Enable web push notifications
- Invite caregivers to your dashboard
- Start tracking your medication adherence!

**Happy medicating! 💊**

---

**Last Updated:** Today  
**Setup Time:** ~5 minutes  
**Difficulty:** Easy 🟢
