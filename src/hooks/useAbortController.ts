
import { useRef, useEffect } from 'react';

export function useAbortController() {
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
  
  const abortCurrentOperation = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
  };
  
  return {
    isMountedRef,
    abortControllerRef,
    abortCurrentOperation
  };
}
