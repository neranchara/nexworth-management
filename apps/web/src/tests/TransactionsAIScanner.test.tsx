import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TransactionsPage from '@/app/dashboard/transactions/page';
import api from '@/lib/api';

// Mock API
vi.mock('@/lib/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

// Mock Hooks
vi.mock('@/hooks/usePermissions', () => ({
  usePermissions: () => ({ hasPermission: () => true }),
}));

// Mock OCR and QR Utilities
vi.mock('@/utils/ocrScanner', () => ({
  scanAmountFromImage: vi.fn().mockResolvedValue({ amount: '150.50', text: 'KBank Slip Food 150.50' }),
}));

vi.mock('@/utils/qrScanner', () => ({
  scanQRFromImage: vi.fn().mockResolvedValue('mock-qr-payload'),
}));

describe('Transactions AI Scanner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (api.get as any).mockImplementation((url: string) => {
      if (url === '/transactions') return Promise.resolve({ data: { transactions: [] } });
      if (url === '/accounts') return Promise.resolve({ data: { accounts: [{ id: 'acc-1', name: 'KBank' }] } });
      if (url === '/categories') return Promise.resolve({ data: { categories: [{ id: 'cat-1', name: 'Food' }] } });
      if (url === '/types') return Promise.resolve({ data: { types: [] } });
      if (url === '/configs') return Promise.resolve({ data: { data: [] } });
      return Promise.resolve({ data: {} });
    });
  });

  it('opens scanner modal when clicking the scanner button', async () => {
    render(<TransactionsPage />);
    
    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.queryByText(/Loading/i)).toBeNull();
    });
    
    const scannerBtn = screen.getByTestId('transactions-header-btn-scan-slip');
    fireEvent.click(scannerBtn);
    
    await waitFor(() => {
      expect(screen.getByText(/AI Slip Intelligence/i)).toBeInTheDocument();
    });
  });

  it('handles slip upload and displays extracted data', async () => {
    const mockExtractedData = {
      amount: 150.50,
      date: '2026-05-14T10:00:00.000Z',
      accountName: 'KBank',
      categoryName: 'Food',
      description: 'Dinner at Zen'
    };

    (api.post as any).mockResolvedValue({ data: { data: mockExtractedData } });

    render(<TransactionsPage />);
    
    // Wait for loading
    await waitFor(() => {
      expect(screen.queryByText(/Loading/i)).toBeNull();
    });
    
    // Open Scanner
    fireEvent.click(screen.getByTestId('transactions-header-btn-scan-slip'));
    
    // Wait for modal to appear
    await waitFor(() => {
      expect(screen.getByText(/AI Slip Intelligence/i)).toBeInTheDocument();
    });
    
    // Find hidden file input and trigger change
    const file = new File(['dummy content'], 'slip.png', { type: 'image/png' });
    const input = screen.getByTestId('ai-scanner-input');
    
    Object.defineProperty(input, 'files', { value: [file] });
    fireEvent.change(input);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/ai/verify-slip', expect.anything());
    }, { timeout: 3000 });

    expect(screen.getByDisplayValue('150.50')).toBeInTheDocument();
  });
});
