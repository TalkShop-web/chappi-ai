
import { useState, useEffect, useCallback } from 'react'
import { checkSupabaseConnection, ConnectionCheckResult } from '@/lib/supabase'
import { withTimeout, retryWithBackoff } from '@/utils/connectionUtils'

type ConnectionStatusType = 'testing' | 'connected' | 'disconnected' | 'partial'

export function useAuthConnection(isOpen: boolean) {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatusType>('testing')
  const [connectionMessage, setConnectionMessage] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  // Memoize the testConnection function to prevent recreation in useEffect dependencies
  const testConnection = useCallback(async () => {
    setConnectionStatus('testing');
    
    // First check browser's online status
    if (!navigator.onLine) {
      console.log("Browser reports device is offline");
      setConnectionStatus('disconnected');
      setConnectionMessage("Your device appears to be offline. Please check your internet connection.");
      return;
    }
    
    try {
      console.log("Testing connection to Supabase...");
      
      // Use retry with backoff for more robust connection testing
      const result = await retryWithBackoff(
        async () => withTimeout<ConnectionCheckResult>(checkSupabaseConnection(), 5000),
        1 // Just 1 retry for connection test (to avoid too much delay)
      );
      
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
    } catch (error) {
      console.error("Connection test error:", error);
      
      // Display specific error message for timeout
      const isTimeout = error instanceof Error && 
        (error.name === 'AbortError' || error.name === 'TimeoutError' || 
         error.message.includes('timed out') || error.message.includes('timeout'));
      
      setConnectionStatus('disconnected');
      setConnectionMessage(isTimeout
        ? "Connection test timed out. Server may be slow or unreachable."
        : error instanceof Error 
          ? `Connection error: ${error.message}` 
          : "Connection test failed. Please check your internet connection.");
    }
  }, []);

  // Check browser online status first, before testing Supabase connection
  useEffect(() => {
    const handleOnlineStatusChange = () => {
      if (!navigator.onLine) {
        setConnectionStatus('disconnected');
        setConnectionMessage("Your device appears to be offline. Please check your internet connection.");
      } else if (connectionStatus === 'disconnected' && isOpen) {
        // Only retest if we were previously disconnected and modal is open
        testConnection();
      }
    };

    window.addEventListener('online', handleOnlineStatusChange);
    window.addEventListener('offline', handleOnlineStatusChange);

    return () => {
      window.removeEventListener('online', handleOnlineStatusChange);
      window.removeEventListener('offline', handleOnlineStatusChange);
    };
  }, [connectionStatus, isOpen, testConnection]);

  useEffect(() => {
    if (isOpen) {
      console.log("Auth modal opened, testing connection...");
      testConnection();
      
      // Retry connection tests less frequently to avoid hammering the server
      const intervalId = setInterval(() => {
        if ((connectionStatus === 'disconnected' || connectionStatus === 'partial') && isOpen) {
          console.log("Retrying connection test...");
          testConnection();
        }
      }, 10000); // Check every 10 seconds instead of 5
      
      return () => clearInterval(intervalId);
    }
  }, [isOpen, connectionStatus, retryCount, testConnection]);

  const handleRetry = () => {
    console.log("Manual retry requested");
    setRetryCount(prev => prev + 1);
    testConnection();
  };

  return {
    connectionStatus,
    connectionMessage,
    setConnectionMessage,
    testConnection,
    handleRetry,
    retryCount,
    setRetryCount
  }
}
