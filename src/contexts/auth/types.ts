
import { User, Provider } from '@supabase/supabase-js'

export type AuthContextType = {
  user: User | null
  signIn: (email: string, password: string) => Promise<User | null>
  signUp: (email: string, password: string) => Promise<User | null>
  signInWithProvider: (provider: Provider) => Promise<void>
  signOut: () => Promise<void>
  loading: boolean
  isConnected: boolean
}
