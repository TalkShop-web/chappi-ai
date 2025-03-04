
import { createContext, useContext, useEffect, useState } from 'react'
import { User, Provider } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/ui/use-toast'

type AuthContextType = {
  user: User | null
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signInWithProvider: (provider: Provider) => Promise<void>
  signOut: () => Promise<void>
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    // Check active sessions
    const fetchSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        setUser(session?.user ?? null)
        setLoading(false)
        console.log("Session checked, user:", session?.user?.email || "No user")
      } catch (error) {
        console.error("Error fetching session:", error)
        setLoading(false)
      }
    }

    fetchSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log("Auth state changed:", _event, session?.user?.email || "No user")
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      const { error, data } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        toast({
          title: "Sign in failed",
          description: error.message,
          variant: "destructive"
        })
        throw error
      }
      if (data?.user) {
        toast({
          title: "Sign in successful",
          description: `Welcome back, ${data.user.email}!`,
        })
      }
    } catch (error) {
      console.error("Sign in error:", error)
      throw error
    }
  }

  const signUp = async (email: string, password: string) => {
    try {
      console.log("Attempting signup with:", email)
      const { error, data } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          emailRedirectTo: `${window.location.origin}`
        }
      })
      
      if (error) {
        console.error("Signup error:", error)
        toast({
          title: "Sign up failed",
          description: error.message,
          variant: "destructive"
        })
        throw error
      }

      console.log("Signup response:", data)
      
      // Success message even if email confirmation is required
      toast({
        title: "Account created",
        description: data.user ? "You can now sign in." : "Please check your email to confirm your account.",
      })
    } catch (error) {
      console.error("Signup process error:", error)
      throw error
    }
  }

  const signInWithProvider = async (provider: Provider) => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({ 
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })
      if (error) {
        toast({
          title: "Provider sign in failed",
          description: error.message,
          variant: "destructive"
        })
        throw error
      }
    } catch (error) {
      console.error("Provider sign in error:", error)
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
      loading 
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
