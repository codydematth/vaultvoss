import {authApi, usersApi} from '@/lib/api/auth';
import {getApiError} from '@/lib/api/client';
import type {
  ForgotPasswordPayload,
  GoogleAuthPayload,
  LoginPayload,
  RegisterPayload,
  VerifyOtpPayload,
} from '@/lib/api/types';
import {useAuthContext} from '@/lib/auth/auth-context';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {storage} from '@/lib/storage';

export const AUTH_KEYS = {
  me: ['auth', 'me'] as const,
} as const;

// ─── Current user ─────────────────────────────────────────────────────────────
export function useMe() {
  const {isAuthenticated} = useAuthContext();

  return useQuery({
    queryKey: AUTH_KEYS.me,
    queryFn: async () => {
      const {data} = await authApi.me();

      if (data.hasError) {
        throw new Error(data.message);
      }

      return data.data;
    },
    enabled: isAuthenticated,
  });
}

// ─── Login ────────────────────────────────────────────────────────────────────
export function useLogin() {
  const {setSession} = useAuthContext();

  return useMutation({
    mutationFn: async (payload: LoginPayload) => {
      try {
        const {data} = await authApi.login(payload);

        if (data.hasError) {
          throw new Error(data.message);
        }

        return data.data;
      } catch (err) {
        throw new Error(getApiError(err));
      }
    },

    onSuccess: async (data) => {
      await setSession(data.access_token, data.refresh_token);
    },
  });
}

// ─── Register ─────────────────────────────────────────────────────────────────
export function useRegister() {
  const {setSession} = useAuthContext();

  return useMutation({
    mutationFn: async (payload: RegisterPayload) => {
      try {
        const {data} = await usersApi.register(payload);

        if (data.hasError) {
          throw new Error(data.message);
        }

        return data.data;
      } catch (err) {
        throw new Error(getApiError(err));
      }
    },

    onSuccess: async (data) => {
      try {
        await storage.setCurrencyPreference('USD');
      } catch (e) {
        console.warn('Failed to set default currency preference:', e);
      }
      await setSession(data.access_token, data.refresh_token);
    },
  });
}

// ─── Google auth ──────────────────────────────────────────────────────────────
export function useGoogleAuth() {
  const {setSession} = useAuthContext();

  return useMutation({
    mutationFn: async (payload: GoogleAuthPayload) => {
      try {
        const {data} = await authApi.google(payload);

        if (data.hasError) {
          throw new Error(data.message);
        }

        return data.data;
      } catch (err) {
        throw new Error(getApiError(err));
      }
    },

    onSuccess: async (data) => {
      await setSession(data.access_token, data.refresh_token);
    },
  });
}

// ─── Logout ───────────────────────────────────────────────────────────────────
export function useLogout() {
  const {clearSession} = useAuthContext();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await clearSession();
    },

    onSuccess: () => {
      qc.clear();
    },
  });
}

// ─── Forgot password ──────────────────────────────────────────────────────────
export function useForgotPassword() {
  return useMutation({
    mutationFn: async (payload: ForgotPasswordPayload) => {
      try {
        const {data} = await authApi.forgotPassword(payload);

        if (data.hasError) {
          throw new Error(data.message);
        }

        return data.message;
      } catch (err) {
        throw new Error(getApiError(err));
      }
    },
  });
}

// ─── Verify OTP ───────────────────────────────────────────────────────────────
export function useVerifyOtp() {
  return useMutation({
    mutationFn: async (payload: VerifyOtpPayload) => {
      try {
        const {data} = await authApi.verifyOtp(payload);

        if (data.hasError) {
          throw new Error(data.message);
        }

        return data.data;
      } catch (err) {
        throw new Error(getApiError(err));
      }
    },
  });
}
