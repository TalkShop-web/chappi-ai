
import { toast as showToast } from '@/hooks/use-toast'
import { isNetworkError } from '@/utils/connectionUtils'

interface AuthErrorHandlerParams {
  error: unknown
  operationType: 'signIn' | 'signUp' | 'signOut' | 'other'
  setIsConnected: (status: boolean) => void
}

/**
 * Handles authentication errors with proper toast notifications
 */
export function handleAuthError({ error, operationType, setIsConnected }: AuthErrorHandlerParams): never {
  console.error(`${operationType} error:`, error)
  
  // Check explicitly for network errors
  if (error instanceof Error) {
    if (error.message === 'Failed to fetch' || isNetworkError(error) || !navigator.onLine) {
      setIsConnected(false)
      showToast({
        title: "Connection Error",
        description: "Unable to connect to authentication service. Please check your internet connection and try again.",
        variant: "destructive"
      })
    }
  }
  
  throw error
}

/**
 * Handles Supabase auth response errors with appropriate user feedback
 */
export function handleSupabaseError(
  error: Error, 
  operationType: 'signIn' | 'signUp' | 'signOut' | 'other',
  setIsConnected: (status: boolean) => void
): never {
  console.error(`${operationType} error:`, error)
  
  if (isNetworkError(error)) {
    setIsConnected(false)
    showToast({
      title: "Connection Error",
      description: "Unable to reach authentication servers. Please check your internet connection and try again.",
      variant: "destructive"
    })
  } else {
    // Regular auth error, we're still connected
    setIsConnected(true)
    showToast({
      title: operationType === 'signIn' 
        ? "Sign in failed" 
        : operationType === 'signUp'
          ? "Sign up failed"
          : "Authentication failed",
      description: error.message,
      variant: "destructive"
    })
  }
  
  throw error
}
