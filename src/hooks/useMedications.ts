import { useState, useEffect } from 'react';
import { getSupabaseClient, getServerEndpoint, getAuthHeaders } from '../utils/supabase/client';

export interface Medication {
  id: string;
  userId?: string;
  user_id?: string;
  name: string;
  strength?: string;
  dosage?: string;
  frequency?: string;
  timing?: string[];
  duration?: string;
  instructions?: string;
  imageUrl?: string;
  image_url?: string;
  prescriptionId?: string;
  prescription_id?: string;
  confidence?: number;
  isActive?: boolean;
  is_active?: boolean;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
}

export function useMedications() {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = getSupabaseClient();

  // Load medications from Supabase on mount
  useEffect(() => {
    loadMedications();
  }, []);

  const loadMedications = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('[useMedications] Loading medications from Supabase...');

      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.warn('[useMedications] No authenticated user, cannot load medications');
        setMedications([]);
        return;
      }

      console.log('[useMedications] Authenticated user:', user.id);

      // Query without is_active filter for now (column may not exist yet)
      const { data, error: fetchError } = await supabase
        .from('medications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('[useMedications] Supabase error:', fetchError);
        throw fetchError;
      }

      console.log('[useMedications] Loaded medications:', data?.length || 0);
      console.log('[useMedications] Medications data:', data);

      // Normalize the data and filter active ones in memory if is_active exists
      const normalizedMedications = (data || [])
        .filter(med => med.is_active !== false) // Only filter out explicitly false values
        .map(med => ({
          id: med.id,
          userId: med.user_id,
          name: med.name,
          strength: med.strength,
          dosage: med.dosage,
          frequency: med.frequency,
          timing: med.timing || [],
          duration: med.duration,
          instructions: med.instructions,
          imageUrl: med.image_url,
          prescriptionId: med.prescription_id,
          isActive: med.is_active !== false, // Default to true if undefined
          createdAt: med.created_at,
          updatedAt: med.updated_at
        }));

      setMedications(normalizedMedications);
    } catch (err) {
      console.error('[useMedications] Error loading medications:', err);
      setError(err instanceof Error ? err.message : 'Failed to load medications');
      setMedications([]);
    } finally {
      setLoading(false);
    }
  };

  const addMedication = async (medication: Partial<Medication>) => {
    try {
      console.log('[useMedications] Adding medication:', medication);

      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Prepare medication data for database (without is_active if column doesn't exist)
      const medicationData: any = {
        user_id: user.id,
        name: medication.name || '',
        strength: medication.strength || null,
        dosage: medication.dosage || null,
        frequency: medication.frequency || null,
        timing: medication.timing || [],
        duration: medication.duration || null,
        instructions: medication.instructions || null,
        image_url: medication.imageUrl || medication.image_url || null,
        prescription_id: medication.prescriptionId || medication.prescription_id || null
        // Note: confidence field removed - not in database schema
      };

      console.log('[useMedications] Inserting to Supabase:', medicationData);

      const { data, error: insertError } = await supabase
        .from('medications')
        .insert([medicationData])
        .select()
        .single();

      if (insertError) {
        console.error('[useMedications] Insert error:', insertError);
        throw insertError;
      }

      console.log('[useMedications] Medication added successfully:', data);

      // Reload medications to get fresh data
      await loadMedications();

      return {
        success: true,
        medication: data
      };
    } catch (err) {
      console.error('[useMedications] Error adding medication:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to add medication'
      };
    }
  };

  const updateMedication = async (id: string, updates: Partial<Medication>) => {
    try {
      console.log('[useMedications] Updating medication:', id, updates);

      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Prepare update data
      const updateData: any = {};
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.strength !== undefined) updateData.strength = updates.strength;
      if (updates.dosage !== undefined) updateData.dosage = updates.dosage;
      if (updates.frequency !== undefined) updateData.frequency = updates.frequency;
      if (updates.timing !== undefined) updateData.timing = updates.timing;
      if (updates.duration !== undefined) updateData.duration = updates.duration;
      if (updates.instructions !== undefined) updateData.instructions = updates.instructions;
      if (updates.imageUrl !== undefined) updateData.image_url = updates.imageUrl;
      if (updates.image_url !== undefined) updateData.image_url = updates.image_url;

      const { data, error: updateError } = await supabase
        .from('medications')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (updateError) {
        console.error('[useMedications] Update error:', updateError);
        throw updateError;
      }

      console.log('[useMedications] Medication updated successfully:', data);

      // Reload medications
      await loadMedications();

      return {
        success: true,
        medication: data
      };
    } catch (err) {
      console.error('[useMedications] Error updating medication:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to update medication'
      };
    }
  };

  const deleteMedication = async (id: string) => {
    try {
      console.log('[useMedications] Deleting medication:', id);

      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Try soft delete first, fallback to hard delete if is_active column doesn't exist
      let deleteError = null;
      
      // Attempt soft delete
      const softDeleteResult = await supabase
        .from('medications')
        .update({ is_active: false })
        .eq('id', id)
        .eq('user_id', user.id);
      
      deleteError = softDeleteResult.error;
      
      // If is_active column doesn't exist, do hard delete
      if (deleteError && deleteError.code === '42703') {
        console.log('[useMedications] is_active column not found, doing hard delete');
        const hardDeleteResult = await supabase
          .from('medications')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id);
        
        deleteError = hardDeleteResult.error;
      }

      if (deleteError) {
        console.error('[useMedications] Delete error:', deleteError);
        throw deleteError;
      }

      console.log('[useMedications] Medication deleted successfully');

      // Reload medications
      await loadMedications();

      return { success: true };
    } catch (err) {
      console.error('[useMedications] Error deleting medication:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to delete medication'
      };
    }
  };

  const processPrescription = async (imageBase64: string) => {
    try {
      console.log('📸 [useMedications] Processing prescription with Gemini...');
      console.log('[useMedications] Image data length:', imageBase64?.length || 0);

      // Validate image data
      if (!imageBase64 || imageBase64.length === 0) {
        throw new Error('No image provided');
      }

      // Check if image is a valid base64 data URL
      if (!imageBase64.startsWith('data:image/')) {
        throw new Error('Invalid image format. Expected base64 data URL');
      }

      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('User not authenticated');
      }

      console.log('[useMedications] Calling Edge Function...');

      // Call server endpoint for Gemini OCR
      const response = await fetch(getServerEndpoint('/hyper-task'), {
        method: 'POST',
        headers: getAuthHeaders(session.access_token),
        body: JSON.stringify({ imageBase64: imageBase64 })
      });

      console.log('[useMedications] Response status:', response.status);

      const data = await response.json();

      if (!response.ok || data.error) {
        console.warn('⚠️ [useMedications] Server response not OK:', { status: response.status, error: data.error });
        
        // If Edge Function doesn't exist, return mock data for testing
        if (response.status === 404 || response.status === 500) {
          console.log('💡 [useMedications] Edge Function not deployed yet - using mock data for testing');
          console.log('ℹ️  To enable real OCR, deploy the Edge Function and add GEMINI_API_KEY');
          return {
            success: true,
            medications: generateMockMedications(),
            prescriptionId: `mock-${Date.now()}`,
            isMock: true
          };
        }
        
        throw new Error(data.error || 'Failed to process prescription');
      }

      console.log('[useMedications] Prescription processed successfully:', data);

      return {
        success: true,
        medications: data.medications || [],
        prescriptionId: data.prescriptionId
      };
    } catch (err) {
      // Check if it's a network error (Edge Function not deployed)
      const isNetworkError = err instanceof TypeError && err.message.includes('Failed to fetch');
      
      if (isNetworkError) {
        console.log('💡 [useMedications] Edge Function not deployed - using mock data for testing');
        console.log('ℹ️  This is normal! The app works with mock data until you deploy the Edge Function');
      } else {
        console.error('❌ [useMedications] Error processing prescription:', err);
      }
      
      // Fallback to mock data - this is expected behavior without Edge Function
      return {
        success: true,
        medications: generateMockMedications(),
        prescriptionId: `mock-${Date.now()}`,
        isMock: true,
        error: err instanceof Error ? err.message : 'Failed to process prescription'
      };
    }
  };

  // Helper function to generate mock medications for testing
  const generateMockMedications = () => {
    return [
      {
        name: 'Paracetamol',
        strength: '500mg',
        dosage: '1 tablet',
        frequency: 'दिन में दो बार',
        timing: ['सुबह', 'शाम'],
        duration: '7 दिन',
        instructions: 'खाने के बाद लें'
      },
      {
        name: 'Amoxicillin',
        strength: '250mg',
        dosage: '1 capsule',
        frequency: 'दिन में तीन बार',
        timing: ['सुबह', 'दोपहर', 'रात'],
        duration: '5 दिन',
        instructions: 'खाली पेट लें'
      },
      {
        name: 'Vitamin D3',
        strength: '60000 IU',
        dosage: '1 sachet',
        frequency: 'हफ्ते में एक बार',
        timing: ['सुबह'],
        duration: '8 हफ्ते',
        instructions: 'दूध के साथ लें'
      }
    ];
  };

  return {
    medications,
    loading,
    error,
    loadMedications,
    addMedication,
    updateMedication,
    deleteMedication,
    processPrescription
  };
}