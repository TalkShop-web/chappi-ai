
import { supabase } from '@/lib/supabase'
import { withTimeout, retryWithBackoff, isNetworkError } from '@/utils/connectionUtils'
import { checkConnectionBeforeAuth } from './utils/connectionChecker'
import { handleAuthError, handleSupabaseError } from './utils/errorHandler'
import { handleAuthSuccess } from './utils/successHandler'

export function useSignInOperation() {
  const signIn = async (email: string, password: string, setIsConnected: (status: boolean) => void) => {
    try {
      console.log("Attempting to sign in with:", email)
      
      // Check connection before proceeding
      await checkConnectionBeforeAuth(setIsConnected)
      
      // Use retry with backoff for network resilience
      const response = await retryWithBackoff(
        async () => withTimeout(
          supabase.auth.signInWithPassword({ 
            email, 
            password,
            options: {
              captchaToken: undefined
            }
          }),
          15000 // 15 seconds timeout
        ),
        1, // 1 retry only
        500, // Start with 500ms delay
        2000, // Max 2 second delay
        isNetworkError
      );
      
      if (response.error) {
        handleSupabaseError(response.error, 'signIn', setIsConnected)
      }
      
      handleAuthSuccess({ 
        user: response.data?.user || null, 
        operationType: 'signIn' 
      })
      
    } catch (error) {
      handleAuthError({ 
        error, 
        operationType: 'signIn', 
        setIsConnected 
      })
    }
  }

  return { signIn }
}
