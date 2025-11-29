import { useState } from 'react';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { useAuth } from '../hooks/useAuth';
import { useSpeech } from '../hooks/useSpeech';
import { ArrowLeft, Bell, Volume2, Globe, Shield, Download, Trash2 } from 'lucide-react';
import logoImage from 'figma:asset/49b3fc8fbe189ff80bcb3cecfcaf8b9a5a1bd523.png';

interface SettingsProps {
  onBack: () => void;
}

export function Settings({ onBack }: SettingsProps) {
  const { signOut } = useAuth();
  const { speak } = useSpeech();
  const [settings, setSettings] = useState({
    notifications: true,
    sound: true,
    vibration: true,
    voiceReminders: true,
    language: 'hi',
    autoVerification: false,
    shareWithCaregiver: true,
    shareWithProvider: false
  });

  const handleToggle = (key: string, value: boolean) => {
    setSettings({ ...settings, [key]: value });
    speak(value ? 'चालू किया गया' : 'बंद किया गया');
  };

  const handleExportData = () => {
    speak('डेटा निर्यात हो रहा है');
    // Export data logic
    alert('आपका डेटा डाउनलोड हो जाएगा');
  };

  const handleDeleteAccount = () => {
    if (confirm('क्या आप वाकई अपना खाता हटाना चाहते हैं? यह कार्रवाई पूर्ववत नहीं की जा सकती।')) {
      speak('खाता हटाया जा रहा है');
      // Delete account logic
      signOut();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 p-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 pt-4">
          <Button
            onClick={onBack}
            variant="ghost"
            size="lg"
            className="h-14 px-4"
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-3xl text-emerald-900">सेटिंग्स</h1>
          <div className="w-14"></div>
        </div>

        <div className="space-y-6">
          {/* Notifications */}
          <div className="bg-white rounded-2xl p-6 shadow-md">
            <div className="flex items-center mb-4">
              <Bell className="w-6 h-6 text-emerald-600 mr-3" />
              <h2 className="text-xl">सूचनाएं</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="notifications" className="text-base flex-1">
                  पुश सूचनाएं
                </Label>
                <Switch
                  id="notifications"
                  checked={settings.notifications}
                  onCheckedChange={(checked) => handleToggle('notifications', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="sound" className="text-base flex-1">
                  आवाज़
                </Label>
                <Switch
                  id="sound"
                  checked={settings.sound}
                  onCheckedChange={(checked) => handleToggle('sound', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="vibration" className="text-base flex-1">
                  कंपन
                </Label>
                <Switch
                  id="vibration"
                  checked={settings.vibration}
                  onCheckedChange={(checked) => handleToggle('vibration', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="voiceReminders" className="text-base flex-1">
                  आवाज़ में रिमाइंडर
                </Label>
                <Switch
                  id="voiceReminders"
                  checked={settings.voiceReminders}
                  onCheckedChange={(checked) => handleToggle('voiceReminders', checked)}
                />
              </div>
            </div>
          </div>

          {/* Language */}
          <div className="bg-white rounded-2xl p-6 shadow-md">
            <div className="flex items-center mb-4">
              <Globe className="w-6 h-6 text-emerald-600 mr-3" />
              <h2 className="text-xl">भाषा</h2>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => {
                  setSettings({ ...settings, language: 'hi' });
                  speak('हिंदी चुनी गई');
                }}
                className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                  settings.language === 'hi'
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-gray-200 hover:border-emerald-200'
                }`}
              >
                <p className="text-lg">हिंदी</p>
              </button>

              <button
                onClick={() => {
                  setSettings({ ...settings, language: 'en' });
                  speak('English selected');
                }}
                className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                  settings.language === 'en'
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-gray-200 hover:border-emerald-200'
                }`}
              >
                <p className="text-lg">English</p>
              </button>
            </div>
          </div>

          {/* Privacy */}
          <div className="bg-white rounded-2xl p-6 shadow-md">
            <div className="flex items-center mb-4">
              <Shield className="w-6 h-6 text-emerald-600 mr-3" />
              <h2 className="text-xl">गोपनीयता</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 pr-4">
                  <Label htmlFor="shareWithCaregiver" className="text-base block mb-1">
                    देखभालकर्ता के साथ साझा करें
                  </Label>
                  <p className="text-sm text-gray-600">
                    आपके परिवार के सदस्य आपकी प्रगति देख सकते हैं
                  </p>
                </div>
                <Switch
                  id="shareWithCaregiver"
                  checked={settings.shareWithCaregiver}
                  onCheckedChange={(checked) => handleToggle('shareWithCaregiver', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex-1 pr-4">
                  <Label htmlFor="shareWithProvider" className="text-base block mb-1">
                    डॉक्टर के साथ साझा करें
                  </Label>
                  <p className="text-sm text-gray-600">
                    आपके डॉक्टर आपकी दवा पालन देख सकते हैं
                  </p>
                </div>
                <Switch
                  id="shareWithProvider"
                  checked={settings.shareWithProvider}
                  onCheckedChange={(checked) => handleToggle('shareWithProvider', checked)}
                />
              </div>
            </div>
          </div>

          {/* Data Management */}
          <div className="bg-white rounded-2xl p-6 shadow-md">
            <h2 className="text-xl mb-4">डेटा प्रबंधन</h2>

            <div className="space-y-3">
              <Button
                onClick={handleExportData}
                variant="outline"
                className="w-full h-14 text-lg justify-start"
              >
                <Download className="w-5 h-5 mr-3" />
                अपना डेटा निर्यात करें
              </Button>

              <Button
                onClick={handleDeleteAccount}
                variant="outline"
                className="w-full h-14 text-lg justify-start text-red-600 border-red-200 hover:bg-red-50"
              >
                <Trash2 className="w-5 h-5 mr-3" />
                खाता हटाएं
              </Button>
            </div>
          </div>

          {/* Account */}
          <div className="bg-white rounded-2xl p-6 shadow-md">
            <h2 className="text-xl mb-4">खाता</h2>
            
            <Button
              onClick={signOut}
              variant="outline"
              className="w-full h-14 text-lg"
            >
              लॉग आउट
            </Button>
          </div>

          {/* App Info */}
          <div className="bg-gray-50 rounded-2xl p-6 text-center">
            <p className="text-lg mb-2">आरोग्य सेतु</p>
            <p className="text-sm text-gray-600 mb-4">संस्करण 1.0.0</p>
            <p className="text-xs text-gray-500">
              🔒 आपका डेटा सुरक्षित और एन्क्रिप्टेड है
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}