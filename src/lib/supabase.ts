
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://38a9e9b6-f1cf-4510-aad9-31f7ae0d3fab.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IjM4YTllOWI2LWYxY2YtNDUxMC1hYWQ5LTMxZjdhZTBkM2ZhYiIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzEwMzMyMTQ3LCJleHAiOjIwMjU5MDgxNDd9.bJ5Ks9ZXXOIaRdNDKEooxXdeMRTyUWt9tEKh3UwSr9k'

// Create Supabase client with retry logic
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'X-Client-Info': 'chappi-app'
    },
    // Add fetch options with longer timeout
    fetch: (url, options) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
      
      return fetch(url, {
        ...options,
        signal: controller.signal,
      }).finally(() => clearTimeout(timeoutId));
    }
  }
})

// Define a type for the connection check result
export interface ConnectionCheckResult {
  connected: boolean;
  partial?: boolean;
  error: Error | null;
  message: string;
}

// Improved connection check function with better error reporting and timeout
export const checkSupabaseConnection = async (): Promise<ConnectionCheckResult> => {
  if (!navigator.onLine) {
    console.error('Browser reports device is offline');
    return {
      connected: false,
      error: new Error('Device offline'),
      message: 'Your device appears to be offline. Please check your internet connection.'
    };
  }

  try {
    console.log('Testing Supabase connection...')
    
    // First, try a quick auth check which should be faster than DB
    try {
      const authCheck = await supabase.auth.getSession();
      
      if (authCheck.error) {
        console.error('Auth connection error:', authCheck.error.message);
        return {
          connected: false,
          error: authCheck.error,
          message: `Unable to connect to authentication service: ${authCheck.error.message}`
        };
      }
      
      // If we can connect to auth, we're at least partially connected
      return {
        connected: true,
        partial: true,
        error: null,
        message: 'Connected to authentication service'
      };
    } catch (err: any) {
      // Check specifically for Failed to fetch errors
      if (err && err.message === 'Failed to fetch') {
        return {
          connected: false,
          error: err,
          message: 'Network error: Failed to fetch. Please check your connection.'
        };
      }
      throw err;
    }
  } catch (error: any) {
    console.error('Supabase connection error:', error);
    
    // Distinguish between timeout and other errors
    const isTimeoutError = error instanceof DOMException && error.name === 'AbortError';
    const isNetworkError = error.message === 'Failed to fetch' || !navigator.onLine;
    
    return {
      connected: false,
      error: error as Error,
      message: isTimeoutError 
        ? 'Connection timed out. Server may be unavailable or your connection is slow.'
        : isNetworkError
          ? 'Network error detected. Please check your internet connection.'
          : error instanceof Error 
            ? error.message 
            : 'Unknown connection error'
    };
  }
}
