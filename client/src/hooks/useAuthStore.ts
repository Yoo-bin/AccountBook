import { create } from 'zustand';
import { User } from '@/types';
import { authService } from '@/services/authService';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
  initializeAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,

  setAuth: (user, token) => {
    authService.setToken(token);
    authService.setUser(user);
    set({ user, token, isAuthenticated: true });
  },

  clearAuth: () => {
    authService.logout();
    set({ user: null, token: null, isAuthenticated: false });
  },

  initializeAuth: () => {
    const token = authService.getToken();
    const user = authService.getUser();
    if (token && user) {
      set({ user, token, isAuthenticated: true });
    }
  },
}));
