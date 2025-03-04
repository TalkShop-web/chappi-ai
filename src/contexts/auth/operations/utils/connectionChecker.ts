
import { toast as showToast } from '@/hooks/use-toast'
import { pingConnection } from '@/utils/connectionUtils'

/**
 * Checks if the device is currently connected before performing auth operations
 */
export async function checkConnectionBeforeAuth(
  setIsConnected: (status: boolean) => void
): Promise<boolean> {
  // First check if we're online before attempting
  if (!navigator.onLine) {
    console.error("Browser reports offline status")
    setIsConnected(false)
    showToast({
      title: "Connection Error",
      description: "Your device appears to be offline. Please check your internet connection.",
      variant: "destructive"
    })
    return false // Return false instead of throwing
  }
  
  // Use the improved ping test
  console.log("Checking connection before auth operation...")
  const isConnected = await pingConnection();
  
  if (!isConnected) {
    console.error("Ping test failed, connection appears to be down");
    setIsConnected(false);
    showToast({
      title: "Connection Error",
      description: "Cannot reach our servers. Please check your internet connection and try again.",
      variant: "destructive"
    });
    return false; // Return false instead of throwing
  }
  
  console.log("Connection test passed, proceeding with auth")
  setIsConnected(true) // Optimistically set connected
  return true
}
