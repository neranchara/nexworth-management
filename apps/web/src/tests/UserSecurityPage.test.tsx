import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import UserSecurityPage from '../app/dashboard/security/page';

// Mock the child component so we don't have to deal with API calls in the page test
vi.mock('@/components/user/SecurityLogs', () => ({
  SecurityLogs: () => <div data-testid="mock-security-logs">Mocked Security Logs</div>
}));

describe('UserSecurityPage', () => {
  it('SHOULD render the page header properly', () => {
    render(<UserSecurityPage />);
    expect(screen.getByText(/Security Center/i)).toBeInTheDocument();
    expect(screen.getByText(/Cloud Identity Protection & Audit Trails/i)).toBeInTheDocument();
  });

  it('SHOULD render the SecurityLogs child component', () => {
    render(<UserSecurityPage />);
    expect(screen.getByTestId('mock-security-logs')).toBeInTheDocument();
  });

  it('SHOULD display the Multi-Factor Auth status as inactive/pending', () => {
    render(<UserSecurityPage />);
    expect(screen.getByText(/Multi-Factor Auth/i)).toBeInTheDocument();
    expect(screen.getByText(/Coming Soon/i)).toBeInTheDocument();
  });
});
