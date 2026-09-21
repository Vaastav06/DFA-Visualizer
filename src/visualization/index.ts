/**
 * PUBLIC API OF THE VISUALIZATION MODULE.
 *
 * Person 3 imports from `@/visualization` and from nothing deeper.
 * Everything else under src/visualization/ is private to Person 2.
 *
 * Adding or removing an export here is a contract change: announce it, and
 * update docs/VISUALIZATION_SPEC.md in the same commit.
 *
 *   import { NfaGraph, DfaGraph } from '@/visualization';
 */

export { NfaGraph } from './components/NfaGraph';
export { DfaGraph } from './components/DfaGraph';

export type {
  AutomatonKind,
  DfaGraphProps,
  GraphHighlight,
  NfaGraphProps,
  StateNodeData,
  TransitionEdgeData,
} from './types';

/*
 * Intentionally NOT exported — internals owned by Person 2:
 *   AutomataGraph, StateNode, TransitionEdge, GraphControls, GraphLegend,
 *   EmptyGraphState, adaptNfa, adaptDfa, layoutAutomaton
 * They may be imported directly by tests in tests/visualization/ only.
 */
