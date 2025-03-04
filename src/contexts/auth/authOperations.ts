
import { Provider } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

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
      
      const { error, data } = await supabase.auth.signInWithPassword({ 
        email, 
        password,
        options: {
          captchaToken: undefined, // Make sure no captcha is expected
        }
      })
      
      if (error) {
        console.error("Sign in error:", error)
        
        // Check if this is a network error (response code is 0 or message includes network-related terms)
        const isNetworkError = 
          (error.status === 0) || 
          error.message.includes("fetch") || 
          error.message.includes("network") ||
          error.message.includes("Failed to fetch") ||
          !navigator.onLine
        
        if (isNetworkError) {
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
            description: error.message,
            variant: "destructive"
          })
        }
        
        throw error
      }
      
      if (data?.user) {
        console.log("Sign in successful for:", data.user.email)
        toast({
          title: "Sign in successful",
          description: `Welcome back, ${data.user.email}!`,
        })
      }
    } catch (error) {
      console.error("Sign in error:", error)
      
      // Check if this is a network error and show appropriate message
      if (error instanceof Error) {
        const isNetworkError = 
          error.message.includes("fetch") || 
          error.message.includes("network") || 
          error.message.includes("Failed to fetch") ||
          !navigator.onLine;
          
        if (isNetworkError) {
          toast({
            title: "Connection Error",
            description: "Unable to connect to authentication service. Please check your internet connection.",
            variant: "destructive"
          })
          setIsConnected(false)
        }
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
      
      // Set a timeout to detect hanging requests
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Request timed out")), 10000);
      });
      
      // Race the actual request against the timeout
      const { error, data } = await Promise.race([
        supabase.auth.signUp({ 
          email, 
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
            captchaToken: undefined // Make sure no captcha is expected
          }
        }),
        timeoutPromise
      ]);
      
      if (error) {
        console.error("Signup error:", error)
        
        // Check if this is a network error
        const isNetworkError = 
          (error.status === 0) || 
          error.message.includes("fetch") || 
          error.message.includes("network") ||
          error.message.includes("Failed to fetch") ||
          error.message.includes("timeout") ||
          !navigator.onLine;
        
        if (isNetworkError) {
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
            description: error.message,
            variant: "destructive"
          })
        }
        
        throw error
      }

      console.log("Signup response:", data)
      
      if (data?.user) {
        console.log("User created:", data.user.email, "Email confirmed:", data.user.email_confirmed_at !== null)
      }
      
      // Success message even if email confirmation is required
      toast({
        title: "Account created",
        description: data.user && data.user.email_confirmed_at !== null 
          ? "You can now sign in." 
          : "Please check your email to confirm your account.",
      })
    } catch (error) {
      console.error("Signup process error:", error)
      
      // Handle timeout errors specifically
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      
      // Handle network errors specifically
      const isNetworkError = 
        errorMessage.includes("fetch") || 
        errorMessage.includes("network") ||
        errorMessage.includes("Failed to fetch") ||
        errorMessage.includes("timeout") ||
        !navigator.onLine;
        
      if (isNetworkError) {
        setIsConnected(false)
        toast({
          title: "Connection Error",
          description: "Unable to connect to authentication service. Please check your internet connection.",
          variant: "destructive"
        })
      } else {
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
