import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SimpleButton } from '../components/SimpleButton';
import React from 'react';

describe('SimpleButton Component', () => {
  it('renders with the correct label', () => {
    render(<SimpleButton label="Click Me" onClick={() => {}} />);
    expect(screen.getByText('Click Me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<SimpleButton label="Click Me" onClick={handleClick} />);
    fireEvent.click(screen.getByTestId('simple-button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
