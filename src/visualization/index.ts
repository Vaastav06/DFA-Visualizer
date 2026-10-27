/**
 * PUBLIC API OF THE VISUALIZATION MODULE.
 *
 * Consumed by the UI layer via `@/visualization` (or `src/visualization`).
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

// Table & Badge Components
export { PositionBadge } from './components/PositionBadge';
export { PositionTable } from './components/PositionTable';
export { AstAnalysisTable } from './components/AstAnalysisTable';
export { FollowposTable } from './components/FollowposTable';
export { DfaPositionMapping } from './components/DfaPositionMapping';

// Types & Constants
export { DEAD_STATE_ID } from './types';
export type {
  AutomatonKind,
  AutomataGraphBaseProps,
  DfaGraphProps,
  SyntaxTreeGraphProps,
  GraphHighlight,
  StateNodeData,
  SyntaxTreeNodeData,
  TransitionEdgeData,
} from './types';
