
import { useState, FormEvent } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useAuth } from '@/contexts/auth/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { isNetworkError } from '@/utils/connectionUtils'
import { ConnectionStatus } from './ConnectionStatus'
import { AuthForm } from './AuthForm'
import { useAuthConnection } from './useAuthConnection'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const { signIn, signUp } = useAuth()
  const { toast } = useToast()
  
  const {
    connectionStatus,
    connectionMessage,
    setConnectionMessage,
    handleRetry,
    setRetryCount,
    testConnection
  } = useAuthConnection(isOpen)

  const handleToggleMode = () => {
    setIsSignUp(!isSignUp)
  }

  const handleSubmit = async (e: FormEvent, email: string, password: string) => {
    e.preventDefault()
    
    if (connectionStatus === 'disconnected') {
      setConnectionMessage("Cannot proceed without a connection to our servers. Please check your internet connection and try again.");
      return;
    }
    
    setLoading(true)

    try {
      if (isSignUp) {
        console.log(`Attempting to sign up with email: ${email}`)
        await signUp(email, password)
        // Don't close modal on signup as verification may be required
      } else {
        await signIn(email, password)
        onClose()
      }
    } catch (error) {
      console.error('Auth error:', error)
      
      if (error instanceof Error) {
        if (isNetworkError(error)) {
          // Update connection status if network error is detected
          testConnection()
        }
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) onClose();
      if (open) {
        setRetryCount(0);
        testConnection();
      }
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isSignUp ? 'Create an account' : 'Sign in'}</DialogTitle>
        </DialogHeader>
        
        <ConnectionStatus 
          status={connectionStatus} 
          message={connectionMessage} 
          onRetry={handleRetry} 
        />

        <AuthForm 
          isSignUp={isSignUp}
          loading={loading}
          connectionDisabled={connectionStatus === 'disconnected'}
          onSubmit={handleSubmit}
          onToggleMode={handleToggleMode}
        />
      </DialogContent>
    </Dialog>
  )
}
