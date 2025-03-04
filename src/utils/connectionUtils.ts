
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
 * Race a promise against a timeout - with shorter default timeout
 */
export const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number = 10000): Promise<T> => {
  const timeoutPromise = createTimeoutPromise<T>(timeoutMs, "Request timed out. Please check your connection and try again.");
  return Promise.race([promise, timeoutPromise]);
};

/**
 * Retry a promise-returning function with exponential backoff
 * More efficient implementation with shorter delays
 */
export const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  retries = 1,
  initialDelay = 300,
  maxDelay = 2000,
  shouldRetry = isNetworkError
): Promise<T> => {
  let lastError: any;
  let delay = initialDelay;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      console.error(`Attempt ${attempt + 1}/${retries + 1} failed:`, error);
      lastError = error;
      
      // Don't retry on the last attempt
      if (attempt === retries) {
        throw error;
      }
      
      // Don't retry if the error isn't retriable
      if (error && !shouldRetry(error)) {
        throw error;
      }
      
      // Add jitter to prevent thundering herd
      const jitter = Math.random() * 50; 
      
      // Wait with exponential backoff plus jitter
      const actualDelay = Math.min(delay + jitter, maxDelay);
      console.log(`Retrying in ${Math.round(actualDelay)}ms...`);
      await new Promise(resolve => setTimeout(resolve, actualDelay));
      
      // Increase delay for next attempt, but don't exceed maxDelay
      delay = Math.min(delay * 1.5, maxDelay);
    }
  }

  throw lastError;
};

/**
 * Simple ping function to check basic internet connectivity
 * Uses a reliable image fetch approach
 */
export const pingConnection = async (): Promise<boolean> => {
  if (!navigator.onLine) return false;
  
  try {
    // Try a more reliable method - image ping
    return new Promise((resolve) => {
      const img = new Image();
      
      // Set a shorter timeout
      const imgTimeoutId = setTimeout(() => {
        img.onload = img.onerror = null;
        console.log("Image ping timed out");
        resolve(false);
      }, 3000);
      
      img.onload = () => {
        clearTimeout(imgTimeoutId);
        console.log("Image ping successful");
        resolve(true);
      };
      
      img.onerror = () => {
        // Even an error means the network is working!
        clearTimeout(imgTimeoutId);
        console.log("Image ping failed but network is reachable");
        // Important: We still consider this a successful ping
        resolve(true);
      };
      
      // Use a cache-busting query and a reliable image
      const timestamp = Date.now();
      img.src = `https://www.google.com/favicon.ico?_=${timestamp}`;
    });
  } catch (err) {
    console.log('Ping failed completely:', err);
    return false;
  }
};
