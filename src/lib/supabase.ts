
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://38a9e9b6-f1cf-4510-aad9-31f7ae0d3fab.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IjM4YTllOWI2LWYxY2YtNDUxMC1hYWQ5LTMxZjdhZTBkM2ZhYiIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzEwMzMyMTQ3LCJleHAiOjIwMjU5MDgxNDd9.bJ5Ks9ZXXOIaRdNDKEooxXdeMRTyUWt9tEKh3UwSr9k'

// Create a single Supabase client instance
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'X-Client-Info': 'chappi-web-app',
    },
  },
  // Improved realtime settings
  realtime: {
    timeout: 60000, // 60 seconds
    params: {
      eventsPerSecond: 1 // Lowering this to ensure reliable connection
    }
  }
})

// Add a function to check if supabase is connected
export const checkSupabaseConnection = async () => {
  try {
    console.log('Testing Supabase connection...')
    // Use a simple public query to test connection
    const { error } = await supabase.from('service_connections').select('count').limit(1)
    
    if (error) {
      console.error('Supabase connection check failed:', error)
      return {
        connected: false,
        error: error
      }
    }
    
    console.log('Supabase connection successful')
    return {
      connected: true,
      error: null
    }
  } catch (error) {
    console.error('Supabase connection error:', error)
    return {
      connected: false,
      error: error
    }
  }
}
