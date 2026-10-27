/**
 * DFA to graph adapter. Each partial-DFA transition is drawn as its own edge.
 */
import type { DFA } from '../../compiler/types';
import { DEAD_STATE_ID } from '../types';
import type { AdaptedGraph, GraphEdge, GraphNode } from './graphTypes';

export interface AdaptDfaOptions {
  includeDeadState?: boolean;
}

export function adaptDfa(dfa: DFA, options: AdaptDfaOptions = {}): AdaptedGraph {
  if (!dfa || !Array.isArray(dfa.states) || dfa.states.length === 0)
    return { nodes: [], edges: [] };
  const acceptSet = new Set(dfa.acceptStates);
  const nodes: GraphNode[] = dfa.states.map((state) => ({
    id: String(state.id),
    data: {
      stateId: state.id,
      label: `q${state.id}`,
      isStart: state.id === dfa.startState,
      isAccepting: state.isAccepting || acceptSet.has(state.id),
      positions: [...state.positions],
    },
  }));
  const edges: GraphEdge[] = [];
  const seen = new Set<string>();
  for (const transition of dfa.transitions) {
    const key = `${transition.from}->${transition.to}->${transition.symbol}`;
    if (seen.has(key)) continue;
    seen.add(key);
    edges.push({
      id: `e${transition.from}-${transition.to}-${transition.symbol}`,
      source: String(transition.from),
      target: String(transition.to),
      data: { symbols: [transition.symbol], label: transition.symbol },
    });
  }

  if (options.includeDeadState) {
    const present = new Set(dfa.transitions.map((t) => `${t.from}->${t.symbol}`));
    const missing = dfa.states.some((state) =>
      dfa.alphabet.some((symbol) => !present.has(`${state.id}->${symbol}`))
    );
    if (missing) {
      nodes.push({
        id: String(DEAD_STATE_ID),
        data: {
          stateId: DEAD_STATE_ID,
          label: 'qd',
          isStart: false,
          isAccepting: false,
          isDeadState: true,
          positions: [],
        },
      });
      for (const state of dfa.states)
        for (const symbol of dfa.alphabet) {
          if (!present.has(`${state.id}->${symbol}`))
            edges.push({
              id: `e${state.id}-${DEAD_STATE_ID}-${symbol}`,
              source: String(state.id),
              target: String(DEAD_STATE_ID),
              data: { symbols: [symbol], label: symbol },
            });
        }
      for (const symbol of dfa.alphabet)
        edges.push({
          id: `e${DEAD_STATE_ID}-${DEAD_STATE_ID}-${symbol}`,
          source: String(DEAD_STATE_ID),
          target: String(DEAD_STATE_ID),
          data: { symbols: [symbol], label: symbol },
        });
    }
  }
  return { nodes, edges };
}
export type { AdaptedGraph, GraphEdge, GraphNode } from './graphTypes';
