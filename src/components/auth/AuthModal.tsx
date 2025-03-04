
import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/ui/use-toast'
import { Loader2, AlertCircle, Wifi, WifiOff } from 'lucide-react'
import { checkSupabaseConnection } from '@/lib/supabase'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'testing' | 'connected' | 'disconnected'>('testing')
  const [networkError, setNetworkError] = useState<string | null>(null)
  const { signIn, signUp } = useAuth()
  const { toast } = useToast()

  // Test connection when modal opens or when retry is clicked
  useEffect(() => {
    if (isOpen) {
      testConnection();
    }
  }, [isOpen]);

  const testConnection = async () => {
    setConnectionStatus('testing');
    setNetworkError(null);
    
    try {
      console.log("Testing connection to Supabase...");
      const result = await checkSupabaseConnection();
      console.log("Connection test result:", result);
      
      setConnectionStatus(result.connected ? 'connected' : 'disconnected');
      
      if (!result.connected) {
        const errorMessage = result.error instanceof Error 
          ? result.error.message 
          : "Connection to our servers failed. Please check your internet connection.";
          
        setNetworkError(errorMessage);
      }
    } catch (error) {
      console.error("Connection test error:", error);
      setConnectionStatus('disconnected');
      setNetworkError("Connection test failed. Please check your internet connection.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (connectionStatus !== 'connected') {
      setNetworkError("Cannot proceed without a connection to our servers. Please check your internet connection and try again.");
      return;
    }
    
    setLoading(true)
    setNetworkError(null)

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
      
      // Check for network errors
      if (error instanceof Error) {
        const errorMessage = error.message || "Unknown error";
        if (
          errorMessage.includes("fetch") || 
          errorMessage.includes("network") ||
          errorMessage.includes("Failed to fetch") ||
          errorMessage.includes("NetworkError") ||
          errorMessage.includes("connection")
        ) {
          setNetworkError("Network connection issue. Please check your internet connection and try again.");
          setConnectionStatus('disconnected');
        }
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) onClose();
      if (open) testConnection();
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isSignUp ? 'Create an account' : 'Sign in'}</DialogTitle>
        </DialogHeader>
        
        {/* Connection status indicator */}
        <div className={`flex items-center gap-2 p-3 rounded-md text-sm ${
          connectionStatus === 'connected' 
            ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300' 
            : connectionStatus === 'testing' 
              ? 'bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300'
              : 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300'
        }`}>
          {connectionStatus === 'connected' ? (
            <>
              <Wifi className="h-4 w-4" />
              Connected to server
            </>
          ) : connectionStatus === 'testing' ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Testing connection...
            </>
          ) : (
            <>
              <WifiOff className="h-4 w-4" />
              {networkError || "Not connected to server"}
              <Button 
                variant="outline" 
                size="sm" 
                className="ml-auto h-7" 
                onClick={testConnection}
              >
                Retry
              </Button>
            </>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading || connectionStatus !== 'connected'}
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading || connectionStatus !== 'connected'}
            minLength={6}
          />
          <Button 
            type="submit" 
            className="w-full" 
            disabled={loading || connectionStatus !== 'connected'}
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
