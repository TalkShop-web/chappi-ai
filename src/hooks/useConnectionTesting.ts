
import { useCallback } from 'react';
import { ConnectionCheckResult, checkSupabaseConnection } from '@/lib/supabase';
import { withTimeout, pingConnection } from '@/utils/connectionUtils';
import { ConnectionStatusType } from './useConnectionState';

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
    
    console.log("Quick ping successful, going to partial mode first");
    return true;
  }, [isMountedRef, testingAborted, setConnectionStatus, setConnectionMessage]);
  
  const performThoroughTest = useCallback(async (): Promise<void> => {
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
      if (testingAborted || !isMountedRef.current) return;
      
      console.error("Background Supabase check failed:", error);
      setConnectionStatus('partial');
      setConnectionMessage("Limited connection detected. Some features may work.");
    }
  }, [isMountedRef, testingAborted, setConnectionStatus, setConnectionMessage]);
  
  return {
    performQuickTest,
    performThoroughTest
  };
}
