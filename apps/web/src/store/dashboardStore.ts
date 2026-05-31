import { create } from 'zustand';
import api from '../lib/api';
import { Stats } from '@/types/dashboard';

export const WIDGET_LIST = [
  { key: 'radar',      label: 'Health Radar' },
  { key: 'velocity',   label: 'Performance Velocity' },
  { key: 'allocation', label: 'Asset Allocation' },
  { key: 'goals',      label: 'Financial Goals' },
] as const;

export type WidgetKey = typeof WIDGET_LIST[number]['key'];

const DEFAULT_WIDGET_CONFIG: Record<WidgetKey, boolean> = {
  radar: true,
  velocity: true,
  allocation: true,
  goals: true,
};

function loadWidgetConfig(): Record<WidgetKey, boolean> {
  if (typeof window === 'undefined') return { ...DEFAULT_WIDGET_CONFIG };
  try {
    const stored = localStorage.getItem('dashboardWidgetConfig');
    if (stored) return { ...DEFAULT_WIDGET_CONFIG, ...JSON.parse(stored) };
  } catch {}
  return { ...DEFAULT_WIDGET_CONFIG };
}

interface DashboardState {
  stats: Stats | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: number | null;

  // Filters
  selectedYear: number;
  selectedMonth: number;

  // Widget visibility config
  widgetConfig: Record<WidgetKey, boolean>;

  fetchDashboardData: (year?: number, month?: number) => Promise<void>;
  setFilters: (year: number, month: number) => void;
  setWidgetConfig: (key: WidgetKey, visible: boolean) => void;
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  stats: null,
  isLoading: false,
  error: null,
  lastUpdated: null,

  selectedYear: new Date().getFullYear(),
  selectedMonth: new Date().getMonth(),

  widgetConfig: loadWidgetConfig(),

  setFilters: (year, month) => {
    set({ selectedYear: year, selectedMonth: month });
  },

  setWidgetConfig: (key, visible) => {
    const next = { ...get().widgetConfig, [key]: visible };
    set({ widgetConfig: next });
    try {
      localStorage.setItem('dashboardWidgetConfig', JSON.stringify(next));
    } catch {}
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
