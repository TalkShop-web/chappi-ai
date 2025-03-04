
import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/ui/use-toast'
import { Loader2, AlertCircle } from 'lucide-react'
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
  const [networkError, setNetworkError] = useState<string | null>(null)
  const { signIn, signUp } = useAuth()
  const { toast } = useToast()

  // Test connection when modal opens
  useState(() => {
    if (isOpen) {
      testConnection();
    }
  });

  const testConnection = async () => {
    setNetworkError(null);
    const result = await checkSupabaseConnection();
    if (!result.connected) {
      setNetworkError("We're having trouble connecting to our servers. Please check your internet connection.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setNetworkError(null)

    try {
      // Check connection before attempting auth
      const connectionTest = await checkSupabaseConnection();
      if (!connectionTest.connected) {
        setNetworkError("Network connection issue. Please check your internet connection and try again.");
        return;
      }

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
      
      // Network error checking
      if (error instanceof Error) {
        const errorMessage = error.message || "Unknown error";
        if (
          errorMessage.includes("fetch") || 
          errorMessage.includes("network") ||
          errorMessage.includes("Failed to fetch") ||
          errorMessage.includes("NetworkError")
        ) {
          setNetworkError("Network connection issue. Please check your internet connection and try again.");
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
        
        {networkError && (
          <div className="bg-destructive/10 p-3 rounded-md flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            {networkError}
            <Button 
              variant="outline" 
              size="sm" 
              className="ml-auto h-7" 
              onClick={testConnection}
            >
              Retry
            </Button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
            minLength={6}
          />
          <Button type="submit" className="w-full" disabled={loading || !!networkError}>
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
