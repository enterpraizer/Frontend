import { apiClient } from './client';
import type { User } from '../types';

export interface UpdateProfilePayload {
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
}

export const usersApi = {
  /** PATCH /users/{id} */
  updateProfile: (id: string, payload: UpdateProfilePayload) =>
    apiClient.patch<User>(`/users/${id}`, payload).then((r) => r.data),
};
