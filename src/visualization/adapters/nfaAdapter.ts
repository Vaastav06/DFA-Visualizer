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

import type { NFA } from '../../compiler/types';
import { EPSILON, EPSILON_DISPLAY } from '../../compiler/types';
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

function formatStateLabel(id: number): string {
  return `q${id}`;
}

function formatEdgeLabel(symbols: (string | null)[]): string {
  return symbols
    .map(s => (s === EPSILON ? EPSILON_DISPLAY : s))
    .join(', ');
}

function isEpsilonSymbol(symbol: string | null): boolean {
  return symbol === EPSILON;
}

function edgeKey(from: number, to: number): string {
  return `${from}->${to}`;
}

export function adaptNfa(nfa: NFA): AdaptedGraph {
  // Build nodes
  const nodes: GraphNode[] = nfa.states.map(id => ({
    id: String(id),
    data: {
      stateId: id,
      label: formatStateLabel(id),
      isStart: id === nfa.startState,
      isAccepting: nfa.acceptStates.includes(id),
    },
  }));

  // Group transitions by (from, to) to merge parallel edges
  const edgeMap = new Map<string, { from: number; to: number; symbols: (string | null)[] }>();

  for (const t of nfa.transitions) {
    const key = edgeKey(t.from, t.to);
    if (!edgeMap.has(key)) {
      edgeMap.set(key, { from: t.from, to: t.to, symbols: [] });
    }
    edgeMap.get(key)!.symbols.push(t.symbol);
  }

  // Build edges
  const edges: GraphEdge[] = Array.from(edgeMap.values()).map(edge => {
    const symbols = edge.symbols;
    const isEpsilon = symbols.some(isEpsilonSymbol);
    const label = formatEdgeLabel(symbols);

    return {
      id: `e-${edge.from}-${edge.to}`,
      source: String(edge.from),
      target: String(edge.to),
      data: {
        symbols,
        label,
        isEpsilon,
      },
    };
  });

  return { nodes, edges };
}
