/**
 * PUBLIC API OF THE VISUALIZATION MODULE.
 *
 * OWNER: Person 2.
 * Person 3 imports from `@/visualization` (or `src/visualization`).
 *
 * This provides interactive visualization of the Direct Regular Expression → DFA
 * construction pipeline (Dragon Book Algorithm 3.36):
 *   - SyntaxTreeGraph
 *   - DfaGraph
 *   - PositionTable
 *   - AstAnalysisTable
 *   - FollowposTable
 *   - DfaPositionMapping
 *   - Reusable GraphControls, GraphLegend, PositionBadge
 */

// Graph Components
export { SyntaxTreeGraph } from './components/SyntaxTreeGraph';
export { DfaGraph } from './components/DfaGraph';
export { AutomataGraph } from './components/AutomataGraph';
export { GraphControls } from './components/GraphControls';
export { GraphLegend } from './components/GraphLegend';
export { EmptyGraphState } from './components/EmptyGraphState';

// Deprecated compatibility export
export { NfaGraph } from './components/NfaGraph';

// Table & Badge Components
export { PositionBadge } from './components/PositionBadge';
export { PositionTable } from './components/PositionTable';
export { AstAnalysisTable } from './components/AstAnalysisTable';
export { FollowposTable } from './components/FollowposTable';
export { DfaPositionMapping } from './components/DfaPositionMapping';

// Types
export type {
  AutomatonKind,
  AutomataGraphBaseProps,
  DfaGraphProps,
  SyntaxTreeGraphProps,
  NfaGraphProps,
  GraphHighlight,
  StateNodeData,
  SyntaxTreeNodeData,
  TransitionEdgeData,
} from './types';
