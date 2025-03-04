import { useState, useEffect, useCallback } from 'react'
import { checkSupabaseConnection, ConnectionCheckResult } from '@/lib/supabase'
import { withTimeout, retryWithBackoff, pingConnection } from '@/utils/connectionUtils'

type ConnectionStatusType = 'testing' | 'connected' | 'disconnected' | 'partial'

export function useAuthConnection(isOpen: boolean) {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatusType>('testing')
  const [connectionMessage, setConnectionMessage] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [testingAborted, setTestingAborted] = useState(false)

  // Memoize the testConnection function to prevent recreation in useEffect dependencies
  const testConnection = useCallback(async () => {
    setConnectionStatus('testing');
    setTestingAborted(false);
    
    // First check browser's online status
    if (!navigator.onLine) {
      console.log("Browser reports device is offline");
      setConnectionStatus('disconnected');
      setConnectionMessage("Your device appears to be offline. Please check your internet connection.");
      return;
    }
    
    try {
      // First try a quick ping - this is faster than the full Supabase check
      const isConnected = await pingConnection();
      
      // If the testing was aborted, don't update status
      if (testingAborted) {
        console.log("Connection test was aborted");
        return;
      }
      
      if (!isConnected) {
        console.log("Quick ping test failed - network appears down");
        setConnectionStatus('disconnected');
        setConnectionMessage("Unable to reach our servers. Your connection appears to be down or very slow.");
        return;
      }
      
      console.log("Quick ping successful, skipping full Supabase connection test...");
      
      // Since we have a successful ping, we can consider the connection as partial
      // This avoids the long timeout issues with the full Supabase connection test
      setConnectionStatus('partial');
      setConnectionMessage("Connected to server, but full authentication status is pending.");
      
      // Attempt the full Supabase check, but don't block UI
      setTimeout(async () => {
        try {
          if (testingAborted) return;
          
          // Perform a simple check against Supabase, but with a shorter timeout
          const result = await withTimeout<ConnectionCheckResult>(
            checkSupabaseConnection(), 
            5000 // 5 second timeout
          );
          
          if (testingAborted) return;
          
          if (result.connected) {
            setConnectionStatus('connected');
            setConnectionMessage(null);
          } else if (result.partial) {
            setConnectionStatus('partial');
            setConnectionMessage(result.message);
          } else {
            setConnectionStatus('disconnected');
            setConnectionMessage(result.message);
          }
        } catch (error) {
          if (testingAborted) return;
          
          console.log("Background Supabase check failed, staying in partial mode", error);
          // Keep the partial status, don't change to disconnected
        }
      }, 100);
      
    } catch (error) {
      if (testingAborted) return;
      
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
  }, [testingAborted]);

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
        if ((connectionStatus === 'disconnected') && isOpen && !testingAborted) {
          console.log("Retrying connection test...");
          testConnection();
        }
      }, 15000); // Check every 15 seconds when disconnected
      
      return () => clearInterval(intervalId);
    }
  }, [isOpen, connectionStatus, testConnection, testingAborted]);

  const handleRetry = () => {
    if (connectionStatus === 'testing') {
      // If we're testing, abort the test
      setTestingAborted(true);
      setConnectionStatus('disconnected');
      setConnectionMessage("Connection test canceled.");
    } else {
      // Otherwise start a new test
      console.log("Manual retry requested");
      setRetryCount(prev => prev + 1);
      testConnection();
    }
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
