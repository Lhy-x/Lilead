'use client';

import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { api } from '@/lib/api';
import { User } from '@/types/user';

type AuthContextValue = {
  user: User | null;
  token: string | null;
  login: (token: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const TOKEN_KEY = 'lilead_token';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? window.localStorage.getItem(TOKEN_KEY) : null;
    if (stored) {
      api.defaults.headers.common.Authorization = `Bearer ${stored}`;
      setToken(stored);
    } else {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!token) return;

    const fetchProfile = async () => {
      try {
        api.defaults.headers.common.Authorization = `Bearer ${token}`;
        const { data } = await api.get<User>('/auth/me');
        setUser(data);
      } catch (error) {
        console.error(error);
        setToken(null);
        window.localStorage.removeItem(TOKEN_KEY);
        delete api.defaults.headers.common.Authorization;
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [token]);

  const login = async (nextToken: string) => {
    window.localStorage.setItem(TOKEN_KEY, nextToken);
    setToken(nextToken);
    setLoading(true);
    api.defaults.headers.common.Authorization = `Bearer ${nextToken}`;
    const { data } = await api.get<User>('/auth/me');
    setUser(data);
    setLoading(false);
    router.push('/dashboard');
  };

  const logout = () => {
    window.localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
    delete api.defaults.headers.common.Authorization;
    router.push('/login');
  };

  const value = useMemo(
    () => ({ user, token, login, logout, loading }),
    [user, token, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
