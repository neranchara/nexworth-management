import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

// ─────────────────────────────────────────────
// P4 — FeatureFlag hook
// vi.resetModules() used to get fresh cache/fetchPromise state per test
// ─────────────────────────────────────────────

beforeEach(() => {
  vi.resetModules();
  vi.resetAllMocks();
});

// Helper: load fresh module with a mocked api.get response
async function setupHook(flagsPayload: { name: string; enabled: boolean }[]) {
  vi.doMock('@/lib/api', () => ({
    default: {
      get: vi.fn().mockResolvedValue({ data: { features: flagsPayload } })
    }
  }));
  const { useFeatureFlag, useFeatureFlags, invalidateFlagCache } =
    await import('@/hooks/useFeatureFlag');
  return { useFeatureFlag, useFeatureFlags, invalidateFlagCache };
}

async function setupHookNeverResolves() {
  vi.doMock('@/lib/api', () => ({
    default: { get: vi.fn().mockReturnValue(new Promise(() => {})) }
  }));
  const { useFeatureFlag } = await import('@/hooks/useFeatureFlag');
  return { useFeatureFlag };
}

async function setupHookFails() {
  vi.doMock('@/lib/api', () => ({
    default: { get: vi.fn().mockRejectedValue(new Error('Network error')) }
  }));
  const { useFeatureFlag } = await import('@/hooks/useFeatureFlag');
  return { useFeatureFlag };
}

describe('P4 — useFeatureFlag()', () => {
  it('returns true by default while flags are loading', async () => {
    const { useFeatureFlag } = await setupHookNeverResolves();
    const { result } = renderHook(() => useFeatureFlag('NEW_DASHBOARD'));
    expect(result.current).toBe(true);
  });

  it('returns true when flag is enabled', async () => {
    const { useFeatureFlag } = await setupHook([{ name: 'NEW_DASHBOARD', enabled: true }]);
    const { result } = renderHook(() => useFeatureFlag('NEW_DASHBOARD'));
    await waitFor(() => expect(result.current).toBe(true));
  });

  it('returns false when flag is disabled', async () => {
    const { useFeatureFlag } = await setupHook([{ name: 'NEW_DASHBOARD', enabled: false }]);
    const { result } = renderHook(() => useFeatureFlag('NEW_DASHBOARD'));
    await waitFor(() => expect(result.current).toBe(false));
  });

  it('returns true for unknown flag (defaults to enabled)', async () => {
    const { useFeatureFlag } = await setupHook([{ name: 'OTHER_FLAG', enabled: false }]);
    const { result } = renderHook(() => useFeatureFlag('UNKNOWN_FLAG'));
    await waitFor(() => expect(result.current).toBe(true));
  });

  it('returns true when API call fails (fail-open)', async () => {
    const { useFeatureFlag } = await setupHookFails();
    const { result } = renderHook(() => useFeatureFlag('NEW_DASHBOARD'));
    await waitFor(() => expect(result.current).toBe(true));
  });
});

describe('P4 — useFeatureFlags() (multiple flags)', () => {
  it('returns correct enabled/disabled values for multiple flags', async () => {
    const { useFeatureFlags } = await setupHook([
      { name: 'FEATURE_A', enabled: true },
      { name: 'FEATURE_B', enabled: false },
    ]);
    const { result } = renderHook(() => useFeatureFlags(['FEATURE_A', 'FEATURE_B']));
    await waitFor(() => {
      expect(result.current['FEATURE_A']).toBe(true);
      expect(result.current['FEATURE_B']).toBe(false);
    });
  });

  it('caches flags — API called only once for multiple hooks', async () => {
    let callCount = 0;
    vi.doMock('@/lib/api', () => ({
      default: {
        get: vi.fn().mockImplementation(() => {
          callCount++;
          return Promise.resolve({ data: { features: [{ name: 'FLAG_X', enabled: true }] } });
        })
      }
    }));
    const { useFeatureFlag } = await import('@/hooks/useFeatureFlag');
    const { result: r1 } = renderHook(() => useFeatureFlag('FLAG_X'));
    const { result: r2 } = renderHook(() => useFeatureFlag('FLAG_X'));
    await waitFor(() => expect(r1.current).toBe(true));
    await waitFor(() => expect(r2.current).toBe(true));
    expect(callCount).toBe(1);
  });

  it('invalidateFlagCache allows re-fetch with new values', async () => {
    // First fetch: FLAG_Y = true
    const getMock = vi.fn()
      .mockResolvedValueOnce({ data: { features: [{ name: 'FLAG_Y', enabled: true }] } })
      .mockResolvedValueOnce({ data: { features: [{ name: 'FLAG_Y', enabled: false }] } });

    vi.doMock('@/lib/api', () => ({ default: { get: getMock } }));
    const { useFeatureFlag, invalidateFlagCache } = await import('@/hooks/useFeatureFlag');

    const { result: r1 } = renderHook(() => useFeatureFlag('FLAG_Y'));
    await waitFor(() => expect(r1.current).toBe(true));
    expect(getMock).toHaveBeenCalledTimes(1);

    // Invalidate and re-fetch
    invalidateFlagCache();
    const { result: r2 } = renderHook(() => useFeatureFlag('FLAG_Y'));
    await waitFor(() => expect(r2.current).toBe(false));
    expect(getMock).toHaveBeenCalledTimes(2);
  });
});
