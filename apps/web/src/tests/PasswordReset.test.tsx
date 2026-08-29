import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import PasswordResetPage from '../app/reset-password/page';
import api from '@/lib/api';

// Mock dependencies
vi.mock('@/lib/api', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
  }
}));

const mockPush = vi.fn();
let mockSearchParams = new URLSearchParams('');

vi.mock('next/navigation', () => ({
  useSearchParams: () => mockSearchParams,
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('PasswordReset Page (Phase 18)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Missing or Invalid Token Flow', () => {
    beforeAll(() => {
      mockSearchParams = new URLSearchParams('');
    });

    it('shows error when token is missing', async () => {
      render(<PasswordResetPage />);
      expect(await screen.findByText(/Invalid or missing reset token/i)).toBeDefined();
    });
  });

  describe('Set New Password Flow (With Token)', () => {
    beforeAll(() => {
      mockSearchParams = new URLSearchParams('?token=valid-token');
    });

    it('renders the new password form', async () => {
      // Mock key fetch and token verify
      (api.get as any).mockImplementation((url: string) => {
        if (url.includes('verify-reset-token')) return Promise.resolve({ data: { email: 'test@example.com' } });
        return Promise.resolve({ data: {} });
      });

      render(<PasswordResetPage />);
      
      expect(await screen.findByText(/Set New Password/i)).toBeDefined();
      expect((await screen.findAllByPlaceholderText('••••••••')).length).toBeGreaterThan(0);
    });
  });
});
