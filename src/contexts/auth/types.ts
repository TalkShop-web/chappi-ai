
import { User, Provider } from '@supabase/supabase-js'

export type AuthContextType = {
  user: User | null
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signInWithProvider: (provider: Provider) => Promise<void>
  signOut: () => Promise<void>
  loading: boolean
  isConnected: boolean
}
