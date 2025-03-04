
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import { isNetworkError, withTimeout } from '@/utils/connectionUtils'

export function useSignInOperation() {
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
      
      const response = await withTimeout(
        supabase.auth.signInWithPassword({ 
          email, 
          password,
          options: {
            captchaToken: undefined
          }
        }),
        10000
      );
      
      if (response.error) {
        console.error("Sign in error:", response.error)
        
        if (isNetworkError(response.error)) {
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
            description: response.error.message,
            variant: "destructive"
          })
        }
        
        throw response.error
      }
      
      if (response.data?.user) {
        console.log("Sign in successful for:", response.data.user.email)
        toast({
          title: "Sign in successful",
          description: `Welcome back, ${response.data.user.email}!`,
        })
      }
    } catch (error) {
      console.error("Sign in error:", error)
      
      if (error instanceof Error && isNetworkError(error)) {
        toast({
          title: "Connection Error",
          description: "Unable to connect to authentication service. Please check your internet connection.",
          variant: "destructive"
        })
        setIsConnected(false)
      }
      
      throw error
    }
  }

  return { signIn }
}
