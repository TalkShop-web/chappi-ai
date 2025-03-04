
import { Button } from '@/components/ui/button'
import { Loader2, Wifi, WifiOff, ServerOff } from 'lucide-react'

type ConnectionStatusType = 'testing' | 'connected' | 'disconnected' | 'partial'

interface ConnectionStatusProps {
  status: ConnectionStatusType
  message: string | null
  onRetry: () => void
}

export function ConnectionStatus({ status, message, onRetry }: ConnectionStatusProps) {
  switch (status) {
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
          {message || "Partial connection to services"}
          <Button 
            variant="outline" 
            size="sm" 
            className="ml-auto h-7" 
            onClick={onRetry}
          >
            Retry
          </Button>
        </div>
      );
    case 'testing':
      return (
        <div className="flex items-center justify-between gap-2 p-3 rounded-md text-sm bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Testing connection...</span>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="h-7" 
            onClick={onRetry}
          >
            Cancel
          </Button>
        </div>
      );
    case 'disconnected':
    default:
      return (
        <div className="flex items-center gap-2 p-3 rounded-md text-sm bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300">
          <WifiOff className="h-4 w-4" />
          <div className="flex-1">
            {message || "Not connected to server"}
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="h-7" 
            onClick={onRetry}
          >
            Retry
          </Button>
        </div>
      );
  }
}
