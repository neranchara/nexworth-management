import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import DashboardCockpit from '@/features/dashboard-overview/DashboardCockpit';
import api from '@/lib/api';

// Mock API
vi.mock('@/lib/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

// Mock Stores
vi.mock('@/store/dashboardStore', () => ({
  WIDGET_LIST: [
    { key: 'velocity', label: 'Financial Velocity' },
    { key: 'allocation', label: 'Asset Allocation' },
    { key: 'goals', label: 'Goal Progress' },
    { key: 'radar', label: 'Health Radar' }
  ],
  useDashboardStore: () => ({
    stats: {
      summary: { netWorth: 1000000, totalAssets: 1200000, totalLiabilities: 200000 },
      health: { score: 85, scores: { saving: 20, emergency: 25, debt: 20, investment: 20 } },
      monthlyCashflow: [],
      assetsByAccount: [],
      goalTracking: []
    },
    isLoading: false,
    fetchDashboardData: vi.fn(),
    selectedYear: 2026,
    selectedMonth: 4,
    setFilters: vi.fn(),
    widgetConfig: { velocity: true, allocation: true, goals: true, radar: true },
    setWidgetConfig: vi.fn()
  }),
}));

vi.mock('@/store/authStore', () => ({
  useAuthStore: () => ({
    user: { id: 'usr-1', email: 'test@example.com' }
  }),
}));

// Mock dynamic components
vi.mock('next/dynamic', () => ({
  default: (importFn: any) => {
    return ({ children, isOpen, title }: any) => {
      if (isOpen !== undefined) {
        // Assume it's GlassModal
        return isOpen ? (
          <div data-testid="mock-modal">
            <h1>{title}</h1>
            {children}
          </div>
        ) : null;
      }
      return <div data-testid="mock-dynamic">Mock Chart</div>;
    };
  },
}));

describe('DashboardCockpit - Transaction Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (api.get as any).mockImplementation((url: string) => {
      if (url === '/accounts') return Promise.resolve({ data: { accounts: [{ id: 'acc-1', name: 'KBank' }] } });
      if (url === '/categories') return Promise.resolve({ data: { categories: [{ id: 'cat-1', name: 'Food' }] } });
      return Promise.resolve({ data: {} });
    });
    vi.spyOn(window, 'alert').mockImplementation(() => {});
  });

  it('shows alert when amount is missing', async () => {
    render(<DashboardCockpit />);
    
    // Open Modal
    fireEvent.click(screen.getByTestId('add-transaction-btn'));
    
    // Wait for meta data and modal
    await waitFor(() => expect(api.get).toHaveBeenCalledWith('/accounts'));
    
    // Click Save without amount
    fireEvent.click(screen.getByTestId('transactions-submit-btn'));
    
    expect(window.alert).toHaveBeenCalledWith('โปรดระบุจำนวนเงินและเลือกบัญชี');
  });

  it('shows alert when toAccountId is missing for transfers', async () => {
    render(<DashboardCockpit />);
    
    fireEvent.click(screen.getByTestId('add-transaction-btn'));
    await waitFor(() => expect(api.get).toHaveBeenCalledWith('/accounts'));
    
    // Switch to Transfer
    fireEvent.click(screen.getByText('TRANSFER'));
    
    // Set amount
    const amountInput = screen.getByPlaceholderText('0.00');
    fireEvent.change(amountInput, { target: { value: '500' } });
    
    // Click Save (toAccountId is empty by default)
    fireEvent.click(screen.getByTestId('transactions-submit-btn'));
    
    expect(window.alert).toHaveBeenCalledWith('โปรดเลือกบัญชีปลายทาง');
  });

  it('submits correctly when all fields are present', async () => {
    (api.post as any).mockResolvedValue({ data: { success: true } });
    
    render(<DashboardCockpit />);
    
    fireEvent.click(screen.getByTestId('add-transaction-btn'));
    // Wait for meta data to be fetched and state to be updated
    await waitFor(() => {
      expect(screen.getByDisplayValue(/KBank/i)).toBeInTheDocument();
      expect(screen.getByDisplayValue(/Food/i)).toBeInTheDocument();
    });
    
    // Fill amount
    // 1. Enter amount
    const amountInput = screen.getByTestId('transactions-amount-input');
    fireEvent.change(amountInput, { target: { value: '150' } });

    // 2. Select Account (ensure it's selected)
    const accountSelect = screen.getByTestId('transactions-account-select');
    fireEvent.change(accountSelect, { target: { value: 'acc-1' } });

    // 3. Select Category (ensure it's selected)
    const categorySelect = screen.getByTestId('transactions-category-select');
    fireEvent.change(categorySelect, { target: { value: 'cat-1' } });

    // 4. Click Submit
    const submitBtn = screen.getByTestId('transactions-submit-btn');
    fireEvent.click(submitBtn);

    // Assert API call
    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/transactions', expect.objectContaining({
        amount: 150,
        accountId: 'acc-1',
        categoryId: 'cat-1',
        type: 'EXPENSE'
      }));
    });
  });
});
