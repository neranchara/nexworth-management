import { create } from 'zustand';
import api from '../lib/api';
import { Stats } from '@/types/dashboard';

interface DashboardState {
  stats: Stats | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: number | null;
  
  // Filters
  selectedYear: number;
  selectedMonth: number;
  
  fetchDashboardData: (year?: number, month?: number) => Promise<void>;
  setFilters: (year: number, month: number) => void;
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  stats: null,
  isLoading: false,
  error: null,
  lastUpdated: null,
  
  selectedYear: new Date().getFullYear(),
  selectedMonth: new Date().getMonth(),

  setFilters: (year, month) => {
    set({ selectedYear: year, selectedMonth: month });
  },

  fetchDashboardData: async (year, month) => {
    const targetYear = year ?? get().selectedYear;
    const targetMonth = month ?? get().selectedMonth;
    
    set({ isLoading: true, error: null });
    
    try {
      const response = await api.get<Stats>('/dashboard/cockpit', {
        params: { year: targetYear, month: targetMonth }
      });
      
      set({ 
        stats: response.data, 
        isLoading: false, 
        lastUpdated: Date.now() 
      });
    } catch (err: any) {
      console.error('Failed to fetch dashboard data:', err);
      set({ 
        error: err.response?.data?.error || 'Failed to load financial data', 
        isLoading: false 
      });
    }
  }
}));
