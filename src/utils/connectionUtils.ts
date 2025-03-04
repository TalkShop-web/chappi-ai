
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
 * Race a promise against a timeout - with increased default timeout
 */
export const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number = 60000): Promise<T> => {
  const timeoutPromise = createTimeoutPromise<T>(timeoutMs, "Request timed out. Please check your connection and try again.");
  return Promise.race([promise, timeoutPromise]);
};

/**
 * Retry a promise-returning function with exponential backoff
 * More robust implementation with configurable options
 */
export const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  retries = 3,
  initialDelay = 1000,
  maxDelay = 10000,
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
      const jitter = Math.random() * 200 - 100; // +/- 100ms
      
      // Wait with exponential backoff plus jitter
      const actualDelay = Math.min(delay + jitter, maxDelay);
      console.log(`Retrying in ${Math.round(actualDelay)}ms...`);
      await new Promise(resolve => setTimeout(resolve, actualDelay));
      
      // Increase delay for next attempt, but don't exceed maxDelay
      delay = Math.min(delay * 2, maxDelay);
    }
  }

  throw lastError;
};

/**
 * Regular ping to check connection status - more reliable implementation
 * @returns Promise that resolves to true if we have connectivity
 */
export const pingConnection = async (): Promise<boolean> => {
  if (!navigator.onLine) return false;
  
  try {
    // First try a simple HEAD request to check connectivity
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // Increased timeout for reliability
    
    try {
      const response = await fetch('/', {
        method: 'HEAD',
        cache: 'no-store',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return response.ok;
    } catch (err) {
      // Fall back to img ping if HEAD request fails
      console.log('HEAD ping failed, trying image ping...');
      
      // Use an image ping as fallback (more reliable through firewalls)
      return new Promise((resolve) => {
        const img = new Image();
        
        // Set a timeout to avoid hanging
        const imgTimeoutId = setTimeout(() => {
          img.onload = img.onerror = null;
          resolve(false);
        }, 5000);
        
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
