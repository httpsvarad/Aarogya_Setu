# Aarogya Setu - Database Setup Guide

## 🚀 Quick Setup Instructions

### Step 1: Run the SQL Schema

1. Open your **Supabase Project Dashboard**
2. Go to **SQL Editor** (left sidebar)
3. Click **"+ New Query"**
4. Copy the entire contents of `/supabase-schema.sql`
5. Paste it into the SQL Editor
6. Click **"Run"** or press `Ctrl+Enter`

This will create:
- ✅ `medications` table
- ✅ `reminders` table
- ✅ `dose_history` table
- ✅ `call_logs` table
- ✅ `prescriptions` table
- ✅ `caregiver_relationships` table
- ✅ All indexes for performance
- ✅ Row Level Security (RLS) policies
- ✅ Auto-update triggers

### Step 2: Verify Tables

1. Go to **Table Editor** in Supabase
2. You should see all 6 tables listed
3. Click on **medications** table
4. Verify columns: `id`, `user_id`, `name`, `strength`, `dosage`, etc.

### Step 3: Test the Connection

1. Sign up or log in to the app
2. Upload a prescription (or click "Add Test Medication")
3. Check the browser console for logs like:
   ```
   [useMedications] Loading medications from Supabase...
   [useMedications] Loaded medications: 3
   ```
4. Go to Supabase **Table Editor** > **medications**
5. You should see your medications in the database!

---

## 📊 Database Schema Overview

### Core Tables

#### 1. **medications** 
Stores all medication information extracted from prescriptions.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key (auto-generated) |
| `user_id` | UUID | References auth.users |
| `name` | TEXT | Medication name (required) |
| `strength` | TEXT | e.g., "500mg", "10ml" |
| `dosage` | TEXT | e.g., "1 tablet", "2 spoons" |
| `frequency` | TEXT | e.g., "Twice daily" |
| `timing` | TEXT[] | Array: ["Morning", "Evening"] |
| `duration` | TEXT | e.g., "7 days", "1 month" |
| `instructions` | TEXT | e.g., "After food" |
| `image_url` | TEXT | URL to medication photo |
| `prescription_id` | UUID | Link to original prescription |
| `confidence` | DECIMAL | OCR confidence (0.00-1.00) |
| `is_active` | BOOLEAN | Soft delete flag |
| `created_at` | TIMESTAMPTZ | Auto-set |
| `updated_at` | TIMESTAMPTZ | Auto-updated |

#### 2. **reminders**
Scheduled medication reminders with notification preferences.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | References auth.users |
| `medication_id` | UUID | References medications(id) |
| `scheduled_time` | TIME | HH:MM (24-hour) |
| `days_of_week` | INTEGER[] | [0-6] Sun-Sat |
| `timezone` | TEXT | Default: Asia/Kolkata |
| `call_enabled` | BOOLEAN | Enable phone calls |
| `sms_enabled` | BOOLEAN | Enable SMS |
| `push_enabled` | BOOLEAN | Enable push notifications |
| `tone` | TEXT | 'gentle' \| 'standard' \| 'urgent' |
| `enabled` | BOOLEAN | Active/inactive |

#### 3. **dose_history**
Track medication adherence history.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | References auth.users |
| `reminder_id` | UUID | References reminders(id) |
| `medication_id` | UUID | References medications(id) |
| `scheduled_time` | TIMESTAMPTZ | When dose was scheduled |
| `status` | TEXT | 'taken' \| 'missed' \| 'snoozed' \| 'pending' |
| `taken_at` | TIMESTAMPTZ | When marked as taken |
| `snoozed_until` | TIMESTAMPTZ | Snooze time |
| `verified` | BOOLEAN | Camera verification |
| `verification_method` | TEXT | 'camera' \| 'manual' \| 'dtmf' |
| `verification_image_url` | TEXT | Photo of pill taken |
| `notes` | TEXT | User notes |
| `side_effects` | TEXT | Any side effects |

#### 4. **call_logs**
Track Twilio call attempts and responses.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | References auth.users |
| `reminder_id` | UUID | References reminders(id) |
| `medication_id` | UUID | References medications(id) |
| `call_time` | TIMESTAMPTZ | When call was made |
| `call_duration` | INTEGER | Seconds |
| `status` | TEXT | 'completed' \| 'no_answer' \| 'busy' \| 'failed' |
| `dtmf_response` | TEXT | '1' = taken, '9' = snooze |
| `twilio_call_sid` | TEXT | Twilio call ID |
| `twilio_status` | TEXT | Twilio status |

#### 5. **prescriptions**
Original prescription uploads (optional tracking).

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | References auth.users |
| `image_url` | TEXT | Prescription image URL |
| `raw_ocr_response` | JSONB | Full Gemini response |
| `medications_count` | INTEGER | Number of meds found |
| `doctor_name` | TEXT | Extracted doctor name |
| `doctor_signature_detected` | BOOLEAN | Signature check |

#### 6. **caregiver_relationships**
Link patients with caregivers.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `patient_id` | UUID | References auth.users |
| `caregiver_id` | UUID | References auth.users |
| `status` | TEXT | 'pending' \| 'accepted' \| 'rejected' |
| `can_view_medications` | BOOLEAN | Permission |
| `can_view_history` | BOOLEAN | Permission |
| `can_receive_alerts` | BOOLEAN | Permission |

---

## 🔒 Security (Row Level Security)

All tables have RLS enabled with these policies:

- ✅ Users can only see their own data
- ✅ Users can only insert/update their own records
- ✅ Caregivers can view patient data if relationship exists
- ✅ All operations require authentication

---

## 🔧 Storage Buckets (Optional)

If you want to store prescription images in Supabase Storage:

1. Go to **Storage** in Supabase Dashboard
2. Create these buckets:
   - `prescriptions` - For uploaded prescriptions
   - `medication-images` - For medication photos
   - `verification-photos` - For dose verification photos

3. Set bucket policies:
   - **Upload**: Authenticated users only
   - **Download**: Public or user-specific paths

---

## 🧪 Testing

### 1. **Direct Database Test**

Go to **Table Editor** > **medications** > **Insert row**:

```json
{
  "user_id": "<your-user-id>",
  "name": "Paracetamol",
  "strength": "500mg",
  "dosage": "1 tablet",
  "frequency": "Twice daily",
  "timing": ["Morning", "Evening"],
  "duration": "7 days",
  "instructions": "After food",
  "is_active": true
}
```

### 2. **App Test**

1. Click "Add Test Medication" button in Reminders page
2. Check browser console for Supabase logs
3. Verify data in Supabase Table Editor

### 3. **Check RLS**

Try accessing data from another user - it should be blocked!

---

## 🐛 Troubleshooting

### Problem: "relation 'medications' does not exist"
**Solution**: Run the SQL schema in Step 1 again

### Problem: "new row violates row-level security policy"
**Solution**: Make sure you're authenticated. Check `user_id` matches `auth.uid()`

### Problem: "permission denied for table medications"
**Solution**: Check RLS policies are created. Re-run the SQL schema.

### Problem: No medications showing in dropdown
**Solution**: 
1. Check browser console for errors
2. Verify user is logged in
3. Check medications exist in Supabase Table Editor
4. Make sure `is_active = true`

### Problem: "Failed to load medications"
**Solution**:
1. Check Supabase credentials in `/utils/supabase/info.tsx`
2. Verify RLS policies allow SELECT
3. Check network tab for API errors

---

## 📝 Next Steps

After database is set up:

1. ✅ Test prescription upload
2. ✅ Create reminders
3. ✅ Set up Twilio for phone calls (see TWILIO_SETUP.md)
4. ✅ Configure Gemini API for OCR (see GEMINI_SETUP.md)
5. ✅ Enable web push notifications
6. ✅ Test caregiver dashboard

---

## 🚨 Important Notes

- **Never expose your Supabase anon key** in public repositories
- **Always use RLS** - don't disable it
- **Backup regularly** - Use Supabase's daily backups
- **Monitor usage** - Check Supabase dashboard for limits
- **Index frequently queried columns** - Already done in schema

---

## 💡 Tips

1. Use Supabase **Realtime** to sync medications across devices
2. Enable **Database Webhooks** to trigger Edge Functions on insert/update
3. Use **Supabase Storage** for prescription images instead of external services
4. Set up **Database Functions** for complex queries (e.g., adherence stats)
5. Monitor **Logs** in Supabase for debugging

---

## 📞 Support

If you encounter issues:
1. Check browser console logs
2. Check Supabase logs (Logs > API / Database)
3. Verify all environment variables
4. Test with a new user account

Happy coding! 🎉
