
import { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

export function useAuthSession() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    // Check active sessions
    const fetchSession = async () => {
      try {
        console.log("Fetching initial session...");
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error("Session fetch error:", error);
          throw error;
        }
        
        setUser(session?.user ?? null)
        setIsConnected(true)
        console.log("Session checked, user:", session?.user?.email || "No user")
      } catch (error) {
        console.error("Error fetching session:", error)
        setIsConnected(false)
      } finally {
        setLoading(false)
      }
    }

    fetchSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log("Auth state changed:", _event, session?.user?.email || "No user")
      setUser(session?.user ?? null)
      setIsConnected(true) // If we get an event, we're connected
    })

    return () => subscription.unsubscribe()
  }, [])

  return { user, loading, isConnected, setIsConnected }
}
