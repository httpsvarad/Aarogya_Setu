import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { useAuth } from '../hooks/useAuth';
import { useSpeech } from '../hooks/useSpeech';
import { Pill, Heart, Bell, Shield, Volume2, Mic } from 'lucide-react';

export function OnboardingFlow() {
  const [step, setStep] = useState(0);
  const [role, setRole] = useState<'patient' | 'caregiver' | 'provider'>('patient');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [consents, setConsents] = useState({
    camera: false,
    voice: false,
    notifications: false,
    dataSharing: false
  });
  const { signUp, signIn } = useAuth();
  const { speak, isSupported } = useSpeech();

  const handleComplete = async () => {
    setIsLoading(true);
    setError('');
    
    const result = await signUp(email, password, name, phone, role);
    
    if (!result.success) {
      setIsLoading(false);
      // Check if the error is about existing email
      if (result.error?.includes('already been registered') || result.error?.includes('email_exists')) {
        setError('यह ईमेल पहले से पंजीकृत है। कृपया लॉगिन करें या दूसरा ईमेल इस्तेमाल करें।');
      } else {
        setError(result.error || 'साइनअप में त्रुटि। कृपया पुनः प्रयास करें।');
      }
    }
    // If success, the useAuth hook will automatically update user state
  };

  const handleSignInInstead = async () => {
    setIsLoading(true);
    setError('');
    
    const result = await signIn(email, password);
    
    if (!result.success) {
      setIsLoading(false);
      setError('लॉगिन में त्रुटि। कृपया अपना ईमेल और पासवर्ड जांचें।');
    }
    // If success, the useAuth hook will automatically update user state
  };

  const speakText = (text: string) => {
    if (isSupported) {
      speak(text);
    }
  };

  if (step === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl p-8 md:p-12 text-center">
          <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Pill className="w-12 h-12 text-white" />
          </div>
          
          <h1 className="text-4xl md:text-5xl mb-4 text-emerald-900">आरोग्य सेतु</h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-12">
            आपकी दवाई का साथी
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="p-6 bg-emerald-50 rounded-2xl">
              <Bell className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
              <p className="text-lg text-gray-700">समय पर रिमाइंडर</p>
            </div>
            <div className="p-6 bg-teal-50 rounded-2xl">
              <Heart className="w-12 h-12 text-teal-600 mx-auto mb-3" />
              <p className="text-lg text-gray-700">आसान उपयोग</p>
            </div>
            <div className="p-6 bg-blue-50 rounded-2xl">
              <Shield className="w-12 h-12 text-blue-600 mx-auto mb-3" />
              <p className="text-lg text-gray-700">सुरक्षित डेटा</p>
            </div>
          </div>

          <Button
            onClick={() => setStep(1)}
            className="w-full h-16 text-2xl bg-emerald-600 hover:bg-emerald-700"
          >
            शुरू करें
          </Button>
        </div>
      </div>
    );
  }

  if (step === 1) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl p-8 md:p-12">
          <h2 className="text-3xl md:text-4xl mb-8 text-emerald-900 text-center">आप कौन हैं?</h2>

          <div className="space-y-4 mb-8">
            <button
              onClick={() => {
                setRole('patient');
                speakText('मरीज़ चुना गया');
              }}
              className={`w-full p-8 rounded-2xl border-4 transition-all ${
                role === 'patient'
                  ? 'border-emerald-500 bg-emerald-50'
                  : 'border-gray-200 hover:border-emerald-200'
              }`}
            >
              <p className="text-2xl md:text-3xl mb-2">🧓 मरीज़</p>
              <p className="text-lg text-gray-600">मुझे दवाई लेनी है</p>
            </button>

            <button
              onClick={() => {
                setRole('caregiver');
                speakText('देखभालकर्ता चुना गया');
              }}
              className={`w-full p-8 rounded-2xl border-4 transition-all ${
                role === 'caregiver'
                  ? 'border-emerald-500 bg-emerald-50'
                  : 'border-gray-200 hover:border-emerald-200'
              }`}
            >
              <p className="text-2xl md:text-3xl mb-2">👨‍👩‍👧 देखभालकर्ता</p>
              <p className="text-lg text-gray-600">मैं किसी की देखभाल करता हूं</p>
            </button>

            <button
              onClick={() => {
                setRole('provider');
                speakText('स्वास्थ्य सेवा प्रदाता चुना गया');
              }}
              className={`w-full p-8 rounded-2xl border-4 transition-all ${
                role === 'provider'
                  ? 'border-emerald-500 bg-emerald-50'
                  : 'border-gray-200 hover:border-emerald-200'
              }`}
            >
              <p className="text-2xl md:text-3xl mb-2">👨‍⚕️ डॉक्टर / नर्स</p>
              <p className="text-lg text-gray-600">मैं स्वास्थ्य सेवा देता हूं</p>
            </button>
          </div>

          <Button
            onClick={() => setStep(2)}
            className="w-full h-16 text-2xl bg-emerald-600 hover:bg-emerald-700"
          >
            आगे बढ़ें
          </Button>
        </div>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl p-8 md:p-12">
          <h2 className="text-3xl md:text-4xl mb-8 text-emerald-900 text-center">अपनी जानकारी दें</h2>

          <div className="space-y-6 mb-8">
            <div>
              <Label htmlFor="name" className="text-xl mb-2 block">आपका नाम</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-16 text-xl"
                placeholder="नाम लिखें"
              />
            </div>

            <div>
              <Label htmlFor="phone" className="text-xl mb-2 block">मोबाइल नंबर</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="h-16 text-xl"
                placeholder="10 अंकों का नंबर"
              />
            </div>

            <div>
              <Label htmlFor="email" className="text-xl mb-2 block">ईमेल</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-16 text-xl"
                placeholder="ईमेल लिखें"
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-xl mb-2 block">पासवर्ड</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-16 text-xl"
                placeholder="पासवर्ड लिखें"
              />
            </div>

            {role === 'patient' && (
              <div>
                <Label htmlFor="emergency" className="text-xl mb-2 block">आपातकालीन संपर्क</Label>
                <Input
                  id="emergency"
                  type="tel"
                  value={emergencyContact}
                  onChange={(e) => setEmergencyContact(e.target.value)}
                  className="h-16 text-xl"
                  placeholder="परिवार का नंबर"
                />
                <p className="text-sm text-gray-500 mt-2">
                  यदि आप दवाई नहीं लेते हैं तो इस नंबर पर सूचना जाएगी
                </p>
              </div>
            )}
          </div>

          <Button
            onClick={() => setStep(3)}
            disabled={!name || !phone || !email || !password}
            className="w-full h-16 text-2xl bg-emerald-600 hover:bg-emerald-700"
          >
            आगे बढ़ें
          </Button>
        </div>
      </div>
    );
  }

  if (step === 3) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl p-8 md:p-12">
          <h2 className="text-3xl md:text-4xl mb-8 text-emerald-900 text-center">अनुमतियाँ</h2>
          <p className="text-lg text-gray-600 mb-8 text-center">
            आरोग्य सेतु को बेहतर काम करने के लिए कुछ अनुमतियाँ चाहिए
          </p>

          <div className="space-y-6 mb-8">
            <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-xl">
              <Checkbox
                id="camera"
                checked={consents.camera}
                onCheckedChange={(checked) => 
                  setConsents({ ...consents, camera: checked as boolean })
                }
                className="mt-1 w-6 h-6"
              />
              <div className="flex-1">
                <label htmlFor="camera" className="text-lg block mb-1 cursor-pointer">
                  📷 कैमरा
                </label>
                <p className="text-sm text-gray-600">
                  प्रिस्क्रिप्शन की फोटो और दवाई की पुष्टि के लिए
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-xl">
              <Checkbox
                id="voice"
                checked={consents.voice}
                onCheckedChange={(checked) => 
                  setConsents({ ...consents, voice: checked as boolean })
                }
                className="mt-1 w-6 h-6"
              />
              <div className="flex-1">
                <label htmlFor="voice" className="text-lg block mb-1 cursor-pointer">
                  🎤 आवाज़
                </label>
                <p className="text-sm text-gray-600">
                  आवाज़ से बात करने और सुनने के लिए
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-xl">
              <Checkbox
                id="notifications"
                checked={consents.notifications}
                onCheckedChange={(checked) => 
                  setConsents({ ...consents, notifications: checked as boolean })
                }
                className="mt-1 w-6 h-6"
              />
              <div className="flex-1">
                <label htmlFor="notifications" className="text-lg block mb-1 cursor-pointer">
                  🔔 सूचनाएं
                </label>
                <p className="text-sm text-gray-600">
                  दवाई का समय याद दिलाने के लिए
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-xl">
              <Checkbox
                id="dataSharing"
                checked={consents.dataSharing}
                onCheckedChange={(checked) => 
                  setConsents({ ...consents, dataSharing: checked as boolean })
                }
                className="mt-1 w-6 h-6"
              />
              <div className="flex-1">
                <label htmlFor="dataSharing" className="text-lg block mb-1 cursor-pointer">
                  👨‍👩‍👧 डेटा साझा करना
                </label>
                <p className="text-sm text-gray-600">
                  देखभालकर्ता और डॉक्टर के साथ जानकारी साझा करने के लिए
                </p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-8">
            <p className="text-sm text-blue-900">
              🔒 <strong>गोपनीयता:</strong> आपका डेटा पूरी तरह सुरक्षित है। हम आपकी जानकारी कभी नहीं बेचते।
            </p>
          </div>

          <Button
            onClick={handleComplete}
            disabled={!consents.notifications}
            className="w-full h-16 text-2xl bg-emerald-600 hover:bg-emerald-700"
          >
            {isLoading ? 'साइनअप करना...' : 'शुरू करें'}
          </Button>

          {error && (
            <p className="text-sm text-red-500 mt-4 text-center">
              {error}
            </p>
          )}

          <div className="text-center mt-4">
            <p className="text-gray-500">यदि पहले से पंजीकृत हैं, तो लॉगिन करें:</p>
            <Button
              onClick={handleSignInInstead}
              className="w-full h-16 text-2xl bg-emerald-600 hover:bg-emerald-700 mt-2"
            >
              {isLoading ? 'लॉगिन करना...' : 'लॉगिन करें'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}