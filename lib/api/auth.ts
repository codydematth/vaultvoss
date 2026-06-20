import {apiClient} from './client';
import {storage} from '../storage';
import type {
  ApiResponse,
  ChangePasswordPayload,
  ForgotPasswordPayload,
  GoogleAuthPayload,
  LoginPayload,
  LoginResponse,
  RefreshPayload,
  RegisterPayload,
  ResetPasswordPayload,
  UpdateUserPayload,
  UpdateUserNotificationSettingsPayload,
  User,
  VerifyOtpPayload,
} from './types';

export const authApi = {
  login: (p: LoginPayload) =>
    apiClient.post<ApiResponse<LoginResponse>>('/auth/login', p),

  me: () => apiClient.get<ApiResponse<User>>('/auth/me'),

  refresh: (p: RefreshPayload) =>
    apiClient.post<ApiResponse<LoginResponse>>('/auth/refresh', p),

  logout: async () => {
    const refreshToken = await storage.getRefreshToken();
    return apiClient.post<ApiResponse<null>>('/auth/logout', {refresh_token: refreshToken ?? ''});
  },

  verifyOtp: (p: VerifyOtpPayload) =>
    apiClient.post<ApiResponse<{ reset_token: string }>>('/auth/verify-otp', p),

  forgotPassword: (p: ForgotPasswordPayload) =>
    apiClient.post<ApiResponse<null>>('/auth/forgot-password', p),

  resetPassword: (p: ResetPasswordPayload) =>
    apiClient.post<ApiResponse<null>>('/auth/reset-password', p),

  changePassword: (p: ChangePasswordPayload) =>
    apiClient.post<ApiResponse<null>>('/auth/change-password', p),

  google: (p: GoogleAuthPayload) =>
    apiClient.post<ApiResponse<LoginResponse>>('/auth/google', p),
};

export const usersApi = {
  register: (p: RegisterPayload) =>
    apiClient.post<ApiResponse<LoginResponse>>('/users/', p),

  getById: (id: string) => apiClient.get<ApiResponse<User>>(`/users/${id}`),

  updateMe: (p: UpdateUserPayload | FormData) =>
    apiClient.patch<ApiResponse<User>>('/users/me', p, {
      headers: p instanceof FormData ? {'Content-Type': 'multipart/form-data'} : undefined,
    }),

  updateNotifications: (p: UpdateUserNotificationSettingsPayload) =>
    apiClient.patch<ApiResponse<User>>('/users/me/notifications', p),

  deleteById: (id: string) =>
    apiClient.delete<ApiResponse<null>>(`/users/${id}`),
};
