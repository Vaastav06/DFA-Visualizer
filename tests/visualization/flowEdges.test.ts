/**
 * Tests for the adapted-graph -> React Flow edge step: routing is attached,
 * simulation highlighting survives rerouting, nothing is added or dropped.
 *
 */

import { describe, expect, it } from 'vitest';
import { compileRegex } from '../../src/compiler';
import { adaptDfa } from '../../src/visualization/adapters/dfaAdapter';
import { buildFlowEdges, routeGraph } from '../../src/visualization/adapters/flowEdges';
import { layoutAutomaton } from '../../src/visualization/layout/graphLayout';
import { MOCK_DFA } from '../fixtures/mockAutomata';
import type { DFA } from '../../src/compiler/types';
import { GRAPH_COLORS } from '../../src/visualization/graphColors';

function prepare(dfa: DFA) {
  const graph = adaptDfa(dfa);
  const layout = layoutAutomaton(
    dfa.states.map((s) => s.id),
    dfa.transitions,
    dfa.startState
  );
  const routing = routeGraph(graph, (_id, stateId) => layout.get(stateId)!);
  return { graph, layout, routing };
}

describe('buildFlowEdges', () => {
  it('attaches a routed path to every edge, one React Flow edge per transition', () => {
    const { graph, routing } = prepare(MOCK_DFA);
    const edges = buildFlowEdges(graph, routing);

    expect(edges).toHaveLength(MOCK_DFA.transitions.length);
    expect(new Set(edges.map((e) => e.id)).size).toBe(edges.length);
    for (const e of edges) {
      expect(e.type).toBe('transition');
      expect(e.data?.route?.path).toMatch(/^M /);
      expect(e.markerEnd).toMatchObject({ type: 'arrowclosed' });
    }
  });

  it('preserves source, target and symbol of every transition', () => {
    const dfa = compileRegex('(a|b)*abb').dfa;
    const { graph, routing } = prepare(dfa);
    const edges = buildFlowEdges(graph, routing);

    const fromEdges = edges.map((e) => `${e.source}-${e.data!.symbols[0]}->${e.target}`).sort();
    const fromDfa = dfa.transitions.map((t) => `${t.from}-${t.symbol}->${t.to}`).sort();
    expect(fromEdges).toEqual(fromDfa);
  });

  it('highlights exactly the simulated transition, with its rerouted geometry intact', () => {
    const dfa = compileRegex('(a|b)*abb').dfa;
    const { graph, routing } = prepare(dfa);
    const back = dfa.transitions.find((t) => t.from > t.to && t.from !== t.to)!;

    const plain = buildFlowEdges(graph, routing);
    const lit = buildFlowEdges(graph, routing, undefined, back);

    const highlighted = lit.filter((e) => e.data?.isHighlighted);
    expect(highlighted).toHaveLength(1);
    expect(highlighted[0].source).toBe(String(back.from));
    expect(highlighted[0].target).toBe(String(back.to));
    expect(highlighted[0].data!.symbols).toEqual([back.symbol]);
    expect(highlighted[0].zIndex).toBe(1);
    expect(highlighted[0].markerEnd).toMatchObject({ color: GRAPH_COLORS.edgeHighlight });

    // Highlighting never changes geometry.
    for (let i = 0; i < lit.length; i += 1) {
      expect(lit[i].data?.route).toEqual(plain[i].data?.route);
    }
  });

  it('highlights via the GraphHighlight overlay as well', () => {
    const { graph, routing } = prepare(MOCK_DFA);
    const t = MOCK_DFA.transitions[0];
    const lit = buildFlowEdges(graph, routing, {
      transitions: [{ from: t.from, to: t.to, symbol: t.symbol }],
    });
    expect(lit.filter((e) => e.data?.isHighlighted)).toHaveLength(1);
  });

  it('does not highlight a parallel sibling with a different symbol', () => {
    const dfa: DFA = {
      states: [
        { id: 0, positions: [1], isAccepting: false },
        { id: 1, positions: [2], isAccepting: true },
      ],
      alphabet: ['a', 'b'],
      startState: 0,
      acceptStates: [1],
      transitions: [
        { from: 0, to: 1, symbol: 'a' },
        { from: 0, to: 1, symbol: 'b' },
      ],
    };
    const { graph, routing } = prepare(dfa);
    const lit = buildFlowEdges(graph, routing, undefined, { from: 0, to: 1, symbol: 'b' });
    expect(lit.find((e) => e.id === 'e0-1-a')!.data!.isHighlighted).toBe(false);
    expect(lit.find((e) => e.id === 'e0-1-b')!.data!.isHighlighted).toBe(true);
    expect(lit[0].data!.route!.path).not.toBe(lit[1].data!.route!.path);
  });

  it('re-routes from dragged positions, keeping other edges deterministic', () => {
    const dfa = compileRegex('(a|b)*abb').dfa;
    const { graph, layout, routing } = prepare(dfa);
    const again = routeGraph(graph, (_id, stateId) => layout.get(stateId)!);
    expect([...again.routes.entries()]).toEqual([...routing.routes.entries()]);

    const moved = routeGraph(graph, (id, stateId) => {
      const p = layout.get(stateId)!;
      return id === '0' ? { x: p.x, y: p.y + 200 } : p;
    });
    const touchesQ0 = graph.edges.filter((e) => e.source === '0' || e.target === '0');
    for (const e of touchesQ0) {
      expect(moved.routes.get(e.id)!.path).not.toBe(routing.routes.get(e.id)!.path);
    }
  });

  it('does not mutate the adapted graph', () => {
    const { graph, routing } = prepare(MOCK_DFA);
    const snapshot = structuredClone(graph);
    buildFlowEdges(graph, routing, undefined, { from: 0, to: 1, symbol: 'a' });
    expect(graph).toEqual(snapshot);
  });
});
