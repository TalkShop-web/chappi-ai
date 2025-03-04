
import { Provider } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import { isNetworkError } from '@/utils/connectionUtils'

export function useSignInWithProviderOperation() {
  const { toast } = useToast()

  const signInWithProvider = async (provider: Provider, setIsConnected: (status: boolean) => void) => {
    try {
      console.log(`Attempting to sign in with provider: ${provider}`);
      setIsConnected(true) // Optimistically set connected
      
      const { error, data } = await supabase.auth.signInWithOAuth({ 
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })
      
      if (error) {
        console.error("Provider sign in error:", error);
        setIsConnected(navigator.onLine) // Reset based on browser online status
        
        toast({
          title: "Provider sign in failed",
          description: error.message,
          variant: "destructive"
        })
        throw error
      }
      
      console.log("OAuth sign in initiated:", data);
    } catch (error) {
      console.error("Provider sign in error:", error)
      
      // Check if this is a network error
      if (error instanceof Error && (!navigator.onLine || error.message.includes("network"))) {
        setIsConnected(false)
        toast({
          title: "Connection Error",
          description: "Unable to connect to authentication service. Please check your internet connection.",
          variant: "destructive"
        })
      }
      
      throw error
    }
  }

  return { signInWithProvider }
}
