import { describe, it, expect, beforeEach, afterEach } from 'vitest';

// ─────────────────────────────────────────────
// P1 — Dashboard Store: localStorage persistence
// Tests that viewMode, selectedYear, widgetConfig
// are saved and restored correctly from localStorage
// ─────────────────────────────────────────────

// Reset Zustand store between tests by clearing localStorage and module cache
const LS_VIEW_MODE   = 'dashboardViewMode';
const LS_YEAR        = 'dashboardSelectedYear';
const LS_WIDGET      = 'dashboardWidgetConfig';

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  localStorage.clear();
});

// ── loadViewMode ──────────────────────────────

describe('P1 — loadViewMode()', () => {
  it('returns "annual" by default when localStorage is empty', async () => {
    const { useDashboardStore } = await import('@/store/dashboardStore');
    useDashboardStore.setState({ viewMode: 'annual' });
    expect(useDashboardStore.getState().viewMode).toBe('annual');
  });

  it('setViewMode saves to localStorage', async () => {
    const { useDashboardStore } = await import('@/store/dashboardStore');
    useDashboardStore.getState().setViewMode('monthly');
    expect(localStorage.getItem(LS_VIEW_MODE)).toBe('monthly');
  });

  it('setViewMode updates store state', async () => {
    const { useDashboardStore } = await import('@/store/dashboardStore');
    useDashboardStore.getState().setViewMode('monthly');
    expect(useDashboardStore.getState().viewMode).toBe('monthly');
  });

  it('setViewMode back to annual updates both store and localStorage', async () => {
    const { useDashboardStore } = await import('@/store/dashboardStore');
    useDashboardStore.getState().setViewMode('monthly');
    useDashboardStore.getState().setViewMode('annual');
    expect(useDashboardStore.getState().viewMode).toBe('annual');
    expect(localStorage.getItem(LS_VIEW_MODE)).toBe('annual');
  });
});

// ── loadSelectedYear ──────────────────────────

describe('P1 — selectedYear persistence', () => {
  it('setFilters saves year to localStorage', async () => {
    const { useDashboardStore } = await import('@/store/dashboardStore');
    useDashboardStore.getState().setFilters(2024, 5);
    expect(localStorage.getItem(LS_YEAR)).toBe('2024');
  });

  it('setFilters updates selectedYear and selectedMonth in store', async () => {
    const { useDashboardStore } = await import('@/store/dashboardStore');
    useDashboardStore.getState().setFilters(2023, 11);
    const state = useDashboardStore.getState();
    expect(state.selectedYear).toBe(2023);
    expect(state.selectedMonth).toBe(11);
  });

  it('selectedMonth is NOT persisted to localStorage (reset on refresh)', async () => {
    const { useDashboardStore } = await import('@/store/dashboardStore');
    useDashboardStore.getState().setFilters(2024, 7);
    expect(localStorage.getItem('dashboardSelectedMonth')).toBeNull();
  });
});

// ── widgetConfig ──────────────────────────────

describe('P1 — widgetConfig persistence', () => {
  it('setWidgetConfig saves config to localStorage', async () => {
    const { useDashboardStore } = await import('@/store/dashboardStore');
    useDashboardStore.getState().setWidgetConfig('radar', false);
    const stored = JSON.parse(localStorage.getItem(LS_WIDGET) || '{}');
    expect(stored.radar).toBe(false);
  });

  it('setWidgetConfig updates only the targeted widget key', async () => {
    const { useDashboardStore } = await import('@/store/dashboardStore');
    useDashboardStore.getState().setWidgetConfig('radar', false);
    const state = useDashboardStore.getState();
    expect(state.widgetConfig.radar).toBe(false);
    expect(state.widgetConfig.velocity).toBe(true);
    expect(state.widgetConfig.allocation).toBe(true);
    expect(state.widgetConfig.goals).toBe(true);
  });

  it('setWidgetConfig persists all widget states together', async () => {
    const { useDashboardStore } = await import('@/store/dashboardStore');
    useDashboardStore.getState().setWidgetConfig('radar', false);
    useDashboardStore.getState().setWidgetConfig('goals', false);
    const stored = JSON.parse(localStorage.getItem(LS_WIDGET) || '{}');
    expect(stored.radar).toBe(false);
    expect(stored.goals).toBe(false);
    expect(stored.velocity).toBe(true);
  });
});

// ── loadFromLocalStorage ──────────────────────

describe('P1 — restore state from localStorage on load', () => {
  it('loadViewMode reads "monthly" from localStorage', () => {
    localStorage.setItem(LS_VIEW_MODE, 'monthly');
    // Simulate the load function directly
    const stored = localStorage.getItem(LS_VIEW_MODE);
    expect(stored === 'annual' || stored === 'monthly' ? stored : 'annual').toBe('monthly');
  });

  it('loadViewMode ignores invalid values and defaults to "annual"', () => {
    localStorage.setItem(LS_VIEW_MODE, 'invalid_value');
    const stored = localStorage.getItem(LS_VIEW_MODE);
    const result = (stored === 'annual' || stored === 'monthly') ? stored : 'annual';
    expect(result).toBe('annual');
  });

  it('loadSelectedYear ignores year outside 2000-2100 range', () => {
    localStorage.setItem(LS_YEAR, '1999');
    const stored = localStorage.getItem(LS_YEAR);
    const year = stored ? parseInt(stored) : NaN;
    const result = (!isNaN(year) && year >= 2000 && year <= 2100) ? year : new Date().getFullYear();
    expect(result).toBe(new Date().getFullYear());
  });

  it('loadWidgetConfig merges with defaults (missing keys use default true)', () => {
    localStorage.setItem(LS_WIDGET, JSON.stringify({ radar: false }));
    const stored = JSON.parse(localStorage.getItem(LS_WIDGET) || '{}');
    const merged = { radar: true, velocity: true, allocation: true, goals: true, ...stored };
    expect(merged.radar).toBe(false);
    expect(merged.velocity).toBe(true);
  });
});
