
import { createContext, useContext } from 'react'
import { Provider } from '@supabase/supabase-js'
import { AuthContextType } from './types'
import { useAuthOperations } from './authOperations'
import { useAuthSession } from '@/hooks/useAuthSession'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user, loading, isConnected, setIsConnected } = useAuthSession()
  const { signIn: authSignIn, signUp: authSignUp, signInWithProvider: authSignInWithProvider, signOut: authSignOut } = useAuthOperations()

  // Wrapper functions to pass the setIsConnected function
  const signIn = async (email: string, password: string) => {
    return authSignIn(email, password, setIsConnected)
  }

  const signUp = async (email: string, password: string) => {
    return authSignUp(email, password, setIsConnected)
  }

  const signInWithProvider = async (provider: Provider) => {
    return authSignInWithProvider(provider, setIsConnected)
  }

  const signOut = async () => {
    return authSignOut(setIsConnected)
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
