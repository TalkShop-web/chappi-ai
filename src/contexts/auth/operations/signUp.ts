
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import { isNetworkError, withTimeout, retryWithBackoff, pingConnection } from '@/utils/connectionUtils'

export function useSignUpOperation() {
  const { toast } = useToast()

  const signUp = async (email: string, password: string, setIsConnected: (status: boolean) => void) => {
    try {
      console.log("Attempting signup with:", email)
      
      // Check if we're online first before attempting
      if (!navigator.onLine) {
        console.error("Browser reports offline status for signup")
        setIsConnected(false)
        toast({
          title: "Connection Error",
          description: "Your device appears to be offline. Please check your internet connection.",
          variant: "destructive"
        })
        throw new Error("Device is offline")
      }
      
      // Quick connection check before proceeding
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
      
      console.log("Sending signup request to Supabase...")
      
      // Use retry with backoff for network resilience - with shorter timeouts
      const response = await retryWithBackoff(
        async () => withTimeout(
          supabase.auth.signUp({ 
            email, 
            password,
            options: {
              emailRedirectTo: `${window.location.origin}/auth/callback`,
              captchaToken: undefined
            }
          }),
          10000 // 10 seconds timeout instead of 60
        ),
        2, // 2 retries max instead of 3
        500, // Start with 500ms delay instead of 2000
        3000, // Max 3 second delay instead of 15000
        isNetworkError
      );
      
      if (response.error) {
        console.error("Signup error:", response.error)
        
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
            title: "Sign up failed",
            description: response.error.message,
            variant: "destructive"
          })
        }
        
        throw response.error
      }

      console.log("Signup response:", response.data)
      
      if (response.data?.user) {
        console.log("User created:", response.data.user.email, "Email confirmed:", response.data.user.email_confirmed_at !== null)
      }
      
      // Success message even if email confirmation is required
      toast({
        title: "Account created",
        description: response.data.user && response.data.user.email_confirmed_at !== null 
          ? "You can now sign in." 
          : "Please check your email to confirm your account.",
      })
    } catch (error) {
      console.error("Signup process error:", error)
      
      // Better network error detection
      if (error instanceof Error && (error.message === 'Failed to fetch' || isNetworkError(error) || !navigator.onLine)) {
        setIsConnected(false)
        toast({
          title: "Connection Error",
          description: "Unable to connect to authentication service. Please check your internet connection and try again.",
          variant: "destructive"
        })
      } else {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        toast({
          title: "Sign up failed",
          description: errorMessage,
          variant: "destructive"
        });
      }
      
      throw error
    }
  }

  return { signUp }
}
