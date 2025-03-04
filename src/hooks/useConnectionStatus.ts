
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export function useConnectionStatus() {
  const [isConnected, setIsConnected] = useState(false)

  // Setup a connection check every minute
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const { error } = await supabase.auth.getSession()
        setIsConnected(!error)
      } catch (e) {
        setIsConnected(false)
        console.error("Connection check failed:", e)
      }
    }
    
    checkConnection()
    const interval = setInterval(checkConnection, 60000) // Every minute
    
    return () => clearInterval(interval)
  }, [])

  return { isConnected, setIsConnected }
}
