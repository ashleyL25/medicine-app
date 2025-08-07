import { useQuery, useQueryClient } from "@tanstack/react-query";

export function useAuth() {
  const queryClient = useQueryClient();
  
  const { data: authData, isLoading } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
    enabled: !!localStorage.getItem("auth_token"), // Only run if token exists
  });

  const logout = () => {
    localStorage.removeItem("auth_token");
    queryClient.clear(); // Clear all cached data
    window.location.reload(); // Refresh to reset app state
  };

  return {
    user: authData?.user,
    isLoading,
    isAuthenticated: !!authData?.user,
    logout,
  };
}