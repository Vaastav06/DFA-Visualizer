/**
 * Visualization-local types.
 *
 * OWNER: Person 2.
 *
 * These describe the graph layer only. They are DERIVED from the shared
 * contract in src/compiler/types.ts — never a replacement for it. The
 * visualization never redefines SyntaxNode/DFA/Transition; it adapts them.
 */

import type { DFA, NFA, SyntaxNode, SyntaxNodeType } from '../compiler/types';

/** Which automaton or diagram a graph is showing. */
export type AutomatonKind = 'nfa' | 'dfa' | 'minimized-dfa' | 'syntax-tree';

/** Data carried by a `StateNode` in the DFA graph. */
export interface StateNodeData extends Record<string, unknown> {
  /** Numeric state id (STATE ID CONTRACT). */
  stateId: number;
  /** Display label, conventionally `q${stateId}`. */
  label: string;
  isStart: boolean;
  isAccepting: boolean;
  /**
   * Authoritative syntax-tree leaf positions represented by this DFA state.
   * e.g., [1, 2, 3] for q0.
   */
  positions?: number[];
  /**
   * @deprecated
   * Legacy compatibility alias for `positions`.
   */
  nfaStates?: number[];
  /** Set by the UI while animating a simulation or step. */
  isHighlighted?: boolean;
  /** Whether this state is currently the active simulation state. */
  isActive?: boolean;
  /** Whether this state is currently selected in the UI. */
  isSelected?: boolean;
}

/** Data carried by a `SyntaxTreeNode` in the syntax tree graph. */
export interface SyntaxTreeNodeData extends Record<string, unknown> {
  /** Unique numeric node id. */
  nodeId: number;
  /** Operator or symbol type. */
  type: SyntaxNodeType;
  /** Rendered node label, e.g. `|`, `.`, `*`, `a`, or `#`. */
  label: string;
  /** Alphabet symbol if a leaf node. */
  symbol?: string;
  /** 1-based leaf position if assigned. */
  position?: number;
  /** Whether the subtree can match the empty string. */
  nullable: boolean;
  /** Set of first positions that can match in this subtree. */
  firstpos: number[];
  /** Set of last positions that can match in this subtree. */
  lastpos: number[];
  /** Whether this node represents the augmented end-marker `#`. */
  isEndMarker?: boolean;
  /** Whether this node is highlighted (e.g. followpos position inspection). */
  isHighlighted?: boolean;
  /** Whether this node is selected. */
  isSelected?: boolean;
}

/** Data carried by a `TransitionEdge` in the graph. */
export interface TransitionEdgeData extends Record<string, unknown> {
  /**
   * Symbols this edge carries. Parallel transitions between the same pair of
   * states are merged into one edge labelled `a, b`.
   * Epsilon is stored as `null` and rendered as `ε` (EPSILON CONTRACT).
   */
  symbols: (string | null)[];
  /** The rendered label, e.g. `a, b` or `ε`. */
  label: string;
  isEpsilon: boolean;
  /** Set by the UI while animating a simulation. */
  isHighlighted?: boolean;
}

/** Highlighting a graph can apply while the UI animates a simulation run. */
export interface GraphHighlight {
  /** State ids to emphasise. */
  states?: number[];
  /** Transitions to emphasise. */
  transitions?: { from: number; to: number; symbol?: string | null }[];
}

/** Props shared by every public graph component. */
export interface AutomataGraphBaseProps {
  /** Optional highlight overlay, used by the string simulator. */
  highlight?: GraphHighlight;
  /** Height of the graph container. Defaults to a CSS variable. */
  height?: number | string;
  /** Extra class name on the wrapper element. */
  className?: string;
  /** Optional state selection callback. */
  onStateClick?: (stateId: number, data: StateNodeData) => void;
  /** Optional selected state id to show selected visual state. */
  selectedStateId?: number | null;
}

/** Props of the public `<DfaGraph />`. Also used for the minimized DFA. */
export interface DfaGraphProps extends AutomataGraphBaseProps {
  dfa: DFA | null | undefined;
  /** Changes the legend/heading wording only. Defaults to `'dfa'`. */
  kind?: Extract<AutomatonKind, 'dfa' | 'minimized-dfa'>;
  /** Directly sets the active state during simulation step playback. */
  activeStateId?: number | null;
  /** States to highlight in simulation path or followpos inspections. */
  highlightedStateIds?: number[];
  /** Transition currently active in simulation. */
  highlightedTransition?: { from: number; to: number; symbol?: string | null } | null;
}

/** Props of the public `<SyntaxTreeGraph />`. */
export interface SyntaxTreeGraphProps {
  tree: SyntaxNode | null | undefined;
  /** Height of the graph container. Defaults to `--graph-height`. */
  height?: number | string;
  /** Extra class name on the wrapper element. */
  className?: string;
  /** Positions to highlight (e.g. when inspecting a followpos row). */
  highlightedPositions?: number[];
  /** Node selection callback. */
  onNodeClick?: (nodeId: number, data: SyntaxTreeNodeData) => void;
  /** Selected node id. */
  selectedNodeId?: number | null;
}

/** Props of the public `<NfaGraph />` (deprecated compatibility export). */
export interface NfaGraphProps extends AutomataGraphBaseProps {
  nfa: NFA | null | undefined;
}
