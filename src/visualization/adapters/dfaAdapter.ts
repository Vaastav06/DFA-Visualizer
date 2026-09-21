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
import type { AdaptedGraph, GraphEdge, GraphNode } from './nfaAdapter';

export function adaptDfa(dfa: DFA): AdaptedGraph {
  if (!dfa || !Array.isArray(dfa.states) || dfa.states.length === 0) {
    return { nodes: [], edges: [] };
  }

  const acceptSet = new Set(dfa.acceptStates ?? []);

  const nodes: GraphNode[] = dfa.states.map((state) => ({
    id: String(state.id),
    data: {
      stateId: state.id,
      label: `q${state.id}`,
      isStart: state.id === dfa.startState,
      isAccepting: state.isAccepting || acceptSet.has(state.id),
      nfaStates: state.nfaStates ? [...state.nfaStates] : undefined,
    },
  }));

  // Merge parallel transitions between the same (from, to) state pair
  const edgeMap = new Map<string, { from: number; to: number; symbols: string[] }>();

  for (const transition of dfa.transitions ?? []) {
    if (transition.symbol === null) {
      throw new Error(
        `Invalid DFA transition from q${transition.from} to q${transition.to}: DFA cannot contain epsilon transitions (symbol is null).`
      );
    }

    const key = `${transition.from}->${transition.to}`;
    const existing = edgeMap.get(key);
    if (existing) {
      if (!existing.symbols.includes(transition.symbol)) {
        existing.symbols.push(transition.symbol);
      }
    } else {
      edgeMap.set(key, {
        from: transition.from,
        to: transition.to,
        symbols: [transition.symbol],
      });
    }
  }

  const edges: GraphEdge[] = Array.from(edgeMap.values()).map(({ from, to, symbols }) => {
    const sortedSymbols = [...symbols].sort((a, b) => a.localeCompare(b));
    const label = sortedSymbols.join(', ');

    return {
      id: `e${from}-${to}`,
      source: String(from),
      target: String(to),
      data: {
        symbols: sortedSymbols,
        label,
        isEpsilon: false,
      },
    };
  });

  return { nodes, edges };
}

export type { AdaptedGraph, GraphEdge, GraphNode } from './nfaAdapter';
