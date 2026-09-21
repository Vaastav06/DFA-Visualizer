/**
 * DFA -> graph adapter.
 *
 * OWNER: Person 2.
 * TODO(Person 2): implement.
 *
 * CONTRACT: as `nfaAdapter`, with two differences:
 *  - a DFA has NO epsilon transitions; if `symbol === null` appears, that is a
 *    compiler bug — surface it, do not silently draw `ε`
 *  - each node carries `nfaStates` so the UI can show the subset-construction
 *    mapping (e.g. `q2 = {1, 3, 4}`) in a tooltip
 */

import type { DFA } from '../../compiler/types';
import type { AdaptedGraph } from './nfaAdapter';

export function adaptDfa(dfa: DFA): AdaptedGraph {
  void dfa;
  // TODO(Person 2): build nodes (with nfaStates) and merged edges.
  return { nodes: [], edges: [] };
}

export type { AdaptedGraph, GraphEdge, GraphNode } from './nfaAdapter';
