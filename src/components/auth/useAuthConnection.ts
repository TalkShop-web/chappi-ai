
import { useState, useEffect } from 'react'
import { checkSupabaseConnection, ConnectionCheckResult } from '@/lib/supabase'
import { withTimeout } from '@/utils/connectionUtils'

type ConnectionStatusType = 'testing' | 'connected' | 'disconnected' | 'partial'

export function useAuthConnection(isOpen: boolean) {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatusType>('testing')
  const [connectionMessage, setConnectionMessage] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  // Check browser online status first, before testing Supabase connection
  useEffect(() => {
    const handleOnlineStatusChange = () => {
      if (!navigator.onLine) {
        setConnectionStatus('disconnected');
        setConnectionMessage("Your device appears to be offline. Please check your internet connection.");
      } else if (connectionStatus === 'disconnected') {
        // Only retest if we were previously disconnected
        testConnection();
      }
    };

    window.addEventListener('online', handleOnlineStatusChange);
    window.addEventListener('offline', handleOnlineStatusChange);

    return () => {
      window.removeEventListener('online', handleOnlineStatusChange);
      window.removeEventListener('offline', handleOnlineStatusChange);
    };
  }, [connectionStatus]);

  useEffect(() => {
    if (isOpen) {
      console.log("Auth modal opened, testing connection...");
      testConnection();
      
      const intervalId = setInterval(() => {
        if (connectionStatus === 'disconnected' || connectionStatus === 'partial') {
          console.log("Retrying connection test...");
          testConnection();
        }
      }, 5000);
      
      return () => clearInterval(intervalId);
    }
  }, [isOpen, connectionStatus, retryCount]);

  const testConnection = async () => {
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
      
      const result = await withTimeout<ConnectionCheckResult>(checkSupabaseConnection(), 5000);
      
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
      setConnectionStatus('disconnected');
      setConnectionMessage(error instanceof Error 
        ? `Connection error: ${error.message}` 
        : "Connection test failed. Please check your internet connection.");
    }
  };

  const handleRetry = () => {
    console.log("Manual retry requested");
    setRetryCount(prev => prev + 1);
    testConnection();
  };

  return {
    connectionStatus,
    connectionMessage,
    testConnection,
    handleRetry,
    retryCount,
    setRetryCount
  }
}
