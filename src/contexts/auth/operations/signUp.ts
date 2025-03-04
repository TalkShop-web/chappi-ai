
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import { isNetworkError, withTimeout } from '@/utils/connectionUtils'

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
      
      setIsConnected(true) // Optimistically set connected
      
      console.log("Sending signup request to Supabase...")
      
      const response = await withTimeout(
        supabase.auth.signUp({ 
          email, 
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
            captchaToken: undefined
          }
        }),
        15000 // Increased timeout to 15 seconds
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
      if (error instanceof Error && (isNetworkError(error) || !navigator.onLine)) {
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
