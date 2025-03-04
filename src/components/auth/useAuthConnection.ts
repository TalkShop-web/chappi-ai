
import { useState, useEffect, useCallback, useRef } from 'react'
import { checkSupabaseConnection, ConnectionCheckResult } from '@/lib/supabase'
import { withTimeout, retryWithBackoff, pingConnection } from '@/utils/connectionUtils'

type ConnectionStatusType = 'testing' | 'connected' | 'disconnected' | 'partial'

export function useAuthConnection(isOpen: boolean) {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatusType>('testing')
  const [connectionMessage, setConnectionMessage] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [testingAborted, setTestingAborted] = useState(false)
  
  const isMountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Clear any pending operations on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const safeSetConnectionStatus = useCallback((status: ConnectionStatusType) => {
    if (isMountedRef.current) {
      setConnectionStatus(status);
    }
  }, []);
  
  const safeSetConnectionMessage = useCallback((message: string | null) => {
    if (isMountedRef.current) {
      setConnectionMessage(message);
    }
  }, []);
  
  const testConnection = useCallback(async () => {
    if (!isOpen) return; // Don't test if modal is closed
    
    // Abort any ongoing tests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    
    safeSetConnectionStatus('testing');
    setTestingAborted(false);
    
    if (!navigator.onLine) {
      console.log("Browser reports device is offline");
      safeSetConnectionStatus('disconnected');
      safeSetConnectionMessage("Your device appears to be offline. Please check your internet connection.");
      return;
    }
    
    try {
      // First do a quick ping test to check basic connectivity
      console.log("Performing quick connectivity test...");
      const isConnected = await pingConnection();
      
      if (testingAborted || !isMountedRef.current) {
        console.log("Connection test was aborted");
        return;
      }
      
      if (!isConnected) {
        console.log("Quick ping test failed - network appears down");
        safeSetConnectionStatus('disconnected');
        safeSetConnectionMessage("Unable to reach our servers. Your connection appears to be down or very slow.");
        return;
      }
      
      console.log("Quick ping successful, going to partial mode first");
      
      // Set to partial mode right away for better UX
      safeSetConnectionStatus('partial');
      safeSetConnectionMessage("Connected to server, but full authentication status is pending.");
      
      // Then do the more thorough Supabase check
      setTimeout(async () => {
        try {
          if (testingAborted || !isMountedRef.current) return;
          
          console.log("Performing full Supabase connection check...");
          const result = await withTimeout<ConnectionCheckResult>(
            checkSupabaseConnection(), 
            10000 // Increased timeout for more thorough check
          );
          
          if (testingAborted || !isMountedRef.current) return;
          
          console.log("Supabase connection check result:", result);
          
          if (result.connected) {
            safeSetConnectionStatus('connected');
            safeSetConnectionMessage(null);
          } else if (result.partial) {
            safeSetConnectionStatus('partial');
            safeSetConnectionMessage(result.message);
          } else {
            safeSetConnectionStatus('disconnected');
            safeSetConnectionMessage(result.message);
          }
        } catch (error) {
          if (testingAborted || !isMountedRef.current) return;
          
          console.error("Background Supabase check failed:", error);
          safeSetConnectionStatus('partial');
          safeSetConnectionMessage("Limited connection detected. Some features may work.");
        }
      }, 100);
      
    } catch (error) {
      if (testingAborted || !isMountedRef.current) return;
      
      console.error("Connection test error:", error);
      
      const isTimeout = error instanceof Error && 
        (error.name === 'AbortError' || error.name === 'TimeoutError' || 
         error.message.includes('timed out') || error.message.includes('timeout'));
      
      safeSetConnectionStatus('disconnected');
      safeSetConnectionMessage(isTimeout
        ? "Connection test timed out. Server may be slow or unreachable."
        : error instanceof Error 
          ? `Connection error: ${error.message}` 
          : "Connection test failed. Please check your internet connection.");
    }
  }, [isOpen, safeSetConnectionMessage, safeSetConnectionStatus, testingAborted]);

  useEffect(() => {
    const handleOnlineStatusChange = () => {
      if (!navigator.onLine) {
        safeSetConnectionStatus('disconnected');
        safeSetConnectionMessage("Your device appears to be offline. Please check your internet connection.");
      } else if (connectionStatus === 'disconnected' && isOpen) {
        testConnection();
      }
    };

    window.addEventListener('online', handleOnlineStatusChange);
    window.addEventListener('offline', handleOnlineStatusChange);

    return () => {
      window.removeEventListener('online', handleOnlineStatusChange);
      window.removeEventListener('offline', handleOnlineStatusChange);
    };
  }, [connectionStatus, isOpen, testConnection, safeSetConnectionStatus, safeSetConnectionMessage]);

  useEffect(() => {
    if (isOpen) {
      console.log("Auth modal opened, testing connection...");
      testConnection();
      
      const intervalId = setInterval(() => {
        if ((connectionStatus === 'disconnected') && isOpen && !testingAborted && isMountedRef.current) {
          console.log("Retrying connection test...");
          testConnection();
        }
      }, 15000);
      
      return () => {
        clearInterval(intervalId);
        setTestingAborted(true);
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
      };
    } else {
      setTestingAborted(true);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    }
  }, [isOpen, connectionStatus, testConnection, testingAborted]);

  const handleRetry = useCallback(() => {
    if (connectionStatus === 'testing') {
      setTestingAborted(true);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      safeSetConnectionStatus('disconnected');
      safeSetConnectionMessage("Connection test canceled.");
    } else {
      console.log("Manual retry requested");
      setRetryCount(prev => prev + 1);
      testConnection();
    }
  }, [connectionStatus, testConnection, safeSetConnectionStatus, safeSetConnectionMessage]);

  return {
    connectionStatus,
    connectionMessage,
    setConnectionMessage: safeSetConnectionMessage,
    testConnection,
    handleRetry,
    retryCount,
    setRetryCount
  };
}
