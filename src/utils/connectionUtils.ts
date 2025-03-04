
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
  
  // Check error message for network-related terms (more comprehensive)
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
    errorMessage.includes("offline") ||
    errorMessage.includes("server") ||
    errorMessage.includes("unavailable") ||
    errorMessage.includes("econnrefused") ||
    errorMessage.includes("econnreset")
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
 * Race a promise against a timeout - with more reasonable default timeout
 */
export const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number = 15000): Promise<T> => {
  const timeoutPromise = createTimeoutPromise<T>(timeoutMs, "Request timed out. Please check your connection and try again.");
  return Promise.race([promise, timeoutPromise]);
};

/**
 * Retry a promise-returning function with exponential backoff
 * More efficient implementation with shorter delays
 */
export const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  retries = 2,
  initialDelay = 500,
  maxDelay = 3000,
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
      const jitter = Math.random() * 100 - 50; // +/- 50ms
      
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
 * Simple ping to check connection status - faster implementation
 */
export const pingConnection = async (): Promise<boolean> => {
  if (!navigator.onLine) return false;
  
  try {
    // Try a fast HEAD request first
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // Shorter timeout for quick feedback
    
    try {
      const response = await fetch('/', {
        method: 'HEAD',
        cache: 'no-store',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return response.ok;
    } catch (err) {
      // Fall back to image ping if HEAD request fails
      console.log('Fast ping failed, trying image ping...');
      
      // Use an image ping as fallback (more reliable through firewalls)
      return new Promise((resolve) => {
        const img = new Image();
        
        // Set a shorter timeout
        const imgTimeoutId = setTimeout(() => {
          img.onload = img.onerror = null;
          resolve(false);
        }, 3000);
        
        img.onload = () => {
          clearTimeout(imgTimeoutId);
          resolve(true);
        };
        
        img.onerror = () => {
          clearTimeout(imgTimeoutId);
          resolve(false);
        };
        
        // Use a cachebuster query param to avoid browser caching
        img.src = `/favicon.ico?_=${Date.now()}`;
      });
    }
  } catch (err) {
    console.log('All ping methods failed:', err);
    return false;
  }
};
