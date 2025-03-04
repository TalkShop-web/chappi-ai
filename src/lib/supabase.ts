
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://38a9e9b6-f1cf-4510-aad9-31f7ae0d3fab.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IjM4YTllOWI2LWYxY2YtNDUxMC1hYWQ5LTMxZjdhZTBkM2ZhYiIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzEwMzMyMTQ3LCJleHAiOjIwMjU5MDgxNDd9.bJ5Ks9ZXXOIaRdNDKEooxXdeMRTyUWt9tEKh3UwSr9k'

// Create Supabase client with fetch configuration to ensure consistent behavior
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
    fetch: fetch.bind(globalThis)
  }
})

// Improved connection check function with better error reporting
export const checkSupabaseConnection = async () => {
  try {
    console.log('Testing Supabase connection...')
    
    // First, try to ping the API without authentication
    const { data, error } = await supabase.from('service_connections').select('count', { count: 'exact', head: true })
    
    if (error) {
      console.error('Supabase connection error:', error.message, error.code)
      
      // Try a basic auth endpoint as fallback
      try {
        const { error: authError } = await supabase.auth.getSession()
        if (authError) {
          console.error('Auth connection error:', authError.message, authError.code)
          return {
            connected: false,
            error: authError,
            message: `Auth connection failed: ${authError.message}`
          }
        }
        
        // Auth works but database doesn't
        return {
          connected: true,
          partial: true,
          error: error,
          message: 'Connected to auth services but database access failed'
        }
      } catch (authCatchError) {
        console.error('Auth connection catch error:', authCatchError)
        return {
          connected: false,
          error: authCatchError,
          message: 'Failed to connect to all Supabase services'
        }
      }
    }
    
    console.log('Supabase connection successful')
    return {
      connected: true,
      error: null,
      message: 'Connected to all Supabase services'
    }
  } catch (error) {
    console.error('Supabase connection catch error:', error)
    return {
      connected: false,
      error: error,
      message: error instanceof Error ? error.message : 'Unknown connection error'
    }
  }
}
