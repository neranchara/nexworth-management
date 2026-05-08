import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { SecurityLogs } from '../components/user/SecurityLogs';
import React from 'react';
import api from '@/lib/api';

// Mock the API
vi.mock('@/lib/api', () => ({
  default: {
    get: vi.fn(),
  },
}));

describe('SecurityLogs (Transparency) Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders "No history" state when logs are empty', async () => {
    (api.get as any).mockResolvedValue({ data: { data: [] } });
    
    render(<SecurityLogs />);
    
    await waitFor(() => {
      expect(screen.getByText(/No administrative access history found/i)).toBeInTheDocument();
    });
  });

  it('renders list of logs when data is available', async () => {
    const mockLogs = [
      {
        id: 'log-1',
        startedAt: new Date().toISOString(),
        endedAt: null,
        ticketReference: 'TICKET-123',
        impersonator: { email: 'admin@nexworth.test' }
      }
    ];
    (api.get as any).mockResolvedValue({ data: { data: mockLogs } });
    
    render(<SecurityLogs />);
    
    await waitFor(() => {
      expect(screen.getByText(/TICKET-123/i)).toBeInTheDocument();
      // Using a simpler match to avoid regex asterisk issues
      expect(screen.getByText(/accessed for troubleshooting/i)).toBeInTheDocument();
    });
  });
});
