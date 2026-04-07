'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import api from '@/lib/api';
import { User } from '@/types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const storedToken = localStorage.getItem('bh_token');
    const storedUser = localStorage.getItem('bh_user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    
    setIsLoading(false);
  }, []);

  // Auth Guard
  useEffect(() => {
    if (!isLoading) {
      const publicPaths = ['/login', '/register', '/'];
      if (!token && !publicPaths.includes(pathname)) {
        router.push('/login');
      }
    }
  }, [token, pathname, isLoading, router]);

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('bh_token', newToken);
    localStorage.setItem('bh_user', JSON.stringify(newUser));
    router.push('/dashboard');
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('bh_token');
    localStorage.removeItem('bh_user');
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
