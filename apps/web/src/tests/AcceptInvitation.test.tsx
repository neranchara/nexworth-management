import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import AcceptInvitationPage from '../app/invite/accept/page';
import api from '@/lib/api';

// Mock dependencies
vi.mock('@/lib/api', () => ({
  default: {
    post: vi.fn(),
  }
}));

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams('?token=valid-token'),
  useRouter: () => ({
    push: mockPush,
  }),
}));

// We need to test two scenarios: logged in and not logged in.
// Let's create a dynamic mock for authStore.
let isAuth = false;
vi.mock('@/store/authStore', () => ({
  useAuthStore: vi.fn((selector) => selector({ isAuthenticated: isAuth, user: null }))
}));

describe('AcceptInvitation Page (Phase 19)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('When user is NOT authenticated', () => {
    beforeAll(() => {
      isAuth = false;
    });

    it('displays the acceptance UI and prompts user to login', async () => {
      render(<AcceptInvitationPage />);
      
      expect(await screen.findByText(/Team Invitation/i)).toBeDefined();
      expect(await screen.findByText(/LOGIN TO ACCEPT/i)).toBeDefined();
    });

    it('redirects to login with a redirect query param when login is clicked', async () => {
      render(<AcceptInvitationPage />);
      
      const loginBtn = (await screen.findByText(/LOGIN TO ACCEPT/i)).closest('a');
      expect(loginBtn?.getAttribute('href')).toBe('/login?redirect=%2Finvite%2Faccept%3Ftoken%3Dvalid-token');
    });
  });

  describe('When user IS authenticated', () => {
    beforeAll(() => {
      isAuth = true;
    });

    it('shows joining status and calls api to accept invitation automatically', async () => {
      (api.post as any).mockResolvedValue({ data: { message: 'Success' } });
      
      render(<AcceptInvitationPage />);
      
      expect(await screen.findByText(/Processing Invitation.../i)).toBeDefined();
      
      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith('/invitations/accept', { token: 'valid-token' });
        // The mock setTimeout inside the component redirects to dashboard after 1.5s, 
        // but we can just check if the api was called successfully.
      });
    });

    it('shows error if the api call fails', async () => {
      (api.post as any).mockRejectedValue({ response: { data: { error: 'Invalid token' } } });
      
      render(<AcceptInvitationPage />);
      
      await waitFor(() => {
        expect(screen.getByText(/Invalid token/i)).toBeDefined();
      });
    });
  });
});
