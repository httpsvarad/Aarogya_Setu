import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useAuth } from '../hooks/useAuth';
import { Search, TrendingUp, TrendingDown, AlertCircle, FileText, Upload } from 'lucide-react';

export function ProviderDashboard() {
  const { signOut } = useAuth();
  const [patients, setPatients] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({
    totalPatients: 0,
    avgAdherence: 0,
    highRisk: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    // Mock data - replace with Supabase queries
    const mockPatients = [
      {
        id: '1',
        name: 'रामेश्वर शर्मा',
        age: 72,
        mrn: 'MRN001234',
        medications: 3,
        adherence: 95,
        lastVisit: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        trend: 'up'
      },
      {
        id: '2',
        name: 'सुनीता देवी',
        age: 68,
        mrn: 'MRN001235',
        medications: 2,
        adherence: 78,
        lastVisit: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        trend: 'down'
      },
      {
        id: '3',
        name: 'मोहन लाल',
        age: 75,
        mrn: 'MRN001236',
        medications: 4,
        adherence: 62,
        lastVisit: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
        trend: 'down'
      }
    ];

    setPatients(mockPatients);
    setStats({
      totalPatients: mockPatients.length,
      avgAdherence: Math.round(mockPatients.reduce((sum, p) => sum + p.adherence, 0) / mockPatients.length),
      highRisk: mockPatients.filter(p => p.adherence < 70).length
    });
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('hi-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const filteredPatients = patients.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.mrn.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl">प्रदाता डैशबोर्ड</h1>
              <p className="text-base text-gray-600 mt-1">मरीजों की दवा पालन निगरानी</p>
            </div>
            <Button onClick={signOut} variant="outline">
              लॉग आउट
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">कुल मरीज़</p>
                <p className="text-3xl">{stats.totalPatients}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">औसत पालन</p>
                <p className="text-3xl">{stats.avgAdherence}%</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">उच्च जोखिम</p>
                <p className="text-3xl">{stats.highRisk}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Patients List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-md">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl">मरीज़ सूची</h2>
                  <Button variant="outline" className="gap-2">
                    <Upload className="w-4 h-4" />
                    नया प्रिस्क्रिप्शन
                  </Button>
                </div>

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="नाम या MRN से खोजें..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-12"
                  />
                </div>
              </div>

              <div className="divide-y max-h-[600px] overflow-y-auto">
                {filteredPatients.map(patient => (
                  <div
                    key={patient.id}
                    onClick={() => setSelectedPatient(patient)}
                    className={`p-4 cursor-pointer hover:bg-purple-50 transition-colors ${
                      selectedPatient?.id === patient.id ? 'bg-purple-50 border-l-4 border-purple-500' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-base mb-1">{patient.name}</p>
                        <p className="text-sm text-gray-600">
                          {patient.mrn} • {patient.age} वर्ष • {patient.medications} दवाइयां
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {patient.trend === 'up' ? (
                          <TrendingUp className="w-5 h-5 text-green-600" />
                        ) : (
                          <TrendingDown className="w-5 h-5 text-red-600" />
                        )}
                        <span className={`text-lg ${
                          patient.adherence >= 90 ? 'text-green-600' :
                          patient.adherence >= 70 ? 'text-amber-600' :
                          'text-red-600'
                        }`}>
                          {patient.adherence}%
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">
                      अंतिम विज़िट: {formatDate(patient.lastVisit)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Patient Details */}
          <div className="lg:col-span-1">
            {!selectedPatient ? (
              <div className="bg-white rounded-xl shadow-md p-12 text-center">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-base text-gray-500">एक मरीज़ चुनें</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-white rounded-xl shadow-md p-6">
                  <h3 className="text-lg mb-4">मरीज़ विवरण</h3>
                  
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="text-gray-600">नाम</p>
                      <p className="text-base">{selectedPatient.name}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">MRN</p>
                      <p className="text-base">{selectedPatient.mrn}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">आयु</p>
                      <p className="text-base">{selectedPatient.age} वर्ष</p>
                    </div>
                    <div>
                      <p className="text-gray-600">दवाइयां</p>
                      <p className="text-base">{selectedPatient.medications}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">पालन दर</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              selectedPatient.adherence >= 90 ? 'bg-green-500' :
                              selectedPatient.adherence >= 70 ? 'bg-amber-500' :
                              'bg-red-500'
                            }`}
                            style={{ width: `${selectedPatient.adherence}%` }}
                          ></div>
                        </div>
                        <span className="text-base">{selectedPatient.adherence}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 space-y-2">
                    <Button className="w-full" variant="outline">
                      पूरा रिकॉर्ड देखें
                    </Button>
                    <Button className="w-full" variant="outline">
                      प्रिस्क्रिप्शन अपडेट करें
                    </Button>
                  </div>
                </div>

                {selectedPatient.adherence < 70 && (
                  <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm text-red-900 mb-2">
                          <strong>उच्च जोखिम मरीज़</strong>
                        </p>
                        <p className="text-xs text-red-800">
                          दवा पालन दर कम है। कृपया मरीज़ से संपर्क करें।
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
