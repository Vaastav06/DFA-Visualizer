/**
 * DFA -> graph adapter.
 *
 * OWNER: Person 2.
 *
 * CONTRACT: translates the shared `DFA` contract into the node/edge data the
 * graph components render.
 *
 * Rules:
 *  - a DFA has NO epsilon transitions; if `symbol === null` appears, surface
 *    an error
 *  - each transition becomes its OWN edge (`e{from}-{to}-{symbol}`); parallel
 *    transitions are NOT merged — the graph offsets them visually instead
 *  - each node carries `positions` (syntax-tree leaf positions, e.g. [1, 2, 3])
 *  - `nfaStates` is preserved as a deprecated backwards-compatibility alias
 */

import type { DFA } from '../../compiler/types';
import type { AdaptedGraph, GraphEdge, GraphNode } from './nfaAdapter';

export function adaptDfa(dfa: DFA): AdaptedGraph {
  if (!dfa || !Array.isArray(dfa.states) || dfa.states.length === 0) {
    return { nodes: [], edges: [] };
  }

  const acceptSet = new Set(dfa.acceptStates ?? []);

  const nodes: GraphNode[] = dfa.states.map((state) => {
    const positions = state.positions ?? state.nfaStates ?? [];

    return {
      id: String(state.id),
      data: {
        stateId: state.id,
        label: `q${state.id}`,
        isStart: state.id === dfa.startState,
        isAccepting: state.isAccepting || acceptSet.has(state.id),
        positions: [...positions],
        nfaStates: state.nfaStates ? [...state.nfaStates] : [...positions],
      },
    };
  });

  // One edge per transition. Parallel (from, to) pairs stay separate so each
  // symbol gets its own curve and label; AutomataGraph offsets them visually.
  const edges: GraphEdge[] = [];
  const seen = new Set<string>();

  for (const transition of dfa.transitions ?? []) {
    if (transition.symbol === null) {
      throw new Error(
        `Invalid DFA transition from q${transition.from} to q${transition.to}: DFA cannot contain epsilon transitions (symbol is null).`
      );
    }

    const key = `${transition.from}->${transition.to}->${transition.symbol}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);

    edges.push({
      id: `e${transition.from}-${transition.to}-${transition.symbol}`,
      source: String(transition.from),
      target: String(transition.to),
      data: {
        symbols: [transition.symbol],
        label: transition.symbol,
        isEpsilon: false,
      },
    });
  }

  return { nodes, edges };
}

export type { AdaptedGraph, GraphEdge, GraphNode } from './nfaAdapter';
