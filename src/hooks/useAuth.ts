import { useState, useEffect } from 'react';
import { getSupabaseClient, getServerEndpoint, getAuthHeaders } from '../utils/supabase/client';

interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: 'elderly' | 'caregiver' | 'provider';
  language: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = getSupabaseClient();

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) throw error;
      
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email!,
          name: session.user.user_metadata.name || '',
          phone: session.user.user_metadata.phone || '',
          role: session.user.user_metadata.role || 'elderly',
          language: session.user.user_metadata.language || 'hi'
        });
        setAccessToken(session.access_token);
      }
    } catch (error) {
      console.error('Session check error:', error);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, name: string, phone: string, role: string = 'elderly') => {
    try {
      console.log('🔐 Starting signup process...');
      console.log('📧 Email:', email);
      console.log('👤 Name:', name);
      console.log('📱 Phone:', phone);
      console.log('🎭 Role:', role);
      
      // Use Supabase's built-in signup directly
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            phone,
            role,
            language: 'hi'
          }
        }
      });

      console.log('📊 Signup response:', { authData, signUpError });

      if (signUpError) {
        console.error('❌ Signup error:', signUpError);
        throw signUpError;
      }

      if (authData.session?.user) {
        console.log('✅ User created and logged in:', authData.session.user.id);
        setUser({
          id: authData.session.user.id,
          email: authData.session.user.email!,
          name,
          phone,
          role: role as any,
          language: 'hi'
        });
        setAccessToken(authData.session.access_token);
      } else if (authData.user && !authData.session) {
        console.log('⚠️ User created but email confirmation required');
        return { 
          success: false, 
          error: 'कृपया अपना ईमेल चेक करें और कन्फर्म करें। / Please check your email to confirm your account.' 
        };
      }

      return { success: true };
    } catch (error: any) {
      console.error('💥 Signup error:', error);
      console.error('Error details:', {
        message: error.message,
        name: error.name,
        status: error.status,
        stack: error.stack
      });
      
      // Provide more helpful error messages
      let errorMessage = error.message;
      
      if (error.message?.includes('fetch')) {
        errorMessage = '🌐 इंटरनेट कनेक्शन की जांच करें। Supabase सर्वर तक नहीं पहुंच पा रहे। / Cannot reach Supabase server. Please check:\n\n1. Is your internet working?\n2. Is the Supabase project active?\n3. Check browser console for details.';
      } else if (error.message?.includes('already registered')) {
        errorMessage = 'यह ईमेल पहले से पंजीकृत है। / This email is already registered.';
      }
      
      return { success: false, error: errorMessage };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      if (data.session?.user) {
        setUser({
          id: data.session.user.id,
          email: data.session.user.email!,
          name: data.session.user.user_metadata.name || '',
          phone: data.session.user.user_metadata.phone || '',
          role: data.session.user.user_metadata.role || 'elderly',
          language: data.session.user.user_metadata.language || 'hi'
        });
        setAccessToken(data.session.access_token);
      }

      return { success: true };
    } catch (error: any) {
      console.error('Sign in error:', error);
      return { success: false, error: error.message };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setAccessToken(null);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const updateProfile = async (updates: Partial<User>) => {
    if (!user) return { success: false, error: 'Not authenticated' };

    try {
      const { error } = await supabase.auth.updateUser({
        data: { ...user, ...updates }
      });

      if (error) throw error;

      setUser({ ...user, ...updates });
      return { success: true };
    } catch (error: any) {
      console.error('Update profile error:', error);
      return { success: false, error: error.message };
    }
  };

  return {
    user,
    accessToken,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
    isAuthenticated: !!user
  };
}