import { useState } from 'react';
import { Button } from './ui/button';
import { getSupabaseClient } from '../utils/supabase/client';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

export function SupabaseConnectionTest() {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    details?: any;
  } | null>(null);

  const testConnection = async () => {
    setTesting(true);
    setResult(null);
    
    try {
      console.log('🧪 Testing Supabase connection...');
      
      const supabase = getSupabaseClient();
      
      // Test 1: Health check
      console.log('Test 1: Health check...');
      const healthResponse = await fetch('https://zdjzdwujvvrabbzazkbc.supabase.co/rest/v1/', {
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpkanpkd3VqdnZyYWJiemF6a2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzNTAyODIsImV4cCI6MjA3OTkyNjI4Mn0.sOFOXcB8tFGUZ9ZESVYsVjoRmxKZYH4yMpGr-bwcNdM'
        }
      });
      
      console.log('Health response:', healthResponse.status, healthResponse.statusText);
      
      if (!healthResponse.ok) {
        throw new Error(`Health check failed: ${healthResponse.status} ${healthResponse.statusText}`);
      }
      
      // Test 2: Auth service
      console.log('Test 2: Testing auth service...');
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        throw new Error(`Auth service error: ${sessionError.message}`);
      }
      
      console.log('Session data:', sessionData);
      
      // Test 3: Try a simple query (this will fail if tables don't exist, but that's ok)
      console.log('Test 3: Testing database connection...');
      const { error: dbError } = await supabase
        .from('medications')
        .select('count')
        .limit(1);
      
      const dbStatus = dbError 
        ? `⚠️ Database accessible but tables not set up: ${dbError.message}`
        : '✅ Database connected and tables exist';
      
      console.log('Database status:', dbStatus);
      
      setResult({
        success: true,
        message: '✅ Supabase connection successful!',
        details: {
          healthCheck: '✅ API reachable',
          authService: '✅ Auth service working',
          database: dbStatus,
          projectId: 'zdjzdwujvvrabbzazkbc',
          url: 'https://zdjzdwujvvrabbzazkbc.supabase.co'
        }
      });
      
    } catch (error: any) {
      console.error('❌ Connection test failed:', error);
      
      setResult({
        success: false,
        message: '❌ Connection failed',
        details: {
          error: error.message,
          errorType: error.name,
          suggestion: error.message.includes('fetch') 
            ? 'Network error - check if Supabase project is active and internet is working'
            : 'Check Supabase dashboard - project may be paused or deleted'
        }
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md max-w-2xl mx-auto my-8">
      <h2 className="text-2xl mb-4">🔌 Supabase Connection Test</h2>
      
      <Button
        onClick={testConnection}
        disabled={testing}
        className="w-full h-12 text-lg mb-4"
      >
        {testing ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Testing Connection...
          </>
        ) : (
          '🧪 Test Supabase Connection'
        )}
      </Button>
      
      {result && (
        <div className={`p-4 rounded-lg border-2 ${
          result.success 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center gap-2 mb-3">
            {result.success ? (
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            ) : (
              <XCircle className="w-6 h-6 text-red-600" />
            )}
            <h3 className="text-xl">{result.message}</h3>
          </div>
          
          {result.details && (
            <div className="space-y-2 text-sm">
              {Object.entries(result.details).map(([key, value]) => (
                <div key={key} className="flex gap-2">
                  <span className="font-semibold min-w-[120px]">{key}:</span>
                  <span className="font-mono text-xs bg-white px-2 py-1 rounded">
                    {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                  </span>
                </div>
              ))}
            </div>
          )}
          
          {!result.success && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-sm">
                <strong>📋 Steps to fix:</strong>
              </p>
              <ol className="text-sm mt-2 space-y-1 list-decimal list-inside">
                <li>Check if Supabase project is active (not paused)</li>
                <li>Verify project ID: <code className="bg-white px-1 rounded">zdjzdwujvvrabbzazkbc</code></li>
                <li>Check internet connection</li>
                <li>Open browser console (F12) for detailed logs</li>
                <li>Try refreshing the page</li>
              </ol>
            </div>
          )}
        </div>
      )}
      
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm">
        <p className="mb-2"><strong>ℹ️ Connection Info:</strong></p>
        <p>Project ID: <code className="bg-white px-1 rounded">zdjzdwujvvrabbzazkbc</code></p>
        <p>URL: <code className="bg-white px-1 rounded">https://zdjzdwujvvrabbzazkbc.supabase.co</code></p>
      </div>
    </div>
  );
}
