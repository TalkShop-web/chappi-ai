
import { Provider } from '@supabase/supabase-js'
import { useSignInOperation } from './operations/signIn'
import { useSignUpOperation } from './operations/signUp'
import { useSignInWithProviderOperation } from './operations/signInWithProvider'
import { useSignOutOperation } from './operations/signOut'

export function useAuthOperations() {
  const { signIn } = useSignInOperation()
  const { signUp } = useSignUpOperation()
  const { signInWithProvider } = useSignInWithProviderOperation()
  const { signOut } = useSignOutOperation()

  return {
    signIn,
    signUp,
    signInWithProvider,
    signOut
  }
}
