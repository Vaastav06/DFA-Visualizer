/**
 * Component and integration tests for visualization public components:
 * <NfaGraph /> and <DfaGraph />.
 *
 * OWNER: Person 2.
 */

import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { DfaGraph, NfaGraph, SyntaxTreeGraph } from '../../src/visualization';
import {
  MOCK_COMPILATION_RESULT,
  MOCK_DFA,
  MOCK_DFA_WITH_SELF_LOOP,
  MOCK_MINIMIZED_DFA,
  MOCK_NFA,
} from '../fixtures/mockAutomata';

describe('<NfaGraph />', () => {
  it('renders the empty state when there is no automaton (null)', () => {
    render(<NfaGraph nfa={null} />);
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText(/No automaton to display/i)).toBeInTheDocument();
  });

  it('renders the empty state when nfa is undefined', () => {
    render(<NfaGraph nfa={undefined} />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders the empty state when nfa has zero states', () => {
    render(
      <NfaGraph
        nfa={{
          states: [],
          alphabet: [],
          startState: 0,
          acceptStates: [],
          transitions: [],
        }}
      />
    );
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders graph controls for an automaton with accessible buttons', () => {
    render(<NfaGraph nfa={MOCK_NFA} />);

    expect(screen.getByRole('group', { name: /graph controls/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /zoom in/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /zoom out/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /fit graph to view/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reset graph view/i })).toBeInTheDocument();
  });

  it('renders all states from the NFA fixture', () => {
    render(<NfaGraph nfa={MOCK_NFA} />);

    for (const stateId of MOCK_NFA.states) {
      expect(screen.getByText(`q${stateId}`)).toBeInTheDocument();
    }
  });

  it('renders extended graph controls including export and minimap toggle', () => {
    render(<DfaGraph dfa={MOCK_DFA} />);

    expect(screen.getByRole('button', { name: /export diagram as svg/i })).toBeInTheDocument();
    const mapToggle = screen.getByRole('button', { name: /show minimap/i });
    expect(mapToggle).toBeInTheDocument();

    fireEvent.click(mapToggle);
    expect(screen.getByRole('button', { name: /hide minimap/i })).toBeInTheDocument();
  });

  it('renders start state indicator and accepting state indicator on NFA nodes', () => {
    const { container } = render(<NfaGraph nfa={MOCK_NFA} />);

    // Start state q0 has state-node--start class
    const startNode = container.querySelector('.state-node--start');
    expect(startNode).toBeInTheDocument();
    expect(startNode).toHaveTextContent('q0');

    // Accepting state q5 has state-node--accepting class
    const acceptNode = container.querySelector('.state-node--accepting');
    expect(acceptNode).toBeInTheDocument();
    expect(acceptNode).toHaveTextContent('q5');
  });

  it('renders NFA legend entries including epsilon', () => {
    render(<NfaGraph nfa={MOCK_NFA} />);

    expect(screen.getByText(/start state/i)).toBeInTheDocument();
    expect(screen.getByText(/accepting state/i)).toBeInTheDocument();
    expect(screen.getByText(/ε-transition/i)).toBeInTheDocument();
  });

  it('respects custom height and className props', () => {
    const { container } = render(
      <NfaGraph nfa={MOCK_NFA} height={500} className="custom-graph-class" />
    );

    const figure = container.querySelector('figure.automata-graph');
    expect(figure).toHaveClass('custom-graph-class');
    expect(figure).toHaveStyle({ height: '500px' });
  });
});

describe('<DfaGraph />', () => {
  it('accepts a DFA and a minimized DFA through the same props', () => {
    const { rerender } = render(<DfaGraph dfa={MOCK_DFA} />);
    expect(screen.getByRole('group', { name: /graph controls/i })).toBeInTheDocument();
    expect(screen.getByText('q0')).toBeInTheDocument();
    expect(screen.getByText('q1')).toBeInTheDocument();
    expect(screen.getByText('q2')).toBeInTheDocument();

    rerender(<DfaGraph dfa={MOCK_MINIMIZED_DFA} kind="minimized-dfa" />);
    expect(screen.getByRole('group', { name: /graph controls/i })).toBeInTheDocument();
    expect(screen.getByText('q0')).toBeInTheDocument();
    expect(screen.getByText('q1')).toBeInTheDocument();
  });

  it('shows positions mapping in node titles and labels for DFA states', () => {
    render(<DfaGraph dfa={MOCK_DFA} />);

    // MOCK_DFA q0 = positions {0, 1, 3}
    const node0 = screen.getByTitle(/Positions: \{0, 1, 3\}/);
    expect(node0).toBeInTheDocument();
    expect(node0).toHaveTextContent('q0');
    expect(node0).toHaveTextContent('{0,1,3}');

    // MOCK_DFA q1 = positions {2, 5}
    const node1 = screen.getByTitle(/Positions: \{2, 5\}/);
    expect(node1).toBeInTheDocument();
    expect(node1).toHaveTextContent('q1');
    expect(node1).toHaveTextContent('{2,5}');
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
        highlightedStateIds={[2]}
        highlightedTransition={{ from: 0, to: 1, symbol: 'a' }}
      />
    );

    const activeNode = container.querySelector('.state-node--active');
    expect(activeNode).toBeInTheDocument();
    expect(activeNode).toHaveTextContent('q1');

    const highlightedNode = container.querySelector('.state-node--highlighted');
    expect(highlightedNode).toBeInTheDocument();
    expect(highlightedNode).toHaveTextContent('q2');
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
    expect(details).toHaveTextContent('Positions: {2, 5}');
  });

  it('reveals non-accepting and start status for the selected start state', () => {
    const { container } = render(<DfaGraph dfa={MOCK_DFA} selectedStateId={0} />);

    const details = container.querySelector('.graph-node-details');
    expect(details).toBeInTheDocument();
    expect(details).toHaveTextContent('Non-accepting · start');
    expect(details).toHaveTextContent('Positions: {0, 1, 3}');
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
});
