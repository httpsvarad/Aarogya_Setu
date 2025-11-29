import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useAuth } from '../hooks/useAuth';
import { Bell, Search, CheckCircle2, AlertCircle, XCircle, MessageCircle, User, TrendingUp } from 'lucide-react';

export function CaregiverDashboard() {
  const { signOut } = useAuth();
  const [patients, setPatients] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [adherenceData, setAdherenceData] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    // Mock data - replace with Supabase queries
    setPatients([
      {
        id: '1',
        name: 'रामेश्वर शर्मा',
        age: 72,
        phone: '+91 98765 43210',
        relationship: 'पिताजी',
        medicationCount: 3,
        todayDoses: { taken: 2, upcoming: 1, missed: 0 },
        weeklyAdherence: 95,
        lastActive: new Date().toISOString()
      },
      {
        id: '2',
        name: 'सुनीता देवी',
        age: 68,
        phone: '+91 98765 43211',
        relationship: 'माताजी',
        medicationCount: 2,
        todayDoses: { taken: 1, upcoming: 1, missed: 1 },
        weeklyAdherence: 78,
        lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
      }
    ]);

    setAlerts([
      {
        id: 'a1',
        patientId: '2',
        patientName: 'सुनीता देवी',
        type: 'missed',
        message: 'सुबह 9:00 की दवाई छूट गई',
        medicationName: 'एस्पिरिन',
        time: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        urgent: true
      }
    ]);
  };

  const handlePatientSelect = (patient: any) => {
    setSelectedPatient(patient);
    // Load detailed adherence data
    setAdherenceData({
      weeklyStats: [
        { day: 'सोम', taken: 3, total: 3 },
        { day: 'मंगल', taken: 3, total: 3 },
        { day: 'बुध', taken: 2, total: 3 },
        { day: 'गुरु', taken: 3, total: 3 },
        { day: 'शुक्र', taken: 3, total: 3 },
        { day: 'शनि', taken: 2, total: 3 },
        { day: 'रवि', taken: 2, total: 2 }
      ],
      recentEvents: [
        {
          id: 'e1',
          medication: 'मेटफोर्मिन',
          time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          status: 'taken',
          verified: true
        },
        {
          id: 'e2',
          medication: 'एस्पिरिन',
          time: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
          status: 'missed',
          verified: false
        }
      ]
    });
  };

  const formatTimeAgo = (isoString: string) => {
    const now = new Date();
    const time = new Date(isoString);
    const diff = now.getTime() - time.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 60) return `${minutes} मिनट पहले`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} घंटे पहले`;
    const days = Math.floor(hours / 24);
    return `${days} दिन पहले`;
  };

  const filteredPatients = patients.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl">देखभालकर्ता डैशबोर्ड</h1>
              <p className="text-base text-gray-600 mt-1">अपने प्रियजनों की देखभाल करें</p>
            </div>
            <Button onClick={signOut} variant="outline">
              लॉग आउट
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Patients List */}
          <div className="lg:col-span-1">
            {/* Search */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="मरीज़ खोजें..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12"
                />
              </div>
            </div>

            {/* Alerts */}
            {alerts.length > 0 && (
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-4">
                <div className="flex items-center mb-2">
                  <Bell className="w-5 h-5 text-red-600 mr-2" />
                  <p className="text-base text-red-900">{alerts.length} नई सूचनाएं</p>
                </div>
                {alerts.map(alert => (
                  <div key={alert.id} className="bg-white rounded-lg p-3 mb-2 last:mb-0">
                    <p className="text-sm mb-1">{alert.patientName}</p>
                    <p className="text-sm text-gray-600">{alert.message}</p>
                    <p className="text-xs text-gray-500 mt-1">{formatTimeAgo(alert.time)}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Patients */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="p-4 bg-blue-500 text-white">
                <p className="text-lg">मरीज़ ({filteredPatients.length})</p>
              </div>
              <div className="divide-y">
                {filteredPatients.map(patient => (
                  <div
                    key={patient.id}
                    onClick={() => handlePatientSelect(patient)}
                    className={`p-4 cursor-pointer hover:bg-blue-50 transition-colors ${
                      selectedPatient?.id === patient.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-base mb-1">{patient.name}</p>
                        <p className="text-sm text-gray-600">{patient.relationship} • {patient.age} वर्ष</p>
                      </div>
                      <div className={`px-2 py-1 rounded text-xs ${
                        patient.weeklyAdherence >= 90 ? 'bg-green-100 text-green-800' :
                        patient.weeklyAdherence >= 70 ? 'bg-amber-100 text-amber-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {patient.weeklyAdherence}%
                      </div>
                    </div>
                    
                    <div className="flex gap-4 text-xs">
                      <span className="text-green-600">✓ {patient.todayDoses.taken}</span>
                      <span className="text-blue-600">○ {patient.todayDoses.upcoming}</span>
                      <span className="text-red-600">✗ {patient.todayDoses.missed}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Patient Details */}
          <div className="lg:col-span-2">
            {!selectedPatient ? (
              <div className="bg-white rounded-xl shadow-md p-12 text-center">
                <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-xl text-gray-500">एक मरीज़ चुनें</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Patient Header */}
                <div className="bg-white rounded-xl shadow-md p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-2xl mb-1">{selectedPatient.name}</h2>
                      <p className="text-base text-gray-600">
                        {selectedPatient.phone} • अंतिम सक्रिय: {formatTimeAgo(selectedPatient.lastActive)}
                      </p>
                    </div>
                    <Button variant="outline" className="gap-2">
                      <MessageCircle className="w-4 h-4" />
                      संदेश
                    </Button>
                  </div>

                  {/* Today's Summary */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-green-50 rounded-lg p-4 text-center">
                      <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto mb-2" />
                      <p className="text-2xl mb-1">{selectedPatient.todayDoses.taken}</p>
                      <p className="text-sm text-gray-600">ली गई</p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-4 text-center">
                      <AlertCircle className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                      <p className="text-2xl mb-1">{selectedPatient.todayDoses.upcoming}</p>
                      <p className="text-sm text-gray-600">बाकी हैं</p>
                    </div>
                    <div className="bg-red-50 rounded-lg p-4 text-center">
                      <XCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
                      <p className="text-2xl mb-1">{selectedPatient.todayDoses.missed}</p>
                      <p className="text-sm text-gray-600">छूटी हुई</p>
                    </div>
                  </div>
                </div>

                {/* Weekly Adherence */}
                <div className="bg-white rounded-xl shadow-md p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl">साप्ताहिक पालन</h3>
                    <div className="flex items-center gap-2 text-green-600">
                      <TrendingUp className="w-5 h-5" />
                      <span className="text-lg">{selectedPatient.weeklyAdherence}%</span>
                    </div>
                  </div>

                  <div className="flex items-end justify-between gap-2 h-40">
                    {adherenceData?.weeklyStats.map((stat: any) => {
                      const percentage = (stat.taken / stat.total) * 100;
                      return (
                        <div key={stat.day} className="flex-1 flex flex-col items-center">
                          <div className="w-full bg-gray-100 rounded-t relative flex-1 flex items-end">
                            <div
                              className={`w-full rounded-t ${
                                percentage === 100 ? 'bg-green-500' :
                                percentage >= 50 ? 'bg-amber-500' :
                                'bg-red-500'
                              }`}
                              style={{ height: `${percentage}%` }}
                            ></div>
                          </div>
                          <p className="text-xs mt-2 text-gray-600">{stat.day}</p>
                          <p className="text-xs text-gray-500">{stat.taken}/{stat.total}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white rounded-xl shadow-md p-6">
                  <h3 className="text-xl mb-4">हाल की गतिविधियां</h3>
                  <div className="space-y-3">
                    {adherenceData?.recentEvents.map((event: any) => (
                      <div key={event.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          {event.status === 'taken' ? (
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-600" />
                          )}
                          <div>
                            <p className="text-sm">{event.medication}</p>
                            <p className="text-xs text-gray-500">{formatTimeAgo(event.time)}</p>
                          </div>
                        </div>
                        {event.verified && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            सत्यापित
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
