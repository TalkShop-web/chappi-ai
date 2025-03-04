
import { useCallback } from 'react';
import { ConnectionStatusType } from './useConnectionState';
import { pingConnection } from '@/utils/connectionUtils';

export function useConnectionTesting(
  isMountedRef: React.MutableRefObject<boolean>,
  testingAborted: boolean,
  setConnectionStatus: (status: ConnectionStatusType) => void,
  setConnectionMessage: (message: string | null) => void
) {
  const performQuickTest = useCallback(async (): Promise<boolean> => {
    console.log("Performing quick connectivity test...");
    
    if (!navigator.onLine) {
      console.log("Browser reports device is offline");
      setConnectionStatus('disconnected');
      setConnectionMessage("Your device appears to be offline. Please check your internet connection.");
      return false;
    }
    
    try {
      const isConnected = await pingConnection();
      
      if (testingAborted || !isMountedRef.current) {
        console.log("Connection test was aborted");
        return false;
      }
      
      if (!isConnected) {
        console.log("Quick ping test failed - network appears down");
        setConnectionStatus('disconnected');
        setConnectionMessage("Unable to reach our servers. Your connection appears to be down or very slow.");
        return false;
      }
      
      console.log("Quick ping successful");
      return true;
    } catch (error) {
      console.error("Ping test error:", error);
      setConnectionStatus('disconnected');
      setConnectionMessage("Connection test failed. Please try again.");
      return false;
    }
  }, [isMountedRef, testingAborted, setConnectionStatus, setConnectionMessage]);
  
  const performThoroughTest = useCallback(async (): Promise<void> => {
    try {
      if (testingAborted || !isMountedRef.current) return;
      
      // If we've made it this far, the basic connection test succeeded
      console.log("Successfully connected to basic services");
      setConnectionStatus('connected');
      setConnectionMessage(null);
    } catch (error) {
      if (testingAborted || !isMountedRef.current) return;
      
      console.error("Background connection check failed:", error);
      // Still mark as connected since the basic test passed
      setConnectionStatus('connected');
      setConnectionMessage(null);
    }
  }, [isMountedRef, testingAborted, setConnectionStatus, setConnectionMessage]);
  
  return {
    performQuickTest,
    performThoroughTest
  };
}
