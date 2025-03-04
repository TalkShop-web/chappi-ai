
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
  if (error.status === 0) return true;
  
  // Check error message for network-related terms
  const errorMessage = error.message || "";
  return (
    errorMessage.includes("fetch") || 
    errorMessage.includes("network") ||
    errorMessage.includes("Failed to fetch") ||
    errorMessage.includes("NetworkError") ||
    errorMessage.includes("connection") ||
    errorMessage.includes("timeout") ||
    errorMessage.includes("abort")
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
  const timeoutPromise = createTimeoutPromise<T>(timeoutMs);
  return Promise.race([promise, timeoutPromise]);
};
