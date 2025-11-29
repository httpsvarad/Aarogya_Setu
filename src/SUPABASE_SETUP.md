# 🚀 Supabase Setup Guide for Aarogya Setu

## ✅ Step 1: Credentials Updated
Your new Supabase project is now connected:
- **Project ID**: `zdjzdwujvvrabbzazkbc`
- **URL**: `https://zdjzdwujvvrabbzazkbc.supabase.co`

## 📋 Step 2: Run Database Schema (CRITICAL!)

Go to your Supabase Dashboard → SQL Editor → New Query and run this:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create medications table
CREATE TABLE IF NOT EXISTS public.medications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  strength TEXT,
  dosage TEXT,
  frequency TEXT,
  timing TEXT[],
  duration TEXT,
  instructions TEXT,
  image_url TEXT,
  prescription_id UUID,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create reminders table
CREATE TABLE IF NOT EXISTS public.reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  medication_id UUID NOT NULL REFERENCES public.medications(id) ON DELETE CASCADE,
  medication_name TEXT NOT NULL,
  scheduled_time TEXT NOT NULL,
  days_of_week INTEGER[] NOT NULL DEFAULT ARRAY[0,1,2,3,4,5,6],
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  call_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  sms_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  push_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  tone TEXT NOT NULL DEFAULT 'gentle',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create dose_history table
CREATE TABLE IF NOT EXISTS public.dose_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  medication_id UUID NOT NULL REFERENCES public.medications(id) ON DELETE CASCADE,
  reminder_id UUID REFERENCES public.reminders(id) ON DELETE SET NULL,
  scheduled_time TIMESTAMPTZ NOT NULL,
  taken_time TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create call_logs table
CREATE TABLE IF NOT EXISTS public.call_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reminder_id UUID REFERENCES public.reminders(id) ON DELETE SET NULL,
  medication_name TEXT NOT NULL,
  call_sid TEXT,
  phone_number TEXT,
  call_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  call_duration INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'initiated',
  dtmf_response TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_medications_user_id ON public.medications(user_id);
CREATE INDEX IF NOT EXISTS idx_medications_active ON public.medications(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_reminders_user_id ON public.reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_reminders_enabled ON public.reminders(user_id, enabled);
CREATE INDEX IF NOT EXISTS idx_dose_history_user_id ON public.dose_history(user_id);
CREATE INDEX IF NOT EXISTS idx_dose_history_status ON public.dose_history(user_id, status);
CREATE INDEX IF NOT EXISTS idx_call_logs_user_id ON public.call_logs(user_id);

-- Enable RLS on all tables
ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dose_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_logs ENABLE ROW LEVEL SECURITY;

-- Medications policies
CREATE POLICY "Users can view their own medications"
  ON public.medications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own medications"
  ON public.medications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own medications"
  ON public.medications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own medications"
  ON public.medications FOR DELETE
  USING (auth.uid() = user_id);

-- Reminders policies
CREATE POLICY "Users can view their own reminders"
  ON public.reminders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reminders"
  ON public.reminders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reminders"
  ON public.reminders FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reminders"
  ON public.reminders FOR DELETE
  USING (auth.uid() = user_id);

-- Dose history policies
CREATE POLICY "Users can view their own dose history"
  ON public.dose_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own dose history"
  ON public.dose_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own dose history"
  ON public.dose_history FOR UPDATE
  USING (auth.uid() = user_id);

-- Call logs policies
CREATE POLICY "Users can view their own call logs"
  ON public.call_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own call logs"
  ON public.call_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create trigger functions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER update_medications_updated_at 
  BEFORE UPDATE ON public.medications
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reminders_updated_at 
  BEFORE UPDATE ON public.reminders
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
```

## ⚙️ Step 3: Configure Authentication

1. Go to **Authentication → Providers**
2. Enable **Email** provider
3. **IMPORTANT**: For testing, disable email confirmation:
   - Go to Authentication → Settings
   - Under "Email Auth" section
   - **Uncheck "Confirm email"** (or configure SMTP for production)

## 🧪 Step 4: Test the Connection

1. Refresh your app
2. Click **"🧪 Test Supabase Connection"** button on the home page
3. You should see ✅ green checkmarks
4. If you see errors, check the browser console

## 🎯 Step 5: Test Signup

1. Try signing up with an email and password
2. Should work instantly now!

## 📞 Step 6: Add Twilio Credentials (Optional - for phone calls)

If you want the voice calling feature to work:

1. Go to Supabase Dashboard → Edge Functions
2. Click on "make-server-b3c2a063" function (if deployed)
3. Add secrets:
   ```
   TWILIO_ACCOUNT_SID=your_account_sid
   TWILIO_AUTH_TOKEN=your_auth_token
   TWILIO_PHONE_NUMBER=your_twilio_number
   ```

## 🤖 Step 7: Add Gemini API Key (Optional - for real OCR)

For prescription scanning:

1. Same Edge Functions section
2. Add secret:
   ```
   GEMINI_API_KEY=your_gemini_api_key
   ```

## 🚀 Step 8: Deploy Edge Function (Optional)

Only if you want real Twilio calls and Gemini OCR:

```bash
npx supabase login
npx supabase link --project-ref zdjzdwujvvrabbzazkbc
npx supabase functions deploy make-server-b3c2a063
```

---

## 🎉 Quick Start Without Edge Functions

The app will work fine without deploying Edge Functions! Features that work:
- ✅ User signup and login
- ✅ Medication management
- ✅ Reminder creation
- ✅ Prescription upload (with mock data)
- ✅ Dose tracking
- ✅ Dashboard and analytics

Features that need Edge Functions:
- ⏸️ Real Twilio voice calls (test button will show mock)
- ⏸️ Real Gemini OCR (currently returns 3 mock medications)

---

## 💡 Need Help?

Check browser console (F12) for detailed logs. All operations are logged with emojis:
- 🔧 = Initialization
- 🔐 = Authentication
- ✅ = Success
- ❌ = Error
- 📊 = Data operation
