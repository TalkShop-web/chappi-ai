
import { FormEvent, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2 } from 'lucide-react'

interface AuthFormProps {
  isSignUp: boolean
  loading: boolean
  connectionDisabled: boolean
  onSubmit: (e: FormEvent, email: string, password: string) => Promise<void>
  onToggleMode: () => void
}

export function AuthForm({ 
  isSignUp, 
  loading, 
  connectionDisabled, 
  onSubmit, 
  onToggleMode 
}: AuthFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = (e: FormEvent) => {
    onSubmit(e, email, password)
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading || connectionDisabled}
        />
        <Input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={loading || connectionDisabled}
          minLength={6}
        />
        <Button 
          type="submit" 
          className="w-full" 
          disabled={loading || connectionDisabled}
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
          onClick={onToggleMode}
          className="text-primary hover:underline"
          disabled={loading}
        >
          {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
        </button>
      </div>
    </>
  )
}
