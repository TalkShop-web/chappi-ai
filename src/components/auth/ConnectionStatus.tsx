
import { Button } from '@/components/ui/button'
import { Loader2, Wifi, WifiOff, ServerOff } from 'lucide-react'
import { useState, useEffect } from 'react'

type ConnectionStatusType = 'testing' | 'connected' | 'disconnected' | 'partial'

interface ConnectionStatusProps {
  status: ConnectionStatusType
  message: string | null
  onRetry: () => void
}

export function ConnectionStatus({ status, message, onRetry }: ConnectionStatusProps) {
  // Ensure we always have a valid status to prevent rendering issues
  const safeStatus: ConnectionStatusType = ['testing', 'connected', 'disconnected', 'partial'].includes(status) 
    ? status 
    : 'disconnected';
  
  // Prevent excessive re-renders and repeated calls by implementing a debounced retry
  const [isRetrying, setIsRetrying] = useState(false);
  
  useEffect(() => {
    // Reset retry state when status changes
    setIsRetrying(false);
  }, [status]);
  
  const handleRetry = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isRetrying) return; // Prevent multiple rapid clicks
    
    setIsRetrying(true);
    onRetry();
    
    // Auto-reset after a delay (for UI feedback)
    setTimeout(() => setIsRetrying(false), 500);
  };
    
  switch (safeStatus) {
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
          <span className="flex-1">{message || "Partial connection to services"}</span>
          <Button 
            variant="outline" 
            size="sm" 
            className="ml-auto h-7"
            disabled={isRetrying}
            onClick={handleRetry}
          >
            {isRetrying ? "Retrying..." : "Retry"}
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
            onClick={handleRetry}
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
          <span className="flex-1">
            {message || "Not connected to server"}
          </span>
          <Button 
            variant="outline" 
            size="sm" 
            className="h-7"
            disabled={isRetrying}
            onClick={handleRetry}
          >
            {isRetrying ? "Retrying..." : "Retry"}
          </Button>
        </div>
      );
  }
}
