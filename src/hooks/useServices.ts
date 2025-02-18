
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
      isConnected 
    }: { 
      serviceName: ServiceConnection['service_name']
      isConnected: boolean 
    }) => {
      if (!user?.id) throw new Error('No user logged in')

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

  return {
    services,
    isLoading,
    error,
    updateService,
  }
}
