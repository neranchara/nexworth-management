import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import MobileBottomNav from '@/features/dashboard-layout/MobileBottomNav';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
}));

let mockUser: any;
vi.mock('@/store/authStore', () => ({
  useAuthStore: () => ({ user: mockUser }),
}));

describe('MobileBottomNav - NEX-BUG-15 permission gating', () => {
  it('hides the Goals tab when the role has no goals permission (matches desktop sidebar)', () => {
    mockUser = {
      isSystemAdmin: false,
      permissions: [
        { resource: 'dashboard', canView: true },
        { resource: 'transactions', canView: true },
        { resource: 'assets', canView: true },
      ],
    };

    render(<MobileBottomNav />);

    expect(screen.queryByText('goals')).not.toBeInTheDocument();
    expect(screen.getByText('transactions')).toBeInTheDocument();
    expect(screen.getByText('assets')).toBeInTheDocument();
  });

  it('shows the Goals tab once the role has goals permission', () => {
    mockUser = {
      isSystemAdmin: false,
      permissions: [
        { resource: 'dashboard', canView: true },
        { resource: 'transactions', canView: true },
        { resource: 'assets', canView: true },
        { resource: 'goals', canView: true },
      ],
    };

    render(<MobileBottomNav />);

    expect(screen.getByText('goals')).toBeInTheDocument();
  });

  it('shows every tab for a system admin regardless of the permissions array', () => {
    mockUser = { isSystemAdmin: true, permissions: [] };

    render(<MobileBottomNav />);

    expect(screen.getByText('goals')).toBeInTheDocument();
    expect(screen.getByText('transactions')).toBeInTheDocument();
    expect(screen.getByText('assets')).toBeInTheDocument();
  });
});
