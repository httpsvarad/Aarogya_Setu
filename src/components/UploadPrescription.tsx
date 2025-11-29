import { useState, useRef } from 'react';
import { Button } from './ui/button';
import { useSpeech } from '../hooks/useSpeech';
import { useMedications } from '../hooks/useMedications';
import { Camera, Upload, ArrowLeft, Loader2, CheckCircle2, Edit2 } from 'lucide-react';

interface UploadPrescriptionProps {
  onComplete: () => void;
  onBack: () => void;
}

export function UploadPrescription({ onComplete, onBack }: UploadPrescriptionProps) {
  const [step, setStep] = useState<'capture' | 'processing' | 'confirm'>('capture');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [processing, setProcessing] = useState(false);
  const [isMockData, setIsMockData] = useState(false);
  const { speak } = useSpeech();
  const { processPrescription, addMedication } = useMedications();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
      processImage(file);
    };
    reader.readAsDataURL(file);
  };

  const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      speak('फोटो ली गई। प्रोसेस हो रहा है...');
      handleFileSelect(file);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      speak('फोटो अपलोड की गई। प्रोसेस हो रहा है...');
      handleFileSelect(file);
    }
  };

  const processImage = async (file: File) => {
    setStep('processing');
    setProcessing(true);

    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      const imageBase64 = await new Promise<string>((resolve) => {
        reader.onloadend = () => resolve(reader.result as string);
      });

      console.log('[UploadPrescription] Image base64 length:', imageBase64?.length || 0);

      // Call backend to process with Gemini Vision
      const result = await processPrescription(imageBase64);

      if (!result.success) {
        throw new Error(result.error || 'Failed to process prescription');
      }

      // Check if mock data was used
      setIsMockData(result.isMock || false);

      // Map the medications from Gemini response
      const medications = result.medications.map((med: any, index: number) => ({
        id: `${Date.now()}-${index}`,
        ...med,
        name: med.name || 'Unknown Medicine', // Ensure name exists
        confidence: med.confidence || 0.95
      }));

      setExtractedData(medications);
      setStep('confirm');
      
      if (result.isMock) {
        speak('टेस्ट डेटा उपयोग किया गया। कृपया जांच लें।');
      } else {
        speak('दवाइयां मिल गईं। कृपया जांच लें।');
      }
    } catch (error) {
      console.error('Error processing image:', error);
      speak('फोटो प्रोसेस करने में समस्या हुई। कृपया फिर से कोशिश करें।');
      setStep('capture');
    } finally {
      setProcessing(false);
    }
  };

  const handleConfirm = async () => {
    speak('दवाइयां सहेज रहे हैं...');
    
    let savedCount = 0;
    
    // Save each medication to database
    for (const med of extractedData) {
      // Remove the temporary id before saving
      const { id, confidence, ...medData } = med;
      
      console.log('Saving medication:', medData);
      const result = await addMedication({
        ...medData,
        confidence // Keep confidence for database
      });
      
      if (result.success) {
        console.log('Medication saved:', result.medication);
        savedCount++;
      } else {
        console.error('Failed to save medication:', result.error);
      }
    }

    if (savedCount > 0) {
      speak(`${savedCount} दवाइयां सहेजी गईं।`);
      onComplete();
    } else {
      speak('दवाइयां सहेजने में समस्या हुई।');
    }
  };

  const handleEdit = (index: number) => {
    speak('संपादन मोड');
    // Navigate to edit screen
  };

  if (step === 'capture') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 p-4">
        <div className="max-w-4xl mx-auto">
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
            <h1 className="text-3xl text-emerald-900">प्रिस्क्रिप्शन जोड़ें</h1>
            <div className="w-14"></div>
          </div>

          {/* Instructions */}
          <div className="bg-white rounded-2xl p-8 mb-8 shadow-md">
            <h2 className="text-2xl mb-4 text-emerald-900">निर्देश</h2>
            <div className="space-y-3 text-lg text-gray-700">
              <p>✓ प्रिस्क्रिप्शन को साफ रोशनी में रखें</p>
              <p>✓ सभी दवाइयों के नाम स्पष्ट दिखने चाहिए</p>
              <p>✓ डॉक्टर का हस्ताक्षर दिखना चाहिए</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4">
            <Button
              onClick={() => cameraInputRef.current?.click()}
              size="lg"
              className="w-full h-24 text-2xl bg-emerald-600 hover:bg-emerald-700"
            >
              <Camera className="w-8 h-8 mr-3" />
              कैमरा से फोटो लें
            </Button>

            <Button
              onClick={() => fileInputRef.current?.click()}
              size="lg"
              variant="outline"
              className="w-full h-24 text-2xl border-2"
            >
              <Upload className="w-8 h-8 mr-3" />
              गैलरी से चुनें
            </Button>
          </div>

          {/* Hidden inputs */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleCameraCapture}
            className="hidden"
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      </div>
    );
  }

  if (step === 'processing') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white rounded-2xl p-12 text-center shadow-2xl">
          <div className="w-32 h-32 mx-auto mb-8 relative">
            {imagePreview && (
              <img
                src={imagePreview}
                alt="Prescription"
                className="w-full h-full object-cover rounded-xl"
              />
            )}
          </div>

          <Loader2 className="w-16 h-16 text-emerald-600 animate-spin mx-auto mb-6" />
          
          <h2 className="text-3xl mb-4 text-emerald-900">प्रिस्क्रिप्शन पढ़ा जा रहा है...</h2>
          <p className="text-xl text-gray-600">
            कृपया प्रतीक्षा करें, हम आपकी दवाइयों की जानकारी निकाल रहे हैं
          </p>

          <div className="mt-8 space-y-2 text-left bg-emerald-50 rounded-xl p-6">
            <p className="text-base text-gray-700">✓ फोटो अपलोड हो गई</p>
            <p className="text-base text-gray-700">✓ AI से विश्लेषण हो रहा है...</p>
            <p className="text-base text-gray-400">○ दवाइयों की जानकारी निकाली जा रही है</p>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'confirm') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 p-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8 pt-4">
            <Button
              onClick={() => setStep('capture')}
              variant="ghost"
              size="lg"
              className="h-14 px-4"
            >
              <ArrowLeft className="w-6 h-6" />
            </Button>
            <h1 className="text-3xl text-emerald-900">जानकारी जांचें</h1>
            <div className="w-14"></div>
          </div>

          {/* Success message */}
          <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-6 mb-6 flex items-center">
            <CheckCircle2 className="w-8 h-8 text-green-600 mr-4" />
            <div>
              <p className="text-xl text-green-900">
                {extractedData.length} दवाई मिली
              </p>
              <p className="text-base text-green-700">
                कृपया सभी जानकारी सही है या नहीं जांच लें
              </p>
            </div>
          </div>

          {/* Mock data notice */}
          {isMockData && (
            <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-6 mb-6">
              <p className="text-base text-amber-900">
                ⚠️ <strong>टेस्ट मोड:</strong> Gemini API अभी कनेक्ट नहीं है, इसलिए सैंपल डेटा दिखाया जा रहा है।
                असली प्रिस्क्रिप्शन स्कैनिंग के लिए Supabase Edge Function में Gemini API key सेटअप करें।
              </p>
            </div>
          )}

          {/* Extracted medications */}
          <div className="space-y-4 mb-8">
            {extractedData.map((med: any, index: number) => (
              <div key={med.id} className="bg-white rounded-2xl p-6 shadow-md">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-2xl mb-2">{med.name}</h3>
                    <p className="text-lg text-gray-600">{med.strength}</p>
                  </div>
                  <Button
                    onClick={() => handleEdit(index)}
                    variant="outline"
                    size="lg"
                    className="h-12 px-4"
                  >
                    <Edit2 className="w-5 h-5" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-4 text-base">
                  <div>
                    <p className="text-gray-500 mb-1">खुराक</p>
                    <p className="text-gray-900">{med.dosage}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-1">बारंबारता</p>
                    <p className="text-gray-900">{med.frequency}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-gray-500 mb-1">समय</p>
                    <p className="text-gray-900">{med.timing.join(', ')}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-gray-500 mb-1">अवधि</p>
                    <p className="text-gray-900">{med.duration}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-gray-500 mb-1">निर्देश</p>
                    <p className="text-gray-900">{med.instructions}</p>
                  </div>
                </div>

                {/* Confidence indicator */}
                {med.confidence && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">विश्वसनीयता</span>
                      <span className="text-emerald-600">
                        {(med.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${med.confidence * 100}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Action buttons */}
          <div className="space-y-4">
            <Button
              onClick={handleConfirm}
              size="lg"
              className="w-full h-20 text-2xl bg-emerald-600 hover:bg-emerald-700"
            >
              ✓ सब सही है, सहेजें
            </Button>

            <Button
              onClick={() => setStep('capture')}
              size="lg"
              variant="outline"
              className="w-full h-16 text-xl border-2"
            >
              नई फोटो लें
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}