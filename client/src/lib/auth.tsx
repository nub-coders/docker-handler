import React, { createContext, useContext, useState, useEffect } from "react";
import { apiRequest } from "./queryClient";
import { useToast } from "@/hooks/use-toast";

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  isVisitorMode: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  setVisitorMode: (enabled: boolean) => void;
  showAuthWarning: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isVisitorMode, setIsVisitorMode] = useState<boolean>(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check auth status on app load
    const checkAuthStatus = async () => {
      try {
        const res = await fetch("/api/auth/status");
        const data = await res.json();
        setIsAuthenticated(data.authenticated);
      } catch (error) {
        console.error("Error checking authentication status:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const res = await apiRequest("POST", "/api/auth/login", { username, password });
      const data = await res.json();
      setIsAuthenticated(true);
      setIsVisitorMode(false);
      toast({
        title: "Login successful",
        description: "Welcome to Docker Management",
      });
      return true;
    } catch (error) {
      toast({
        title: "Login failed",
        description: "Invalid username or password",
        variant: "destructive",
      });
      return false;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await apiRequest("POST", "/api/auth/logout", {});
      setIsAuthenticated(false);
      setIsVisitorMode(false);
      toast({
        title: "Logged out",
        description: "You have been logged out successfully",
      });
    } catch (error) {
      toast({
        title: "Logout failed",
        description: "An error occurred during logout",
        variant: "destructive",
      });
    }
  };

  const setVisitorMode = (enabled: boolean) => {
    setIsVisitorMode(enabled);
    if (enabled) {
      toast({
        title: "Visitor Mode Enabled",
        description: "You have limited access. Login to perform actions.",
        variant: "default",
      });
    }
  };

  const showAuthWarning = () => {
    if (isVisitorMode) {
      toast({
        title: "Authentication Required",
        description: "You need to login to perform this action.",
        variant: "destructive",
      });
    }
  };

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      isLoading, 
      isVisitorMode,
      login, 
      logout,
      setVisitorMode,
      showAuthWarning
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};