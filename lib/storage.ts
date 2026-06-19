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

  // ── Notification preferences ────────────────────────────────────────────
  setNotifDailyEnabled: (enabled: boolean) =>
    SecureStore.setItemAsync('vv_notif_daily_enabled', enabled ? 'true' : 'false'),
  getNotifDailyEnabled: async () => {
    const raw = await SecureStore.getItemAsync('vv_notif_daily_enabled');
    return raw === 'true';
  },

  setNotifDailyTime: (hour: number, minute: number) =>
    SecureStore.setItemAsync('vv_notif_daily_time', `${hour}:${minute}`),
  getNotifDailyTime: async (): Promise<{hour: number; minute: number}> => {
    const raw = await SecureStore.getItemAsync('vv_notif_daily_time');
    if (raw) {
      const [h, m] = raw.split(':').map(Number);
      return {hour: h ?? 20, minute: m ?? 0};
    }
    return {hour: 20, minute: 0}; // default 8 PM
  },

  setNotifBillsEnabled: (enabled: boolean) =>
    SecureStore.setItemAsync('vv_notif_bills_enabled', enabled ? 'true' : 'false'),
  getNotifBillsEnabled: async () => {
    const raw = await SecureStore.getItemAsync('vv_notif_bills_enabled');
    return raw === 'true';
  },

  setNotifBudgetEnabled: (enabled: boolean) =>
    SecureStore.setItemAsync('vv_notif_budget_enabled', enabled ? 'true' : 'false'),
  getNotifBudgetEnabled: async () => {
    const raw = await SecureStore.getItemAsync('vv_notif_budget_enabled');
    return raw === 'true';
  },

  setNotifWeeklyEnabled: (enabled: boolean) =>
    SecureStore.setItemAsync('vv_notif_weekly_enabled', enabled ? 'true' : 'false'),
  getNotifWeeklyEnabled: async () => {
    const raw = await SecureStore.getItemAsync('vv_notif_weekly_enabled');
    return raw === 'true';
  },

  setNotifMonthlyBudgetEnabled: (enabled: boolean) =>
    SecureStore.setItemAsync('vv_notif_monthly_budget_enabled', enabled ? 'true' : 'false'),
  getNotifMonthlyBudgetEnabled: async () => {
    const raw = await SecureStore.getItemAsync('vv_notif_monthly_budget_enabled');
    return raw === 'true';
  },

  setHideBalance: (hidden: boolean) =>
    SecureStore.setItemAsync('vv_hide_balance', hidden ? 'true' : 'false'),
  getHideBalance: async () => {
    const raw = await SecureStore.getItemAsync('vv_hide_balance');
    return raw === 'true';
  },

  setLastWeeklyEmailSent: (dateStr: string) =>
    SecureStore.setItemAsync('vv_last_weekly_email_sent', dateStr),
  getLastWeeklyEmailSent: () =>
    SecureStore.getItemAsync('vv_last_weekly_email_sent'),

  setWarnedBudgets: (listJson: string) =>
    SecureStore.setItemAsync('vv_warned_budgets', listJson),
  getWarnedBudgets: () =>
    SecureStore.getItemAsync('vv_warned_budgets'),
};
