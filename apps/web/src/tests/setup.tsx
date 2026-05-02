import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock next/dynamic to render components synchronously in tests
vi.mock('next/dynamic', () => ({
  default: (loader: any) => {
    const Component = (props: any) => {
      // Create a placeholder or try to render the actual component if it's already resolved
      return <div data-testid="dynamic-component-placeholder">{JSON.stringify(props)}</div>;
    };
    Component.displayName = 'DynamicComponent';
    return Component;
  },
}));
