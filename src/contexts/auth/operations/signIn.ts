
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import { isNetworkError, withTimeout, retryWithBackoff, pingConnection } from '@/utils/connectionUtils'

export function useSignInOperation() {
  const { toast } = useToast()

  const signIn = async (email: string, password: string, setIsConnected: (status: boolean) => void) => {
    try {
      console.log("Attempting to sign in with:", email)
      
      // First check if we're online before attempting
      if (!navigator.onLine) {
        console.error("Browser reports offline status")
        setIsConnected(false)
        toast({
          title: "Connection Error",
          description: "Your device appears to be offline. Please check your internet connection.",
          variant: "destructive"
        })
        throw new Error("Device is offline")
      }
      
      // Check connection with quick ping before proceeding
      const isConnected = await pingConnection();
      if (!isConnected) {
        console.error("Ping test failed, connection appears to be down");
        setIsConnected(false);
        toast({
          title: "Connection Error",
          description: "Cannot reach our servers. Please check your internet connection and try again.",
          variant: "destructive"
        });
        throw new Error("Server unreachable");
      }
      
      setIsConnected(true) // Optimistically set connected
      
      console.log("Sending sign in request to Supabase...")
      
      // Use retry with backoff for network resilience
      const response = await retryWithBackoff(
        async () => withTimeout(
          supabase.auth.signInWithPassword({ 
            email, 
            password,
            options: {
              captchaToken: undefined
            }
          }),
          30000 // 30 seconds timeout for sign in
        ),
        2, // 2 retries max
        1000, // Start with 1 second delay
        8000, // Max 8 second delay
        isNetworkError
      );
      
      if (response.error) {
        console.error("Sign in error:", response.error)
        
        if (isNetworkError(response.error)) {
          setIsConnected(false)
          toast({
            title: "Connection Error",
            description: "Unable to reach authentication servers. Please check your internet connection and try again.",
            variant: "destructive"
          })
        } else {
          // Regular auth error, we're still connected
          setIsConnected(true)
          toast({
            title: "Sign in failed",
            description: response.error.message,
            variant: "destructive"
          })
        }
        
        throw response.error
      }
      
      if (response.data?.user) {
        console.log("Sign in successful for:", response.data.user.email)
        toast({
          title: "Sign in successful",
          description: `Welcome back, ${response.data.user.email}!`,
        })
      }
    } catch (error) {
      console.error("Sign in error:", error)
      
      // Check explicitly for network errors
      if (error instanceof Error) {
        if (error.message === 'Failed to fetch' || isNetworkError(error) || !navigator.onLine) {
          setIsConnected(false)
          toast({
            title: "Connection Error",
            description: "Unable to connect to authentication service. Please check your internet connection and try again.",
            variant: "destructive"
          })
        }
      }
      
      throw error
    }
  }

  return { signIn }
}
