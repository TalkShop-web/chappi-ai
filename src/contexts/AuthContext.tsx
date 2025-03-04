
import { createContext, useContext, useEffect, useState } from 'react'
import { User, Provider } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

type AuthContextType = {
  user: User | null
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signInWithProvider: (provider: Provider) => Promise<void>
  signOut: () => Promise<void>
  loading: boolean
  isConnected: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isConnected, setIsConnected] = useState(false)
  const { toast } = useToast()

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

  const signIn = async (email: string, password: string) => {
    try {
      console.log("Attempting to sign in with:", email)
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
        setIsConnected(navigator.onLine) // Reset based on browser online status
        
        toast({
          title: "Sign in failed",
          description: error.message,
          variant: "destructive"
        })
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

  const signUp = async (email: string, password: string) => {
    try {
      console.log("Attempting signup with:", email)
      setIsConnected(true) // Optimistically set connected
      
      // Add additional logging to track the request
      console.log("Sending signup request to Supabase...");
      
      // Proceed with signup with explicitly disabled captcha
      const { error, data } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          captchaToken: undefined // Make sure no captcha is expected
        }
      })
      
      if (error) {
        console.error("Signup error:", error)
        setIsConnected(navigator.onLine) // Reset based on browser online status
        
        toast({
          title: "Sign up failed",
          description: error.message,
          variant: "destructive"
        })
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
      
      // Handle network errors specifically
      if (error instanceof Error) {
        const errorMessage = error.message || "Unknown error";
        const isNetworkError = 
          errorMessage.includes("fetch") || 
          errorMessage.includes("network") ||
          errorMessage.includes("Failed to fetch") ||
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
      } else {
        toast({
          title: "Sign up failed",
          description: "An unexpected error occurred",
          variant: "destructive"
        });
      }
      
      throw error;
    }
  }

  const signInWithProvider = async (provider: Provider) => {
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

  const signOut = async () => {
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

  return (
    <AuthContext.Provider value={{ 
      user, 
      signIn, 
      signUp, 
      signInWithProvider,
      signOut, 
      loading,
      isConnected
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
