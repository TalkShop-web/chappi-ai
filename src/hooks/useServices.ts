
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { ServiceConnection } from '@/types/database'
import { useToast } from '@/components/ui/use-toast'

export function useServices() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const { toast } = useToast()

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
      apiKey 
    }: { 
      serviceName: ServiceConnection['service_name']
      isConnected: boolean
      apiKey?: string
    }) => {
      if (!user?.id) throw new Error('No user logged in')

      // If we're connecting and have an API key, first validate it
      if (isConnected && apiKey) {
        const isValid = await validateApiKey(serviceName, apiKey);
        if (!isValid) {
          throw new Error(`Invalid API key for ${serviceName}`);
        }
        
        // Here we would store the API key securely, but for this demo
        // we'll just simulate successful connection
        console.log(`API key for ${serviceName} is valid`);
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

  // This function would validate the API key with the respective service
  // For demo purposes, we'll just simulate validation
  const validateApiKey = async (
    serviceName: ServiceConnection['service_name'], 
    apiKey: string
  ): Promise<boolean> => {
    // In a real app, you would make an API call to validate the key
    // This is just a placeholder that accepts any non-empty key
    if (!apiKey.trim()) return false;
    
    // Here you would implement actual API validation:
    // e.g., for OpenAI:
    // const response = await fetch('https://api.openai.com/v1/models', {
    //   headers: { 'Authorization': `Bearer ${apiKey}` }
    // });
    // return response.ok;
    
    return true;
  }

  return {
    services,
    isLoading,
    error,
    updateService,
  }
}
