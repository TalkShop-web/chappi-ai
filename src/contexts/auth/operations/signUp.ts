
import { supabase } from '@/lib/supabase'
import { withTimeout, retryWithBackoff, isNetworkError } from '@/utils/connectionUtils'
import { checkConnectionBeforeAuth } from './utils/connectionChecker'
import { handleAuthSuccess } from './utils/successHandler'
import { toast } from '@/hooks/use-toast'

export function useSignUpOperation() {
  const signUp = async (email: string, password: string, setIsConnected: (status: boolean) => void) => {
    try {
      console.log("Attempting to sign up with:", email)
      
      // Check connection before proceeding
      const isConnected = await checkConnectionBeforeAuth(setIsConnected)
      if (!isConnected) {
        return; // Exit early if not connected
      }
      
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
        (error) => isNetworkError(error)
      );
      
      if (response.error) {
        toast({
          title: "Sign up failed", 
          description: response.error.message,
          variant: "destructive"
        })
        
        if (isNetworkError(response.error)) {
          setIsConnected(false);
        }
        
        return; // Exit early on error
      }
      
      handleAuthSuccess({ 
        user: response.data?.user || null, 
        operationType: 'signUp' 
      })
      
      return response.data?.user || null;
      
    } catch (error) {
      console.error("Sign up error:", error);
      
      // Update connection status if it's a network error
      if (error instanceof Error && isNetworkError(error)) {
        setIsConnected(false);
      }
      
      toast({
        title: "Sign up failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive"
      })
      
      return null;
    }
  }

  return { signUp }
}
