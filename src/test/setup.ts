/**
 * Vitest global setup — runs before every test file.
 *
 * SHARED FILE. Adding a global here affects all three test suites, so mention
 * it in the team channel before you do.
 */

import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// ResizeObserver polyfill for jsdom (needed by React Flow)
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// React Testing Library does not auto-clean when `globals: true` is combined
// with a custom setup file, so do it explicitly.
afterEach(() => {
  cleanup();
});
