import React, { createContext, useState, useEffect, ReactNode } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

interface User {
  id: number;
  username: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  login: async () => {},
  logout: async () => {},
  isLoading: true,
  error: null,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Check authentication status
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["/api/auth/check"],
    retry: false,
  });

  useEffect(() => {
    if (data && data.isAuthenticated) {
      setUser(data.user);
    } else {
      setUser(null);
    }
  }, [data]);

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async ({ username, password }: { username: string; password: string }) => {
      const res = await apiRequest("POST", "/api/auth/login", { username, password });
      return res.json();
    },
    onSuccess: (data) => {
      setUser(data.user);
      setError(null);
      toast({
        title: "Login successful",
        description: `Welcome, ${data.user.username}!`,
      });
      refetch();
      setLocation("/");
    },
    onError: (err: any) => {
      setError(err.message || "Invalid username or password");
      toast({
        title: "Login failed",
        description: err.message || "Invalid username or password",
        variant: "destructive",
      });
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/auth/logout");
      return res.json();
    },
    onSuccess: () => {
      setUser(null);
      toast({
        title: "Logged out",
        description: "You have been logged out successfully",
      });
      refetch();
      setLocation("/login");
    },
    onError: (err: any) => {
      toast({
        title: "Logout failed",
        description: err.message || "Failed to log out",
        variant: "destructive",
      });
    },
  });

  const login = async (username: string, password: string) => {
    loginMutation.mutate({ username, password });
  };

  const logout = async () => {
    logoutMutation.mutate();
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!user,
        user,
        login,
        logout,
        isLoading,
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
