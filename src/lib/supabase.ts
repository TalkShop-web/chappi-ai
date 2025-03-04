
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://38a9e9b6-f1cf-4510-aad9-31f7ae0d3fab.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IjM4YTllOWI2LWYxY2YtNDUxMC1hYWQ5LTMxZjdhZTBkM2ZhYiIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzEwMzMyMTQ3LCJleHAiOjIwMjU5MDgxNDd9.bJ5Ks9ZXXOIaRdNDKEooxXdeMRTyUWt9tEKh3UwSr9k'

// Custom fetch function with retry logic and longer timeout
const customFetch = (url: string, options: RequestInit): Promise<Response> => {
  return new Promise((resolve, reject) => {
    const MAX_RETRIES = 3;
    let retryCount = 0;
    
    const attemptFetch = () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      fetch(url, {
        ...options,
        signal: controller.signal
      }).then(response => {
        clearTimeout(timeoutId);
        resolve(response);
      }).catch(err => {
        clearTimeout(timeoutId);
        
        // Detect if it's a network error worth retrying
        const isNetworkError = !navigator.onLine || 
          err.name === 'AbortError' || 
          err.name === 'TimeoutError' || 
          err.message.includes('fetch') || 
          err.message.includes('network');
          
        if (isNetworkError && retryCount < MAX_RETRIES) {
          retryCount++;
          const delay = Math.min(1000 * Math.pow(2, retryCount) + Math.random() * 100, 10000);
          console.log(`Fetch attempt ${retryCount} failed, retrying in ${Math.round(delay)}ms...`);
          
          setTimeout(attemptFetch, delay);
        } else {
          reject(err);
        }
      });
    };
    
    attemptFetch();
  });
};

// Create Supabase client with improved resilience
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
    fetch: customFetch
  }
})

// Define a type for the connection check result
export interface ConnectionCheckResult {
  connected: boolean;
  partial?: boolean;
  error: Error | null;
  message: string;
}

// Improved connection check function with better error reporting
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
    
    // First, try a simple ping test which should be fast
    try {
      // Use a simple ping to quickly test connectivity
      const pingPromise = supabase.auth.getSession();
      
      // Using a separate timeout promise for race condition
      const timeoutPromise = new Promise<{data: null, error: Error}>((_, reject) => {
        setTimeout(() => reject({
          data: null, 
          error: new Error('Connection timed out')
        }), 5000);
      });
      
      // Using Promise.race to implement timeout
      const { data, error } = await Promise.race([pingPromise, timeoutPromise]);
      
      if (error) {
        console.error('Auth connection error:', error.message);
        return {
          connected: false,
          error: error,
          message: `Unable to connect to authentication service: ${error.message}`
        };
      }
      
      // If session check worked, we're at least partially connected
      return {
        connected: true,
        partial: false,
        error: null,
        message: 'Connected to authentication service'
      };
    } catch (err: any) {
      console.error('Auth check error:', err);
      
      // Handle different error scenarios
      if (err && err.error && err.error.message === 'Connection timed out') {
        return {
          connected: false,
          partial: true,
          error: err.error,
          message: 'Connection is slow. Basic functionality may work, but some features might be limited.'
        };
      }
      
      // Specific error handling for various network issues
      if (err) {
        if (err.name === 'AbortError' || (err.message && err.message.includes('timed out'))) {
          return {
            connected: false,
            partial: true,
            error: err,
            message: 'Connection is slow. Basic functionality may work, but some features might be limited.'
          };
        }
        
        if (err.message === 'Failed to fetch') {
          return {
            connected: false,
            error: err,
            message: 'Network error: Failed to fetch. Please check your connection.'
          };
        }
      }
      
      // Fallback for other error types
      return {
        connected: false,
        partial: true,
        error: err,
        message: 'Limited connection detected. Some features may work.'
      };
    }
  } catch (error: any) {
    console.error('Supabase connection error:', error);
    
    // Distinguish between timeout and other errors
    const isTimeoutError = error instanceof Error && 
      (error.name === 'AbortError' || error.message.includes('timed out'));
    const isNetworkError = error.message === 'Failed to fetch' || !navigator.onLine;
    
    return {
      connected: false,
      error: error as Error,
      message: isTimeoutError 
        ? 'Connection timed out. Basic features will still work offline.'
        : isNetworkError
          ? 'Network error detected. Please check your internet connection.'
          : error instanceof Error 
            ? error.message 
            : 'Unknown connection error'
    };
  }
}
