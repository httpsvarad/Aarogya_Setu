import { useState, useRef } from 'react';
import { Button } from './ui/button';
import { useSpeech } from '../hooks/useSpeech';
import { useOfflineSync } from '../hooks/useOfflineSync';
import { Camera, ArrowLeft, CheckCircle2, AlertTriangle, Loader2, X } from 'lucide-react';

interface VerificationFlowProps {
  reminder: any;
  onComplete: () => void;
  onBack: () => void;
}

export function VerificationFlow({ reminder, onComplete, onBack }: VerificationFlowProps) {
  const [step, setStep] = useState<'choice' | 'capture' | 'verifying' | 'result'>('choice');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const { speak } = useSpeech();
  const { saveDoseEvent } = useOfflineSync();
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleTakeWithoutVerification = async () => {
    speak('दवाई ली गई। धन्यवाद!');
    
    await saveDoseEvent({
      id: Date.now().toString(),
      medicationId: reminder.medicationId,
      scheduledTime: reminder.scheduledTime,
      takenAt: new Date().toISOString(),
      status: 'taken',
      verificationImageUrl: null,
      synced: false
    });

    onComplete();
  };

  const handleCameraCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
      verifyPill(file);
    };
    reader.readAsDataURL(file);
  };

  const verifyPill = async (file: File) => {
    setStep('verifying');
    speak('फोटो की जांच हो रही है...');

    try {
      // In production: Upload to Supabase Storage
      // const { data: uploadData } = await supabase.storage
      //   .from('pill-verifications')
      //   .upload(`${userId}/${Date.now()}.jpg`, file);

      // Call Edge Function for Gemini Vision verification
      // const { data } = await supabase.functions.invoke('verify-pill', {
      //   body: {
      //     imageUrl: uploadData.path,
      //     expectedMedication: reminder.medicationName
      //   }
      // });

      // Mock Gemini Vision verification response
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockResult = {
        match: true,
        confidence: 0.92,
        reasons: [
          'गोली का आकार सही है',
          'रंग मेल खाता है',
          'ब्रांड का निशान दिख रहा है'
        ],
        safetyFlags: []
      };

      setVerificationResult(mockResult);
      setStep('result');

      if (mockResult.match) {
        speak('सही दवाई है। बहुत अच्छा!');
      } else {
        speak('ध्यान दें! यह सही दवाई नहीं लग रही है।');
      }

      // Save dose event
      await saveDoseEvent({
        id: Date.now().toString(),
        medicationId: reminder.medicationId,
        scheduledTime: reminder.scheduledTime,
        takenAt: new Date().toISOString(),
        status: 'taken',
        verificationImageUrl: 'mock-url',
        verified: mockResult.match,
        confidence: mockResult.confidence,
        synced: false
      });

    } catch (error) {
      console.error('Verification error:', error);
      speak('जांच में समस्या हुई। कृपया फिर से कोशिश करें।');
      setStep('choice');
    }
  };

  if (step === 'choice') {
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
            <h1 className="text-3xl text-emerald-900">दवाई लें</h1>
            <div className="w-14"></div>
          </div>

          {/* Medication Info */}
          <div className="bg-white rounded-2xl p-8 mb-8 shadow-md">
            <div className="flex items-center mb-6">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mr-6">
                <span className="text-4xl">💊</span>
              </div>
              <div>
                <h2 className="text-3xl mb-2">{reminder.medicationName}</h2>
                <p className="text-xl text-gray-600">अभी समय है</p>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-lg text-blue-900">
                💬 {reminder.message}
              </p>
            </div>
          </div>

          {/* Options */}
          <div className="space-y-4">
            <Button
              onClick={() => {
                setStep('capture');
                speak('कैमरा खुल रहा है');
              }}
              size="lg"
              className="w-full h-24 text-2xl bg-emerald-600 hover:bg-emerald-700"
            >
              <Camera className="w-8 h-8 mr-3" />
              दवाई की फोटो लेकर पुष्टि करें
            </Button>

            <Button
              onClick={handleTakeWithoutVerification}
              size="lg"
              variant="outline"
              className="w-full h-20 text-xl border-2"
            >
              <CheckCircle2 className="w-6 h-6 mr-3" />
              बिना फोटो के ली
            </Button>

            <Button
              onClick={onBack}
              size="lg"
              variant="ghost"
              className="w-full h-16 text-lg"
            >
              <X className="w-5 h-5 mr-2" />
              अभी नहीं
            </Button>
          </div>

          {/* Info box */}
          <div className="mt-8 bg-amber-50 border border-amber-200 rounded-xl p-6">
            <p className="text-base text-amber-900">
              ℹ️ <strong>सुझाव:</strong> फोटो से पुष्टि करने से आप गलत दवाई खाने से बच सकते हैं।
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'capture') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 p-4">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8 pt-4">
            <Button
              onClick={() => setStep('choice')}
              variant="ghost"
              size="lg"
              className="h-14 px-4"
            >
              <ArrowLeft className="w-6 h-6" />
            </Button>
            <h1 className="text-3xl text-emerald-900">दवाई की फोटो</h1>
            <div className="w-14"></div>
          </div>

          {/* Instructions */}
          <div className="bg-white rounded-2xl p-8 mb-8 shadow-md">
            <h2 className="text-2xl mb-4 text-emerald-900">निर्देश</h2>
            <div className="space-y-3 text-lg text-gray-700">
              <p>✓ दवाई को अपने हाथ में रखें</p>
              <p>✓ साफ रोशनी में फोटो लें</p>
              <p>✓ दवाई स्पष्ट दिखनी चाहिए</p>
            </div>
          </div>

          {/* Camera button */}
          <Button
            onClick={() => cameraInputRef.current?.click()}
            size="lg"
            className="w-full h-32 text-2xl bg-emerald-600 hover:bg-emerald-700"
          >
            <Camera className="w-12 h-12 mr-3" />
            कैमरा खोलें
          </Button>

          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleCameraCapture}
            className="hidden"
          />
        </div>
      </div>
    );
  }

  if (step === 'verifying') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white rounded-2xl p-12 text-center shadow-2xl">
          {imagePreview && (
            <div className="w-48 h-48 mx-auto mb-8 rounded-xl overflow-hidden">
              <img
                src={imagePreview}
                alt="Pill"
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <Loader2 className="w-16 h-16 text-emerald-600 animate-spin mx-auto mb-6" />
          
          <h2 className="text-3xl mb-4 text-emerald-900">दवाई की जांच हो रही है...</h2>
          <p className="text-xl text-gray-600">
            हम यह देख रहे हैं कि यह सही दवाई है या नहीं
          </p>
        </div>
      </div>
    );
  }

  if (step === 'result') {
    const isMatch = verificationResult?.match;
    const confidence = verificationResult?.confidence || 0;

    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 p-4">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8 pt-4">
            <div className="w-14"></div>
            <h1 className="text-3xl text-emerald-900">जांच परिणाम</h1>
            <div className="w-14"></div>
          </div>

          {/* Result card */}
          <div className={`rounded-2xl p-8 mb-8 shadow-md ${
            isMatch ? 'bg-green-50 border-2 border-green-200' : 'bg-amber-50 border-2 border-amber-200'
          }`}>
            <div className="text-center mb-6">
              {isMatch ? (
                <CheckCircle2 className="w-20 h-20 text-green-600 mx-auto mb-4" />
              ) : (
                <AlertTriangle className="w-20 h-20 text-amber-600 mx-auto mb-4" />
              )}
              
              <h2 className="text-3xl mb-2">
                {isMatch ? '✓ सही दवाई है!' : '⚠️ ध्यान दें!'}
              </h2>
              <p className="text-xl text-gray-700">
                {isMatch 
                  ? 'यह आपकी निर्धारित दवाई है' 
                  : 'यह सही दवाई नहीं लग रही है'
                }
              </p>
            </div>

            {/* Image preview */}
            {imagePreview && (
              <div className="w-48 h-48 mx-auto mb-6 rounded-xl overflow-hidden border-4 border-white">
                <img
                  src={imagePreview}
                  alt="Pill verification"
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Confidence */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-lg">विश्वसनीयता</span>
                <span className="text-xl">{(confidence * 100).toFixed(0)}%</span>
              </div>
              <div className="h-4 bg-white rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    isMatch ? 'bg-green-500' : 'bg-amber-500'
                  }`}
                  style={{ width: `${confidence * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Reasons */}
            <div className="space-y-2">
              <p className="text-lg mb-2">कारण:</p>
              {verificationResult?.reasons?.map((reason: string, idx: number) => (
                <p key={idx} className="text-base text-gray-700">
                  {isMatch ? '✓' : '•'} {reason}
                </p>
              ))}
            </div>

            {/* Safety flags */}
            {verificationResult?.safetyFlags?.length > 0 && (
              <div className="mt-6 pt-6 border-t border-amber-300">
                <p className="text-lg mb-2 text-amber-900">⚠️ चेतावनी:</p>
                {verificationResult.safetyFlags.map((flag: string, idx: number) => (
                  <p key={idx} className="text-base text-amber-800">
                    • {flag}
                  </p>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="space-y-4">
            {isMatch ? (
              <>
                <Button
                  onClick={onComplete}
                  size="lg"
                  className="w-full h-20 text-2xl bg-green-600 hover:bg-green-700"
                >
                  ✓ बहुत अच्छा!
                </Button>
              </>
            ) : (
              <>
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 mb-4">
                  <p className="text-lg text-red-900">
                    ⚠️ कृपया अपने डॉक्टर या फार्मासिस्ट से सलाह लें। गलत दवाई न लें।
                  </p>
                </div>

                <Button
                  onClick={() => setStep('capture')}
                  size="lg"
                  className="w-full h-20 text-2xl bg-emerald-600 hover:bg-emerald-700"
                >
                  <Camera className="w-6 h-6 mr-3" />
                  फिर से फोटो लें
                </Button>

                <Button
                  onClick={onBack}
                  size="lg"
                  variant="outline"
                  className="w-full h-16 text-xl border-2"
                >
                  वापस जाएं
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
