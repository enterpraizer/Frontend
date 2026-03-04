import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Tokens } from '../types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;

  // computed (derived from state)
  isAuthenticated: boolean;
  isAdmin: boolean;
  hasTenant: boolean;

  // actions
  login: (tokens: Tokens, user: User) => void;
  logout: () => void;
  setUser: (user: User) => void;
  setTokens: (tokens: Tokens) => void;
}

const computeFlags = (accessToken: string | null, user: User | null) => ({
  isAuthenticated: !!accessToken,
  isAdmin: user?.role === 'admin',
  hasTenant: !!user?.tenant_id,
});

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isAdmin: false,
      hasTenant: false,

      login: (tokens, user) =>
        set({
          user,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          ...computeFlags(tokens.access_token, user),
        }),

      logout: () =>
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          isAdmin: false,
          hasTenant: false,
        }),

      setUser: (user) =>
        set((s) => ({
          user,
          ...computeFlags(s.accessToken, user),
        })),

      setTokens: (tokens) =>
        set((s) => ({
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          ...computeFlags(tokens.access_token, s.user),
        })),
    }),
    {
      name: 'auth-storage',
      partialize: (s) => ({
        user: s.user,
        accessToken: s.accessToken,
        refreshToken: s.refreshToken,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          const flags = computeFlags(state.accessToken, state.user);
          state.isAuthenticated = flags.isAuthenticated;
          state.isAdmin = flags.isAdmin;
          state.hasTenant = flags.hasTenant;
        }
      },
    }
  )
);
