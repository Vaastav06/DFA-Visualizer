/**
 * NFA -> graph adapter.
 *
 * OWNER: Person 2.
 * TODO(Person 2): implement.
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

export function adaptNfa(nfa: NFA): AdaptedGraph {
  void nfa;
  // TODO(Person 2): build nodes and merged edges per the contract above.
  return { nodes: [], edges: [] };
}
