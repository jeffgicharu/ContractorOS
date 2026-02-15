'use client';

import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { AuthContext } from '@/hooks/use-auth';
import {
  login as authLogin,
  logout as authLogout,
  refreshToken,
  getMe,
  initAuthRefresh,
  type AuthUser,
} from '@/lib/auth';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initAuthRefresh();

    // Try to restore session on mount
    refreshToken()
      .then(async (success) => {
        if (success) {
          const me = await getMe();
          setUser(me);
        }
      })
      .catch(() => {
        // No valid session
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const loggedInUser = await authLogin(email, password);
    setUser(loggedInUser);
    return loggedInUser;
  }, []);

  const logout = useCallback(async () => {
    await authLogout();
    setUser(null);
  }, []);

  return (
    <AuthContext value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext>
  );
}
