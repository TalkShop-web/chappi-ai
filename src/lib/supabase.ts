
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://38a9e9b6-f1cf-4510-aad9-31f7ae0d3fab.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IjM4YTllOWI2LWYxY2YtNDUxMC1hYWQ5LTMxZjdhZTBkM2ZhYiIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzEwMzMyMTQ3LCJleHAiOjIwMjU5MDgxNDd9.bJ5Ks9ZXXOIaRdNDKEooxXdeMRTyUWt9tEKh3UwSr9k'

// Create Supabase client with improved network and retry settings
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  global: {
    fetch: (url, options) => {
      // Add custom fetch configuration to help with network issues
      console.log(`Supabase fetch: ${url instanceof URL ? url.toString() : String(url)}`)
      return fetch(url, options)
    },
    headers: {
      'X-Client-Info': 'chappi-web-app',
    },
  },
  // Setting longer timeout for network issues
  realtime: {
    timeout: 60000, // 60 seconds
  }
})

// Add a function to check if supabase is connected
export const checkSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase.from('service_connections').select('count', { count: 'exact' }).limit(1)
    if (error) {
      console.error('Supabase connection check failed:', error)
      return false
    }
    console.log('Supabase connection successful')
    return true
  } catch (error) {
    console.error('Supabase connection error:', error)
    return false
  }
}
