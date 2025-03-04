
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { ServiceConnection } from '@/types/database'
import { useToast } from '@/components/ui/use-toast'
import { useState, useCallback, useEffect, useRef } from 'react'

export function useServices() {
  // State for managing auth windows
  const [authWindow, setAuthWindow] = useState<Window | null>(null);
  const authCheckIntervalRef = useRef<number | null>(null);
  
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Function to clear interval if it exists
  const clearAuthCheckInterval = useCallback(() => {
    if (authCheckIntervalRef.current !== null) {
      window.clearInterval(authCheckIntervalRef.current);
      authCheckIntervalRef.current = null;
    }
  }, []);

  // Clear interval on unmount
  useEffect(() => {
    return () => clearAuthCheckInterval();
  }, [clearAuthCheckInterval]);

  // Close any open auth window when component unmounts
  useEffect(() => {
    return () => {
      if (authWindow && !authWindow.closed) {
        authWindow.close();
      }
    };
  }, [authWindow]);

  const {
    data: services,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['services', user?.id],
    queryFn: async (): Promise<ServiceConnection[]> => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('service_connections')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Helper function to get the appropriate auth URL for each service
  const getAuthUrl = (serviceName: ServiceConnection['service_name']): string => {
    console.log(`Getting auth URL for ${serviceName}`);
    
    // In a real application, these would be actual OAuth authorization URLs
    // with your app's client ID and redirect URI
    switch (serviceName) {
      case 'ChatGPT':
        return 'https://platform.openai.com/account/api-keys';
      case 'Claude':
        return 'https://console.anthropic.com/account/keys';
      case 'Gemini':
        return 'https://makersuite.google.com/app/apikey';
      case 'Perplexity':
        return 'https://www.perplexity.ai/settings/api';
      default:
        return '#';
    }
  };

  // This function initiates the OAuth authentication flow for different services
  const initiateAuthFlow = useCallback(async (
    serviceName: ServiceConnection['service_name']
  ): Promise<void> => {
    console.log(`Initiating auth flow for ${serviceName}`);
    
    // Close any existing auth window
    if (authWindow && !authWindow.closed) {
      authWindow.close();
    }
    
    // Clear any existing interval
    clearAuthCheckInterval();
    
    // Get the appropriate auth URL
    const authUrl = getAuthUrl(serviceName);
    
    // Open the authentication window
    const width = 800;
    const height = 700;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    
    try {
      // Use window.open with proper window features
      const newAuthWindow = window.open(
        authUrl,
        `Connect_${serviceName}_${Date.now()}`, // Unique name prevents reusing the same window
        `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes,status=yes`
      );
      
      if (!newAuthWindow) {
        throw new Error("Popup blocked. Please allow popups for this site and try again.");
      }
      
      // Focus the new window
      newAuthWindow.focus();
      setAuthWindow(newAuthWindow);
      
      return new Promise((resolve, reject) => {
        // Set up an interval to check if the window is closed
        authCheckIntervalRef.current = window.setInterval(() => {
          if (newAuthWindow.closed) {
            clearAuthCheckInterval();
            setAuthWindow(null);
            console.log(`Auth window for ${serviceName} closed by user`);
            resolve();
          }
        }, 500);
        
        // For this demo version, we'll resolve after a timeout if the window remains open
        // In a real OAuth implementation, you would listen for a redirect to your callback URL
        setTimeout(() => {
          if (!newAuthWindow.closed) {
            console.log(`Auth flow for ${serviceName} timed out, considering successful`);
            clearAuthCheckInterval();
            // Don't close the window automatically, let the user close it when they're done
            resolve();
          }
        }, 30000); // 30 seconds timeout
      });
    } catch (error) {
      console.error("Failed to open auth window:", error);
      throw error;
    }
  }, [authWindow, clearAuthCheckInterval]);

  const updateService = useMutation({
    mutationFn: async ({ 
      serviceName, 
      isConnected,
    }: { 
      serviceName: ServiceConnection['service_name']
      isConnected: boolean
    }) => {
      if (!user?.id) throw new Error('No user logged in');

      // If we're connecting, initiate the OAuth flow
      if (isConnected) {
        await initiateAuthFlow(serviceName);
      }

      const { data, error } = await supabase
        .from('service_connections')
        .upsert({
          user_id: user.id,
          service_name: serviceName,
          is_connected: isConnected,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services', user?.id] });
      toast({
        title: 'Service updated',
        description: 'Your service connection has been updated successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update service connection',
        variant: 'destructive',
      });
    },
  });

  return {
    services,
    isLoading,
    error,
    updateService,
    authWindow,
    initiateAuthFlow
  };
}
