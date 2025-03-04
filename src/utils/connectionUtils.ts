
/**
 * Utility functions for checking and handling connection-related issues
 */

/**
 * Checks if a given error is likely a network-related error
 */
export const isNetworkError = (error: any): boolean => {
  if (!error) return false;
  
  // Check if we're offline according to browser
  if (!navigator.onLine) return true;
  
  // Check error status (0 typically indicates network issue)
  if (error.status === 0 || error.status === 'NETWORK_ERROR') return true;
  
  // Check if it's a fetch error
  if (error.message === 'Failed to fetch') return true;
  
  // Check for Supabase connection failures
  if (error.code === 'PGRST_CONNECTION_ERROR' || 
      error.code === 'CONNECTION_ERROR' || 
      error.code === 'SERVICE_UNAVAILABLE') {
    return true;
  }
  
  // Check for timeout errors
  if (error.name === 'AbortError' || error.name === 'TimeoutError') {
    return true;
  }
  
  // Check error message for network-related terms
  const errorMessage = typeof error.message === 'string' ? error.message.toLowerCase() : '';
  return (
    errorMessage.includes("fetch") || 
    errorMessage.includes("network") ||
    errorMessage.includes("failed to fetch") ||
    errorMessage.includes("networkerror") ||
    errorMessage.includes("connection") ||
    errorMessage.includes("timeout") ||
    errorMessage.includes("abort") ||
    errorMessage.includes("unreachable") ||
    errorMessage.includes("offline")
  );
};

/**
 * Creates a timeout promise that rejects after specified milliseconds
 */
export const createTimeoutPromise = <T>(ms: number, errorMessage = "Request timed out"): Promise<T> => {
  return new Promise<T>((_, reject) => {
    setTimeout(() => reject(new Error(errorMessage)), ms);
  });
};

/**
 * Race a promise against a timeout
 */
export const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
  const timeoutPromise = createTimeoutPromise<T>(timeoutMs, "Authentication request timed out. Please check your connection and try again.");
  return Promise.race([promise, timeoutPromise]);
};

/**
 * Retry a promise-returning function with exponential backoff
 */
export const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  retries = 3,
  initialDelay = 500,
  maxDelay = 5000
): Promise<T> => {
  let lastError: any;
  let delay = initialDelay;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // If it's not a network error or we've used all retries, throw
      if (!isNetworkError(error) || attempt === retries) {
        throw error;
      }
      
      // Wait with exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Increase delay for next attempt, but don't exceed maxDelay
      delay = Math.min(delay * 2, maxDelay);
    }
  }

  throw lastError;
};
