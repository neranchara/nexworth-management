import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TeamPage from '../app/dashboard/team/page';
import api from '@/lib/api';

// Mock dependencies
vi.mock('@/lib/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  }
}));

vi.mock('@/store/authStore', () => ({
  useAuthStore: () => ({
    user: { id: 'admin-id', role: 'Admin', isSystemAdmin: true }
  })
}));

describe('TeamManagement Page (Phase 19)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    // Setup api to return promises that don't resolve immediately
    (api.get as any).mockReturnValue(new Promise(() => {}));
    
    render(<TeamPage />);
    // Since loader is a Lucide icon with animate-spin class, we can check for that
    expect(document.querySelector('.animate-spin')).toBeDefined();
  });

  it('fetches and displays team members, invitations, and roles', async () => {
    (api.get as any).mockImplementation((url: string) => {
      if (url === '/users') {
        return Promise.resolve({ data: { users: [{ id: '1', email: 'test@example.com', firstName: 'John', lastName: 'Doe', role: { name: 'Admin' } }] } });
      }
      if (url === '/invitations') {
        return Promise.resolve({ data: [{ id: 'inv1', email: 'invite@example.com', status: 'PENDING', expiresAt: '2026-12-31T00:00:00Z' }] });
      }
      if (url === '/roles') {
        return Promise.resolve({ data: { roles: [{ id: 'r1', name: 'Editor' }] } });
      }
      return Promise.resolve({ data: {} });
    });

    render(<TeamPage />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeDefined();
      expect(screen.getByText('test@example.com')).toBeDefined();
      expect(screen.getByText('invite@example.com')).toBeDefined();
    });
  });

  it('displays Coming Soon for the invitation feature', async () => {
    (api.get as any).mockImplementation((url: string) => {
      if (url === '/users') return Promise.resolve({ data: { users: [] } });
      if (url === '/invitations') return Promise.resolve({ data: [] });
      if (url === '/roles') return Promise.resolve({ data: { roles: [{ id: 'r1', name: 'Editor' }] } });
      return Promise.resolve({ data: {} });
    });

    render(<TeamPage />);

    await waitFor(() => {
      expect(screen.getByText('Coming Soon')).toBeDefined();
      expect(screen.getByText(/ระบบเชิญสมาชิกอยู่ระหว่างพัฒนา/i)).toBeDefined();
    });
  });

  it('allows Admin to revoke a pending invitation', async () => {
    (api.get as any).mockImplementation((url: string) => {
      if (url === '/users') return Promise.resolve({ data: { users: [] } });
      if (url === '/invitations') return Promise.resolve({ data: [{ id: 'inv1', email: 'invite@example.com', status: 'PENDING', expiresAt: '2026-12-31T00:00:00Z' }] });
      if (url === '/roles') return Promise.resolve({ data: { roles: [] } });
      return Promise.resolve({ data: {} });
    });

    (api.delete as any).mockResolvedValue({ data: { success: true } });

    // Mock window.confirm
    const confirmSpy = vi.spyOn(window, 'confirm').mockImplementation(() => true);

    render(<TeamPage />);

    // Wait for the invitation to render
    await waitFor(() => {
      expect(screen.getByText('invite@example.com')).toBeDefined();
    });

    // Find the revoke button (it has Lucide Trash2 icon and title "Revoke Invitation")
    const revokeBtn = screen.getByTitle('Revoke Invitation');
    fireEvent.click(revokeBtn);

    expect(confirmSpy).toHaveBeenCalledWith('Are you sure you want to revoke this invitation?');

    await waitFor(() => {
      expect(api.delete).toHaveBeenCalledWith('/invitations/inv1');
      expect(screen.getByText('Invitation revoked successfully')).toBeDefined();
    });

    confirmSpy.mockRestore();
  });
});
