import { create } from 'zustand';
import api from '../lib/api';
import { User, MeResponse } from '../types/auth';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, userData: User) => void;
  logout: () => void;
  checkAuth: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  
  updateUser: (userData) => {
    set((state) => ({
      user: state.user ? { ...state.user, ...userData } : null
    }));
  },
  
  login: (token, userData) => {
    localStorage.setItem('token', token);
    set({ user: userData, isAuthenticated: true });
  },
  
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      console.error('Logout error', e);
    } finally {
      localStorage.removeItem('token');
      set({ user: null, isAuthenticated: false });
    }
  },
  
  checkAuth: async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      set({ user: null, isAuthenticated: false, isLoading: false });
      return;
    }

    try {
      const response = await api.get<MeResponse>('/auth/me');
      set({ 
        user: { 
          id: response.data.user.sub, 
          email: response.data.user.email,
          firstName: response.data.user.firstName,
          lastName: response.data.user.lastName,
          role: response.data.user.role,
          permissions: response.data.user.permissions || [],
          organizationId: response.data.user.organizationId,
          orgName: response.data.user.orgName,
          isSystemAdmin: response.data.user.isSystemAdmin
        }, 
        isAuthenticated: true, 
        isLoading: false 
      });
    } catch (err: any) {
      // 401 is expected if session expires, no need to clutter console with error
      if (err.response?.status !== 401) {
        console.error('checkAuth failed:', err.response?.status, err.message);
      }
      localStorage.removeItem('token');
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  }
}));
