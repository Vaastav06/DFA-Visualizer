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
import { DEAD_STATE_ID } from '../types';
import type { AdaptedGraph, GraphEdge, GraphNode } from './nfaAdapter';

export interface AdaptDfaOptions {
  /**
   * If true and the DFA has missing transitions on symbols in `dfa.alphabet`,
   * a visual dead/trap state (`qd`) is included with all missing transitions
   * routed to it and a self-loop on all alphabet symbols.
   */
  includeDeadState?: boolean;
}

export function adaptDfa(dfa: DFA, options?: AdaptDfaOptions): AdaptedGraph {
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

  // Synthesize visual dead / trap state (qd) if requested and missing transitions exist
  if (options?.includeDeadState) {
    const alphabet = dfa.alphabet ?? [];
    const transitionSet = new Set((dfa.transitions ?? []).map((t) => `${t.from}:${t.symbol}`));

    const missingTransitionsByState = new Map<number, string[]>();
    for (const state of dfa.states) {
      const missing = alphabet.filter((symbol) => !transitionSet.has(`${state.id}:${symbol}`));
      if (missing.length > 0) {
        missingTransitionsByState.set(state.id, missing);
      }
    }

    if (missingTransitionsByState.size > 0) {
      nodes.push({
        id: String(DEAD_STATE_ID),
        data: {
          stateId: DEAD_STATE_ID,
          label: 'qd',
          isStart: false,
          isAccepting: false,
          isDeadState: true,
          positions: [],
          nfaStates: [],
        },
      });

      for (const [stateId, missingSymbols] of missingTransitionsByState.entries()) {
        edges.push({
          id: `e${stateId}-${DEAD_STATE_ID}`,
          source: String(stateId),
          target: String(DEAD_STATE_ID),
          data: {
            symbols: [...missingSymbols],
            label: missingSymbols.join(', '),
            isEpsilon: false,
          },
        });
      }

      // Self-loop on dead state for all alphabet symbols
      if (alphabet.length > 0) {
        edges.push({
          id: `e${DEAD_STATE_ID}-${DEAD_STATE_ID}`,
          source: String(DEAD_STATE_ID),
          target: String(DEAD_STATE_ID),
          data: {
            symbols: [...alphabet],
            label: alphabet.join(', '),
            isEpsilon: false,
          },
        });
      }
    }
  }

  return { nodes, edges };
}

export type { AdaptedGraph, GraphEdge, GraphNode } from './nfaAdapter';
