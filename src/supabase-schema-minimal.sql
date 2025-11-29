-- =====================================================
-- Aarogya Setu - MINIMAL Database Schema
-- This is a simplified version that matches your existing table
-- =====================================================

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- ADD MISSING COLUMNS TO EXISTING MEDICATIONS TABLE
-- =====================================================

-- Check if is_active column exists, if not add it
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'medications' 
    AND column_name = 'is_active'
  ) THEN
    ALTER TABLE medications ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
    COMMENT ON COLUMN medications.is_active IS 'Soft delete flag';
  END IF;
END $$;

-- Check if confidence column exists, if not add it
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'medications' 
    AND column_name = 'confidence'
  ) THEN
    ALTER TABLE medications ADD COLUMN confidence DECIMAL(3,2);
    COMMENT ON COLUMN medications.confidence IS 'OCR confidence score (0.00-1.00)';
  END IF;
END $$;

-- Check if prescription_id column exists, if not add it
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'medications' 
    AND column_name = 'prescription_id'
  ) THEN
    ALTER TABLE medications ADD COLUMN prescription_id UUID;
    COMMENT ON COLUMN medications.prescription_id IS 'Link to original prescription';
  END IF;
END $$;

-- =====================================================
-- CREATE REMINDERS TABLE (if not exists)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  medication_id UUID NOT NULL REFERENCES public.medications(id) ON DELETE CASCADE,
  
  -- Schedule
  scheduled_time TIME NOT NULL,
  days_of_week INTEGER[] NOT NULL,
  timezone TEXT DEFAULT 'Asia/Kolkata',
  
  -- Notification Settings
  call_enabled BOOLEAN DEFAULT TRUE,
  sms_enabled BOOLEAN DEFAULT FALSE,
  push_enabled BOOLEAN DEFAULT TRUE,
  tone TEXT DEFAULT 'gentle',
  
  -- Status
  enabled BOOLEAN DEFAULT TRUE,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- CREATE DOSE HISTORY TABLE (if not exists)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.dose_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reminder_id UUID NOT NULL REFERENCES public.reminders(id) ON DELETE CASCADE,
  medication_id UUID NOT NULL REFERENCES public.medications(id) ON DELETE CASCADE,
  
  scheduled_time TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL,
  taken_at TIMESTAMPTZ,
  snoozed_until TIMESTAMPTZ,
  
  verified BOOLEAN DEFAULT FALSE,
  verification_method TEXT,
  verification_image_url TEXT,
  
  notes TEXT,
  side_effects TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- CREATE CALL LOGS TABLE (if not exists)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.call_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reminder_id UUID NOT NULL REFERENCES public.reminders(id) ON DELETE CASCADE,
  medication_id UUID NOT NULL REFERENCES public.medications(id) ON DELETE CASCADE,
  
  call_time TIMESTAMPTZ NOT NULL,
  call_duration INTEGER,
  status TEXT NOT NULL,
  dtmf_response TEXT,
  
  twilio_call_sid TEXT,
  twilio_status TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- CREATE INDEXES (if not exist)
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_medications_user_id ON public.medications(user_id);
CREATE INDEX IF NOT EXISTS idx_medications_active ON public.medications(user_id, is_active);

CREATE INDEX IF NOT EXISTS idx_reminders_user_id ON public.reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_reminders_medication_id ON public.reminders(medication_id);
CREATE INDEX IF NOT EXISTS idx_reminders_enabled ON public.reminders(user_id, enabled);

CREATE INDEX IF NOT EXISTS idx_dose_history_user_id ON public.dose_history(user_id);
CREATE INDEX IF NOT EXISTS idx_dose_history_reminder_id ON public.dose_history(reminder_id);
CREATE INDEX IF NOT EXISTS idx_dose_history_scheduled_time ON public.dose_history(scheduled_time);

CREATE INDEX IF NOT EXISTS idx_call_logs_user_id ON public.call_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_call_time ON public.call_logs(call_time);

-- =====================================================
-- ENABLE ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dose_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_logs ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- CREATE RLS POLICIES (if not exist)
-- =====================================================

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own medications" ON public.medications;
DROP POLICY IF EXISTS "Users can insert their own medications" ON public.medications;
DROP POLICY IF EXISTS "Users can update their own medications" ON public.medications;
DROP POLICY IF EXISTS "Users can delete their own medications" ON public.medications;

-- Medications Policies
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

-- Drop existing reminder policies
DROP POLICY IF EXISTS "Users can view their own reminders" ON public.reminders;
DROP POLICY IF EXISTS "Users can insert their own reminders" ON public.reminders;
DROP POLICY IF EXISTS "Users can update their own reminders" ON public.reminders;
DROP POLICY IF EXISTS "Users can delete their own reminders" ON public.reminders;

-- Reminders Policies
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

-- Drop existing dose history policies
DROP POLICY IF EXISTS "Users can view their own dose history" ON public.dose_history;
DROP POLICY IF EXISTS "Users can insert their own dose history" ON public.dose_history;
DROP POLICY IF EXISTS "Users can update their own dose history" ON public.dose_history;

-- Dose History Policies
CREATE POLICY "Users can view their own dose history"
  ON public.dose_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own dose history"
  ON public.dose_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own dose history"
  ON public.dose_history FOR UPDATE
  USING (auth.uid() = user_id);

-- Drop existing call log policies
DROP POLICY IF EXISTS "Users can view their own call logs" ON public.call_logs;
DROP POLICY IF EXISTS "Users can insert their own call logs" ON public.call_logs;

-- Call Logs Policies
CREATE POLICY "Users can view their own call logs"
  ON public.call_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own call logs"
  ON public.call_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- CREATE TRIGGERS FOR UPDATED_AT
-- =====================================================

-- Function to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_medications_updated_at ON public.medications;
DROP TRIGGER IF EXISTS update_reminders_updated_at ON public.reminders;
DROP TRIGGER IF EXISTS update_dose_history_updated_at ON public.dose_history;

-- Create triggers
CREATE TRIGGER update_medications_updated_at 
  BEFORE UPDATE ON public.medications
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reminders_updated_at 
  BEFORE UPDATE ON public.reminders
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dose_history_updated_at 
  BEFORE UPDATE ON public.dose_history
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$ 
BEGIN
  RAISE NOTICE '✅ Database schema updated successfully!';
  RAISE NOTICE '✅ Missing columns added to medications table';
  RAISE NOTICE '✅ Reminders, dose_history, and call_logs tables created';
  RAISE NOTICE '✅ RLS policies enabled';
  RAISE NOTICE '✅ Indexes created for performance';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Your Aarogya Setu database is ready!';
END $$;
