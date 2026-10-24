import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TransactionsPage from '@/app/dashboard/transactions/page';
import api from '@/lib/api';

// This page's TransactionsPage renders behind useTranslations('transactions') with no
// NextIntlClientProvider in this test tree; stub it locally so the component renders.
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('@/lib/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

vi.mock('@/hooks/usePermissions', () => ({
  usePermissions: () => ({ hasPermission: () => true }),
}));

const mockTransactions = [
  { id: 'tx-1', amount: 1000, direction: 'TO', date: '2026-05-01T00:00:00.000Z', description: 'Salary', typeId: 't1', categoryId: 'c1', accountId: 'acc-1' },
  { id: 'tx-2', amount: 300, direction: 'FROM', date: '2026-05-02T00:00:00.000Z', description: 'Groceries', typeId: 't2', categoryId: 'c2', accountId: 'acc-1' },
  { id: 'tx-3', amount: 200, direction: 'FROM', date: '2026-05-03T00:00:00.000Z', description: 'Transport', typeId: 't2', categoryId: 'c2', accountId: 'acc-1' },
];

describe('Transactions Page - NEX-FEAT-16 filtered summary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (api.get as any).mockImplementation((url: string) => {
      if (url === '/transactions') return Promise.resolve({ data: { transactions: mockTransactions } });
      if (url === '/accounts') return Promise.resolve({ data: { accounts: [{ id: 'acc-1', name: 'KBank', isActive: true }] } });
      if (url === '/categories') return Promise.resolve({ data: { categories: [{ id: 'c1', name: 'Income' }, { id: 'c2', name: 'Expense' }] } });
      if (url === '/types') return Promise.resolve({ data: { types: [] } });
      if (url === '/configs') return Promise.resolve({ data: { data: [] } });
      return Promise.resolve({ data: {} });
    });
  });

  it('shows income/expense/net/count totals for the current (unfiltered) list', async () => {
    render(<TransactionsPage />);

    await waitFor(() => {
      expect(screen.getByTestId('transactions-summary-bar')).toBeInTheDocument();
    });

    expect(screen.getByTestId('transactions-summary-text-count')).toHaveTextContent('3');
    expect(screen.getByTestId('transactions-summary-text-income')).toHaveTextContent('1,000.00');
    expect(screen.getByTestId('transactions-summary-text-expense')).toHaveTextContent('500.00');
    expect(screen.getByTestId('transactions-summary-text-net')).toHaveTextContent('500.00');
  });

  it('recomputes totals when the account filter narrows the list to zero matches', async () => {
    (api.get as any).mockImplementation((url: string) => {
      if (url === '/transactions') return Promise.resolve({ data: { transactions: mockTransactions } });
      if (url === '/accounts') return Promise.resolve({
        data: { accounts: [{ id: 'acc-1', name: 'KBank', isActive: true }, { id: 'acc-2', name: 'Other', isActive: true }] }
      });
      if (url === '/categories') return Promise.resolve({ data: { categories: [] } });
      if (url === '/types') return Promise.resolve({ data: { types: [] } });
      if (url === '/configs') return Promise.resolve({ data: { data: [] } });
      return Promise.resolve({ data: {} });
    });

    render(<TransactionsPage />);

    await waitFor(() => {
      expect(screen.getByTestId('transactions-summary-text-count')).toHaveTextContent('3');
    });

    fireEvent.change(screen.getByTestId('transactions-list-sel-filter-account'), { target: { value: 'acc-2' } });

    await waitFor(() => {
      expect(screen.getByTestId('transactions-summary-text-count')).toHaveTextContent('0');
      expect(screen.getByTestId('transactions-summary-text-income')).toHaveTextContent('0.00');
      expect(screen.getByTestId('transactions-summary-text-expense')).toHaveTextContent('0.00');
    });
  });
});
