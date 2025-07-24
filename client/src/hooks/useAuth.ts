import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';

interface User {
  id: number;
  username: string;
}

export function useAuth() {
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  // Query to check current user
  const { data: user, isLoading, error } = useQuery<User>({
    queryKey: ['/api/auth/user'],
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/logout', {
        method: 'POST',
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Logout failed');
      }
      return response.json();
    },
    onSuccess: () => {
      // Clear all queries and redirect to login
      queryClient.clear();
      setLocation('/login');
    },
    onError: (error) => {
      console.error('Logout error:', error);
      // Even if logout fails on server, clear client state
      queryClient.clear();
      setLocation('/login');
    },
  });

  const logout = () => {
    logoutMutation.mutate();
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user && !error,
    logout,
    isLoggingOut: logoutMutation.isPending,
  };
}