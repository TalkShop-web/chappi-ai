
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { ServiceConnection } from '@/types/database'
import { useToast } from '@/components/ui/use-toast'
import { useState } from 'react'

export function useServices() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [authWindow, setAuthWindow] = useState<Window | null>(null)

  const {
    data: services,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['services', user?.id],
    queryFn: async (): Promise<ServiceConnection[]> => {
      if (!user?.id) return []
      
      const { data, error } = await supabase
        .from('service_connections')
        .select('*')
        .eq('user_id', user.id)

      if (error) throw error
      return data || []
    },
    enabled: !!user?.id,
  })

  const updateService = useMutation({
    mutationFn: async ({ 
      serviceName, 
      isConnected,
    }: { 
      serviceName: ServiceConnection['service_name']
      isConnected: boolean
    }) => {
      if (!user?.id) throw new Error('No user logged in')

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
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services', user?.id] })
      toast({
        title: 'Service updated',
        description: 'Your service connection has been updated successfully.',
      })
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update service connection',
        variant: 'destructive',
      })
    },
  })

  // This function initiates the OAuth authentication flow for different services
  const initiateAuthFlow = async (
    serviceName: ServiceConnection['service_name']
  ): Promise<void> => {
    // Determine the auth URL based on the service
    const authUrl = getAuthUrl(serviceName);
    
    // Open the authentication window
    const width = 600;
    const height = 700;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    
    const authWindowInstance = window.open(
      authUrl,
      `Connect to ${serviceName}`,
      `width=${width},height=${height},left=${left},top=${top}`
    );
    
    if (!authWindowInstance) {
      throw new Error('Could not open authentication window. Please allow popups for this site.');
    }
    
    setAuthWindow(authWindowInstance);
    
    // In a real implementation, we would:
    // 1. Listen for a message from the auth window (via postMessage)
    // 2. Verify the auth was successful
    // 3. Store tokens securely (not on the client)
    
    // For this demo, we'll simulate a successful authentication
    // In a real app, this would be handled by the OAuth redirect and callback
    return new Promise((resolve) => {
      // Simulate auth completion after a delay
      setTimeout(() => {
        if (authWindowInstance && !authWindowInstance.closed) {
          authWindowInstance.close();
        }
        setAuthWindow(null);
        resolve();
      }, 3000);
    });
  };

  // Helper function to get the appropriate auth URL for each service
  const getAuthUrl = (serviceName: ServiceConnection['service_name']): string => {
    // In a real application, these would be actual OAuth authorization URLs
    // with your app's client ID and redirect URI
    switch (serviceName) {
      case 'ChatGPT':
        return 'https://auth.openai.com/oauth?client_id=YOUR_CLIENT_ID&redirect_uri=YOUR_REDIRECT_URI';
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

  return {
    services,
    isLoading,
    error,
    updateService,
    authWindow,
  }
}
