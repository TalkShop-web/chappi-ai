
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/auth/AuthContext'
import { UserProfile } from '@/types/database'
import { useToast } from '@/components/ui/use-toast'

export function useProfile() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const {
    data: profile,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async (): Promise<UserProfile | null> => {
      if (!user?.id) return null
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error) throw error
      return data
    },
    enabled: !!user?.id,
  })

  const updateProfile = useMutation({
    mutationFn: async (updates: Partial<UserProfile>) => {
      if (!user?.id) throw new Error('No user logged in')

      const { data, error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          updated_at: new Date().toISOString(),
          ...updates,
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] })
      toast({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully.',
      })
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update profile',
        variant: 'destructive',
      })
    },
  })

  return {
    profile,
    isLoading,
    error,
    updateProfile,
  }
}
