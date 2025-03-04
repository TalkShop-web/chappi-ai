
import { useState, useCallback } from 'react';

export type ConnectionStatusType = 'testing' | 'connected' | 'disconnected' | 'partial';

export function useConnectionState() {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatusType>('testing');
  const [connectionMessage, setConnectionMessage] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [testingAborted, setTestingAborted] = useState(false);
  
  // Safe setters that can be used with useCallback without stale closures
  const safeSetConnectionStatus = useCallback((status: ConnectionStatusType) => {
    setConnectionStatus(status);
  }, []);
  
  const safeSetConnectionMessage = useCallback((message: string | null) => {
    setConnectionMessage(message);
  }, []);
  
  return {
    connectionStatus,
    connectionMessage,
    retryCount,
    testingAborted,
    setConnectionStatus: safeSetConnectionStatus,
    setConnectionMessage: safeSetConnectionMessage,
    setRetryCount,
    setTestingAborted
  };
}
