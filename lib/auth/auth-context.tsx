import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

import {authApi} from '../api/auth';
import type {User} from '../api/types';
import {storage} from '../storage';

// ─── Context shape ────────────────────────────────────────────────────────────

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  /** Store auth tokens after login/register/google auth */
  setSession: (access: string, refresh: string) => Promise<void>;

  /** Clear auth session */
  clearSession: () => Promise<void>;

  /** Refresh current user manually */
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({children}: {children: React.ReactNode}) {
  const [state, setState] = useState<{
    user: User | null;
    isLoading: boolean;
  }>({
    user: null,
    isLoading: true,
  });

  // ─── Fetch current user ────────────────────────────────────────────────────

  const refreshUser = useCallback(async () => {
    try {
      const {data} = await authApi.me();

      if (!data.hasError && data.data) {
        setState((prev) => ({
          ...prev,
          user: data.data,
        }));
        await storage.setUser(data.data);
      }
    } catch (err) {
      console.log('Failed to refresh user:', err);
      // If the refresh failed because the token was cleared (e.g. by 401 interceptor logout)
      const token = await storage.getAccessToken();
      if (!token) {
        setState((prev) => ({
          ...prev,
          user: null,
        }));
      }
    }
  }, []);

  // ─── Restore session on app start ─────────────────────────────────────────

  useEffect(() => {
    (async () => {
      try {
        const [token, cachedUser] = await Promise.all([
          storage.getAccessToken(),
          storage.getUser(),
        ]);

        // No token = unauthenticated
        if (!token) {
          setState({
            user: null,
            isLoading: false,
          });
          return;
        }

        // Restore cached user immediately to mount Stack and redirect instantly
        if (cachedUser) {
          setState({
            user: cachedUser as User,
            isLoading: false,
          });
          // Refresh latest user details in background
          refreshUser().catch((err) => console.log('Background refresh failed:', err));
        } else {
          // If we have a token but no cached user, we must fetch it before showing the app
          await refreshUser();
          setState((prev) => ({
            ...prev,
            isLoading: false,
          }));
        }
      } catch (err) {
        console.log('Failed to restore session:', err);
        setState((prev) => ({
          ...prev,
          isLoading: false,
        }));
      }
    })();
  }, [refreshUser]);

  // ─── Save session ─────────────────────────────────────────────────────────

  const setSession = useCallback(
    async (access: string, refresh: string) => {
      await storage.setTokens(access, refresh);

      // Immediately fetch authenticated user
      await refreshUser();
    },
    [refreshUser],
  );

  // ─── Logout ───────────────────────────────────────────────────────────────

  const clearSession = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {}

    await Promise.all([storage.clearTokens(), storage.clearUser()]);

    setState({
      user: null,
      isLoading: false,
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user: state.user,
        isLoading: state.isLoading,
        isAuthenticated: !!state.user,
        setSession,
        clearSession,
        refreshUser,
      }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuthContext() {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error('useAuthContext must be used inside <AuthProvider>');
  }

  return ctx;
}
