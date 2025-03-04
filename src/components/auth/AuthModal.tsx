import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/contexts/auth/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { Loader2, AlertCircle, Wifi, WifiOff, ServerOff } from 'lucide-react'
import { checkSupabaseConnection, supabase } from '@/lib/supabase'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'testing' | 'connected' | 'disconnected' | 'partial'>('testing')
  const [connectionMessage, setConnectionMessage] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const { signIn, signUp } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    if (isOpen) {
      testConnection();
      
      const intervalId = setInterval(() => {
        if (connectionStatus === 'disconnected' || connectionStatus === 'partial') {
          testConnection();
        }
      }, 5000);
      
      return () => clearInterval(intervalId);
    }
  }, [isOpen, connectionStatus, retryCount]);

  const testConnection = async () => {
    setConnectionStatus('testing');
    
    try {
      console.log("Testing connection to Supabase...");
      const result = await checkSupabaseConnection();
      console.log("Connection test result:", result);
      
      if (result.partial) {
        setConnectionStatus('partial');
        setConnectionMessage(result.message || "Connected to authentication but database access limited");
      } else if (result.connected) {
        setConnectionStatus('connected');
        setConnectionMessage(null);
      } else {
        setConnectionStatus('disconnected');
        setConnectionMessage(result.message || "Connection to our servers failed. Please check your internet connection.");
      }
      
      if (!result.connected) {
        try {
          const response = await fetch(`${window.location.origin}/ping-test`, { 
            method: 'HEAD',
            mode: 'no-cors',
            cache: 'no-store'
          });
          console.log("Ping test completed");
        } catch (pingError) {
          console.error("Direct ping failed:", pingError);
        }
      }
    } catch (error) {
      console.error("Connection test error:", error);
      setConnectionStatus('disconnected');
      setConnectionMessage("Connection test failed. Please check your internet connection.");
    }
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    testConnection();
  };

  const handleSubmit = async (e: React.FormEvent) => {
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
        const errorMessage = error.message || "Unknown error";
        if (
          errorMessage.includes("fetch") || 
          errorMessage.includes("network") ||
          errorMessage.includes("Failed to fetch") ||
          errorMessage.includes("NetworkError") ||
          errorMessage.includes("connection")
        ) {
          setConnectionStatus('disconnected');
          setConnectionMessage("Network connection issue. Please check your internet connection and try again.");
          setRetryCount(prev => prev + 1);
        }
      }
    } finally {
      setLoading(false)
    }
  }

  const getConnectionUI = () => {
    switch (connectionStatus) {
      case 'connected':
        return (
          <div className="flex items-center gap-2 p-3 rounded-md text-sm bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300">
            <Wifi className="h-4 w-4" />
            Connected to server
          </div>
        );
      case 'partial':
        return (
          <div className="flex items-center gap-2 p-3 rounded-md text-sm bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300">
            <ServerOff className="h-4 w-4" />
            {connectionMessage}
            <Button 
              variant="outline" 
              size="sm" 
              className="ml-auto h-7" 
              onClick={handleRetry}
            >
              Retry
            </Button>
          </div>
        );
      case 'testing':
        return (
          <div className="flex items-center gap-2 p-3 rounded-md text-sm bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300">
            <Loader2 className="h-4 w-4 animate-spin" />
            Testing connection...
          </div>
        );
      case 'disconnected':
      default:
        return (
          <div className="flex items-center gap-2 p-3 rounded-md text-sm bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300">
            <WifiOff className="h-4 w-4" />
            {connectionMessage || "Not connected to server"}
            <Button 
              variant="outline" 
              size="sm" 
              className="ml-auto h-7" 
              onClick={handleRetry}
            >
              Retry
            </Button>
          </div>
        );
    }
  };

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
        
        {getConnectionUI()}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading || connectionStatus === 'disconnected'}
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading || connectionStatus === 'disconnected'}
            minLength={6}
          />
          <Button 
            type="submit" 
            className="w-full" 
            disabled={loading || connectionStatus === 'disconnected'}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isSignUp ? 'Creating account...' : 'Signing in...'}
              </>
            ) : (
              isSignUp ? 'Sign up' : 'Sign in'
            )}
          </Button>
        </form>
        <div className="text-center text-sm">
          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-primary hover:underline"
            disabled={loading}
          >
            {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
