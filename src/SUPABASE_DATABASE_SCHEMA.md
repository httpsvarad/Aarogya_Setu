# Supabase Database Schema for Aarogya Setu

## Tables to Create in Supabase SQL Editor

### 1. Reminders Table

```sql
CREATE TABLE IF NOT EXISTS public.reminders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  medication_id UUID NOT NULL,
  medication_name TEXT NOT NULL,
  scheduled_time TEXT NOT NULL, -- HH:MM format (e.g., "09:00", "14:30")
  days_of_week INTEGER[] NOT NULL DEFAULT ARRAY[0,1,2,3,4,5,6], -- 0=Sunday, 6=Saturday
  enabled BOOLEAN DEFAULT TRUE,
  call_enabled BOOLEAN DEFAULT TRUE,
  sms_enabled BOOLEAN DEFAULT FALSE,
  push_enabled BOOLEAN DEFAULT TRUE,
  tone TEXT DEFAULT 'gentle' CHECK (tone IN ('gentle', 'standard', 'urgent')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;

-- RLS Policies
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

-- Create index for faster queries
CREATE INDEX idx_reminders_user_id ON public.reminders(user_id);
CREATE INDEX idx_reminders_enabled ON public.reminders(enabled) WHERE enabled = TRUE;
```

### 2. Dose History Table

```sql
CREATE TABLE IF NOT EXISTS public.dose_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  medication_id UUID NOT NULL,
  reminder_id UUID REFERENCES public.reminders(id) ON DELETE SET NULL,
  scheduled_time TIMESTAMPTZ NOT NULL,
  taken_at TIMESTAMPTZ,
  status TEXT NOT NULL CHECK (status IN ('taken', 'missed', 'snoozed', 'pending')),
  verification_method TEXT CHECK (verification_method IN ('camera', 'manual', 'call', 'sms')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.dose_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own dose history"
  ON public.dose_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own dose history"
  ON public.dose_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own dose history"
  ON public.dose_history FOR UPDATE
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_dose_history_user_id ON public.dose_history(user_id);
CREATE INDEX idx_dose_history_scheduled_time ON public.dose_history(scheduled_time);
CREATE INDEX idx_dose_history_status ON public.dose_history(status);
```

### 3. Call Logs Table

```sql
CREATE TABLE IF NOT EXISTS public.call_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reminder_id UUID REFERENCES public.reminders(id) ON DELETE SET NULL,
  medication_name TEXT NOT NULL,
  call_time TIMESTAMPTZ NOT NULL,
  call_duration INTEGER DEFAULT 0, -- in seconds
  status TEXT NOT NULL CHECK (status IN ('completed', 'no_answer', 'busy', 'failed')),
  dtmf_response TEXT, -- Stores DTMF key pressed (1=taken, 9=snooze, etc.)
  twilio_call_sid TEXT, -- Twilio Call SID for reference
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.call_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own call logs"
  ON public.call_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own call logs"
  ON public.call_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_call_logs_user_id ON public.call_logs(user_id);
CREATE INDEX idx_call_logs_created_at ON public.call_logs(created_at);
```

### 4. Update Medications Table (if not exists)

```sql
CREATE TABLE IF NOT EXISTS public.medications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  strength TEXT,
  dosage TEXT,
  frequency TEXT,
  timing TEXT[], -- Array of times like ["09:00", "14:00", "21:00"]
  instructions TEXT,
  start_date DATE,
  end_date DATE,
  image_url TEXT,
  prescription_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
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

-- Create index
CREATE INDEX idx_medications_user_id ON public.medications(user_id);
```

## Functions for Auto-updating Timestamps

```sql
-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER update_reminders_updated_at
  BEFORE UPDATE ON public.reminders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_medications_updated_at
  BEFORE UPDATE ON public.medications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

## Realtime Configuration

Enable Realtime for tables that need live updates:

```sql
-- Enable Realtime for reminders
ALTER PUBLICATION supabase_realtime ADD TABLE public.reminders;

-- Enable Realtime for dose_history
ALTER PUBLICATION supabase_realtime ADD TABLE public.dose_history;

-- Enable Realtime for call_logs
ALTER PUBLICATION supabase_realtime ADD TABLE public.call_logs;
```

## Setup Instructions

1. **Go to Supabase Dashboard** → Your Project → SQL Editor
2. **Copy and paste** each SQL block above and run them in order
3. **Verify tables were created** by checking the Table Editor
4. **Test RLS policies** by trying to insert/query data

## Additional Notes

### Reminder Scheduling Logic

The `scheduled_time` in the `reminders` table is stored in 24-hour format (HH:MM).
The `days_of_week` array contains integers 0-6 representing days:
- 0 = Sunday
- 1 = Monday
- 2 = Tuesday
- 3 = Wednesday
- 4 = Thursday
- 5 = Friday
- 6 = Saturday

### Call Timing Display

When a reminder is set for "09:00" with call enabled, the user will receive:
- 📞 **Automated Twilio Call** at 9:00 AM
- 📱 **Push Notification** (if enabled) at 9:00 AM
- 📧 **SMS** (if enabled) at 9:00 AM

The call will speak in Hindi: "नमस्ते, [दवाई का नाम] लेने का समय हो गया है। अगर ली है तो 1 दबाएं, 10 मिनट बाद याद दिलाने के लिए 9 दबाएं।"

### DTMF Responses

- **1** = Medication taken (marks dose as "taken")
- **9** = Snooze for 10 minutes (reschedules reminder)

All calls are logged in `call_logs` table with:
- Duration
- Status (completed, no_answer, busy, failed)
- DTMF response (if any)
- Twilio Call SID for debugging
