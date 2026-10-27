/**
 * Component and integration tests for visualization public components:
 * <DfaGraph /> and <SyntaxTreeGraph />.
 *
 */

import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { DfaGraph, SyntaxTreeGraph } from '../../src/visualization';
import {
  MOCK_COMPILATION_RESULT,
  MOCK_DFA,
  MOCK_DFA_WITH_SELF_LOOP,
} from '../fixtures/mockAutomata';

describe('<DfaGraph />', () => {
  it('renders the direct DFA graph with controls and its states', () => {
    render(<DfaGraph dfa={MOCK_DFA} />);
    expect(screen.getByRole('group', { name: /graph controls/i })).toBeInTheDocument();
    expect(screen.getByText('q0')).toBeInTheDocument();
    expect(screen.getByText('q1')).toBeInTheDocument();
  });

  it('shows positions mapping in node titles and labels for DFA states', () => {
    render(<DfaGraph dfa={MOCK_DFA} />);

    // MOCK_DFA q0 = positions {1, 2}
    const node0 = screen.getByTitle(/Positions: \{1, 2\}/);
    expect(node0).toBeInTheDocument();
    expect(node0).toHaveTextContent('q0');
    expect(node0).toHaveTextContent('{1,2}');

    // MOCK_DFA q1 = positions {3}
    const node1 = screen.getByTitle(/Positions: \{3\}/);
    expect(node1).toBeInTheDocument();
    expect(node1).toHaveTextContent('q1');
    expect(node1).toHaveTextContent('{3}');
  });

  it('renders DFA legend explaining position sets and active states', () => {
    render(<DfaGraph dfa={MOCK_DFA} />);

    expect(screen.getByText(/start state/i)).toBeInTheDocument();
    expect(screen.getByText(/accepting state/i)).toBeInTheDocument();
    expect(screen.getByText(/leaf position set/i)).toBeInTheDocument();
    expect(screen.getByText(/active \/ highlighted/i)).toBeInTheDocument();
    expect(screen.queryByText(/ε-transition/i)).not.toBeInTheDocument();
  });

  it('renders DFA with self-loop correctly', () => {
    render(<DfaGraph dfa={MOCK_DFA_WITH_SELF_LOOP} />);
    expect(screen.getByText('q0')).toBeInTheDocument();
  });

  it('applies highlighting to active states and transitions via highlight prop', () => {
    const { container } = render(
      <DfaGraph
        dfa={MOCK_DFA}
        highlight={{
          states: [1],
          transitions: [{ from: 0, to: 1, symbol: 'a' }],
        }}
      />
    );

    const highlightedNode = container.querySelector('.state-node--highlighted');
    expect(highlightedNode).toBeInTheDocument();
    expect(highlightedNode).toHaveTextContent('q1');
  });

  it('supports direct simulation props activeStateId and highlightedStateIds', () => {
    const { container } = render(
      <DfaGraph
        dfa={MOCK_DFA}
        activeStateId={1}
        highlightedStateIds={[0]}
        highlightedTransition={{ from: 0, to: 1, symbol: 'a' }}
      />
    );

    const activeNode = container.querySelector('.state-node--active');
    expect(activeNode).toBeInTheDocument();
    expect(activeNode).toHaveTextContent('q1');

    const highlightedNode = container.querySelector('.state-node--highlighted');
    expect(highlightedNode).toBeInTheDocument();
    expect(highlightedNode).toHaveTextContent('q0');
  });

  it('calls onStateClick callback when a state node is clicked', () => {
    const onStateClick = vi.fn();
    render(<DfaGraph dfa={MOCK_DFA} onStateClick={onStateClick} />);

    const node0 = screen.getByText('q0');
    fireEvent.click(node0);

    expect(onStateClick).toHaveBeenCalled();
    expect(onStateClick).toHaveBeenCalledWith(
      0,
      expect.objectContaining({ stateId: 0, label: 'q0' })
    );
  });

  it('applies selected styling when selectedStateId matches', () => {
    const { container } = render(<DfaGraph dfa={MOCK_DFA} selectedStateId={1} />);

    const selectedNode = container.querySelector('.state-node--selected');
    expect(selectedNode).toBeInTheDocument();
    expect(selectedNode).toHaveTextContent('q1');
  });

  it('reveals state details (status and positions) when the state is selected', () => {
    const { container } = render(<DfaGraph dfa={MOCK_DFA} selectedStateId={1} />);

    const details = container.querySelector('.graph-node-details');
    expect(details).toBeInTheDocument();
    expect(details).toHaveTextContent('Accepting');
    expect(details).toHaveTextContent('Positions: {3}');
  });

  it('reveals non-accepting and start status for the selected start state', () => {
    const { container } = render(<DfaGraph dfa={MOCK_DFA} selectedStateId={0} />);

    const details = container.querySelector('.graph-node-details');
    expect(details).toBeInTheDocument();
    expect(details).toHaveTextContent('Non-accepting · start');
    expect(details).toHaveTextContent('Positions: {1, 2}');
  });
});

describe('<SyntaxTreeGraph />', () => {
  it('renders the empty state when tree is null or undefined', () => {
    render(<SyntaxTreeGraph tree={null} />);
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText(/No syntax tree available yet/i)).toBeInTheDocument();
  });

  it('renders syntax tree with nodes, controls, and legend', () => {
    render(<SyntaxTreeGraph tree={MOCK_COMPILATION_RESULT.syntaxTree} />);

    expect(screen.getByRole('group', { name: /graph controls/i })).toBeInTheDocument();
    expect(screen.getByRole('list', { name: /syntax tree legend/i })).toBeInTheDocument();
    expect(screen.getByText(/operator node/i)).toBeInTheDocument();
    expect(screen.getByText(/alphabet symbol/i)).toBeInTheDocument();
    expect(screen.getByText(/augmented end-marker/i)).toBeInTheDocument();
    expect(screen.getByText(/leaf position/i)).toBeInTheDocument();
  });

  it('renders symbols and augmented end-marker leaf nodes with position badges', () => {
    const { container } = render(<SyntaxTreeGraph tree={MOCK_COMPILATION_RESULT.syntaxTree} />);

    // End-marker node #
    const endNode = container.querySelector('.syntax-tree-node--end-marker');
    expect(endNode).toBeInTheDocument();
    expect(endNode).toHaveTextContent('#');

    // Position badge on leaf node
    const posBadges = container.querySelectorAll('.syntax-tree-node__pos');
    expect(posBadges.length).toBeGreaterThanOrEqual(3);
  });

  it('highlights nodes matching highlightedPositions', () => {
    const { container } = render(
      <SyntaxTreeGraph tree={MOCK_COMPILATION_RESULT.syntaxTree} highlightedPositions={[1]} />
    );

    const highlighted = container.querySelector('.syntax-tree-node--highlighted');
    expect(highlighted).toBeInTheDocument();
    expect(highlighted).toHaveTextContent('a');
  });

  it('triggers onNodeClick callback when a node is clicked', () => {
    const onNodeClick = vi.fn();
    const { container } = render(
      <SyntaxTreeGraph tree={MOCK_COMPILATION_RESULT.syntaxTree} onNodeClick={onNodeClick} />
    );

    const endNode = container.querySelector('.syntax-tree-node--end-marker')!;
    expect(endNode).toBeInTheDocument();
    fireEvent.click(endNode);

    expect(onNodeClick).toHaveBeenCalled();
    expect(onNodeClick).toHaveBeenCalledWith(
      4,
      expect.objectContaining({ nodeId: 4, label: '#', isEndMarker: true })
    );
  });

  it('reveals node analysis details when the node is selected', () => {
    const { container } = render(
      <SyntaxTreeGraph tree={MOCK_COMPILATION_RESULT.syntaxTree} selectedNodeId={1} />
    );

    const details = container.querySelector('.graph-node-details');
    expect(details).toBeInTheDocument();
    expect(details).toHaveTextContent('symbol · pos 1');
    expect(details).toHaveTextContent('Nullable: false');
    expect(details).toHaveTextContent('Firstpos: {1}');
    expect(details).toHaveTextContent('Lastpos: {1}');
  });

  it('supports selecting syntax tree node via Enter keyboard key', () => {
    const onNodeClick = vi.fn();
    const { container } = render(
      <SyntaxTreeGraph tree={MOCK_COMPILATION_RESULT.syntaxTree} onNodeClick={onNodeClick} />
    );

    const endNode = container.querySelector('.syntax-tree-node--end-marker')!;
    expect(endNode).toBeInTheDocument();
    fireEvent.keyDown(endNode, { key: 'Enter' });

    expect(onNodeClick).toHaveBeenCalled();
  });
});
