import { describe, expect, it } from 'vitest';
import type { DFA } from '../../src/compiler/types';
import { adaptDfa } from '../../src/visualization/adapters/dfaAdapter';
import { MOCK_DFA, MOCK_DFA_WITH_SELF_LOOP } from '../fixtures/mockAutomata';

describe('adaptDfa', () => {
  it('returns an empty graph for an empty DFA', () => {
    expect(
      adaptDfa({ states: [], alphabet: [], startState: 0, acceptStates: [], transitions: [] })
    ).toEqual({ nodes: [], edges: [] });
  });

  it('maps direct states with their canonical syntax-tree positions', () => {
    const graph = adaptDfa(MOCK_DFA);
    expect(graph.nodes).toHaveLength(2);
    expect(graph.nodes[0].data).toMatchObject({ label: 'q0', isStart: true, positions: [1, 2] });
    expect(graph.nodes[1].data).toMatchObject({ label: 'q1', isAccepting: true, positions: [3] });
  });

  it('renders one edge per symbol, including parallel state pairs', () => {
    const graph = adaptDfa(MOCK_DFA);
    expect(graph.edges.map((edge) => [edge.id, edge.data.label])).toEqual([
      ['e0-1-a', 'a'],
      ['e0-1-b', 'b'],
    ]);
  });

  it('keeps DFA self-loops', () => {
    const graph = adaptDfa(MOCK_DFA_WITH_SELF_LOOP);
    expect(graph.edges).toHaveLength(1);
    expect(graph.edges[0].source).toBe(graph.edges[0].target);
  });

  it('can display omitted partial-DFA transitions as an implicit sink', () => {
    const partial: DFA = {
      states: [{ id: 0, positions: [1], isAccepting: true }],
      alphabet: ['a', 'b'],
      startState: 0,
      acceptStates: [0],
      transitions: [{ from: 0, to: 0, symbol: 'a' }],
    };
    const graph = adaptDfa(partial, { includeDeadState: true });
    expect(graph.nodes[graph.nodes.length - 1]?.data.label).toBe('qd');
    expect(graph.edges.some((edge) => edge.target === '-1' && edge.data.label === 'b')).toBe(true);
  });
});
