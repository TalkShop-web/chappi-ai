
import { toast as showToast } from '@/hooks/use-toast'
import { User } from '@supabase/supabase-js'

interface AuthSuccessParams {
  user: User | null
  operationType: 'signIn' | 'signUp' | 'signOut' | 'other'
}

/**
 * Handles successful authentication with appropriate toast notifications
 */
export function handleAuthSuccess({ user, operationType }: AuthSuccessParams): void {
  if (operationType === 'signIn' && user) {
    console.log("Sign in successful for:", user.email)
    showToast({
      title: "Sign in successful",
      description: `Welcome back${user.email ? `, ${user.email}` : ''}!`,
    })
  } else if (operationType === 'signUp' && user) {
    console.log("Sign up successful for:", user.email)
    showToast({
      title: "Account created",
      description: user.email_confirmed_at !== null 
        ? "You can now sign in with your account." 
        : "Please check your email to confirm your account.",
    })
  } else if (operationType === 'signOut') {
    showToast({
      title: "Signed out",
      description: "You have been successfully signed out.",
    })
  }
}
