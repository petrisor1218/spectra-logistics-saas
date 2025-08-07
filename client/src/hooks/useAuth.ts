import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { getQueryFn } from '@/lib/queryClient';

interface User {
  id: number;
  username: string;
}

export function useAuth() {
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  // Query to check current user
  const { data: user, isLoading, error } = useQuery<User | null>({
    queryKey: ['/api', 'auth', 'user'],
    queryFn: getQueryFn({ on401: "returnNull" }),
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

  const login = (userData: any) => {
    // Update the query cache with user data
    queryClient.setQueryData(['/api', 'auth', 'user'], userData);
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user && !error,
    logout,
    login,
    isLoggingOut: logoutMutation.isPending,
  };
}