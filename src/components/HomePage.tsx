import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useAuth } from '../hooks/useAuth';
import { Globe, Eye, EyeOff, User, Heart, Stethoscope } from 'lucide-react';
import logoImage from 'figma:asset/49b3fc8fbe189ff80bcb3cecfcaf8b9a5a1bd523.png';
import { SupabaseConnectionTest } from './SupabaseConnectionTest';

export function HomePage() {
  const [mode, setMode] = useState<'home' | 'login' | 'signup' | 'role' | 'test'>('home');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'patient' | 'caregiver' | 'provider'>('patient');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState<'hi' | 'en'>('hi');
  const { signUp, signIn } = useAuth();

  // Simple translation function
  const t = (key: string) => {
    const translations: any = {
      hi: {
        appName: 'आरोग्य सेतु',
        tagline: 'आपकी दवाई का साथी',
        getStarted: 'शुरू करें',
        login: 'लॉगिन करें',
        signup: 'साइन अप करें',
        alreadyHaveAccount: 'पहले से खाता है?',
        dontHaveAccount: 'खाता नहीं है?',
        timelyReminders: 'समय पर रिमाइंडर',
        easyToUse: 'आसान उपयोग',
        secureData: 'सुरक्षित डेटा',
        voiceSupport: 'आवाज़ समर्थन',
        name: 'आपका नाम',
        phone: 'मोबाइल नंबर',
        email: 'ईमेल',
        password: 'पासवर्ड',
        back: 'वापस',
        loading: 'लोड हो रहा है...',
        next: 'आगे बढ़ें',
        whoAreYou: 'आप कौन हैं?',
        patient: 'मरीज़',
        patientDesc: 'मुझे दवाई लेनी है',
        caregiver: 'देखभालकर्ता',
        caregiverDesc: 'मैं किसी की देखभाल करता हूं',
        provider: 'डॉक्टर / नर्स',
        providerDesc: 'मैं स्वास्थ्य सेवा देता हूं',
      },
      en: {
        appName: 'Aarogya Setu',
        tagline: 'Your Medication Companion',
        getStarted: 'Get Started',
        login: 'Login',
        signup: 'Sign Up',
        alreadyHaveAccount: 'Already have an account?',
        dontHaveAccount: "Don't have an account?",
        timelyReminders: 'Timely Reminders',
        easyToUse: 'Easy to Use',
        secureData: 'Secure Data',
        voiceSupport: 'Voice Support',
        name: 'Your Name',
        phone: 'Mobile Number',
        email: 'Email',
        password: 'Password',
        back: 'Back',
        loading: 'Loading...',
        next: 'Next',
        whoAreYou: 'Who are you?',
        patient: 'Patient',
        patientDesc: 'I need to take medication',
        caregiver: 'Caregiver',
        caregiverDesc: 'I take care of someone',
        provider: 'Doctor / Nurse',
        providerDesc: 'I provide healthcare',
      }
    };
    return translations[language][key] || key;
  };

  const handleSignUp = async () => {
    if (!name || !phone || !email || !password) {
      setError(language === 'hi' ? 'कृपया सभी फील्ड भरें' : 'Please fill all fields');
      return;
    }

    setIsLoading(true);
    setError('');

    const result = await signUp(email, password, name, phone, role);

    if (!result.success) {
      setIsLoading(false);
      setError(result.error || 'Signup error');
    }
    // If successful, the auth hook will automatically update the user state
  };

  const handleLogin = async () => {
    if (!email || !password) {
      setError(language === 'hi' ? 'ईमेल और पासवर्ड दर्ज करें' : 'Enter email and password');
      return;
    }

    setIsLoading(true);
    setError('');

    const result = await signIn(email, password);

    if (!result.success) {
      setIsLoading(false);
      setError(result.error || 'Login error');
    }
    // If successful, the auth hook will automatically update the user state
  };

  const toggleLanguage = () => {
    setLanguage(language === 'hi' ? 'en' : 'hi');
  };

  // Role Selection Screen
  if (mode === 'role') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8">
          {/* Language Toggle */}
          <div className="flex justify-end mb-4">
            <Button
              onClick={toggleLanguage}
              variant="ghost"
              size="sm"
              className="gap-2"
            >
              <Globe className="w-4 h-4" />
              {language === 'hi' ? 'English' : 'हिंदी'}
            </Button>
          </div>

          <div className="text-center mb-8">
            <img src={logoImage} alt="Logo" className="w-24 h-24 mx-auto mb-4" />
            <h1 className="text-3xl mb-2 text-emerald-900">{t('whoAreYou')}</h1>
          </div>

          <div className="space-y-4 mb-8">
            <button
              onClick={() => setRole('patient')}
              className={`w-full p-6 rounded-2xl border-2 text-left transition-all ${role === 'patient'
                  ? 'border-emerald-500 bg-emerald-50 shadow-lg'
                  : 'border-gray-200 hover:border-emerald-200 hover:bg-gray-50'
                }`}
            >
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-xl flex items-center justify-center flex-shrink-0">
                  <User className="w-8 h-8 text-emerald-700" />
                </div>
                <div>
                  <h3 className="text-xl mb-1">{t('patient')}</h3>
                  <p className="text-gray-600">{t('patientDesc')}</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => setRole('caregiver')}
              className={`w-full p-6 rounded-2xl border-2 text-left transition-all ${role === 'caregiver'
                  ? 'border-teal-500 bg-teal-50 shadow-lg'
                  : 'border-gray-200 hover:border-teal-200 hover:bg-gray-50'
                }`}
            >
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-teal-100 to-teal-200 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Heart className="w-8 h-8 text-teal-700" />
                </div>
                <div>
                  <h3 className="text-xl mb-1">{t('caregiver')}</h3>
                  <p className="text-gray-600">{t('caregiverDesc')}</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => setRole('provider')}
              className={`w-full p-6 rounded-2xl border-2 text-left transition-all ${role === 'provider'
                  ? 'border-blue-500 bg-blue-50 shadow-lg'
                  : 'border-gray-200 hover:border-blue-200 hover:bg-gray-50'
                }`}
            >
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Stethoscope className="w-8 h-8 text-blue-700" />
                </div>
                <div>
                  <h3 className="text-xl mb-1">{t('provider')}</h3>
                  <p className="text-gray-600">{t('providerDesc')}</p>
                </div>
              </div>
            </button>
          </div>

          <Button
            onClick={() => setMode('signup')}
            className="w-full h-14 text-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
          >
            {t('next')}
          </Button>

          <Button
            onClick={() => setMode('home')}
            variant="ghost"
            className="w-full mt-4"
          >
            ← {t('back')}
          </Button>
        </div>
      </div>
    );
  }

  // Login Screen
  if (mode === 'login') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8">
          {/* Language Toggle */}
          <div className="flex justify-end mb-4">
            <Button
              onClick={toggleLanguage}
              variant="ghost"
              size="sm"
              className="gap-2"
            >
              <Globe className="w-4 h-4" />
              {language === 'hi' ? 'English' : 'हिंदी'}
            </Button>
          </div>

          <div className="text-center mb-8">
            <img src={logoImage} alt="Logo" className="w-24 h-24 mx-auto mb-4" />
            <h1 className="text-3xl mb-2 text-emerald-900">{t('appName')}</h1>
            <p className="text-lg text-gray-600">{t('login')}</p>
             <p className="text-sm text-red-500 mt-3">Please refresh loading takes too long!</p>
          </div>

          <div className="space-y-4 mb-6">
            <div>
              <Label htmlFor="email" className="text-base mb-2 block">{t('email')}</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 text-base"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-base mb-2 block">{t('password')}</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 text-base pr-10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <Button
            onClick={handleLogin}
            disabled={!email || !password || isLoading}
            className="w-full h-12 text-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
          >
            {isLoading ? t('loading') : t('login')}
          </Button>

          <div className="text-center mt-6">
            <p className="text-gray-600 mb-2">{t('dontHaveAccount')}</p>
            <Button
              onClick={() => {
                setMode('role');
                setError('');
              }}
              variant="outline"
              className="w-full h-12 text-base border-2"
            >
              {t('signup')}
            </Button>
          </div>

          <Button
            onClick={() => {
              setMode('home');
              setError('');
            }}
            variant="ghost"
            className="w-full mt-4"
          >
            ← {t('back')}
          </Button>
        </div>
      </div>
    );
  }

  // Signup Screen
  if (mode === 'signup') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8">
          {/* Language Toggle */}
          <div className="flex justify-end mb-4">
            <Button
              onClick={toggleLanguage}
              variant="ghost"
              size="sm"
              className="gap-2"
            >
              <Globe className="w-4 h-4" />
              {language === 'hi' ? 'English' : 'हिंदी'}
            </Button>
          </div>

          <div className="text-center mb-8">
            <img src={logoImage} alt="Logo" className="w-24 h-24 mx-auto mb-4" />
            <h1 className="text-3xl mb-2 text-emerald-900">{t('appName')}</h1>
            <p className="text-lg text-gray-600">{t('signup')}</p>
            <p className="text-sm text-red-500 mt-3">Please refresh loading takes too long!</p>
          </div>

          <div className="space-y-4 mb-6">
            <div>
              <Label htmlFor="name" className="text-base mb-2 block">{t('name')}</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-12 text-base"
                placeholder={language === 'hi' ? 'नाम लिखें' : 'Enter your name'}
              />
            </div>

            <div>
              <Label htmlFor="phone" className="text-base mb-2 block">{t('phone')}</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="h-12 text-base"
                placeholder="+91 XXXXX XXXXX"
              />
            </div>

            <div>
              <Label htmlFor="email" className="text-base mb-2 block">{t('email')}</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 text-base"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-base mb-2 block">{t('password')}</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 text-base pr-10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <Button
            onClick={handleSignUp}
            disabled={!name || !phone || !email || !password || isLoading}
            className="w-full h-12 text-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
          >
            {isLoading ? t('loading') : t('signup')}
          </Button>

          <div className="text-center mt-6">
            <p className="text-gray-600 mb-2">{t('alreadyHaveAccount')}</p>
            <Button
              onClick={() => {
                setMode('login');
                setError('');
              }}
              variant="outline"
              className="w-full h-12 text-base border-2"
            >
              {t('login')}
            </Button>
          </div>

          <Button
            onClick={() => {
              setMode('role');
              setError('');
            }}
            variant="ghost"
            className="w-full mt-4"
          >
            ← {t('back')}
          </Button>
        </div>
      </div>
    );
  }

  // Test Connection Screen
  if (mode === 'test') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 p-4">
        <Button
          onClick={() => setMode('home')}
          variant="ghost"
          className="mb-4"
        >
          ← Back to Home
        </Button>
        <SupabaseConnectionTest />
      </div>
    );
  }

  // Home screen
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center p-4">
      <div className="max-w-3xl w-full">
        {/* Language Toggle */}
        <div className="flex justify-end mb-8">
          <Button
            onClick={toggleLanguage}
            variant="outline"
            size="lg"
            className="gap-2 bg-white/80 backdrop-blur-sm shadow-md"
          >
            <Globe className="w-5 h-5" />
            {language === 'hi' ? 'English' : 'हिंदी'}
          </Button>
        </div>

        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 md:p-12 text-center">
          <img src={logoImage} alt="Aarogya Setu Logo" className="w-32 h-32 mx-auto mb-6" />

          <div className="overflow-visible pt-4">
            <h1 className="text-4xl md:text-5xl mb-4 text-emerald-700">
              आरोग्य सेतु
            </h1>
          </div>

          <p className="text-xl md:text-2xl text-gray-600 mb-12">
            {t('tagline')}
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            <div className="p-6 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl shadow-md hover:shadow-lg transition-shadow">
              <div className="text-3xl mb-2">⏰</div>
              <p className="text-sm text-gray-700">{t('timelyReminders')}</p>
            </div>
            <div className="p-6 bg-gradient-to-br from-teal-50 to-teal-100 rounded-2xl shadow-md hover:shadow-lg transition-shadow">
              <div className="text-3xl mb-2">❤️</div>
              <p className="text-sm text-gray-700">{t('easyToUse')}</p>
            </div>
            <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl shadow-md hover:shadow-lg transition-shadow">
              <div className="text-3xl mb-2">🔒</div>
              <p className="text-sm text-gray-700">{t('secureData')}</p>
            </div>
            <div className="p-6 bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-2xl shadow-md hover:shadow-lg transition-shadow">
              <div className="text-3xl mb-2">🔊</div>
              <p className="text-sm text-gray-700">{t('voiceSupport')}</p>
            </div>
          </div>

          <div className="space-y-4">
            <Button
              onClick={() => setMode('role')}
              className="w-full h-16 text-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg hover:shadow-xl transition-all"
            >
              {t('getStarted')}
            </Button>

            <Button
              onClick={() => setMode('login')}
              variant="outline"
              className="w-full h-16 text-xl border-2 border-emerald-600 text-emerald-600 hover:bg-emerald-50"
            >
              {t('login')}
            </Button>

            {/* <Button
              onClick={() => setMode('test')}
              variant="outline"
              className="w-full h-12 text-base border-2 border-blue-600 text-blue-600 hover:bg-blue-50"
            >
              🧪 Test Supabase Connection
            </Button> */}
          </div>

          <p className="mt-8 text-sm text-gray-500">
            {language === 'hi'
              ? '🔒 आपका डेटा पूरी तरह सुरक्षित है। हम आपकी जानकारी कभी नहीं बेचते।'
              : '🔒 Your data is completely secure. We never sell your information.'
            }
          </p>
        </div>
      </div>
    </div>
  );
}
