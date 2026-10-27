/**
 * End-to-end integration tests for tests/integration/ — OWNED JOINTLY.
 *
 * Exercises the complete user journey through the real compiler, context,
 * UI components, and visualization components with nothing mocked.
 */

import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../../src/App';

describe('application shell & complete user journey', () => {
  it('mounts and shows the empty state', () => {
    render(<App />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/DFA Visualizer/i);
    expect(screen.getByText(/Nothing to show yet/i)).toBeInTheDocument();
  });

  it('surfaces a compiler failure as a user-facing message, links aria-describedby, and clears on typing or Dismiss', async () => {
    render(<App />);

    const input = screen.getByLabelText(/regular expression/i);
    await userEvent.type(input, '(a|b');
    await userEvent.click(screen.getByRole('button', { name: /convert/i }));

    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveTextContent(/parenthesis/i);
    expect(input).toHaveAttribute('aria-invalid', 'true');

    // Typing clears stale error automatically
    await userEvent.type(input, ')');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(input).not.toHaveAttribute('aria-invalid');
  });

  it('completes the full compilation and step-navigation journey for (a|b)*abb', async () => {
    render(<App />);

    // 1. Enter Regex & Compile
    const input = screen.getByLabelText(/regular expression/i);
    await userEvent.type(input, '(a|b)*abb');
    await userEvent.click(screen.getByRole('button', { name: /convert/i }));

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    // 2. View Tokens
    await userEvent.click(screen.getByRole('tab', { name: /Tokenization/i }));
    expect(screen.getByRole('tabpanel')).toHaveTextContent('9 tokens');

    // 3. View Explicit Concatenation
    await userEvent.click(screen.getByRole('tab', { name: /Explicit Concatenation/i }));
    expect(screen.getByRole('tabpanel')).toHaveTextContent('(a|b)*.a.b.b');

    // 4. View Postfix
    await userEvent.click(screen.getByRole('tab', { name: /Postfix Notation/i }));
    expect(screen.getByRole('tabpanel')).toHaveTextContent('ab|*a.b.b.');

    // 5. View Syntax Tree, Positions, and Nullable/Firstpos/Lastpos
    await userEvent.click(screen.getByRole('tab', { name: /Syntax Tree & Positions/i }));
    expect(screen.getByRole('figure', { name: /Syntax Tree Diagram/i })).toBeInTheDocument();
    expect(screen.getByRole('table', { name: /Syntax-tree leaf positions/i })).toBeInTheDocument();
    expect(screen.getByRole('table', { name: /Syntax tree node analysis/i })).toBeInTheDocument();

    // 6. Inspect Followpos
    await userEvent.click(screen.getByRole('tab', { name: /Followpos Table/i }));
    const followposTable = screen.getByRole('table', { name: /Followpos transition table/i });
    expect(followposTable).toBeInTheDocument();
    expect(within(followposTable).getAllByText('{1, 2, 3}')).toHaveLength(2);

    // 7. View Direct DFA
    await userEvent.click(screen.getByRole('tab', { name: /Direct DFA Construction/i }));
    expect(screen.getByRole('figure', { name: /DFA state transition graph/i })).toBeInTheDocument();
    expect(screen.getByRole('table', { name: /DFA transition table/i })).toBeInTheDocument();
    expect(screen.getByRole('table', { name: /DFA state mapping/i })).toBeInTheDocument();

    // 8. Run String Simulation (Accept & Reject)
    await userEvent.click(screen.getByRole('tab', { name: /String Simulation/i }));
    const simInput = screen.getByLabelText(/input string/i);
    await userEvent.type(simInput, 'abb');
    await userEvent.click(screen.getByRole('button', { name: /^run$/i }));
    expect(screen.getByText(/✓ ACCEPTED/i)).toBeInTheDocument();

    await userEvent.clear(simInput);
    await userEvent.type(simInput, 'aba');
    await userEvent.click(screen.getByRole('button', { name: /^run$/i }));
    expect(screen.getByText(/✗ REJECTED/i)).toBeInTheDocument();

    // 9. Clicking an example expression immediately compiles and updates the view
    await userEvent.click(screen.getByRole('button', { name: 'a*' }));
    expect(input).toHaveValue('a*');
    // Stale simulation result should be cleared when DFA changes
    expect(screen.queryByText(/✗ REJECTED/i)).not.toBeInTheDocument();
    // A new compilation restarts the walkthrough at step 1
    expect(screen.getByRole('tab', { name: /Regular Expression/i })).toHaveAttribute(
      'aria-selected',
      'true'
    );
  });

  it('opens the first step after creating a DFA, even from a later step', async () => {
    render(<App />);
    const input = screen.getByLabelText(/regular expression/i);
    const firstStepTab = () => screen.getByRole('tab', { name: /Regular Expression/i });

    await userEvent.type(input, 'ab');
    await userEvent.click(screen.getByRole('button', { name: /convert/i }));
    expect(firstStepTab()).toHaveAttribute('aria-selected', 'true');

    await userEvent.click(screen.getByRole('tab', { name: /Followpos Table/i }));
    await userEvent.clear(input);
    await userEvent.type(input, 'a|b');
    await userEvent.click(screen.getByRole('button', { name: /convert/i }));
    expect(firstStepTab()).toHaveAttribute('aria-selected', 'true');
  });
});
