import { create } from 'zustand';
import type { User } from '../types';

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  setAuth: (token: string, user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  user: null,
  token: null,
  setAuth: (token, user) => set({ isAuthenticated: true, token, user }),
  logout: () => set({ isAuthenticated: false, token: null, user: null }),
}));
