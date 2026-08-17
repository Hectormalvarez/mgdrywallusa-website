/**
 * Reusable accessibility helper for jest-axe.
 *
 * Import and use in component tests:
 *   import { axeCheck } from '@/lib/__tests__/axe-helper';
 *   const { container } = render(<Component />);
 *   await axeCheck(container);
 */
import { configureAxe, toHaveNoViolations } from 'jest-axe';
import { expect } from '@jest/globals';

expect.extend(toHaveNoViolations);

export const axeCheck = configureAxe({
  rules: {
    // Color-contrast checks can be noisy in jsdom without real computed styles;
    // enable selectively in E2E or visual tests instead.
    'color-contrast': { enabled: false },
  },
});
