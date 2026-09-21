/**
 * Visualization-local types.
 *
 * OWNER: Person 2.
 *
 * These describe the graph layer only. They are DERIVED from the shared
 * contract in src/compiler/types.ts — never a replacement for it. The
 * visualization never redefines NFA/DFA/Transition; it adapts them.
 */

import type { DFA, NFA } from '../compiler/types';

/** Which automaton a graph is showing. Drives the legend and the node labels. */
export type AutomatonKind = 'nfa' | 'dfa' | 'minimized-dfa';

/** Data carried by a `StateNode` in the graph. */
export interface StateNodeData extends Record<string, unknown> {
  /** Numeric state id (STATE ID CONTRACT). */
  stateId: number;
  /** Display label, conventionally `q${stateId}`. */
  label: string;
  isStart: boolean;
  isAccepting: boolean;
  /** For DFA states: the NFA subset this state came from. Undefined for NFA nodes. */
  nfaStates?: number[];
  /** Set by the UI while animating a simulation. */
  isHighlighted?: boolean;
  /** Whether this state is currently selected in the UI. */
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
  transitions?: { from: number; to: number; symbol: string | null }[];
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

/** Props of the public `<NfaGraph />`. */
export interface NfaGraphProps extends AutomataGraphBaseProps {
  nfa: NFA | null | undefined;
}

/** Props of the public `<DfaGraph />`. Also used for the minimized DFA. */
export interface DfaGraphProps extends AutomataGraphBaseProps {
  dfa: DFA | null | undefined;
  /** Changes the legend/heading wording only. Defaults to `'dfa'`. */
  kind?: Extract<AutomatonKind, 'dfa' | 'minimized-dfa'>;
}
