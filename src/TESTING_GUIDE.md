# Testing Guide for Aarogya Setu

Complete testing guide for all features of the medication adherence application.

## Prerequisites

✅ Supabase project configured with:
- Database tables created
- RLS policies enabled
- Storage buckets created
- Edge Functions deployed
- Environment variables set:
  - `GEMINI_API_KEY`
  - `TWILIO_ACCOUNT_SID`
  - `TWILIO_AUTH_TOKEN`
  - `TWILIO_PHONE_NUMBER`

## 1. Test Authentication

### Signup Flow

1. Open the app in browser
2. Click "Get Started" or "Sign Up"
3. Enter details:
   - Name: Test User
   - Phone: +919876543210
   - Email: test@example.com
   - Password: TestPass123
4. Click "Sign Up"
5. ✅ Should be redirected to dashboard

### Login Flow

1. Click "Login" from home page
2. Enter credentials:
   - Email: test@example.com
   - Password: TestPass123
3. Click "Login"
4. ✅ Should be redirected to dashboard

### Logout

1. Go to Settings
2. Click "लॉग आउट" (Logout)
3. ✅ Should be redirected to home page

## 2. Test Language Switching

### From Home Page

1. Open home page (logged out)
2. Click the Globe icon in top-right
3. Toggle between Hindi/English
4. ✅ All text should change language

### From Settings

1. Login to app
2. Go to Settings
3. Under "भाषा" section, click on language option
4. ✅ App should switch to selected language

## 3. Test Prescription Upload

### Upload via Camera

1. Go to Dashboard
2. Click "नई दवाई" (Add Medication)
3. Click "कैमरा से फोटो लें" (Take Photo)
4. Take photo of a prescription (or upload test image)
5. ✅ Should show "Processing..." screen
6. ✅ Should extract medications and show confirmation screen
7. Review extracted data
8. Click "सब सही है, सहेजें" (Confirm & Save)
9. ✅ Should return to dashboard with medications visible

### Upload from Gallery

1. Go to Dashboard
2. Click "नई दवाई" (Add Medication)
3. Click "गैलरी से चुनें" (Choose from Gallery)
4. Select a prescription image
5. ✅ Follow same flow as camera upload

### Test with Sample Prescriptions

Create test images with medications like:
```
Dr. Sharma's Clinic
Patient: Ram Kumar

Medications:
1. मेटफोर्मिन 500mg - दिन में 2 बार (सुबह, शाम)
2. एस्पिरिन 75mg - दिन में 1 बार (सुबह)
3. एटोर्वास्टेटिन 10mg - रात को 1 बार
```

## 4. Test Dashboard Features

### View Medications

1. Login to app
2. Go to Dashboard
3. ✅ Should see list of all medications
4. ✅ Each card should show:
   - Medicine name
   - Strength
   - Dosage instructions
   - Timing

### View Statistics

1. Check the stats cards at top of dashboard
2. ✅ Should show:
   - Medications taken today
   - Upcoming medications
   - Missed medications

### Edit Medication

1. Click on a medication card
2. Modify details (name, dosage, timing)
3. Click "Save"
4. ✅ Changes should be reflected in dashboard

## 5. Test Twilio Voice Calling

### Manual Call Test

1. Open browser console
2. Get your access token from Supabase
3. Make a test API call:

```javascript
const makeTestCall = async () => {
  const response = await fetch('YOUR_SUPABASE_URL/functions/v1/make-server-b3c2a063/twilio/make-call', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_ACCESS_TOKEN',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      phoneNumber: '+919876543210', // Your phone number
      medicationName: 'मेटफोर्मिन',
      reminderId: 'test-123'
    })
  });
  
  const data = await response.json();
  console.log('Call initiated:', data);
};

makeTestCall();
```

### Test Call Flow

1. Answer the phone when it rings
2. ✅ Should hear: "नमस्ते। यह आपकी दवाई का रिमाइंडर है।"
3. ✅ Should hear: "आपको मेटफोर्मिन लेने का समय हो गया है।"
4. ✅ Should hear options to press 1 or 9

### Test DTMF - Press 1 (Taken)

1. During call, press **1** on phone keypad
2. ✅ Should hear: "धन्यवाद। आपकी दवाई रिकॉर्ड कर ली गई है। स्वस्थ रहें।"
3. ✅ Call should end
4. Check reminder status in database

### Test DTMF - Press 9 (Snooze)

1. During call, press **9** on phone keypad
2. ✅ Should hear: "ठीक है। हम १५ मिनट में फिर से याद दिलाएंगे।"
3. ✅ Call should end
4. ✅ System should schedule another call in 15 minutes

### Check Call Status

```javascript
const checkReminderStatus = async (reminderId) => {
  const response = await fetch(`YOUR_SUPABASE_URL/functions/v1/make-server-b3c2a063/twilio/reminder-status/${reminderId}`, {
    headers: {
      'Authorization': 'Bearer YOUR_ACCESS_TOKEN'
    }
  });
  
  const data = await response.json();
  console.log('Reminder status:', data);
};

checkReminderStatus('test-123');
```

## 6. Test Pill Verification

### Verify Medication

1. When a reminder appears, click "ली" (Taken)
2. It will ask to verify the pill
3. Take a photo of the medication
4. ✅ Should use Gemini Vision to verify
5. ✅ Should show confidence score
6. ✅ Should mark as taken if verified

## 7. Test Offline Mode

### Go Offline

1. Open app in browser
2. Open DevTools → Network
3. Check "Offline" mode
4. ✅ Should show "ऑफलाइन मोड" banner

### Add Medication Offline

1. While offline, try to upload prescription
2. ✅ Should queue the action
3. ✅ Should show pending count

### Sync When Back Online

1. Disable offline mode
2. ✅ Should automatically sync
3. ✅ Should show "सिंक हो रहा है..." banner
4. ✅ Pending count should decrease

## 8. Test PWA Installation

### Install on Mobile (Android)

1. Open app in Chrome on Android
2. Tap "Add to Home Screen" prompt
3. ✅ App should install
4. ✅ App icon should appear on home screen
5. ✅ App should open in fullscreen mode

### Install on Desktop

1. Open app in Chrome
2. Click install icon in address bar
3. ✅ App should install
4. ✅ Can launch from desktop

## 9. Test Notifications

### Enable Notifications

1. When prompted, click "Allow"
2. ✅ Browser should request notification permission

### Test Push Notification

```javascript
// Test notification
if (Notification.permission === 'granted') {
  new Notification('दवाई का समय', {
    body: 'मेटफोर्मिन लेने का समय हो गया है',
    icon: '/icon-192.png',
    badge: '/icon-72.png',
    vibrate: [200, 100, 200]
  });
}
```

## 10. Test Voice Features

### Voice Instructions

1. Enable voice in settings
2. Navigate through app
3. ✅ Should hear voice feedback for actions
4. ✅ Should work in both Hindi and English

## 11. Performance Testing

### Load Testing

1. Add 20+ medications
2. ✅ Dashboard should load quickly
3. ✅ Scrolling should be smooth
4. ✅ No memory leaks

### Image Processing

1. Upload large prescription image (5MB)
2. ✅ Should compress before upload
3. ✅ Should process within reasonable time (< 30 seconds)
4. ✅ Should show progress indicator

## 12. Security Testing

### Test RLS Policies

1. Try accessing another user's medications via API
2. ✅ Should return 403 Forbidden

### Test Authentication

1. Try accessing dashboard without login
2. ✅ Should redirect to home page

### Test CORS

1. Try calling API from different domain
2. ✅ Should block if not whitelisted

## 13. Browser Compatibility

Test on:
- ✅ Chrome (Desktop & Mobile)
- ✅ Firefox (Desktop & Mobile)
- ✅ Safari (Desktop & Mobile)
- ✅ Edge (Desktop)

## 14. Error Handling

### Network Errors

1. Disable internet during action
2. ✅ Should show error message
3. ✅ Should retry when connection restored

### Invalid Data

1. Upload non-prescription image
2. ✅ Should show appropriate error
3. ✅ Should allow retry

### API Errors

1. Provide invalid auth token
2. ✅ Should show "Unauthorized" error
3. ✅ Should prompt to login again

## 15. Accessibility Testing

### Keyboard Navigation

1. Navigate using Tab key
2. ✅ All buttons should be focusable
3. ✅ Focus indicators should be visible

### Screen Reader

1. Use screen reader (NVDA/JAWS)
2. ✅ All content should be announced
3. ✅ Form labels should be associated

### Color Contrast

1. Check with WCAG contrast checker
2. ✅ All text should meet AA standards
3. ✅ Interactive elements should be distinguishable

## Test Checklist

- [ ] User signup works
- [ ] User login works
- [ ] Language switching works (Hindi ↔ English)
- [ ] Prescription upload via camera works
- [ ] Prescription upload via gallery works
- [ ] Gemini OCR extracts medications correctly
- [ ] Medications visible on dashboard after upload
- [ ] Twilio voice call is made successfully
- [ ] Hindi voice prompt is heard correctly
- [ ] DTMF keypress 1 marks medication as taken
- [ ] DTMF keypress 9 snoozes reminder for 15 minutes
- [ ] Pill verification works with camera
- [ ] Offline mode queues actions
- [ ] Sync works when back online
- [ ] PWA can be installed
- [ ] Push notifications work
- [ ] Voice feedback works in both languages
- [ ] Settings page updates preferences
- [ ] Logout works correctly
- [ ] Performance is acceptable with 20+ medications
- [ ] Security measures prevent unauthorized access

## Troubleshooting

### Prescription not processing
- Check Gemini API key is set
- Check image size (< 10MB)
- Check image format (JPEG/PNG)
- Review Supabase Edge Function logs

### Twilio call not working
- Verify credentials in Supabase
- Check phone number format (+country code)
- Check Twilio account balance
- Review call logs in Twilio console

### Medications not showing on dashboard
- Check browser console for errors
- Verify user is logged in
- Check Supabase RLS policies
- Try refreshing the page

### Language not switching
- Clear browser cache
- Check LanguageContext is wrapped in App
- Verify translations exist for all keys

---

**Report Issues:**
- Check browser console for errors
- Review Supabase logs
- Check network tab for failed requests
- Document steps to reproduce
