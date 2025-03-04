
import { useEffect, useCallback } from 'react';
import { useConnectionState } from '@/hooks/useConnectionState';
import { useAbortController } from '@/hooks/useAbortController';
import { useConnectionTesting } from '@/hooks/useConnectionTesting';

export function useAuthConnection(isOpen: boolean) {
  const {
    connectionStatus,
    connectionMessage,
    retryCount,
    testingAborted,
    setConnectionStatus,
    setConnectionMessage,
    setRetryCount,
    setTestingAborted
  } = useConnectionState();
  
  const {
    isMountedRef,
    abortControllerRef,
    abortCurrentOperation
  } = useAbortController();
  
  const {
    performQuickTest,
    performThoroughTest
  } = useConnectionTesting(
    isMountedRef,
    testingAborted,
    setConnectionStatus,
    setConnectionMessage
  );

  const testConnection = useCallback(async () => {
    if (!isOpen) return; // Don't test if modal is closed
    
    // Abort any ongoing tests
    abortCurrentOperation();
    
    setConnectionStatus('testing');
    setTestingAborted(false);
    
    try {
      // First do a quick ping test to check basic connectivity
      const quickTestSucceeded = await performQuickTest();
      
      if (!quickTestSucceeded || testingAborted || !isMountedRef.current) return;
      
      // Set to partial mode right away for better UX
      setConnectionStatus('partial');
      setConnectionMessage("Connected to server, but full authentication status is pending.");
      
      // Then do the more thorough Supabase check
      setTimeout(() => performThoroughTest(), 100);
      
    } catch (error) {
      if (testingAborted || !isMountedRef.current) return;
      
      console.error("Connection test error:", error);
      
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
  }, [
    isOpen, 
    abortCurrentOperation, 
    setConnectionStatus, 
    setTestingAborted, 
    performQuickTest, 
    testingAborted, 
    isMountedRef, 
    setConnectionMessage, 
    performThoroughTest
  ]);

  useEffect(() => {
    const handleOnlineStatusChange = () => {
      if (!navigator.onLine) {
        setConnectionStatus('disconnected');
        setConnectionMessage("Your device appears to be offline. Please check your internet connection.");
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
  }, [connectionStatus, isOpen, testConnection, setConnectionStatus, setConnectionMessage]);

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
  }, [isOpen, connectionStatus, testConnection, testingAborted, isMountedRef, setTestingAborted, abortControllerRef]);

  const handleRetry = useCallback(() => {
    if (connectionStatus === 'testing') {
      setTestingAborted(true);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      setConnectionStatus('disconnected');
      setConnectionMessage("Connection test canceled.");
    } else {
      console.log("Manual retry requested");
      setRetryCount(prev => prev + 1);
      testConnection();
    }
  }, [connectionStatus, testConnection, setConnectionStatus, setConnectionMessage, setTestingAborted, abortControllerRef, setRetryCount]);

  return {
    connectionStatus,
    connectionMessage,
    setConnectionMessage,
    testConnection,
    handleRetry,
    retryCount,
    setRetryCount
  };
}
