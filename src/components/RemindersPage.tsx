import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { useReminders, Reminder } from '../hooks/useReminders';
import { useMedications } from '../hooks/useMedications';
import { useTwilio } from '../hooks/useTwilio';
import { 
  ArrowLeft, 
  Plus, 
  Edit, 
  Trash2, 
  Phone, 
  MessageSquare, 
  Bell,
  Clock,
  Calendar,
  CheckCircle2,
  XCircle,
  Pause,
  History,
  FlaskConical,
  PhoneCall
} from 'lucide-react';
import logoImage from 'figma:asset/49b3fc8fbe189ff80bcb3cecfcaf8b9a5a1bd523.png';

interface RemindersPageProps {
  onBack: () => void;
}

export function RemindersPage({ onBack }: RemindersPageProps) {
  const { 
    reminders, 
    doseHistory, 
    callLogs, 
    loading,
    createReminder,
    updateReminder,
    deleteReminder,
    toggleReminder,
    getTodayStats
  } = useReminders();
  const { medications, loading: medicationsLoading, loadMedications, addMedication } = useMedications();
  const { makeCall } = useTwilio();

  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [activeTab, setActiveTab] = useState<'reminders' | 'history' | 'calls'>('reminders');
  const [testCallLoading, setTestCallLoading] = useState(false);
  const [showTestCallDialog, setShowTestCallDialog] = useState(false);
  const [testPhoneNumber, setTestPhoneNumber] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    medication_id: '',
    medication_name: '',
    scheduled_time: '09:00',
    days_of_week: [1, 2, 3, 4, 5, 6, 0], // All days
    enabled: true,
    call_enabled: true,
    sms_enabled: false,
    push_enabled: true,
    tone: 'gentle' as const
  });

  // Refresh medications when component mounts
  useEffect(() => {
    console.log('RemindersPage mounted, loading medications...');
    loadMedications();
  }, []);

  // Debug: log medications when they change
  useEffect(() => {
    console.log('[RemindersPage] Medications loaded:', medications);
    console.log('[RemindersPage] Medications count:', medications.length);
    if (medications.length > 0) {
      console.log('[RemindersPage] First medication:', medications[0]);
    }
  }, [medications]);

  const stats = getTodayStats();

  const daysOfWeek = [
    { value: 0, label: 'रवि', labelEn: 'Sun' },
    { value: 1, label: 'सोम', labelEn: 'Mon' },
    { value: 2, label: 'मंगल', labelEn: 'Tue' },
    { value: 3, label: 'बुध', labelEn: 'Wed' },
    { value: 4, label: 'गुरु', labelEn: 'Thu' },
    { value: 5, label: 'शुक्र', labelEn: 'Fri' },
    { value: 6, label: 'शनि', labelEn: 'Sat' }
  ];

  const handleEditReminder = (reminder: Reminder) => {
    setEditingReminder(reminder);
    setFormData({
      medication_id: reminder.medication_id,
      medication_name: reminder.medication_name,
      scheduled_time: reminder.scheduled_time,
      days_of_week: reminder.days_of_week,
      enabled: reminder.enabled,
      call_enabled: reminder.call_enabled,
      sms_enabled: reminder.sms_enabled,
      push_enabled: reminder.push_enabled,
      tone: reminder.tone
    });
    setShowEditDialog(true);
  };

  const handleCreateReminder = () => {
    setEditingReminder(null);
    const firstMed = medications.find(m => m && m.id) || null;
    setFormData({
      medication_id: firstMed?.id || '',
      medication_name: firstMed?.name || '',
      scheduled_time: '09:00',
      days_of_week: [1, 2, 3, 4, 5, 6, 0],
      enabled: true,
      call_enabled: true,
      sms_enabled: false,
      push_enabled: true,
      tone: 'gentle'
    });
    setShowEditDialog(true);
  };

  const handleSaveReminder = async () => {
    // Validate medication_id
    if (!formData.medication_id || formData.medication_id === '') {
      alert('कृपया एक दवाई चुनें');
      return;
    }
    
    // Validate medication exists
    const med = medications.find(m => m && m.id === formData.medication_id);
    if (!med) {
      alert('चयनित दवाई अमान्य है। कृपया दूसरी दवाई चुनें।');
      return;
    }
    
    if (editingReminder) {
      const result = await updateReminder(editingReminder.id, formData);
      if (result.success) {
        setShowEditDialog(false);
      }
    } else {
      const result = await createReminder(formData);
      if (result.success) {
        setShowEditDialog(false);
      }
    }
  };

  const handleDeleteReminder = async (id: string) => {
    if (confirm('क्या आप यह रिमाइंडर हटाना चाहते हैं?')) {
      await deleteReminder(id);
    }
  };

  const toggleDay = (day: number) => {
    if (formData.days_of_week.includes(day)) {
      setFormData({
        ...formData,
        days_of_week: formData.days_of_week.filter(d => d !== day)
      });
    } else {
      setFormData({
        ...formData,
        days_of_week: [...formData.days_of_week, day].sort()
      });
    }
  };

  const formatTime12Hour = (time24: string) => {
    const [hours, minutes] = time24.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'taken': return 'text-green-600 bg-green-50';
      case 'missed': return 'text-red-600 bg-red-50';
      case 'snoozed': return 'text-amber-600 bg-amber-50';
      case 'pending': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'taken': return <CheckCircle2 className="w-5 h-5" />;
      case 'missed': return <XCircle className="w-5 h-5" />;
      case 'snoozed': return <Pause className="w-5 h-5" />;
      default: return <Clock className="w-5 h-5" />;
    }
  };

  // Test function to add sample medications
  const handleAddTestMedication = async () => {
    const testMeds = [
      {
        name: 'Paracetamol',
        strength: '500mg',
        dosage: '1 tablet',
        frequency: 'Twice daily',
        timing: ['Morning', 'Evening'],
        duration: '7 days',
        instructions: 'After food'
      },
      {
        name: 'Vitamin D',
        strength: '60000 IU',
        dosage: '1 capsule',
        frequency: 'Once weekly',
        timing: ['Morning'],
        duration: '8 weeks',
        instructions: 'With breakfast'
      },
      {
        name: 'Calcium',
        strength: '500mg',
        dosage: '1 tablet',
        frequency: 'Once daily',
        timing: ['Night'],
        duration: '1 month',
        instructions: 'Before bed'
      }
    ];

    for (const med of testMeds) {
      await addMedication(med);
    }

    // Reload medications
    await loadMedications();
  };

  const handleTestCall = async () => {
    if (!testPhoneNumber) {
      alert('कृपया एक फोन नंबर दर्ज करें।');
      return;
    }

    setTestCallLoading(true);
    try {
      const result = await makeCall(
        testPhoneNumber,
        'टेस्ट दवाई', // Test medication name in Hindi
        'test-reminder-' + Date.now() // Generate unique test reminder ID
      );
      if (result.success) {
        alert('✅ कॉल सफलतापूर्वक शुरू किया गया है! कृपया अपने फोन की जाँच करें।');
        setShowTestCallDialog(false);
        setTestPhoneNumber('');
      } else {
        alert(`❌ कॉल शुरू करने में विफलता: ${result.error || 'अज्ञात त्रुटि'}`);
      }
    } catch (error: any) {
      console.error('कॉल करने में त्रुटि:', error);
      alert(`❌ कॉल करने में त्रुटि: ${error.message || 'अज्ञात त्रुटि'}`);
    } finally {
      setTestCallLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                onClick={onBack}
                variant="ghost"
                size="lg"
                className="h-12 w-12 rounded-full"
              >
                <ArrowLeft className="w-6 h-6" />
              </Button>
              <div>
                <h1 className="text-3xl text-emerald-900">रिमाइंडर प्रबंधन</h1>
                <p className="text-lg text-gray-600">अपने सभी रिमाइंडर देखें और संपादित करें</p>
              </div>
            </div>
            <img src={logoImage} alt="Logo" className="w-16 h-16" />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-6 text-center shadow-md">
            <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-2" />
            <p className="text-3xl mb-1">{stats.taken}</p>
            <p className="text-base text-gray-600">आज ली गई</p>
          </div>
          <div className="bg-white rounded-2xl p-6 text-center shadow-md">
            <XCircle className="w-10 h-10 text-red-500 mx-auto mb-2" />
            <p className="text-3xl mb-1">{stats.missed}</p>
            <p className="text-base text-gray-600">छूटी हुई</p>
          </div>
          <div className="bg-white rounded-2xl p-6 text-center shadow-md">
            <Clock className="w-10 h-10 text-blue-500 mx-auto mb-2" />
            <p className="text-3xl mb-1">{stats.pending}</p>
            <p className="text-base text-gray-600">बाकी हैं</p>
          </div>
          <div className="bg-white rounded-2xl p-6 text-center shadow-md">
            <Bell className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <p className="text-3xl mb-1">{reminders.filter(r => r.enabled).length}</p>
            <p className="text-base text-gray-600">सक्रिय रिमाइंडर</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-md overflow-hidden">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('reminders')}
              className={`flex-1 px-6 py-4 text-lg transition-colors ${
                activeTab === 'reminders'
                  ? 'bg-emerald-50 text-emerald-700 border-b-2 border-emerald-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Bell className="w-5 h-5 inline-block mr-2" />
              सक्रिय रिमाइंडर
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex-1 px-6 py-4 text-lg transition-colors ${
                activeTab === 'history'
                  ? 'bg-emerald-50 text-emerald-700 border-b-2 border-emerald-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <History className="w-5 h-5 inline-block mr-2" />
              इतिहास
            </button>
            <button
              onClick={() => setActiveTab('calls')}
              className={`flex-1 px-6 py-4 text-lg transition-colors ${
                activeTab === 'calls'
                  ? 'bg-emerald-50 text-emerald-700 border-b-2 border-emerald-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Phone className="w-5 h-5 inline-block mr-2" />
              कॉल लॉग
            </button>
          </div>

          {/* Reminders Tab */}
          {activeTab === 'reminders' && (
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl">सभी रिमाइंडर</h2>
                  {medicationsLoading ? (
                    <p className="text-sm text-gray-500 mt-1">दवाइयां लोड हो रही हैं...</p>
                  ) : (
                    <div className="flex items-center gap-3 mt-1">
                      <p className="text-sm text-gray-500">
                        {medications.length} दवाइयां उपलब्ध
                      </p>
                      <button
                        onClick={loadMedications}
                        className="text-sm text-emerald-600 hover:text-emerald-700 underline"
                      >
                        🔄 रीफ्रेश करें
                      </button>
                    </div>
                  )}
                </div>
                <Button
                  onClick={handleCreateReminder}
                  size="lg"
                  className="h-14 px-6 text-lg bg-emerald-600 hover:bg-emerald-700"
                  disabled={medications.length === 0 || medicationsLoading}
                >
                  <Plus className="w-5 h-5 mr-2" />
                  नया रिमाइंडर
                </Button>
              </div>

              {medicationsLoading ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-xl text-gray-500">लोड हो रहा है...</p>
                </div>
              ) : medications.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-xl bg-amber-50">
                  <Bell className="w-16 h-16 text-amber-500 mx-auto mb-4" />
                  <p className="text-xl mb-2">कोई दवाई नहीं मिली</p>
                  <p className="text-base text-gray-600 mb-4">
                    पहले प्रिस्क्रिप्शन स्कैन करें, फिर रिमाइंडर बनाएं
                  </p>
                  <div className="flex gap-3 justify-center">
                    <Button
                      onClick={onBack}
                      size="lg"
                      className="h-14 px-6 text-lg"
                    >
                      Dashboard पर वापस जाएं
                    </Button>
                    <Button
                      onClick={handleAddTestMedication}
                      variant="outline"
                      size="lg"
                      className="h-14 px-6 text-lg border-2 border-purple-300 text-purple-700 hover:bg-purple-50"
                    >
                      <FlaskConical className="w-5 h-5 mr-2" />
                      टेस्ट दवाई जोड़ें
                    </Button>
                  </div>
                </div>
              ) : reminders.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-xl">
                  <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-xl text-gray-500 mb-4">कोई रिमाइंडर नहीं मिला</p>
                  {medications.length > 0 && (
                    <Button
                      onClick={handleCreateReminder}
                      size="lg"
                      className="h-14 px-6 text-lg"
                    >
                      <Plus className="w-5 h-5 mr-2" />
                      पहला रिमाइंडर बनाएं
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {reminders.map((reminder) => (
                    <div
                      key={reminder.id}
                      className={`p-6 rounded-xl border-2 transition-all ${
                        reminder.enabled
                          ? 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200'
                          : 'bg-gray-50 border-gray-200 opacity-60'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-2xl">{reminder.medication_name}</h3>
                            <Switch
                              checked={reminder.enabled}
                              onCheckedChange={(checked) => toggleReminder(reminder.id, checked)}
                            />
                          </div>

                          <div className="space-y-2 text-base text-gray-700">
                            <div className="flex items-center gap-2">
                              <Clock className="w-5 h-5 text-emerald-600" />
                              <span className="text-xl">{formatTime12Hour(reminder.scheduled_time)}</span>
                              <span className="text-2xl ml-2">⏰</span>
                            </div>

                            <div className="flex items-center gap-2">
                              <Calendar className="w-5 h-5 text-teal-600" />
                              <div className="flex gap-1">
                                {daysOfWeek.map((day) => (
                                  <span
                                    key={day.value}
                                    className={`px-2 py-1 rounded text-sm ${
                                      reminder.days_of_week.includes(day.value)
                                        ? 'bg-teal-600 text-white'
                                        : 'bg-gray-200 text-gray-400'
                                    }`}
                                  >
                                    {day.label}
                                  </span>
                                ))}
                              </div>
                            </div>

                            <div className="flex items-center gap-4 mt-3">
                              {reminder.call_enabled && (
                                <div className="flex items-center gap-1 px-3 py-1 bg-blue-100 rounded-full">
                                  <Phone className="w-4 h-4 text-blue-600" />
                                  <span className="text-sm text-blue-700">कॉल</span>
                                </div>
                              )}
                              {reminder.sms_enabled && (
                                <div className="flex items-center gap-1 px-3 py-1 bg-purple-100 rounded-full">
                                  <MessageSquare className="w-4 h-4 text-purple-600" />
                                  <span className="text-sm text-purple-700">SMS</span>
                                </div>
                              )}
                              {reminder.push_enabled && (
                                <div className="flex items-center gap-1 px-3 py-1 bg-green-100 rounded-full">
                                  <Bell className="w-4 h-4 text-green-600" />
                                  <span className="text-sm text-green-700">पुश</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleEditReminder(reminder)}
                            variant="outline"
                            size="lg"
                            className="h-12 w-12"
                          >
                            <Edit className="w-5 h-5" />
                          </Button>
                          <Button
                            onClick={() => handleDeleteReminder(reminder.id)}
                            variant="outline"
                            size="lg"
                            className="h-12 w-12 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-5 h-5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div className="p-6">
              <h2 className="text-2xl mb-6">दवाई लेने का इतिहास</h2>
              {doseHistory.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-xl">
                  <History className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-xl text-gray-500">कोई इतिहास नहीं मिला</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {doseHistory.map((dose) => (
                    <div
                      key={dose.id}
                      className="p-5 bg-white rounded-xl border border-gray-200 hover:border-gray-300 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-xl mb-1">{dose.medication_id}</p>
                          <p className="text-sm text-gray-600">
                            {new Date(dose.scheduled_time).toLocaleString('hi-IN', {
                              dateStyle: 'medium',
                              timeStyle: 'short'
                            })}
                          </p>
                          {dose.notes && (
                            <p className="text-sm text-gray-500 mt-1">💬 {dose.notes}</p>
                          )}
                        </div>
                        <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${getStatusColor(dose.status)}`}>
                          {getStatusIcon(dose.status)}
                          <span className="capitalize">{dose.status === 'taken' ? 'ली गई' : dose.status === 'missed' ? 'छूटी' : dose.status}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Call Logs Tab */}
          {activeTab === 'calls' && (
            <div className="p-6">
              <h2 className="text-2xl mb-6">कॉल लॉग</h2>
              {callLogs.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-xl">
                  <Phone className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-xl text-gray-500">कोई कॉल लॉग नहीं मिला</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {callLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-5 bg-white rounded-xl border border-gray-200 hover:border-gray-300 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <Phone className="w-5 h-5 text-blue-600" />
                            <p className="text-xl">{log.medication_name}</p>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">
                            {new Date(log.call_time).toLocaleString('hi-IN', {
                              dateStyle: 'medium',
                              timeStyle: 'short'
                            })}
                          </p>
                          <p className="text-sm text-gray-500">
                            अवधि: {log.call_duration}s
                            {log.dtmf_response && ` • प्रतिक्रिया: ${log.dtmf_response === '1' ? '✅ ली गई' : log.dtmf_response === '9' ? '⏰ स्नूज़' : log.dtmf_response}`}
                          </p>
                        </div>
                        <div className={`px-4 py-2 rounded-full text-sm ${
                          log.status === 'completed' ? 'bg-green-100 text-green-700' :
                          log.status === 'no_answer' ? 'bg-amber-100 text-amber-700' :
                          log.status === 'busy' ? 'bg-orange-100 text-orange-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {log.status === 'completed' ? '✅ पूर्ण' :
                           log.status === 'no_answer' ? '📵 नहीं उठाया' :
                           log.status === 'busy' ? '📞 व्यस्त' :
                           '❌ विफल'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Edit/Create Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {editingReminder ? 'रिमाइंडर संपादित करें' : 'नया रिमाइंडर बनाएं'}
            </DialogTitle>
            <DialogDescription className="sr-only">
              {editingReminder ? 'अपने दवाई रिमाइंडर को संपादित करें' : 'नया दवाई रिमाइंडर बनाएं'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Medication Selection */}
            <div>
              <Label className="text-lg mb-2 block">दवाई चुनें</Label>
              {medications.length === 0 ? (
                <div className="p-4 bg-amber-50 border-2 border-amber-200 rounded-lg">
                  <p className="text-base text-amber-800">
                    ⚠️ पहले दवाई जोड़ें। Dashboard से प्रिस्क्रिप्शन अपलोड करें।
                  </p>
                </div>
              ) : (
                <>
                  <select
                    value={formData.medication_id}
                    onChange={(e) => {
                      const med = medications.find(m => m && m.id === e.target.value);
                      console.log('[Dropdown] Selected medication:', med);
                      setFormData({
                        ...formData,
                        medication_id: e.target.value,
                        medication_name: med?.name || ''
                      });
                    }}
                    className="w-full h-14 px-4 border-2 border-gray-300 rounded-lg text-lg"
                    required
                  >
                    <option value="" disabled>
                      दवाई चुनें...
                    </option>
                    {(() => {
                      const validMeds = medications.filter(m => m && m.id && m.name);
                      console.log('[Dropdown] Total medications:', medications.length);
                      console.log('[Dropdown] Valid medications:', validMeds.length);
                      console.log('[Dropdown] Medications data:', medications);
                      console.log('[Dropdown] Valid medications data:', validMeds);
                      return validMeds.map((med) => (
                        <option key={med.id} value={med.id}>
                          {med.name}{med.strength ? ` - ${med.strength}` : ''}
                        </option>
                      ));
                    })()}
                  </select>
                  
                  {/* Debug Info */}
                  <div className="mt-2 p-3 bg-gray-100 rounded text-xs">
                    <p className="mb-1">🔍 Debug: {medications.length} total medications</p>
                    <p className="mb-1">✅ Valid: {medications.filter(m => m && m.id && m.name).length}</p>
                    <details className="mt-2">
                      <summary className="cursor-pointer text-blue-600">Show medication details</summary>
                      <pre className="mt-2 overflow-auto max-h-40 text-xs">
                        {JSON.stringify(medications.map(m => ({
                          id: m?.id,
                          name: m?.name,
                          strength: m?.strength,
                          hasId: !!m?.id,
                          hasName: !!m?.name
                        })), null, 2)}
                      </pre>
                    </details>
                  </div>
                </>
              )}
            </div>

            {/* Time Selection */}
            <div>
              <Label className="text-lg mb-2 block">समय (कॉल का समय)</Label>
              <Input
                type="time"
                value={formData.scheduled_time}
                onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
                className="h-14 text-xl"
              />
              <p className="text-sm text-gray-600 mt-2">
                📞 आपको इस समय कॉल आएगी: <strong>{formatTime12Hour(formData.scheduled_time)}</strong>
              </p>
            </div>

            {/* Days of Week */}
            <div>
              <Label className="text-lg mb-3 block">कौन-कौन से दिन?</Label>
              <div className="grid grid-cols-7 gap-2">
                {daysOfWeek.map((day) => (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => toggleDay(day.value)}
                    className={`h-16 rounded-lg border-2 transition-all ${
                      formData.days_of_week.includes(day.value)
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white text-gray-600 border-gray-300 hover:border-emerald-300'
                    }`}
                  >
                    <div className="text-sm">{day.label}</div>
                    <div className="text-xs">{day.labelEn}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Notification Methods */}
            <div className="space-y-4">
              <Label className="text-lg block">सूचना विधि</Label>
              
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                <div className="flex items-center gap-3">
                  <Phone className="w-6 h-6 text-blue-600" />
                  <div>
                    <p className="text-base">फोन कॉल (अनुशंसित)</p>
                    <p className="text-sm text-gray-600">हिंदी में स्वचालित कॉल</p>
                  </div>
                </div>
                <Switch
                  checked={formData.call_enabled}
                  onCheckedChange={(checked) => setFormData({ ...formData, call_enabled: checked })}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
                <div className="flex items-center gap-3">
                  <MessageSquare className="w-6 h-6 text-purple-600" />
                  <div>
                    <p className="text-base">SMS संदेश</p>
                    <p className="text-sm text-gray-600">टेक्स्ट मैसेज रिमाइंडर</p>
                  </div>
                </div>
                <Switch
                  checked={formData.sms_enabled}
                  onCheckedChange={(checked) => setFormData({ ...formData, sms_enabled: checked })}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
                <div className="flex items-center gap-3">
                  <Bell className="w-6 h-6 text-green-600" />
                  <div>
                    <p className="text-base">पुश नोटिफिकेशन</p>
                    <p className="text-sm text-gray-600">ऐप में सूचना</p>
                  </div>
                </div>
                <Switch
                  checked={formData.push_enabled}
                  onCheckedChange={(checked) => setFormData({ ...formData, push_enabled: checked })}
                />
              </div>
            </div>

            {/* Tone Selection */}
            <div>
              <Label className="text-lg mb-3 block">आवाज़ का स्वर</Label>
              <div className="grid grid-cols-3 gap-3">
                {(['gentle', 'standard', 'urgent'] as const).map((tone) => (
                  <button
                    key={tone}
                    type="button"
                    onClick={() => setFormData({ ...formData, tone })}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      formData.tone === tone
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-emerald-300'
                    }`}
                  >
                    {tone === 'gentle' && '😊 कोमल'}
                    {tone === 'standard' && '😀 सामान्य'}
                    {tone === 'urgent' && '⚠️ तत्काल'}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                onClick={() => setShowEditDialog(false)}
                variant="outline"
                size="lg"
                className="flex-1 h-14 text-lg"
              >
                रद्द करें
              </Button>
              <Button
                onClick={handleSaveReminder}
                disabled={!formData.medication_id || formData.medication_id === ''}
                size="lg"
                className="flex-1 h-14 text-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editingReminder ? 'अपडेट करें' : 'बनाएं'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Test Call Dialog */}
      <Dialog open={showTestCallDialog} onOpenChange={setShowTestCallDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              टेस्ट कॉल करें
            </DialogTitle>
            <DialogDescription className="sr-only">
              टेस्ट कॉल करें और अपने फोन सेटिंग्स की जाँच करें
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Phone Number Input */}
            <div>
              <Label className="text-lg mb-2 block">फोन नंबर</Label>
              <Input
                type="tel"
                value={testPhoneNumber}
                onChange={(e) => setTestPhoneNumber(e.target.value)}
                className="h-14 text-xl"
                placeholder="+1234567890"
                required
              />
              <p className="text-sm text-gray-600 mt-2">
                📞 टेस्ट कॉल के लिए एक वैध फोन नंबर दर्ज करें (e.g., +919876543210)
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                onClick={() => setShowTestCallDialog(false)}
                variant="outline"
                size="lg"
                className="flex-1 h-14 text-lg"
              >
                रद्द करें
              </Button>
              <Button
                onClick={handleTestCall}
                disabled={testCallLoading || !testPhoneNumber}
                size="lg"
                className="flex-1 h-14 text-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {testCallLoading ? 'कॉल कर रहा है...' : 'टेस्ट कॉल करें'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Floating Test Call Button */}
      <button
        onClick={() => setShowTestCallDialog(true)}
        className="fixed bottom-8 right-8 w-16 h-16 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110 z-50"
        title="टेस्ट कॉल करें"
      >
        <PhoneCall className="w-8 h-8" />
      </button>
    </div>
  );
}