
'use client';

import React, { createContext, useState, useEffect, useCallback, ReactNode, useMemo } from 'react';
import type { User } from '@/types';
import { AuthService } from '@/core/auth-service';
import { useRouter, usePathname } from 'next/navigation';

export interface AuthContextType {
  user: User | null;
  login: (username: string, password_plaintext: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const authServiceInstance = useMemo(() => {
    if (typeof window !== 'undefined') {
      return new AuthService();
    }
    return null;
  }, []);

  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Tracks initial user loading
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (authServiceInstance) {
      const currentUser = authServiceInstance.getCurrentUser();
      setUser(currentUser);
    }
    setIsLoading(false); // Finished initial attempt to load user
  }, [authServiceInstance]);

  useEffect(() => {
    if (!isLoading) { // Only redirect after initial loading attempt
      if (!user && pathname !== '/login') {
        router.push('/login');
      } else if (user && pathname === '/login') {
        router.push('/');
      }
    }
  }, [user, isLoading, pathname, router]);

  const login = useCallback(async (username: string, password_plaintext: string): Promise<boolean> => {
    if (!authServiceInstance) return false;
    const loggedInUser = await authServiceInstance.login(username, password_plaintext);
    setUser(loggedInUser);
    return !!loggedInUser;
  }, [authServiceInstance]);

  const logout = useCallback(() => {
    if (!authServiceInstance) return;
    authServiceInstance.logout();
    setUser(null);
  }, [authServiceInstance]);

  const contextValue: AuthContextType = {
    user,
    login,
    logout,
    isLoading: isLoading || !authServiceInstance, // True if initial load or service not ready (SSR)
  };

  if ((isLoading || !authServiceInstance) && pathname !== '/login') {
    return <div className="flex items-center justify-center min-h-screen bg-background text-foreground">Loading Noodlix...</div>; // Updated
  }

  if (pathname === '/login') {
    return (
      <AuthContext.Provider value={contextValue}>
        {children}
      </AuthContext.Provider>
    );
  }

  if (!isLoading && !user && pathname !== '/login') {
    return <div className="flex items-center justify-center min-h-screen bg-background text-foreground">Redirecting to login...</div>;
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
