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
import {GoogleSignin} from '@react-native-google-signin/google-signin';

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
        const token = await storage.getAccessToken();

        if (token) {
          // Since the policy is "logout on close", any fresh launch should clear the session.
          // Trigger the cleanup in the background so it doesn't block the UI.
          (async () => {
            try {
              await authApi.logout();
            } catch (err) {
              console.log('Background logout API call failed:', err);
            }
            try {
              await GoogleSignin.signOut();
            } catch (err) {
              console.log('Failed to sign out of Google on launch:', err);
            }
            await Promise.all([
              storage.clearTokens(),
              storage.clearUser(),
              storage.setCurrencyPreference('USD'),
            ]).catch((err) => {
              console.log('Failed to clear storage on launch:', err);
            });
          })();
        }

        // Set to unauthenticated immediately on launch to load the login/onboarding screen straight away
        setState({
          user: null,
          isLoading: false,
        });
      } catch (err) {
        console.log('Failed to restore session:', err);
        setState({
          user: null,
          isLoading: false,
        });
      }
    })();
  }, []);

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
    // Immediately update UI state so user is redirected to login screen instantly
    setState({
      user: null,
      isLoading: false,
    });

    try {
      await authApi.logout();
    } catch {}

    try {
      await GoogleSignin.signOut();
    } catch (err) {
      console.log('Failed to sign out of Google:', err);
    }

    await Promise.all([
      storage.clearTokens(),
      storage.clearUser(),
      storage.setCurrencyPreference('USD'),
    ]);
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
