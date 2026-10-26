/**
 * Tests for visualization tables and badges:
 * PositionBadge, PositionTable, AstAnalysisTable, FollowposTable, DfaPositionMapping.
 *
 * OWNER: Person 2.
 */

import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import {
  AstAnalysisTable,
  DfaPositionMapping,
  FollowposTable,
  PositionBadge,
  PositionTable,
} from '../../src/visualization';
import { TransitionTable } from '../../src/components/TransitionTable';
import { MOCK_COMPILATION_RESULT, MOCK_DFA } from '../fixtures/mockAutomata';

describe('PositionBadge', () => {
  it('renders position number and optional symbol', () => {
    const { container, rerender } = render(<PositionBadge position={1} />);
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(container.querySelector('.position-badge')).not.toHaveClass('position-badge--end');

    rerender(<PositionBadge position={2} symbol="b" />);
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('b')).toBeInTheDocument();
  });

  it('applies end-marker styling when symbol is # or isEndMarker is true', () => {
    const { container } = render(<PositionBadge position={3} symbol="#" />);
    expect(container.querySelector('.position-badge')).toHaveClass('position-badge--end');
  });
});

describe('PositionTable', () => {
  it('renders empty state when positions is null or empty', () => {
    render(<PositionTable positions={[]} />);
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText(/No position information available/i)).toBeInTheDocument();
  });

  it('renders table rows for each leaf position and distinguishes end-marker #', () => {
    render(<PositionTable positions={MOCK_COMPILATION_RESULT.positions} />);

    expect(screen.getByRole('table', { name: /syntax-tree leaf positions/i })).toBeInTheDocument();
    expect(screen.getAllByRole('row')).toHaveLength(4); // 1 header + 3 data rows

    expect(screen.getByText('Augmented end-marker (#)')).toBeInTheDocument();
    expect(screen.getAllByText('Alphabet symbol')).toHaveLength(2);
  });

  it('handles row selection when onSelectPosition is provided', () => {
    const onSelect = vi.fn();
    render(
      <PositionTable
        positions={MOCK_COMPILATION_RESULT.positions}
        highlightedPosition={2}
        onSelectPosition={onSelect}
      />
    );

    const row2 = screen.getByText('b').closest('tr')!;
    expect(row2).toHaveClass('vis-table__row--selected');

    fireEvent.click(row2);
    expect(onSelect).toHaveBeenCalledWith(2);
  });
});

describe('AstAnalysisTable', () => {
  it('renders empty state when tree is null or undefined', () => {
    render(<AstAnalysisTable tree={null} />);
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText(/No AST analysis available/i)).toBeInTheDocument();
  });

  it('renders analysis rows for all AST nodes with nullable, firstpos, and lastpos', () => {
    render(<AstAnalysisTable tree={MOCK_COMPILATION_RESULT.syntaxTree} />);

    expect(screen.getByRole('table', { name: /syntax tree node analysis/i })).toBeInTheDocument();
    // 5 nodes: concat, union, a, b, #
    expect(screen.getByText('#5')).toBeInTheDocument();
    expect(screen.getByText('#3')).toBeInTheDocument();
    expect(screen.getByText('#1')).toBeInTheDocument();
    expect(screen.getAllByText('{1, 2}').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('{3}').length).toBeGreaterThanOrEqual(1);
  });

  it('allows clicking a node row when onSelectNode is provided', () => {
    const onSelectNode = vi.fn();
    render(
      <AstAnalysisTable
        tree={MOCK_COMPILATION_RESULT.syntaxTree}
        selectedNodeId={1}
        onSelectNode={onSelectNode}
      />
    );

    const node1Row = screen.getByText('#1').closest('tr')!;
    expect(node1Row).toHaveClass('vis-table__row--selected');

    fireEvent.click(node1Row);
    expect(onSelectNode).toHaveBeenCalledWith(1);
  });
});

describe('FollowposTable', () => {
  it('renders empty state when followpos is null or empty', () => {
    render(<FollowposTable followpos={[]} />);
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText(/No followpos data available/i)).toBeInTheDocument();
  });

  it('renders followpos sets and displays ∅ for empty sets', () => {
    render(<FollowposTable followpos={MOCK_COMPILATION_RESULT.followpos} />);

    expect(screen.getByRole('table', { name: /followpos transition table/i })).toBeInTheDocument();
    expect(screen.getAllByText('{3}')).toHaveLength(2); // followpos(1) = {3}, followpos(2) = {3}
    expect(screen.getByText('∅')).toBeInTheDocument(); // followpos(3) = ∅
  });

  it('triggers onSelectPosition when a row is clicked', () => {
    const onSelectPosition = vi.fn();
    render(
      <FollowposTable
        followpos={MOCK_COMPILATION_RESULT.followpos}
        selectedPosition={1}
        onSelectPosition={onSelectPosition}
      />
    );

    const row1 = screen.getByText('a').closest('tr')!;
    expect(row1).toHaveClass('vis-table__row--selected');

    fireEvent.click(row1);
    expect(onSelectPosition).toHaveBeenCalledWith(1);
  });
});

describe('DfaPositionMapping', () => {
  it('renders empty state when dfa is null or has no states', () => {
    render(<DfaPositionMapping dfa={null} />);
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText(/No DFA states available/i)).toBeInTheDocument();
  });

  it('renders table displaying DFA state IDs, syntax-tree positions, and acceptance status', () => {
    render(<DfaPositionMapping dfa={MOCK_DFA} />);

    expect(
      screen.getByRole('table', { name: /DFA State to Position Mapping/i })
    ).toBeInTheDocument();
    expect(screen.getByText('q0')).toBeInTheDocument();
    expect(screen.getByText('{0, 1, 3}')).toBeInTheDocument();
    expect(screen.getByText('start')).toBeInTheDocument();

    expect(screen.getByText('q1')).toBeInTheDocument();
    expect(screen.getByText('{2, 5}')).toBeInTheDocument();
    expect(screen.getAllByText(/Accepting \(contains #\)/i)).toHaveLength(2);
  });

  it('triggers onSelectState when a row is clicked', () => {
    const onSelectState = vi.fn();
    render(<DfaPositionMapping dfa={MOCK_DFA} selectedStateId={0} onSelectState={onSelectState} />);

    const row0 = screen.getByText('q0').closest('tr')!;
    expect(row0).toHaveClass('vis-table__row--selected');

    fireEvent.click(row0);
    expect(onSelectState).toHaveBeenCalledWith(0);
  });
});

describe('TransitionTable', () => {
  it('renders dead state row and targets when showDeadState is true', () => {
    const partialDfa = {
      states: [
        { id: 0, positions: [1], isAccepting: false },
        { id: 1, positions: [2], isAccepting: true },
      ],
      alphabet: ['a', 'b'],
      startState: 0,
      acceptStates: [1],
      transitions: [{ from: 0, to: 1, symbol: 'a' }],
    };

    const { rerender } = render(<TransitionTable dfa={partialDfa} showDeadState={false} />);
    expect(screen.getAllByText('—').length).toBe(3);
    expect(screen.queryByText('qd')).not.toBeInTheDocument();

    rerender(<TransitionTable dfa={partialDfa} showDeadState={true} />);
    expect(screen.queryByText('—')).not.toBeInTheDocument();
    expect(screen.getAllByText('qd').length).toBeGreaterThan(0);
    expect(screen.getByText('trap')).toBeInTheDocument();
  });
});
