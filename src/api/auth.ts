import { apiClient } from './client';
import type { Tokens, User } from '../types';

export interface LoginPayload {
  username: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  username: string;
  password: string;
  first_name?: string;
  last_name?: string;
}

export const authApi = {
  /** POST /auth/token — OAuth2 password flow */
  login: (payload: LoginPayload) => {
    const form = new URLSearchParams();
    form.append('username', payload.username);
    form.append('password', payload.password);
    return apiClient
      .post<Tokens>('/auth/token', form, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      })
      .then((r) => r.data);
  },

  /** POST /auth/register */
  register: (payload: RegisterPayload) =>
    apiClient.post<User>('/auth/register', payload).then((r) => r.data),

  /** POST /auth/register/confirm?token=... */
  confirmEmail: (token: string) =>
    apiClient.post<void>('/auth/register/confirm', null, { params: { token } }).then((r) => r.data),

  /** POST /auth/refresh */
  refresh: (refreshToken: string) =>
    apiClient
      .post<Tokens>('/auth/refresh', { refresh_token: refreshToken })
      .then((r) => r.data),

  /** GET /auth/me */
  me: () => apiClient.get<User>('/auth/me').then((r) => r.data),

  /** POST /auth/tenant — create tenant during onboarding, returns new tokens */
  createTenant: (name: string) =>
    apiClient.post<Tokens>('/auth/tenant', { name }).then((r) => r.data),

  /** PATCH /auth/change_password */
  changePassword: (payload: { old_password: string; new_password: string }) =>
    apiClient.patch<void>('/auth/change_password', payload).then((r) => r.data),
};
