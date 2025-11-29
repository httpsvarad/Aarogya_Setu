# Aarogya Setu - Reminder Management System Guide

## Overview

The Aarogya Setu app now has a complete reminder management system where users can:
- ✅ View all active reminders
- ✅ Create new reminders with custom schedules
- ✅ Edit reminder times and notification preferences
- ✅ See exactly when they'll receive calls
- ✅ View prescription details
- ✅ See call logs history
- ✅ Track taken/missed medication history
- ✅ Delete reminders

## How to Access

### From Dashboard
Click the prominent **"रिमाइंडर प्रबंधन"** (Reminder Management) button with the 🔔 icon.

## Features

### 1. Active Reminders Tab (सक्रिय रिमाइंडर)

**What You See:**
- 📊 **Stats Cards** at top showing:
  - Today's taken doses
  - Missed doses
  - Pending doses
  - Total active reminders

- 📋 **All Active Reminders** with:
  - ✅ Medicine name (large text)
  - ⏰ **Call time** clearly displayed (e.g., "9:00 AM")
  - 📅 Days of week when reminder is active
  - 📞 Notification methods enabled (Call, SMS, Push)
  - 🔄 ON/OFF toggle to enable/disable reminder
  - ✏️ Edit button
  - 🗑️ Delete button

**Call Timing Display:**
When you create a reminder for 9:00 AM, you'll see:
```
⏰ 9:00 AM 📞
```
This means **you will receive an automated phone call at exactly 9:00 AM** on the selected days.

### 2. History Tab (इतिहास)

**What You See:**
- Complete history of all medication doses (last 30 days)
- Each entry shows:
  - 💊 Medicine name
  - 📅 Date and time scheduled
  - ✅ Status: Taken / ❌ Missed / ⏸️ Snoozed / 🕐 Pending
  - 💬 Notes (if any)
  - 🔍 Verification method (camera, manual, call, SMS)

### 3. Call Logs Tab (कॉल लॉग)

**What You See:**
- Complete log of all automated calls made (last 30 days)
- Each call shows:
  - 📞 Medicine name
  - 📅 Date and time of call
  - ⏱️ Duration (in seconds)
  - ✅ Status: Completed / 📵 No Answer / 📞 Busy / ❌ Failed
  - 🔢 **DTMF Response**: What you pressed during the call
    - "✅ ली गई" (Taken) - You pressed 1
    - "⏰ स्नूज़" (Snooze) - You pressed 9

## Creating/Editing a Reminder

### Step-by-Step:

1. **Click "नया रिमाइंडर" (New Reminder)** button
2. **Select Medicine** from dropdown
3. **Set Time** using time picker
   - The time picker shows when **you'll receive the call**
   - Example: Set "09:00" → You'll get called at 9:00 AM
4. **Select Days** - Choose which days the reminder should be active
   - Click days to toggle them on/off
   - Selected days appear in green
5. **Choose Notification Methods:**
   - 📞 **Phone Call** (Recommended) - Automated Hindi voice call
   - 📱 **SMS Message** - Text reminder
   - 🔔 **Push Notification** - App notification
6. **Select Tone:**
   - 😊 **Gentle** - Soft, calm voice
   - 😀 **Standard** - Normal voice
   - ⚠️ **Urgent** - More assertive tone
7. **Click "बनाएं" (Create)** or **"अपडेट करें" (Update)**

## How Automated Calls Work

### When Reminder Time Arrives:

1. **📞 You receive a phone call** at the exact scheduled time
2. **🗣️ Hindi voice says:**
   ```
   "नमस्ते, [दवाई का नाम] लेने का समय हो गया है।
   अगर ली है तो 1 दबाएं, 10 मिनट बाद याद दिलाने के लिए 9 दबाएं।"
   ```
   Translation: "Hello, it's time to take [medicine name]. Press 1 if taken, press 9 to remind in 10 minutes."

3. **🔢 You press:**
   - **1** → Marked as "Taken" ✅
   - **9** → Snoozed for 10 minutes ⏰
   - No response → Marked as "No Answer" 📵

4. **📊 Everything is logged** in Call Logs tab

## Prescription Details

When viewing medications or reminders, you can see:
- 💊 Medicine name
- 💪 Strength (e.g., "500mg")
- 📋 Dosage (e.g., "1 tablet")
- 🔄 Frequency (e.g., "Twice daily")
- ⏰ All scheduled times
- ℹ️ Special instructions

## Backend Integration

All data is stored in **Supabase** with:
- ✅ Real-time sync across devices
- ✅ Offline support (changes sync when online)
- ✅ Secure with Row Level Security (RLS)
- ✅ Automatic backups

### Database Tables:

1. **`reminders`** - All reminder schedules
2. **`dose_history`** - Track of all doses (taken/missed)
3. **`call_logs`** - Complete log of all calls made
4. **`medications`** - Prescription and medication data

## Important Notes

### Call Timing is Clear
- ⏰ The time shown on the reminder is **exactly when the call will come**
- 📞 Calls are made automatically by the system using Twilio
- 🕐 Multiple reminders can be set for the same medicine at different times

### Days of Week
- Reminders only trigger on selected days
- You can set different schedules for different days
- Example: Morning medicine Mon-Fri, but not weekends

### Enabling/Disabling
- Use the toggle switch to temporarily disable a reminder
- Disabled reminders are shown with reduced opacity
- No calls or notifications for disabled reminders

### Deleting Reminders
- Click the 🗑️ button to permanently delete
- Confirmation dialog appears
- Past history is preserved even after deletion

## Twilio Configuration Required

For calls to work, configure in **Supabase Edge Function** environment variables:

```
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1...
```

See `/supabase/functions/make-server/TWILIO_SETUP.md` for complete details.

## Testing

### To Test Reminders:
1. Create a reminder for 2-3 minutes from now
2. Enable call notification
3. Wait for the call
4. Press 1 or 9 to test DTMF detection
5. Check Call Logs tab to verify it was logged

### To Test History:
1. Mark some doses as taken from dashboard
2. Go to Reminders → History tab
3. Verify all doses are logged with correct status

## Support

For issues or questions:
- Check Call Logs for failed calls
- Verify reminder is enabled and today is a selected day
- Ensure Twilio credentials are configured
- Check Supabase logs for backend errors
