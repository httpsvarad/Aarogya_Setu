import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { useSpeech } from '../hooks/useSpeech';
import { useOfflineSync } from '../hooks/useOfflineSync';
import { useMedications } from '../hooks/useMedications';
import { Camera, Plus, Settings as SettingsIcon, Volume2, CheckCircle2, Clock, AlertCircle, Bell } from 'lucide-react';
import logoImage from 'figma:asset/49b3fc8fbe189ff80bcb3cecfcaf8b9a5a1bd523.png';

interface DashboardProps {
  onUploadPrescription: () => void;
  onEditMedication: (med: any) => void;
  onVerifyDose: (reminder: any) => void;
  onSettings: () => void;
  onReminders: () => void;
}

export function Dashboard({
  onUploadPrescription,
  onEditMedication,
  onVerifyDose,
  onSettings,
  onReminders
}: DashboardProps) {
  const { speak } = useSpeech();
  const { getMedications: getLocalMedications, saveDoseEvent } = useOfflineSync();
  const { medications: serverMedications, loading } = useMedications();
  const [medications, setMedications] = useState<any[]>([]);
  const [upcomingReminders, setUpcomingReminders] = useState<any[]>([]);
  const [todayStats, setTodayStats] = useState({
    taken: 3,
    upcoming: 2,
    missed: 0
  });

  useEffect(() => {
    loadData();
  }, [serverMedications]);

  const loadData = async () => {
    // Merge server medications with local ones
    const allMeds = serverMedications.length > 0 ? serverMedications : [];
    
    if (allMeds.length > 0) {
      setMedications(allMeds);
    } else {
      // Load from IndexedDB as fallback
      const meds = await getLocalMedications();
      if (meds.length > 0) {
        setMedications(meds);
      } else {
        // Mock data for demo - only if no medications exist
        setMedications([]);
      }
    }

    // Mock upcoming reminders
    setUpcomingReminders([
      {
        id: 'r1',
        medicationId: '1',
        medicationName: 'मेटफोर्मिन',
        scheduledTime: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        message: 'मेटफोर्मिन लेने का समय हो गया है',
        tone: 'gentle'
      },
      {
        id: 'r2',
        medicationId: '2',
        medicationName: 'एस्पिरिन',
        scheduledTime: new Date(Date.now() + 90 * 60 * 1000).toISOString(),
        message: 'एस्पिरिन लेना न भूलें',
        tone: 'encouraging'
      }
    ]);
  };

  const handleTakeDose = async (reminder: any) => {
    onVerifyDose(reminder);
  };

  const speakWelcome = () => {
    const now = new Date();
    const hour = now.getHours();
    let greeting = 'नमस्ते';
    if (hour < 12) greeting = 'सुप्रभात';
    else if (hour < 17) greeting = 'नमस्ते';
    else greeting = 'शुभ संध्या';

    speak(`${greeting}। आज आपको ${todayStats.upcoming} दवाइयां लेनी हैं।`);
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 0) return 'अभी';
    if (minutes < 60) return `${minutes} मिनट में`;
    const hours = Math.floor(minutes / 60);
    return `${hours} घंटे में`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl text-emerald-900">आरोग्य सेतु</h1>
              <p className="text-lg text-gray-600 mt-1">आपका स्वागत है</p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={speakWelcome}
                variant="outline"
                size="lg"
                className="h-14 w-14 rounded-full"
              >
                <Volume2 className="w-6 h-6" />
              </Button>
              <Button
                onClick={onSettings}
                variant="outline"
                size="lg"
                className="h-14 w-14 rounded-full"
              >
                <SettingsIcon className="w-6 h-6" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-6 text-center shadow-md">
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-2" />
            <p className="text-4xl mb-1">{todayStats.taken}</p>
            <p className="text-lg text-gray-600">ली गई</p>
          </div>
          <div className="bg-white rounded-2xl p-6 text-center shadow-md">
            <Clock className="w-12 h-12 text-blue-500 mx-auto mb-2" />
            <p className="text-4xl mb-1">{todayStats.upcoming}</p>
            <p className="text-lg text-gray-600">बाकी हैं</p>
          </div>
          <div className="bg-white rounded-2xl p-6 text-center shadow-md">
            <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-2" />
            <p className="text-4xl mb-1">{todayStats.missed}</p>
            <p className="text-lg text-gray-600">छूटी हुई</p>
          </div>
        </div>

        {/* Upcoming Reminders */}
        <div className="bg-white rounded-2xl p-6 shadow-md">
          <h2 className="text-2xl mb-4 text-emerald-900">आने वाली दवाइयां</h2>
          
          {upcomingReminders.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-xl text-gray-500">कोई आने वाली दवाई नहीं है</p>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingReminders.map((reminder) => (
                <div
                  key={reminder.id}
                  className="flex items-center justify-between p-6 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border-2 border-emerald-200"
                >
                  <div className="flex-1">
                    <p className="text-2xl mb-1">{reminder.medicationName}</p>
                    <p className="text-lg text-gray-600">
                      {formatTime(reminder.scheduledTime)}
                    </p>
                  </div>
                  <Button
                    onClick={() => handleTakeDose(reminder)}
                    size="lg"
                    className="h-16 px-8 text-xl bg-emerald-600 hover:bg-emerald-700"
                  >
                    ✓ ली
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* My Medications */}
        <div className="bg-white rounded-2xl p-6 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl text-emerald-900">मेरी दवाइयां</h2>
            <Button
              onClick={onUploadPrescription}
              size="lg"
              className="h-14 px-6 text-lg bg-emerald-600 hover:bg-emerald-700"
            >
              <Camera className="w-5 h-5 mr-2" />
              नया प्रिस्क्रिप्शन
            </Button>
          </div>

          {medications.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-xl">
              <Camera className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-xl text-gray-500 mb-4">
                अभी तक कोई दवाई नहीं जोड़ी गई
              </p>
              <Button
                onClick={onUploadPrescription}
                size="lg"
                className="h-16 px-8 text-xl bg-emerald-600 hover:bg-emerald-700"
              >
                <Camera className="w-6 h-6 mr-2" />
                प्रिस्क्रिप्शन की फोटो लें
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {medications.filter(med => med && med.id && med.name).map((med) => (
                <div
                  key={med.id}
                  onClick={() => onEditMedication(med)}
                  className="p-6 bg-gray-50 rounded-xl border-2 border-gray-200 hover:border-emerald-300 cursor-pointer transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-2xl mb-1">{med.name || 'Unknown Medicine'}</h3>
                      <p className="text-lg text-gray-600">{med.strength || ''}</p>
                    </div>
                    <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                      <span className="text-2xl">💊</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-base text-gray-700">
                    <p>📋 {med.dosage || ''} • {med.frequency || ''}</p>
                    <p>⏰ {med.timing?.join(', ') || 'No timing set'}</p>
                    <p>ℹ️ {med.instructions || 'No instructions'}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-4">
          <Button
            onClick={onReminders}
            size="lg"
            className="h-20 text-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          >
            <Bell className="w-6 h-6 mr-2" />
            रिमाइंडर प्रबंधन
          </Button>
          <Button
            onClick={onUploadPrescription}
            size="lg"
            variant="outline"
            className="h-20 text-xl border-2"
          >
            <Camera className="w-6 h-6 mr-2" />
            नया प्रिस्क्रिप्शन
          </Button>
          <Button
            onClick={onSettings}
            size="lg"
            variant="outline"
            className="h-20 text-xl border-2"
          >
            <SettingsIcon className="w-6 h-6 mr-2" />
            सेटिंग्स
          </Button>
        </div>
      </div>
    </div>
  );
}