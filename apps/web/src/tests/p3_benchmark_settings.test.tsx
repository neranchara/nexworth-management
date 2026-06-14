import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import BenchmarkSettingsModal from '@/features/dashboard-overview/components/BenchmarkSettingsModal';

// ─────────────────────────────────────────────
// P3 — BenchmarkSettingsModal
// Tests: percentage conversion, API call, callbacks
// ─────────────────────────────────────────────

vi.mock('@/lib/api', () => ({
  default: { put: vi.fn() }
}));

import api from '@/lib/api';

const defaultBenchmarks = {
  savingRateTarget:      0.20,   // 20%
  investmentRateTarget:  0.15,   // 15%
  debtRatioTarget:       0.30,   // 30%
  emergencyMonthsTarget: 6,
};

const renderModal = (overrides = {}) => {
  const onClose = vi.fn();
  const onSaveSuccess = vi.fn();
  render(
    <BenchmarkSettingsModal
      isOpen={true}
      onClose={onClose}
      initialBenchmarks={{ ...defaultBenchmarks, ...overrides }}
      onSaveSuccess={onSaveSuccess}
    />
  );
  return { onClose, onSaveSuccess };
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('P3 — BenchmarkSettingsModal: initial display', () => {
  it('converts decimal to percentage for display (0.20 → 20%)', () => {
    renderModal();
    // savingRateTarget 0.20 should display as "20"
    expect(screen.getByText('20%')).toBeTruthy();
  });

  it('converts investmentRateTarget decimal to percentage (0.15 → 15%)', () => {
    renderModal();
    expect(screen.getByText('15%')).toBeTruthy();
  });

  it('converts debtRatioTarget decimal to percentage (0.30 → 30%)', () => {
    renderModal();
    expect(screen.getByText('30%')).toBeTruthy();
  });

  it('displays emergencyMonthsTarget as-is (6 months)', () => {
    renderModal();
    expect(screen.getByText('6 เดือน')).toBeTruthy();
  });

  it('shows save button', () => {
    renderModal();
    expect(screen.getByText('บันทึกเป้าหมาย')).toBeTruthy();
  });
});

describe('P3 — BenchmarkSettingsModal: API call on save', () => {
  it('sends percentage values converted back to decimals', async () => {
    (api.put as any).mockResolvedValue({});
    const { onSaveSuccess, onClose } = renderModal();

    fireEvent.click(screen.getByText('บันทึกเป้าหมาย'));

    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith('/settings/benchmarks', {
        savingRateTarget:      0.20,
        investmentRateTarget:  0.15,
        debtRatioTarget:       0.30,
        emergencyMonthsTarget: 6,
      });
    });
  });

  it('calls onSaveSuccess and onClose after successful save', async () => {
    (api.put as any).mockResolvedValue({});
    const { onSaveSuccess, onClose } = renderModal();

    fireEvent.click(screen.getByText('บันทึกเป้าหมาย'));

    await waitFor(() => {
      expect(onSaveSuccess).toHaveBeenCalledTimes(1);
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  it('does NOT call onSaveSuccess when API fails', async () => {
    (api.put as any).mockRejectedValue(new Error('Network error'));
    const { onSaveSuccess } = renderModal();

    // Suppress expected alert
    vi.spyOn(window, 'alert').mockImplementation(() => {});
    fireEvent.click(screen.getByText('บันทึกเป้าหมาย'));

    await waitFor(() => {
      expect(onSaveSuccess).not.toHaveBeenCalled();
    });
  });
});

describe('P3 — BenchmarkSettingsModal: range validation', () => {
  it('renders sliders for all 4 KPI fields', () => {
    renderModal();
    const sliders = document.querySelectorAll('input[type="range"]');
    expect(sliders).toHaveLength(4);
  });

  it('savingRateTarget slider has correct min/max (5-50%)', () => {
    renderModal();
    const sliders = document.querySelectorAll('input[type="range"]');
    const savingSlider = sliders[0] as HTMLInputElement;
    expect(savingSlider.min).toBe('5');
    expect(savingSlider.max).toBe('50');
  });

  it('emergencyMonthsTarget slider has correct min/max (1-24)', () => {
    renderModal();
    const sliders = document.querySelectorAll('input[type="range"]');
    const emergencySlider = sliders[3] as HTMLInputElement;
    expect(emergencySlider.min).toBe('1');
    expect(emergencySlider.max).toBe('24');
  });
});
