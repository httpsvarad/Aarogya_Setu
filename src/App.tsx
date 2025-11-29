import { useState, useEffect } from 'react';
import { HomePage } from './components/HomePage';
import { Dashboard } from './components/Dashboard';
import { UploadPrescription } from './components/UploadPrescription';
import { EditMedication } from './components/EditMedication';
import { VerificationFlow } from './components/VerificationFlow';
import { CaregiverDashboard } from './components/CaregiverDashboard';
import { ProviderDashboard } from './components/ProviderDashboard';
import { Settings } from './components/Settings';
import { RemindersPage } from './components/RemindersPage';
import { useAuth } from './hooks/useAuth';
import { useNotifications } from './hooks/useNotifications';
import { useOfflineSync } from './hooks/useOfflineSync';
import { useServiceWorker } from './hooks/useServiceWorker';
import { Button } from './components/ui/button';
import { RefreshCw } from 'lucide-react';

export type UserRole = 'patient' | 'caregiver' | 'provider';

export interface User {
  id: string;
  role: UserRole;
  name: string;
  phone: string;
  preferredLanguage: string;
}

function App() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const { requestPermission, isSupported } = useNotifications();
  const { syncStatus, pendingCount } = useOfflineSync();
  const { updateAvailable, updateServiceWorker } = useServiceWorker();
  const [currentScreen, setCurrentScreen] = useState<string>('dashboard');
  const [selectedMedication, setSelectedMedication] = useState<any>(null);
  const [reminderToVerify, setReminderToVerify] = useState<any>(null);

  // Request notification permission on mount
  useEffect(() => {
    if (isAuthenticated && isSupported) {
      requestPermission();
    }
  }, [isAuthenticated, isSupported]);

  // Show onboarding if no user
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-emerald-900">लोड हो रहा है...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <HomePage />;
  }

  // Route based on user role
  if (user.role === 'caregiver') {
    return <CaregiverDashboard />;
  }

  if (user.role === 'provider') {
    return <ProviderDashboard />;
  }

  // Patient interface
  const renderScreen = () => {
    switch (currentScreen) {
      case 'upload':
        return (
          <UploadPrescription
            onComplete={() => setCurrentScreen('dashboard')}
            onBack={() => setCurrentScreen('dashboard')}
          />
        );
      case 'edit':
        return (
          <EditMedication
            medication={selectedMedication}
            onSave={() => setCurrentScreen('dashboard')}
            onBack={() => setCurrentScreen('dashboard')}
          />
        );
      case 'verify':
        return (
          <VerificationFlow
            reminder={reminderToVerify}
            onComplete={() => setCurrentScreen('dashboard')}
            onBack={() => setCurrentScreen('dashboard')}
          />
        );
      case 'settings':
        return (
          <Settings
            onBack={() => setCurrentScreen('dashboard')}
          />
        );
      case 'reminders':
        return (
          <RemindersPage
            onBack={() => setCurrentScreen('dashboard')}
          />
        );
      default:
        return (
          <Dashboard
            onUploadPrescription={() => setCurrentScreen('upload')}
            onEditMedication={(med) => {
              setSelectedMedication(med);
              setCurrentScreen('edit');
            }}
            onVerifyDose={(reminder) => {
              setReminderToVerify(reminder);
              setCurrentScreen('verify');
            }}
            onSettings={() => setCurrentScreen('settings')}
            onReminders={() => setCurrentScreen('reminders')}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50">
      {/* Offline indicator */}
      {!navigator.onLine && (
        <div className="fixed top-0 left-0 right-0 bg-amber-500 text-white text-center py-2 z-50">
          <p className="text-sm">ऑफलाइन मोड • {pendingCount > 0 && `${pendingCount} इवेंट सिंक होने बाकी हैं`}</p>
        </div>
      )}
      
      {/* Sync status indicator */}
      {syncStatus === 'syncing' && (
        <div className="fixed top-0 left-0 right-0 bg-blue-500 text-white text-center py-2 z-50">
          <p className="text-sm">सिंक हो रहा है...</p>
        </div>
      )}

      {/* Update available indicator */}
      {updateAvailable && (
        <div className="fixed top-0 left-0 right-0 bg-green-500 text-white text-center py-2 z-50">
          <p className="text-sm">अपडेट उपलब्ध • <Button onClick={updateServiceWorker} className="text-white"><RefreshCw size={16} /> अपडेट करें</Button></p>
        </div>
      )}

      {renderScreen()}
    </div>
  );
}

export default App;