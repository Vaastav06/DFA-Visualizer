/**
 * DFA -> graph adapter.
 *
 * OWNER: Person 2.
 *
 * CONTRACT: as `nfaAdapter`, with two differences:
 *  - a DFA has NO epsilon transitions; if `symbol === null` appears, that is a
 *    compiler bug — surface it, do not silently draw `ε`
 *  - each node carries `nfaStates` so the UI can show the subset-construction
 *    mapping (e.g. `q2 = {1, 3, 4}`) in a tooltip
 */

import type { DFA } from '../../compiler/types';
import { EPSILON } from '../../compiler/types';
import type { AdaptedGraph, GraphNode, GraphEdge } from './nfaAdapter';

function formatStateLabel(id: number): string {
  return `q${id}`;
}

function formatEdgeLabel(symbols: string[]): string {
  return symbols.join(', ');
}

function edgeKey(from: number, to: number): string {
  return `${from}->${to}`;
}

export function adaptDfa(dfa: DFA): AdaptedGraph {
  // Build nodes with nfaStates for subset construction mapping
  const nodes: GraphNode[] = dfa.states.map(state => ({
    id: String(state.id),
    data: {
      stateId: state.id,
      label: formatStateLabel(state.id),
      isStart: state.id === dfa.startState,
      isAccepting: state.isAccepting,
      nfaStates: state.nfaStates,
    },
  }));

  // Group transitions by (from, to) to merge parallel edges
  const edgeMap = new Map<string, { from: number; to: number; symbols: string[] }>();

  for (const t of dfa.transitions) {
    // DFA should never have epsilon transitions
    if (t.symbol === EPSILON) {
      throw new Error('Internal compiler error: DFA contains epsilon transition. This is a bug in subset construction.');
    }

    const key = edgeKey(t.from, t.to);
    if (!edgeMap.has(key)) {
      edgeMap.set(key, { from: t.from, to: t.to, symbols: [] });
    }
    edgeMap.get(key)!.symbols.push(t.symbol);
  }

  // Build edges
  const edges: GraphEdge[] = Array.from(edgeMap.values()).map(edge => {
    const symbols = edge.symbols;
    const label = formatEdgeLabel(symbols);

    return {
      id: `e-${edge.from}-${edge.to}`,
      source: String(edge.from),
      target: String(edge.to),
      data: {
        symbols,
        label,
        isEpsilon: false,
      },
    };
  });

  return { nodes, edges };
}

export type { AdaptedGraph, GraphEdge, GraphNode } from './nfaAdapter';
