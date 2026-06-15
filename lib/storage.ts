import * as SecureStore from 'expo-secure-store';

const KEYS = {
  ACCESS: 'vv_access_token',
  REFRESH: 'vv_refresh_token',
  USER: 'vv_cached_user',
} as const;

export const storage = {
  setTokens: (access: string, refresh: string) =>
    Promise.all([
      SecureStore.setItemAsync(KEYS.ACCESS, access),
      SecureStore.setItemAsync(KEYS.REFRESH, refresh),
    ]),

  getAccessToken: () => SecureStore.getItemAsync(KEYS.ACCESS),
  getRefreshToken: () => SecureStore.getItemAsync(KEYS.REFRESH),

  clearTokens: () =>
    Promise.all([
      SecureStore.deleteItemAsync(KEYS.ACCESS),
      SecureStore.deleteItemAsync(KEYS.REFRESH),
    ]),

  setUser: (user: object) =>
    SecureStore.setItemAsync(KEYS.USER, JSON.stringify(user)),

  getUser: async (): Promise<unknown> => {
    const raw = await SecureStore.getItemAsync(KEYS.USER);
    return raw ? JSON.parse(raw) : null;
  },

  clearUser: () => SecureStore.deleteItemAsync(KEYS.USER),

  setBiometricEnabled: (enabled: boolean) =>
    SecureStore.setItemAsync('vv_biometric_enabled', enabled ? 'true' : 'false'),

  getBiometricEnabled: async () => {
    const raw = await SecureStore.getItemAsync('vv_biometric_enabled');
    return raw === 'true';
  },

  saveBiometricCredentials: (email: string, pass: string) =>
    Promise.all([
      SecureStore.setItemAsync('vv_biometric_email', email),
      SecureStore.setItemAsync('vv_biometric_password', pass),
    ]),

  getBiometricCredentials: async () => {
    const [email, pass] = await Promise.all([
      SecureStore.getItemAsync('vv_biometric_email'),
      SecureStore.getItemAsync('vv_biometric_password'),
    ]);
    return email && pass ? {email, pass} : null;
  },

  clearBiometricCredentials: () =>
    Promise.all([
      SecureStore.deleteItemAsync('vv_biometric_email'),
      SecureStore.deleteItemAsync('vv_biometric_password'),
      SecureStore.deleteItemAsync('vv_biometric_enabled'),
    ]),

  setCurrencyPreference: (currency: string) =>
    SecureStore.setItemAsync('vv_currency_preference', currency),

  getCurrencyPreference: async () => {
    const raw = await SecureStore.getItemAsync('vv_currency_preference');
    return raw ?? 'USD';
  },

  setOnboardingCompleted: () =>
    SecureStore.setItemAsync('vv_onboarding_completed', 'true'),

  getOnboardingCompleted: async () => {
    const raw = await SecureStore.getItemAsync('vv_onboarding_completed');
    return raw === 'true';
  },
};
