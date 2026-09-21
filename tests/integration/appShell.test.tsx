/**
 * Seed test for tests/integration/ — OWNED JOINTLY.
 *
 * Integration tests exercise the real wiring: UI -> hook -> compiler ->
 * visualization. They must not mock the compiler; that is the point.
 *
 * The end-to-end "type a regex, see a DFA" test belongs here once Person 1
 * pipeline works. See docs/TESTING_STRATEGY.md.
 */

import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../../src/App';

describe('application shell', () => {
  it('mounts and shows the empty state', () => {
    render(<App />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/DFA Visualizer/i);
    expect(screen.getByText(/Nothing to show yet/i)).toBeInTheDocument();
  });

  it('surfaces a compiler failure as a user-facing message, not a crash', async () => {
    // The compiler is not implemented yet, so it throws InternalCompilerError.
    // This asserts the error PATH is wired, which stays true afterwards: once
    // the pipeline works, change the input below to an invalid expression.
    render(<App />);

    await userEvent.type(screen.getByLabelText(/regular expression/i), 'a|b');
    await userEvent.click(screen.getByRole('button', { name: /convert/i }));

    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
});
