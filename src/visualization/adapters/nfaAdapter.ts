/**
 * NFA -> graph adapter.
 *
 * OWNER: Person 2.
 *
 * CONTRACT: translates the shared `NFA` contract into the node/edge data the
 * graph components render. This is the ONLY place the visualization is allowed
 * to know about the shape of an `NFA`.
 *
 * Rules:
 *  - one node per state, labelled `q${id}`
 *  - `isStart` for `nfa.startState`, `isAccepting` for `nfa.acceptStates`
 *  - transitions with the same (from, to) merge into ONE edge whose
 *    `symbols` array holds every label
 *  - `symbol === null` is epsilon; render it as `ε` (EPSILON_DISPLAY), and set
 *    `isEpsilon` so the edge can be styled as a dashed line
 */

import { EPSILON_DISPLAY, type NFA } from '../../compiler/types';
import type { StateNodeData, TransitionEdgeData } from '../types';

/** A node ready to be handed to the graph renderer. */
export interface GraphNode {
  id: string;
  data: StateNodeData;
}

/** An edge ready to be handed to the graph renderer. */
export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  data: TransitionEdgeData;
}

/** The adapter output consumed by `<NfaGraph />`. */
export interface AdaptedGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

/** Format a single transition symbol for display, converting null to the epsilon glyph. */
export function formatTransitionSymbol(symbol: string | null): string {
  return symbol === null ? EPSILON_DISPLAY : symbol;
}

export function adaptNfa(nfa: NFA): AdaptedGraph {
  if (!nfa || !Array.isArray(nfa.states) || nfa.states.length === 0) {
    return { nodes: [], edges: [] };
  }

  const acceptSet = new Set(nfa.acceptStates ?? []);

  const nodes: GraphNode[] = nfa.states.map((stateId) => ({
    id: String(stateId),
    data: {
      stateId,
      label: `q${stateId}`,
      isStart: stateId === nfa.startState,
      isAccepting: acceptSet.has(stateId),
    },
  }));

  // Merge parallel transitions between the same (from, to) state pair
  const edgeMap = new Map<string, { from: number; to: number; symbols: (string | null)[] }>();

  for (const transition of nfa.transitions ?? []) {
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
    // Deterministically sort symbols: letters alphabetically, epsilon (null) at the end
    const sortedSymbols = [...symbols].sort((a, b) => {
      if (a === null) return 1;
      if (b === null) return -1;
      return a.localeCompare(b);
    });

    const isEpsilon = sortedSymbols.every((s) => s === null);
    const label = sortedSymbols.map(formatTransitionSymbol).join(', ');

    return {
      id: `e${from}-${to}`,
      source: String(from),
      target: String(to),
      data: {
        symbols: sortedSymbols,
        label,
        isEpsilon,
      },
    };
  });

  return { nodes, edges };
}
