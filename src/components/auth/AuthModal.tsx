
import { useState, FormEvent, useEffect } from 'react'
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

  // Add effect to check connection status when modal opens or when network status changes
  useEffect(() => {
    const handleOnlineStatusChange = () => {
      if (isOpen) {
        if (navigator.onLine) {
          testConnection();
        } else {
          setConnectionMessage("Your device appears to be offline. Please check your internet connection.");
        }
      }
    };
    
    window.addEventListener('online', handleOnlineStatusChange);
    window.addEventListener('offline', handleOnlineStatusChange);
    
    return () => {
      window.removeEventListener('online', handleOnlineStatusChange);
      window.removeEventListener('offline', handleOnlineStatusChange);
    };
  }, [isOpen, testConnection, setConnectionMessage]);

  const handleToggleMode = () => {
    setIsSignUp(!isSignUp)
  }

  const handleSubmit = async (e: FormEvent, email: string, password: string) => {
    e.preventDefault()
    
    if (connectionStatus === 'disconnected') {
      toast({
        title: "Connection Error",
        description: "Cannot proceed without a connection to our servers. Please check your internet connection and try again.",
        variant: "destructive"
      });
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

  // Determine whether to allow auth operations based on connection status
  const isConnectionAcceptable = connectionStatus === 'connected' || connectionStatus === 'partial'

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
          connectionDisabled={!isConnectionAcceptable}
          onSubmit={handleSubmit}
          onToggleMode={handleToggleMode}
        />
      </DialogContent>
    </Dialog>
  )
}
