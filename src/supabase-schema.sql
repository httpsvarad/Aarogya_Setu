-- =====================================================
-- Aarogya Setu - Medication Adherence System
-- Database Schema for Supabase
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- MEDICATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.medications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Medication Details
  name TEXT NOT NULL,
  strength TEXT,
  dosage TEXT,
  frequency TEXT,
  timing TEXT[], -- Array of times: ['Morning', 'Evening']
  duration TEXT,
  instructions TEXT,
  
  -- Image & Metadata
  image_url TEXT,
  prescription_id UUID, -- Link to original prescription
  confidence DECIMAL(3,2), -- OCR confidence score (0.00-1.00)
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE
);

-- =====================================================
-- REMINDERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  medication_id UUID NOT NULL REFERENCES public.medications(id) ON DELETE CASCADE,
  
  -- Schedule
  scheduled_time TIME NOT NULL, -- 24-hour format
  days_of_week INTEGER[] NOT NULL, -- [0-6] where 0=Sunday
  timezone TEXT DEFAULT 'Asia/Kolkata',
  
  -- Notification Settings
  call_enabled BOOLEAN DEFAULT TRUE,
  sms_enabled BOOLEAN DEFAULT FALSE,
  push_enabled BOOLEAN DEFAULT TRUE,
  tone TEXT DEFAULT 'gentle', -- 'gentle' | 'standard' | 'urgent'
  
  -- Status
  enabled BOOLEAN DEFAULT TRUE,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- DOSE HISTORY TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.dose_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reminder_id UUID NOT NULL REFERENCES public.reminders(id) ON DELETE CASCADE,
  medication_id UUID NOT NULL REFERENCES public.medications(id) ON DELETE CASCADE,
  
  -- Schedule Info
  scheduled_time TIMESTAMPTZ NOT NULL,
  
  -- Status
  status TEXT NOT NULL, -- 'taken' | 'missed' | 'snoozed' | 'pending'
  taken_at TIMESTAMPTZ,
  snoozed_until TIMESTAMPTZ,
  
  -- Verification
  verified BOOLEAN DEFAULT FALSE,
  verification_method TEXT, -- 'camera' | 'manual' | 'dtmf'
  verification_image_url TEXT,
  
  -- Notes & Metadata
  notes TEXT,
  side_effects TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- CALL LOGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.call_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reminder_id UUID NOT NULL REFERENCES public.reminders(id) ON DELETE CASCADE,
  medication_id UUID NOT NULL REFERENCES public.medications(id) ON DELETE CASCADE,
  
  -- Call Details
  call_time TIMESTAMPTZ NOT NULL,
  call_duration INTEGER, -- in seconds
  status TEXT NOT NULL, -- 'completed' | 'no_answer' | 'busy' | 'failed'
  
  -- DTMF Response
  dtmf_response TEXT, -- '1' for taken, '9' for snooze
  
  -- Twilio Metadata
  twilio_call_sid TEXT,
  twilio_status TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- PRESCRIPTIONS TABLE (Optional - for tracking uploads)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.prescriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Image
  image_url TEXT NOT NULL,
  
  -- OCR Results
  raw_ocr_response JSONB, -- Full Gemini response
  medications_count INTEGER DEFAULT 0,
  
  -- Doctor Info
  doctor_name TEXT,
  doctor_signature_detected BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- CAREGIVER RELATIONSHIPS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.caregiver_relationships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  caregiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Status
  status TEXT DEFAULT 'pending', -- 'pending' | 'accepted' | 'rejected'
  
  -- Permissions
  can_view_medications BOOLEAN DEFAULT TRUE,
  can_view_history BOOLEAN DEFAULT TRUE,
  can_receive_alerts BOOLEAN DEFAULT TRUE,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(patient_id, caregiver_id)
);

-- =====================================================
-- INDEXES
-- =====================================================

-- Medications
CREATE INDEX idx_medications_user_id ON public.medications(user_id);
CREATE INDEX idx_medications_active ON public.medications(user_id, is_active);

-- Reminders
CREATE INDEX idx_reminders_user_id ON public.reminders(user_id);
CREATE INDEX idx_reminders_medication_id ON public.reminders(medication_id);
CREATE INDEX idx_reminders_enabled ON public.reminders(user_id, enabled);

-- Dose History
CREATE INDEX idx_dose_history_user_id ON public.dose_history(user_id);
CREATE INDEX idx_dose_history_reminder_id ON public.dose_history(reminder_id);
CREATE INDEX idx_dose_history_medication_id ON public.dose_history(medication_id);
CREATE INDEX idx_dose_history_scheduled_time ON public.dose_history(scheduled_time);
CREATE INDEX idx_dose_history_status ON public.dose_history(user_id, status);

-- Call Logs
CREATE INDEX idx_call_logs_user_id ON public.call_logs(user_id);
CREATE INDEX idx_call_logs_reminder_id ON public.call_logs(reminder_id);
CREATE INDEX idx_call_logs_call_time ON public.call_logs(call_time);

-- Prescriptions
CREATE INDEX idx_prescriptions_user_id ON public.prescriptions(user_id);

-- Caregiver Relationships
CREATE INDEX idx_caregiver_patient ON public.caregiver_relationships(patient_id);
CREATE INDEX idx_caregiver_caregiver ON public.caregiver_relationships(caregiver_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS
ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dose_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.caregiver_relationships ENABLE ROW LEVEL SECURITY;

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

-- Call Logs Policies
CREATE POLICY "Users can view their own call logs"
  ON public.call_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own call logs"
  ON public.call_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Prescriptions Policies
CREATE POLICY "Users can view their own prescriptions"
  ON public.prescriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own prescriptions"
  ON public.prescriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own prescriptions"
  ON public.prescriptions FOR UPDATE
  USING (auth.uid() = user_id);

-- Caregiver Policies
CREATE POLICY "Users can view relationships where they are patient or caregiver"
  ON public.caregiver_relationships FOR SELECT
  USING (auth.uid() = patient_id OR auth.uid() = caregiver_id);

CREATE POLICY "Patients can create caregiver relationships"
  ON public.caregiver_relationships FOR INSERT
  WITH CHECK (auth.uid() = patient_id);

CREATE POLICY "Users can update their own relationships"
  ON public.caregiver_relationships FOR UPDATE
  USING (auth.uid() = patient_id OR auth.uid() = caregiver_id);

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_medications_updated_at BEFORE UPDATE ON public.medications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reminders_updated_at BEFORE UPDATE ON public.reminders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dose_history_updated_at BEFORE UPDATE ON public.dose_history
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prescriptions_updated_at BEFORE UPDATE ON public.prescriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_caregiver_relationships_updated_at BEFORE UPDATE ON public.caregiver_relationships
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- STORAGE BUCKETS (Run separately in Supabase Dashboard)
-- =====================================================
-- Run these commands in the Supabase Storage UI:
-- 1. Create bucket: 'prescriptions'
-- 2. Create bucket: 'medication-images'
-- 3. Create bucket: 'verification-photos'
-- 
-- Bucket Policies (public read, authenticated write):
-- - Allow authenticated users to upload
-- - Allow public to read (or restrict to user-specific paths)
