
import { supabase } from '@/lib/supabase'
import { withTimeout, retryWithBackoff } from '@/utils/connectionUtils'
import { checkConnectionBeforeAuth } from './utils/connectionChecker'
import { handleAuthError, handleSupabaseError } from './utils/errorHandler'
import { handleAuthSuccess } from './utils/successHandler'

export function useSignUpOperation() {
  const signUp = async (email: string, password: string, setIsConnected: (status: boolean) => void) => {
    try {
      console.log("Attempting to sign up with:", email)
      
      // Check connection before proceeding
      await checkConnectionBeforeAuth(setIsConnected)
      
      // Use retry with backoff for network resilience
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
          15000 // 15 seconds timeout
        ),
        1, // 1 retry only
        500, // Start with 500ms delay
        2000, // Max 2 second delay
        (error) => error && error.message && error.message.includes('network')
      );
      
      if (response.error) {
        handleSupabaseError(response.error, 'signUp', setIsConnected)
      }
      
      handleAuthSuccess({ 
        user: response.data?.user || null, 
        operationType: 'signUp' 
      })
      
    } catch (error) {
      handleAuthError({ 
        error, 
        operationType: 'signUp', 
        setIsConnected 
      })
    }
  }

  return { signUp }
}
