import axios, {type AxiosError, type InternalAxiosRequestConfig} from 'axios';
import {storage} from '../storage';

// Trim trailing slash so we can always write '/path' in endpoint strings
const BASE_URL = (process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/$/, '');

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 45_000,
  headers: {'Content-Type': 'application/json'},
});

// ─── Inject access token on every request ────────────────────────────────────
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const url = config.url ?? '';
    const isPublicAuth = url.startsWith('/auth/') && url !== '/auth/me' && url !== '/auth/logout';
    const isRegister = url === '/users/' && config.method?.toLowerCase() === 'post';

    if (!isPublicAuth && !isRegister) {
      const token = await storage.getAccessToken();
      if (token) config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
);

// ─── Silent token refresh on 401 ─────────────────────────────────────────────
let isRefreshing = false;
let pendingQueue: Array<{
  resolve: (t: string) => void;
  reject: (e: unknown) => void;
}> = [];

const drainQueue = (error: unknown, token: string | null = null) => {
  pendingQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token!)));
  pendingQueue = [];
};

apiClient.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const config = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (error.response?.status !== 401 || config._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise<string>((resolve, reject) =>
        pendingQueue.push({resolve, reject}),
      ).then((token) => {
        config.headers.Authorization = `Bearer ${token}`;
        return apiClient(config);
      });
    }

    config._retry = true;
    isRefreshing = true;

    try {
      const refreshToken = await storage.getRefreshToken();
      if (!refreshToken) throw new Error('Session expired');

      const {data} = await axios.post(`${BASE_URL}/auth/refresh`, {
        refresh_token: refreshToken,
      });

      const newAccess: string = data.data?.access_token ?? data.access_token;
      const newRefresh: string =
        data.data?.refresh_token ?? data.refresh_token ?? refreshToken;

      await storage.setTokens(newAccess, newRefresh);
      apiClient.defaults.headers.common.Authorization = `Bearer ${newAccess}`;
      drainQueue(null, newAccess);

      config.headers.Authorization = `Bearer ${newAccess}`;
      return apiClient(config);
    } catch (err) {
      drainQueue(err);
      await Promise.all([storage.clearTokens(), storage.clearUser()]);
      return Promise.reject(err);
    } finally {
      isRefreshing = false;
    }
  },
);

// ─── Human-readable error helper ─────────────────────────────────────────────
export function getApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const d = error.response?.data;
    if (d?.message) return String(d.message);
    if (d?.detail) return String(d.detail);
    if (!error.response) return 'Check your internet connection and try again.';
    switch (error.response.status) {
      case 400:
        return 'Invalid request. Please check your input.';
      case 401:
        return 'Invalid email or password.';
      case 403:
        return 'You are not authorised to do that.';
      case 404:
        return 'Not found.';
      case 409:
        return 'An account with this email already exists.';
      case 422:
        return 'Validation failed. Please review your details.';
      default:
        if (error.response.status >= 500)
          return 'Server error. Please try again later.';
    }
  }
  if (error instanceof Error) return error.message;
  return 'Something went wrong. Please try again.';
}
