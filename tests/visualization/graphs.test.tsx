/**
 * Seed test for tests/visualization/ — OWNER: Person 2.
 *
 * Proves the public components render with real contract data and with nothing.
 * Person 2 extends this directory with node, edge, layout and controls tests.
 */

import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DfaGraph, NfaGraph } from '../../src/visualization';
import { MOCK_DFA, MOCK_MINIMIZED_DFA, MOCK_NFA } from '../fixtures/mockAutomata';

describe('<NfaGraph />', () => {
  it('renders the empty state when there is no automaton', () => {
    render(<NfaGraph nfa={null} />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders graph controls for an automaton', () => {
    render(<NfaGraph nfa={MOCK_NFA} />);
    expect(screen.getByRole('group', { name: /graph controls/i })).toBeInTheDocument();
  });
});

describe('<DfaGraph />', () => {
  it('accepts a DFA and a minimized DFA through the same props', () => {
    const { rerender } = render(<DfaGraph dfa={MOCK_DFA} />);
    expect(screen.getByRole('group', { name: /graph controls/i })).toBeInTheDocument();

    rerender(<DfaGraph dfa={MOCK_MINIMIZED_DFA} kind="minimized-dfa" />);
    expect(screen.getByRole('group', { name: /graph controls/i })).toBeInTheDocument();
  });
});
