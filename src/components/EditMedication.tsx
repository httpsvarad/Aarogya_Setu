import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { useSpeech } from '../hooks/useSpeech';

interface EditMedicationProps {
  medication: any;
  onSave: () => void;
  onBack: () => void;
}

export function EditMedication({ medication, onSave, onBack }: EditMedicationProps) {
  const [formData, setFormData] = useState({
    name: medication?.name || '',
    strength: medication?.strength || '',
    dosage: medication?.dosage || '',
    frequency: medication?.frequency || '',
    timing: medication?.timing || [],
    duration: medication?.duration || '',
    instructions: medication?.instructions || ''
  });
  const { speak } = useSpeech();

  const handleSave = () => {
    // Save to IndexedDB and Supabase
    speak('दवाई की जानकारी सहेजी गई');
    onSave();
  };

  const handleDelete = () => {
    if (confirm('क्या आप इस दवाई को हटाना चाहते हैं?')) {
      speak('दवाई हटाई गई');
      onBack();
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
          <h1 className="text-3xl text-emerald-900">दवाई संपादित करें</h1>
          <Button
            onClick={handleDelete}
            variant="ghost"
            size="lg"
            className="h-14 px-4 text-red-600"
          >
            <Trash2 className="w-6 h-6" />
          </Button>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl p-8 shadow-md space-y-6">
          <div>
            <Label htmlFor="name" className="text-xl mb-2 block">दवाई का नाम</Label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="h-14 text-lg"
            />
          </div>

          <div>
            <Label htmlFor="strength" className="text-xl mb-2 block">ताकत</Label>
            <Input
              id="strength"
              type="text"
              value={formData.strength}
              onChange={(e) => setFormData({ ...formData, strength: e.target.value })}
              className="h-14 text-lg"
              placeholder="जैसे: 500mg"
            />
          </div>

          <div>
            <Label htmlFor="dosage" className="text-xl mb-2 block">खुराक</Label>
            <Input
              id="dosage"
              type="text"
              value={formData.dosage}
              onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
              className="h-14 text-lg"
              placeholder="जैसे: 1 गोली"
            />
          </div>

          <div>
            <Label htmlFor="frequency" className="text-xl mb-2 block">बारंबारता</Label>
            <Input
              id="frequency"
              type="text"
              value={formData.frequency}
              onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
              className="h-14 text-lg"
              placeholder="जैसे: दिन में 2 बार"
            />
          </div>

          <div>
            <Label htmlFor="duration" className="text-xl mb-2 block">अवधि</Label>
            <Input
              id="duration"
              type="text"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
              className="h-14 text-lg"
              placeholder="जैसे: 30 दिन"
            />
          </div>

          <div>
            <Label htmlFor="instructions" className="text-xl mb-2 block">निर्देश</Label>
            <Input
              id="instructions"
              type="text"
              value={formData.instructions}
              onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
              className="h-14 text-lg"
              placeholder="जैसे: खाना खाने के बाद"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 space-y-4">
          <Button
            onClick={handleSave}
            size="lg"
            className="w-full h-16 text-2xl bg-emerald-600 hover:bg-emerald-700"
          >
            ✓ सहेजें
          </Button>

          <Button
            onClick={onBack}
            size="lg"
            variant="outline"
            className="w-full h-14 text-xl border-2"
          >
            रद्द करें
          </Button>
        </div>
      </div>
    </div>
  );
}
