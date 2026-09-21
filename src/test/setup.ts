/**
 * Vitest global setup — runs before every test file.
 *
 * SHARED FILE. Adding a global here affects all three test suites, so mention
 * it in the team channel before you do.
 */

import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// React Testing Library does not auto-clean when `globals: true` is combined
// with a custom setup file, so do it explicitly.
afterEach(() => {
  cleanup();
});
