import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock next/dynamic — render children directly (avoid JSON.stringify circular refs)
vi.mock('next/dynamic', () => ({
  default: (loader: any) => {
    const Component = ({ children, ...props }: any) => (
      <div data-testid="dynamic-component-placeholder">{children}</div>
    );
    Component.displayName = 'DynamicComponent';
    return Component;
  },
}));

// Suppress recharts "width/height should be > 0" noise in jsdom (no real dimensions)
const isRechartsWarning = (args: any[]) =>
  typeof args[0] === 'string' && args[0].includes('width(') && args[0].includes('height(');

const originalError = console.error;
const originalWarn = console.warn;

vi.spyOn(console, 'error').mockImplementation((...args) => {
  if (isRechartsWarning(args)) return;
  originalError(...args);
});

vi.spyOn(console, 'warn').mockImplementation((...args) => {
  if (isRechartsWarning(args)) return;
  originalWarn(...args);
});
