/**
 * Seed test for tests/visualization/ — OWNER: Person 2.
 *
 * Proves the public components render with real contract data and with nothing.
 * Person 2 extends this directory with node, edge, layout and controls tests.
 */

import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ReactFlowProvider } from '@xyflow/react';
import { DfaGraph, NfaGraph } from '../../src/visualization';
import { MOCK_DFA, MOCK_MINIMIZED_DFA, MOCK_NFA } from '../fixtures/mockAutomata';

const renderWithProvider = (ui: React.ReactElement) => render(<ReactFlowProvider>{ui}</ReactFlowProvider>);

describe('<NfaGraph />', () => {
  it('renders the empty state when there is no automaton', () => {
    renderWithProvider(<NfaGraph nfa={null} />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders graph controls for an automaton', () => {
    renderWithProvider(<NfaGraph nfa={MOCK_NFA} />);
    expect(screen.getByRole('group', { name: /graph controls/i })).toBeInTheDocument();
  });
});

describe('<DfaGraph />', () => {
  it('renders graph controls for a DFA', () => {
    renderWithProvider(<DfaGraph dfa={MOCK_DFA} />);
    expect(screen.getByRole('group', { name: /graph controls/i })).toBeInTheDocument();
  });

  it('renders graph controls for a minimized DFA', () => {
    renderWithProvider(<DfaGraph dfa={MOCK_MINIMIZED_DFA} kind="minimized-dfa" />);
    expect(screen.getByRole('group', { name: /graph controls/i })).toBeInTheDocument();
  });
});
