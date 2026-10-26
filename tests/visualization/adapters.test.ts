/**
 * Tests for visualization adapters (adaptNfa and adaptDfa).
 *
 * OWNER: Person 2.
 */

import { describe, expect, it } from 'vitest';
import { adaptNfa, formatTransitionSymbol } from '../../src/visualization/adapters/nfaAdapter';
import { adaptDfa } from '../../src/visualization/adapters/dfaAdapter';
import { EPSILON_DISPLAY, type DFA, type NFA } from '../../src/compiler/types';
import {
  MOCK_DFA,
  MOCK_DFA_WITH_SELF_LOOP,
  MOCK_MINIMIZED_DFA,
  MOCK_NFA,
} from '../fixtures/mockAutomata';

describe('formatTransitionSymbol', () => {
  it('formats null as epsilon display glyph', () => {
    expect(formatTransitionSymbol(null)).toBe(EPSILON_DISPLAY);
    expect(formatTransitionSymbol(null)).toBe('ε');
    expect(formatTransitionSymbol(null)).not.toBe('null');
  });

  it('formats alphabet characters unchanged', () => {
    expect(formatTransitionSymbol('a')).toBe('a');
    expect(formatTransitionSymbol('b')).toBe('b');
  });
});

describe('adaptNfa', () => {
  it('returns empty nodes and edges for empty or invalid input', () => {
    const empty = adaptNfa({
      states: [],
      alphabet: [],
      startState: 0,
      acceptStates: [],
      transitions: [],
    });
    expect(empty.nodes).toEqual([]);
    expect(empty.edges).toEqual([]);
  });

  it('converts NFA states into GraphNodes with formatted labels', () => {
    const adapted = adaptNfa(MOCK_NFA);
    expect(adapted.nodes).toHaveLength(MOCK_NFA.states.length);

    // State 0 is the start state and not accepting
    const node0 = adapted.nodes.find((n) => n.id === '0')!;
    expect(node0).toBeDefined();
    expect(node0.data.stateId).toBe(0);
    expect(node0.data.label).toBe('q0');
    expect(node0.data.isStart).toBe(true);
    expect(node0.data.isAccepting).toBe(false);

    // State 5 is the accepting state
    const node5 = adapted.nodes.find((n) => n.id === '5')!;
    expect(node5).toBeDefined();
    expect(node5.data.stateId).toBe(5);
    expect(node5.data.label).toBe('q5');
    expect(node5.data.isStart).toBe(false);
    expect(node5.data.isAccepting).toBe(true);
  });

  it('translates null transitions to epsilon edges', () => {
    const adapted = adaptNfa(MOCK_NFA);
    const epsEdge = adapted.edges.find((e) => e.source === '0' && e.target === '1')!;
    expect(epsEdge).toBeDefined();
    expect(epsEdge.data.isEpsilon).toBe(true);
    expect(epsEdge.data.label).toBe('ε');
    expect(epsEdge.data.symbols).toEqual([null]);
  });

  it('merges parallel transitions between the same state pair', () => {
    const nfaWithParallel: NFA = {
      states: [0, 1],
      alphabet: ['a', 'b'],
      startState: 0,
      acceptStates: [1],
      transitions: [
        { from: 0, to: 1, symbol: 'a' },
        { from: 0, to: 1, symbol: 'b' },
      ],
    };

    const adapted = adaptNfa(nfaWithParallel);
    expect(adapted.edges).toHaveLength(1);
    expect(adapted.edges[0].id).toBe('e0-1');
    expect(adapted.edges[0].data.label).toBe('a, b');
    expect(adapted.edges[0].data.symbols).toEqual(['a', 'b']);
    expect(adapted.edges[0].data.isEpsilon).toBe(false);
  });

  it('supports self-loops correctly', () => {
    const nfaLoop: NFA = {
      states: [0],
      alphabet: ['a'],
      startState: 0,
      acceptStates: [0],
      transitions: [{ from: 0, to: 0, symbol: 'a' }],
    };

    const adapted = adaptNfa(nfaLoop);
    expect(adapted.nodes).toHaveLength(1);
    expect(adapted.edges).toHaveLength(1);
    expect(adapted.edges[0].source).toBe('0');
    expect(adapted.edges[0].target).toBe('0');
    expect(adapted.edges[0].data.label).toBe('a');
  });
});

describe('adaptDfa', () => {
  it('returns empty nodes and edges for empty input', () => {
    const empty = adaptDfa({
      states: [],
      alphabet: [],
      startState: 0,
      acceptStates: [],
      transitions: [],
    });
    expect(empty.nodes).toEqual([]);
    expect(empty.edges).toEqual([]);
  });

  it('maps DFA states and preserves canonical positions and nfaStates subset mapping', () => {
    const adapted = adaptDfa(MOCK_DFA);
    expect(adapted.nodes).toHaveLength(3);

    const q0 = adapted.nodes.find((n) => n.id === '0')!;
    expect(q0.data.label).toBe('q0');
    expect(q0.data.isStart).toBe(true);
    expect(q0.data.isAccepting).toBe(false);
    expect(q0.data.positions).toEqual([0, 1, 3]);
    expect(q0.data.nfaStates).toEqual([0, 1, 3]);

    const q1 = adapted.nodes.find((n) => n.id === '1')!;
    expect(q1.data.label).toBe('q1');
    expect(q1.data.isStart).toBe(false);
    expect(q1.data.isAccepting).toBe(true);
    expect(q1.data.positions).toEqual([2, 5]);
    expect(q1.data.nfaStates).toEqual([2, 5]);
  });

  it('maps canonical positions when state.positions is provided without nfaStates', () => {
    const directDfa: DFA = {
      states: [
        { id: 0, positions: [1, 2, 3], isAccepting: false },
        { id: 1, positions: [4, 5], isAccepting: true },
      ],
      alphabet: ['a', 'b'],
      startState: 0,
      acceptStates: [1],
      transitions: [{ from: 0, to: 1, symbol: 'a' }],
    };

    const adapted = adaptDfa(directDfa);
    expect(adapted.nodes).toHaveLength(2);
    expect(adapted.nodes[0].data.positions).toEqual([1, 2, 3]);
    expect(adapted.nodes[0].data.nfaStates).toEqual([1, 2, 3]);
    expect(adapted.nodes[1].data.positions).toEqual([4, 5]);
  });

  it('throws an error if a DFA contains an epsilon transition', () => {
    const brokenDfa: DFA = {
      states: [{ id: 0, positions: [0], nfaStates: [0], isAccepting: true }],
      alphabet: ['a'],
      startState: 0,
      acceptStates: [0],
      transitions: [{ from: 0, to: 0, symbol: null }],
    };

    expect(() => adaptDfa(brokenDfa)).toThrow(/cannot contain epsilon transitions/i);
  });

  it('keeps parallel transitions between the same state pair as separate edges', () => {
    const adapted = adaptDfa(MOCK_MINIMIZED_DFA);
    expect(adapted.nodes).toHaveLength(2);

    // MOCK_MINIMIZED_DFA has 0 -> 1 with 'a' and 0 -> 1 with 'b'
    expect(adapted.edges).toHaveLength(2);
    expect(adapted.edges[0].id).toBe('e0-1-a');
    expect(adapted.edges[0].source).toBe('0');
    expect(adapted.edges[0].target).toBe('1');
    expect(adapted.edges[0].data.label).toBe('a');
    expect(adapted.edges[0].data.symbols).toEqual(['a']);
    expect(adapted.edges[0].data.isEpsilon).toBe(false);
    expect(adapted.edges[1].id).toBe('e0-1-b');
    expect(adapted.edges[1].data.label).toBe('b');
    expect(adapted.edges[1].data.symbols).toEqual(['b']);
    expect(adapted.edges[1].data.isEpsilon).toBe(false);
  });

  it('deduplicates an identical repeated transition', () => {
    const dfaWithDuplicate: DFA = {
      states: [
        { id: 0, positions: [1], nfaStates: [1], isAccepting: false },
        { id: 1, positions: [2], nfaStates: [2], isAccepting: true },
      ],
      alphabet: ['a'],
      startState: 0,
      acceptStates: [1],
      transitions: [
        { from: 0, to: 1, symbol: 'a' },
        { from: 0, to: 1, symbol: 'a' },
      ],
    };

    const adapted = adaptDfa(dfaWithDuplicate);
    expect(adapted.edges).toHaveLength(1);
    expect(adapted.edges[0].id).toBe('e0-1-a');
  });

  it('adapts DFA with self-loop', () => {
    const adapted = adaptDfa(MOCK_DFA_WITH_SELF_LOOP);
    expect(adapted.nodes).toHaveLength(1);
    expect(adapted.nodes[0].data.isStart).toBe(true);
    expect(adapted.nodes[0].data.isAccepting).toBe(true);
    expect(adapted.edges).toHaveLength(1);
    expect(adapted.edges[0].id).toBe('e0-0-a');
    expect(adapted.edges[0].source).toBe('0');
    expect(adapted.edges[0].target).toBe('0');
  });

  it('includes dead state (qd) with missing transitions and self-loop when includeDeadState is true', () => {
    // DFA for (a|b)(c|d): 3 states, 4 alphabet symbols
    const partialDfa: DFA = {
      states: [
        { id: 0, positions: [1, 2], isAccepting: false },
        { id: 1, positions: [3, 4], isAccepting: false },
        { id: 2, positions: [5], isAccepting: true },
      ],
      alphabet: ['a', 'b', 'c', 'd'],
      startState: 0,
      acceptStates: [2],
      transitions: [
        { from: 0, to: 1, symbol: 'a' },
        { from: 0, to: 1, symbol: 'b' },
        { from: 1, to: 2, symbol: 'c' },
        { from: 1, to: 2, symbol: 'd' },
      ],
    };

    const adaptedWithoutDeadState = adaptDfa(partialDfa);
    expect(adaptedWithoutDeadState.nodes).toHaveLength(3);
    expect(adaptedWithoutDeadState.edges).toHaveLength(4);

    const adaptedWithDeadState = adaptDfa(partialDfa, { includeDeadState: true });
    // Expect 3 original states + 1 dead state (qd)
    expect(adaptedWithDeadState.nodes).toHaveLength(4);
    const deadNode = adaptedWithDeadState.nodes.find((n) => n.id === '-1');
    expect(deadNode).toBeDefined();
    expect(deadNode?.data.label).toBe('qd');
    expect(deadNode?.data.isDeadState).toBe(true);
    expect(deadNode?.data.isAccepting).toBe(false);
    expect(deadNode?.data.positions).toEqual([]);

    // Outgoing edges to dead state:
    // q0 missing c, d -> edge e0--1
    const edge0Dead = adaptedWithDeadState.edges.find((e) => e.id === 'e0--1');
    expect(edge0Dead).toBeDefined();
    expect(edge0Dead?.data.label).toBe('c, d');
    expect(edge0Dead?.data.symbols).toEqual(['c', 'd']);

    // q1 missing a, b -> edge e1--1
    const edge1Dead = adaptedWithDeadState.edges.find((e) => e.id === 'e1--1');
    expect(edge1Dead).toBeDefined();
    expect(edge1Dead?.data.label).toBe('a, b');
    expect(edge1Dead?.data.symbols).toEqual(['a', 'b']);

    // q2 missing a, b, c, d -> edge e2--1
    const edge2Dead = adaptedWithDeadState.edges.find((e) => e.id === 'e2--1');
    expect(edge2Dead).toBeDefined();
    expect(edge2Dead?.data.label).toBe('a, b, c, d');

    // Self loop on dead state for all alphabet symbols
    const deadLoop = adaptedWithDeadState.edges.find((e) => e.id === 'e-1--1');
    expect(deadLoop).toBeDefined();
    expect(deadLoop?.data.label).toBe('a, b, c, d');
    expect(deadLoop?.data.symbols).toEqual(['a', 'b', 'c', 'd']);
  });

  it('does not add a dead state if the DFA is already total', () => {
    const totalDfa: DFA = {
      states: [{ id: 0, positions: [1], isAccepting: true }],
      alphabet: ['a'],
      startState: 0,
      acceptStates: [0],
      transitions: [{ from: 0, to: 0, symbol: 'a' }],
    };

    const adapted = adaptDfa(totalDfa, { includeDeadState: true });
    expect(adapted.nodes).toHaveLength(1);
    expect(adapted.edges).toHaveLength(1);
  });
});
