# Aarogya Setu - System Architecture

This document describes the complete architecture of the Aarogya Setu medication adherence PWA.

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (PWA)                           │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────┐   │
│  │   React     │  │  IndexedDB   │  │  Service Worker     │   │
│  │   + Hooks   │  │  (Offline)   │  │  (Push & Cache)     │   │
│  └─────────────┘  └──────────────┘  └─────────────────────┘   │
│         │                  │                    │               │
└─────────┼──────────────────┼────────────────────┼───────────────┘
          │                  │                    │
          ▼                  ▼                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Supabase Backend                            │
│  ┌──────────┐  ┌───────────┐  ┌─────────┐  ┌──────────────┐   │
│  │   Auth   │  │ Postgres  │  │ Storage │  │ Edge Funcs   │   │
│  │  (OTP)   │  │  + RLS    │  │ (Images)│  │  (Gemini)    │   │
│  └──────────┘  └───────────┘  └─────────┘  └──────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
                    ┌────────────────────┐
                    │   External APIs    │
                    │  • Gemini Vision   │
                    │  • Gemini Pro      │
                    │  • Twilio (SMS)    │
                    └────────────────────┘
```

## Component Architecture

### 1. Frontend Layer

#### React Components

```
App.tsx
├── OnboardingFlow
│   ├── Role Selection
│   ├── User Info
│   └── Permissions
│
├── Dashboard (Patient)
│   ├── Stats Cards
│   ├── Upcoming Reminders
│   └── Medication List
│
├── UploadPrescription
│   ├── Camera Capture
│   ├── Processing View
│   └── Confirmation
│
├── VerificationFlow
│   ├── Choice Screen
│   ├── Camera Capture
│   └── Result Display
│
├── EditMedication
│   └── Form Fields
│
├── CaregiverDashboard
│   ├── Patient List
│   ├── Adherence Charts
│   └── Alert Panel
│
├── ProviderDashboard
│   ├── Patient Overview
│   ├── Statistics
│   └── High-Risk Alerts
│
└── Settings
    ├── Notifications
    ├── Language
    ├── Privacy
    └── Data Management
```

#### Custom Hooks

```typescript
// Authentication & User Management
useAuth()
  - signIn(phone, otp)
  - signUp(name, phone, role, emergencyContact)
  - signOut()
  - user state

// Offline Data Sync
useOfflineSync()
  - saveDoseEvent(event)
  - saveMedication(medication)
  - getMedications()
  - saveReminder(reminder)
  - syncPendingEvents()
  - syncStatus, pendingCount

// Push Notifications
useNotifications()
  - requestPermission()
  - subscribeToPush()
  - showNotification(title, options)
  - permission, isSupported

// Voice Interface
useSpeech()
  - speak(text, lang)
  - startListening()
  - stopListening()
  - transcript, isListening, isSpeaking

// Service Worker Management
useServiceWorker()
  - registration
  - updateAvailable
  - isOnline
  - updateServiceWorker()
```

### 2. Data Layer

#### IndexedDB Schema

```typescript
interface AarogyaDB {
  // Dose events (for offline sync)
  doseEvents: {
    id: string
    medicationId: string
    scheduledTime: string
    takenAt?: string
    status: 'pending' | 'taken' | 'missed' | 'skipped'
    verificationImageUrl?: string
    notes?: string
    synced: boolean
    createdAt: string
  }

  // Medications (cached for offline)
  medications: {
    id: string
    name: string
    strength: string
    dosage: string
    frequency: string
    timing: string[]
    duration: string
    instructions: string
    imageUrl?: string
    createdAt: string
  }

  // Reminders (next 24 hours cached)
  reminders: {
    id: string
    medicationId: string
    scheduledTime: string
    message: string
    tone: string
    notified: boolean
  }
}
```

#### Supabase Database Schema

```sql
-- Core tables
profiles              (user accounts)
medications           (medication details)
dose_schedules        (scheduled reminders)
dose_events           (adherence tracking)

-- Relationships
caregivers            (patient-caregiver links)
provider_integrations (patient-provider links)

-- System
web_push_subscriptions (push endpoints)
ai_recommendations     (AI-generated suggestions)
alerts                 (system alerts & escalations)
```

### 3. Backend Layer (Supabase)

#### Edge Functions

**parse-prescription**
```
Input: { imageUrl: string }
Process:
  1. Get signed URL from Storage
  2. Call Gemini Vision API
  3. Extract medication data (JSON)
  4. Return structured medications
Output: { medications: Medication[] }
```

**verify-pill**
```
Input: { imageUrl: string, expectedMedication: string }
Process:
  1. Get signed URL from Storage
  2. Call Gemini Vision API
  3. Compare with expected medication
  4. Analyze safety concerns
Output: { 
  match: boolean,
  confidence: number,
  reasons: string[],
  safetyFlags: string[]
}
```

**agent-recommendation**
```
Input: { userId: string }
Process:
  1. Fetch 30-day adherence history
  2. Analyze patterns with Gemini Pro
  3. Generate personalized recommendations
  4. Save to ai_recommendations table
Output: {
  optimizedTimings: string[],
  messageStyle: 'gentle' | 'encouraging' | 'firm',
  personalizedMessages: string[],
  concernLevel: 'low' | 'medium' | 'high'
}
```

**send-push**
```
Input: { 
  userId: string, 
  title: string, 
  body: string, 
  data: object 
}
Process:
  1. Get active subscriptions for user
  2. Send push to each endpoint (VAPID)
  3. Handle failed subscriptions
  4. Update subscription status
Output: { sent: number, failed: number }
```

**check-reminders** (Cron)
```
Schedule: Every 5 minutes
Process:
  1. Get reminders for next 15 minutes
  2. Send push notifications
  3. Mark as notified
  4. Log notification events
```

**escalate-missed-doses** (Cron)
```
Schedule: Hourly
Process:
  1. Find patients with 3+ missed doses
  2. Create high-priority alerts
  3. Notify caregivers (push + email)
  4. Send SMS if critical (Twilio)
```

## Data Flow Diagrams

### Prescription Upload Flow

```
┌──────────┐
│  User    │ Captures prescription photo
└────┬─────┘
     │
     ▼
┌─────────────────┐
│  Camera API     │ File object created
└────┬────────────┘
     │
     ▼
┌─────────────────┐
│  Frontend       │ Upload to Supabase Storage
└────┬────────────┘
     │
     ▼
┌─────────────────────┐
│  Supabase Storage   │ Store image, return path
└────┬────────────────┘
     │
     ▼
┌─────────────────────┐
│  Edge Function      │ parse-prescription
│  (Gemini Vision)    │ Extract medication data
└────┬────────────────┘
     │
     ▼
┌─────────────────┐
│  Frontend       │ Display for confirmation
└────┬────────────┘
     │ User confirms
     ▼
┌─────────────────────┐
│  Supabase Postgres  │ Save medications
│                     │ Generate schedules
└─────────────────────┘
```

### Pill Verification Flow

```
┌──────────┐
│  User    │ Takes pill photo
└────┬─────┘
     │
     ▼
┌─────────────────┐
│  Camera API     │ Capture image
└────┬────────────┘
     │
     ▼
┌─────────────────┐
│  Frontend       │ Upload to Storage
└────┬────────────┘
     │
     ▼
┌─────────────────────┐
│  Edge Function      │ verify-pill
│  (Gemini Vision)    │ Compare with expected
└────┬────────────────┘
     │
     ▼
┌─────────────────┐
│  Frontend       │ Show match result
└────┬────────────┘
     │ If match
     ▼
┌─────────────────────┐
│  IndexedDB          │ Log dose event locally
└────┬────────────────┘
     │
     ▼
┌─────────────────────┐
│  Supabase Postgres  │ Sync when online
│                     │ Update adherence
└─────────────────────┘
```

### Reminder Notification Flow

```
┌─────────────────────┐
│  Cron Job (5 min)   │ check-reminders
└────┬────────────────┘
     │
     ▼
┌─────────────────────┐
│  Edge Function      │ Get upcoming reminders
└────┬────────────────┘
     │
     ▼
┌─────────────────────┐
│  Postgres Query     │ dose_schedules WHERE
│                     │ time < now + 15min
└────┬────────────────┘
     │
     ▼
┌─────────────────────┐
│  send-push          │ For each reminder
│  Edge Function      │
└────┬────────────────┘
     │
     ▼
┌─────────────────────────┐
│  web_push_subscriptions │ Get user's endpoints
└────┬────────────────────┘
     │
     ▼
┌─────────────────────┐
│  Web Push API       │ Send notification (VAPID)
└────┬────────────────┘
     │
     ▼
┌─────────────────────┐
│  Service Worker     │ Receive push event
└────┬────────────────┘
     │
     ▼
┌─────────────────────┐
│  Notification API   │ Show notification
│                     │ (even if app closed)
└─────────────────────┘
```

### Offline Sync Flow

```
┌──────────┐
│  User    │ Logs dose (offline)
└────┬─────┘
     │
     ▼
┌─────────────────┐
│  Frontend       │ Save immediately
└────┬────────────┘
     │
     ▼
┌─────────────────┐
│  IndexedDB      │ Store with synced=false
└────┬────────────┘
     │
     │ Device comes online
     ▼
┌─────────────────┐
│  Service Worker │ Background Sync event
└────┬────────────┘
     │
     ▼
┌─────────────────┐
│  useOfflineSync │ syncPendingEvents()
└────┬────────────┘
     │
     ▼
┌─────────────────────┐
│  Supabase API       │ POST dose_events
└────┬────────────────┘
     │ Success
     ▼
┌─────────────────┐
│  IndexedDB      │ Update synced=true
└─────────────────┘
```

## Security Architecture

### Authentication Flow

```
User Phone Number
      │
      ▼
┌──────────────────┐
│  Supabase Auth   │ Send OTP via SMS
└────┬─────────────┘
     │
     ▼
User Enters OTP
     │
     ▼
┌──────────────────┐
│  Supabase Auth   │ Verify OTP
└────┬─────────────┘
     │ Valid
     ▼
┌──────────────────┐
│  JWT Token       │ Stored in browser
└────┬─────────────┘
     │
     ▼
All API Requests Include JWT
```

### Row Level Security (RLS)

```sql
-- Example: Medications table
CREATE POLICY "Users can view own medications"
  ON medications FOR SELECT
  USING (auth.uid() = user_id);

-- Caregivers can also view if approved
CREATE POLICY "Caregivers can view patient medications"
  ON medications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM caregivers
      WHERE caregivers.patient_id = medications.user_id
        AND caregivers.caregiver_id = auth.uid()
        AND caregivers.approved = true
    )
  );
```

### Image Access Control

```
1. User uploads image
     ↓
2. Stored in user-specific folder: /{user_id}/{filename}
     ↓
3. Storage bucket policy: Only owner can access
     ↓
4. For temporary access: Generate signed URL (60s expiry)
     ↓
5. Edge Functions use service role to access
```

## Performance Optimizations

### 1. Code Splitting

```javascript
// Lazy load routes
const Dashboard = lazy(() => import('./components/Dashboard'))
const CaregiverDashboard = lazy(() => import('./components/CaregiverDashboard'))

// Vendor splitting (vite.config.ts)
manualChunks: {
  'react-vendor': ['react', 'react-dom'],
  'ui-vendor': ['lucide-react'],
  'radix-vendor': ['@radix-ui/react-*']
}
```

### 2. Caching Strategy

```
App Shell:        Cache-First (permanent)
Images:           Cache-First (30 days)
API Responses:    Network-First (with fallback)
Fonts:            Cache-First (1 year)
Prescription Images: Network-only (privacy)
```

### 3. Database Indexes

```sql
-- Critical indexes for performance
CREATE INDEX idx_medications_user_id ON medications(user_id);
CREATE INDEX idx_dose_events_scheduled_time ON dose_events(scheduled_time);
CREATE INDEX idx_dose_schedules_scheduled_time ON dose_schedules(scheduled_time);
CREATE INDEX idx_dose_events_status ON dose_events(status);
```

### 4. Image Optimization

```
1. Compress on upload (80% quality JPEG)
2. Generate thumbnails server-side
3. Use WebP format when supported
4. Lazy load images below fold
5. Progressive JPEG for large images
```

## Scalability Considerations

### Current Architecture Supports

- **Users**: Up to 100,000 active users
- **Medications**: ~3-5 per user average
- **Daily Events**: ~500,000 dose logs/day
- **Storage**: ~10GB images (with compression)
- **Push Notifications**: ~1 million/day

### Scaling Strategy

**Phase 1** (0-10K users)
- Single Supabase project
- Default Edge Function limits
- Basic monitoring

**Phase 2** (10K-50K users)
- Enable Supabase connection pooling
- Upgrade Edge Function compute
- Implement CDN for static assets
- Add read replicas

**Phase 3** (50K+ users)
- Multi-region deployment
- Separate read/write databases
- Queue system for notifications
- Advanced caching layer

## Monitoring & Observability

### Key Metrics to Track

**User Metrics**
- Daily Active Users (DAU)
- Weekly Active Users (WAU)
- Average adherence rate
- Notification click-through rate

**Technical Metrics**
- API response time (p50, p95, p99)
- Edge Function execution time
- IndexedDB operation time
- Service Worker cache hit rate

**Business Metrics**
- Prescription upload success rate
- Pill verification accuracy
- Caregiver engagement
- Provider integration usage

### Logging Strategy

```typescript
// Structured logging
{
  timestamp: "2024-01-15T10:30:00Z",
  level: "info",
  event: "dose_logged",
  userId: "user-123",
  medicationId: "med-456",
  status: "taken",
  verified: true,
  offline: false
}
```

## Disaster Recovery

### Backup Strategy

1. **Database**: Automatic daily backups (Supabase)
2. **Images**: Replicated across regions (Supabase Storage)
3. **User Data Export**: On-demand via Settings

### Recovery Plan

**Scenario 1: Database Corruption**
- Restore from latest backup (up to 24hr data loss)
- Replay offline events from user devices

**Scenario 2: Storage Failure**
- Access replica in different region
- Regenerate thumbnails if needed

**Scenario 3: Edge Function Failure**
- Graceful degradation to offline mode
- Queue AI operations for later

## Compliance & Privacy

### Data Retention

- **Dose Events**: 2 years
- **Prescription Images**: 1 year (user can delete anytime)
- **Verification Images**: 90 days
- **User Profiles**: Until account deletion

### GDPR Compliance

- ✅ Right to access (data export)
- ✅ Right to deletion (account deletion flow)
- ✅ Right to portability (JSON export)
- ✅ Consent management (explicit opt-ins)
- ✅ Data minimization (only necessary data)

### HIPAA Considerations

⚠️ For HIPAA compliance in production:
- Sign Business Associate Agreement (BAA)
- Enable audit logging
- Implement encryption at rest (already enabled)
- Add access controls
- Regular security audits

---

**Architecture Review Date**: November 2024
**Next Review**: May 2025
**Owner**: Development Team
