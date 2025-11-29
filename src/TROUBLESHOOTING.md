# 🔧 Troubleshooting Guide - Aarogya Setu

## Error: "column medications.is_active does not exist"

### ✅ SOLUTION (Choose one):

#### Option 1: Run Minimal Schema (Recommended - Quick Fix)
```sql
-- In Supabase SQL Editor, run:
-- Copy contents of /supabase-schema-minimal.sql
-- This will ADD missing columns to your existing table
```

This script will:
- ✅ Add `is_active` column if missing
- ✅ Add `confidence` column if missing  
- ✅ Add `prescription_id` column if missing
- ✅ Create other required tables (reminders, dose_history, call_logs)
- ✅ Keep your existing data intact

#### Option 2: Code Already Fixed (No SQL needed)
The code has been updated to work WITHOUT the `is_active` column!

**What changed:**
- ❌ Old code: `.eq('is_active', true)` (would fail if column doesn't exist)
- ✅ New code: Filters in memory, not in database query
- ✅ Delete function: Falls back to hard delete if soft delete fails

**You can continue using the app without running any SQL!**

---

## ⚡ Quick Fixes

### Problem: Medications not showing in dropdown

**Check:**
```bash
1. Open browser console (F12)
2. Look for "[useMedications] Loaded medications: X"
3. Check the number - is it > 0?
```

**Solutions:**
```bash
# If number is 0:
1. Click "Add Test Medication" button
2. Wait for success message
3. Click "🔄 Refresh" button
4. Check Supabase Table Editor

# If still 0:
1. Go to Supabase Dashboard
2. Table Editor → medications
3. Click "+ Insert row"
4. Add manually:
   - user_id: [your user ID from auth.users]
   - name: "Test Med"
   - strength: "500mg"
5. Refresh app
```

---

### Problem: "User not authenticated"

**Check:**
```javascript
// In browser console:
const supabase = window.supabase; // or however you access it
const { data: { user } } = await supabase.auth.getUser();
console.log(user);
```

**Solutions:**
```bash
1. Logout and login again
2. Clear browser cache (Ctrl+Shift+Delete)
3. Check if session expired
4. Verify Supabase credentials in /utils/supabase/info.tsx
```

---

### Problem: "RLS policy violation"

**Full Error:**
```
new row violates row-level security policy for table "medications"
```

**Solution:**
```sql
-- In Supabase SQL Editor, verify policies exist:
SELECT * FROM pg_policies WHERE tablename = 'medications';

-- If empty, run the minimal schema SQL
```

**Quick Fix:**
```sql
-- Temporarily disable RLS (NOT recommended for production!)
ALTER TABLE medications DISABLE ROW LEVEL SECURITY;

-- Then run your app
-- Then re-enable and fix policies:
ALTER TABLE medications ENABLE ROW LEVEL SECURITY;
```

---

### Problem: Insert fails with "null value in column 'name'"

**Error:**
```
null value in column "name" of relation "medications" violates not-null constraint
```

**Solution:**
Check your prescription upload is parsing correctly:

```javascript
// In UploadPrescription.tsx
const medications = result.medications.map((med, index) => ({
  id: `${Date.now()}-${index}`,
  ...med,
  name: med.name || 'Unknown Medication', // ADD THIS
  confidence: 0.95
}));
```

---

## 🗄️ Database Issues

### Check if tables exist

```sql
-- Run in Supabase SQL Editor:
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

**Expected output:**
- medications ✅
- reminders ✅
- dose_history ✅
- call_logs ✅

**If missing:** Run `/supabase-schema-minimal.sql`

---

### Check if columns exist

```sql
-- Check medications table columns:
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'medications'
ORDER BY ordinal_position;
```

**Expected columns:**
- id (uuid) ✅
- user_id (uuid) ✅
- name (text) ✅
- strength (text) ✅
- dosage (text) ✅
- frequency (text) ✅
- timing (ARRAY) ✅
- duration (text) ✅
- instructions (text) ✅
- image_url (text) ✅
- prescription_id (uuid) ✅
- confidence (numeric) ✅
- is_active (boolean) ✅
- created_at (timestamptz) ✅
- updated_at (timestamptz) ✅

**If missing:** Run `/supabase-schema-minimal.sql`

---

### Check RLS policies

```sql
-- Check if RLS is enabled:
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public'
  AND tablename IN ('medications', 'reminders', 'dose_history', 'call_logs');
```

**Expected:** `rowsecurity = true` for all tables

```sql
-- Check policies:
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'medications';
```

**Expected policies:**
- Users can view their own medications ✅
- Users can insert their own medications ✅
- Users can update their own medications ✅
- Users can delete their own medications ✅

---

## 🔍 Debugging Tips

### Enable verbose logging

Add this to your component:

```javascript
useEffect(() => {
  console.log('=== MEDICATIONS DEBUG ===');
  console.log('Medications array:', medications);
  console.log('Medications count:', medications.length);
  console.log('Loading state:', loading);
  console.log('Error state:', error);
  medications.forEach((med, i) => {
    console.log(`Med ${i}:`, {
      id: med.id,
      name: med.name,
      hasId: !!med.id,
      hasName: !!med.name
    });
  });
  console.log('=== END DEBUG ===');
}, [medications, loading, error]);
```

---

### Check Supabase logs

1. Go to Supabase Dashboard
2. Click **Logs** in left sidebar
3. Select **API** or **Database**
4. Look for errors at the time of your operation

**Common errors:**
- `relation "medications" does not exist` → Run schema SQL
- `column "is_active" does not exist` → Run minimal schema OR code is already fixed
- `permission denied for table medications` → Check RLS policies
- `null value in column "name"` → Check data being inserted

---

### Test direct database query

In Supabase SQL Editor:

```sql
-- Check if you can see medications
SELECT * FROM medications LIMIT 10;

-- Check if you can insert (replace with your user_id)
INSERT INTO medications (user_id, name, strength)
VALUES ('YOUR_USER_ID_HERE', 'Test Med', '500mg');

-- Check if data appears
SELECT * FROM medications WHERE name = 'Test Med';
```

---

## 🚨 Emergency Fixes

### Nuclear Option 1: Clear everything and start fresh

```sql
-- ⚠️ WARNING: This deletes ALL medications!
DELETE FROM medications;
DELETE FROM reminders;
DELETE FROM dose_history;
DELETE FROM call_logs;

-- Then run /supabase-schema-minimal.sql
```

---

### Nuclear Option 2: Drop and recreate medications table

```sql
-- ⚠️ WARNING: This deletes the entire table!
DROP TABLE IF EXISTS medications CASCADE;

-- Then run /supabase-schema.sql (the full one)
```

---

### Nuclear Option 3: Fresh database

1. Create new Supabase project
2. Run `/supabase-schema.sql`
3. Update `/utils/supabase/info.tsx` with new credentials
4. Test with fresh data

---

## 📊 Verification Checklist

After fixing issues, verify:

```bash
✅ Can login/signup
✅ No console errors
✅ Medications table exists in Supabase
✅ RLS policies enabled
✅ Can add test medication
✅ Test medication appears in database
✅ Test medication shows in app
✅ Dropdown populated with medications
✅ Can create reminder
✅ Reminder saved to database
```

---

## 🆘 Still Stuck?

### Gather this info:

1. **Error message** (full text from console)
2. **Supabase logs** (from Dashboard → Logs)
3. **Table structure** (run column check SQL above)
4. **RLS status** (run RLS check SQL above)
5. **User authentication** (check if user is logged in)
6. **Browser console** (screenshot of errors)

### Common causes:

- ❌ Schema not run → **Solution:** Run `/supabase-schema-minimal.sql`
- ❌ User not logged in → **Solution:** Logout/login
- ❌ Wrong credentials → **Solution:** Check `/utils/supabase/info.tsx`
- ❌ RLS blocking queries → **Solution:** Check policies match user_id
- ❌ Missing columns → **Solution:** Run minimal schema to add them

---

## 💡 Pro Tips

1. **Always check browser console first** - 90% of issues show there
2. **Check Supabase Table Editor** - Verify data exists
3. **Test with SQL Editor** - Direct queries help isolate issues
4. **Use test medications** - Don't rely on OCR for testing
5. **Check one thing at a time** - Don't change multiple things simultaneously

---

## ✅ Success Indicators

You'll know it's working when:

```
✅ Console shows: "[useMedications] Loaded medications: 3"
✅ Dropdown shows medication names
✅ Supabase Table Editor shows medications
✅ No red errors in console
✅ Can create reminders without errors
✅ Reminders appear in Supabase
```

---

**Last Updated:** Today  
**Most Common Issue:** is_active column missing → Run `/supabase-schema-minimal.sql`
