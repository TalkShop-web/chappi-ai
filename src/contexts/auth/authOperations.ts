import { Provider } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import { isNetworkError, withTimeout } from '@/utils/connectionUtils'

// Define the response type to fix TS errors
interface SupabaseResponse {
  data: any;
  error: any;
}

export function useAuthOperations() {
  const { toast } = useToast()

  const signIn = async (email: string, password: string, setIsConnected: (status: boolean) => void) => {
    try {
      console.log("Attempting to sign in with:", email)
      
      // First check if we're online
      if (!navigator.onLine) {
        console.error("Browser reports offline status")
        setIsConnected(false)
        toast({
          title: "Connection Error",
          description: "Your device appears to be offline. Please check your internet connection.",
          variant: "destructive"
        })
        return // Early return - don't even try to connect if we're offline
      }
      
      setIsConnected(true) // Optimistically set connected
      
      const response = await withTimeout(
        supabase.auth.signInWithPassword({ 
          email, 
          password,
          options: {
            captchaToken: undefined
          }
        }),
        10000
      );
      
      if (response.error) {
        console.error("Sign in error:", response.error)
        
        if (isNetworkError(response.error)) {
          setIsConnected(false)
          toast({
            title: "Connection Error",
            description: "Unable to reach authentication servers. Please check your internet connection.",
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
      
      if (error instanceof Error && isNetworkError(error)) {
        toast({
          title: "Connection Error",
          description: "Unable to connect to authentication service. Please check your internet connection.",
          variant: "destructive"
        })
        setIsConnected(false)
      }
      
      throw error
    }
  }

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
        return // Early return
      }
      
      setIsConnected(true) // Optimistically set connected
      
      // Add additional logging to track the request
      console.log("Sending signup request to Supabase...");
      
      const response = await withTimeout(
        supabase.auth.signUp({ 
          email, 
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
            captchaToken: undefined
          }
        }),
        10000
      );
      
      if (response.error) {
        console.error("Signup error:", response.error)
        
        if (isNetworkError(response.error)) {
          setIsConnected(false)
          toast({
            title: "Connection Error",
            description: "Unable to reach authentication servers. Please check your internet connection.",
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
      
      if (error instanceof Error && isNetworkError(error)) {
        setIsConnected(false)
        toast({
          title: "Connection Error",
          description: "Unable to connect to authentication service. Please check your internet connection.",
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
      
      throw error;
    }
  }

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

  const signOut = async (setIsConnected: (status: boolean) => void) => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        toast({
          title: "Sign out failed",
          description: error.message,
          variant: "destructive"
        })
        throw error
      }
      toast({
        title: "Signed out",
        description: "You have been successfully signed out."
      })
    } catch (error) {
      console.error("Sign out error:", error)
      
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

  return {
    signIn,
    signUp,
    signInWithProvider,
    signOut
  }
}
