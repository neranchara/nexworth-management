import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import CashflowHealthWidget from '../features/dashboard-overview/components/CashflowHealthWidget';

describe('CashflowHealthWidget - Component Test', () => {
  const mockOnOpenSettings = vi.fn();

  it('renders SAFE status with correct colors', () => {
    render(
      <CashflowHealthWidget 
        remaining={85000} 
        status="SAFE" 
        onOpenSettings={mockOnOpenSettings} 
      />
    );

    expect(screen.getByText(/ปลอดภัยมาก/i)).toBeDefined();
    expect(screen.getByText(/85,000/i)).toBeDefined();
    // Check if the text has emerald classes
    const statusText = screen.getByText(/ปลอดภัยมาก/i);
    expect(statusText.className).toContain('text-emerald');
  });

  it('renders WATCH status with correct colors', () => {
    render(
      <CashflowHealthWidget 
        remaining={45000} 
        status="WATCH" 
        onOpenSettings={mockOnOpenSettings} 
      />
    );

    expect(screen.getByText(/เฝ้าระวัง/i)).toBeDefined();
    expect(screen.getByText(/45,000/i)).toBeDefined();
    const statusText = screen.getByText(/เฝ้าระวัง/i);
    expect(statusText.className).toContain('text-amber');
  });

  it('renders DANGER status with correct colors', () => {
    render(
      <CashflowHealthWidget 
        remaining={15000} 
        status="DANGER" 
        onOpenSettings={mockOnOpenSettings} 
      />
    );

    expect(screen.getByText(/ระดับอันตราย/i)).toBeDefined();
    expect(screen.getByText(/15,000/i)).toBeDefined();
    const statusText = screen.getByText(/ระดับอันตราย/i);
    expect(statusText.className).toContain('text-rose');
  });

  it('triggers settings callback when gear icon clicked', () => {
    render(
      <CashflowHealthWidget 
        remaining={50000} 
        status="WATCH" 
        onOpenSettings={mockOnOpenSettings} 
      />
    );

    const settingsBtn = screen.getByRole('button');
    fireEvent.click(settingsBtn);
    expect(mockOnOpenSettings).toHaveBeenCalled();
  });
});
