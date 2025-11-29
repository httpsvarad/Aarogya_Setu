import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from './info.tsx';

// Singleton client instance for frontend
let supabaseClient: ReturnType<typeof createClient> | null = null;

export function getSupabaseClient() {
  if (!supabaseClient) {
    const supabaseUrl = `https://${projectId}.supabase.co`;
    
    console.log('🔧 Initializing Supabase client...');
    console.log('📍 URL:', supabaseUrl);
    console.log('🔑 Anon Key:', publicAnonKey.substring(0, 20) + '...');
    
    supabaseClient = createClient(
      supabaseUrl,
      publicAnonKey,
      {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true
        }
      }
    );
    
    console.log('✅ Supabase client initialized');
  }
  return supabaseClient;
}

// Server endpoint helper
export function getServerEndpoint(route: string) {
  return `https://${projectId}.supabase.co/functions/v1/${route}`;
}

// Auth header helper
export function getAuthHeaders(accessToken?: string) {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken || publicAnonKey}`
  };
}