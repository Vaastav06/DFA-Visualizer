/**
 * SHARED DATA CONTRACT — owned jointly by Persons 1, 2 and 3.
 *
 * This file is the single source of truth for every structure that crosses a
 * module boundary (compiler -> visualization, compiler -> UI, UI -> visualization).
 *
 * CHANGING THIS FILE REQUIRES TEAM AGREEMENT.
 * Any change here must be mirrored in docs/DATA_CONTRACTS.md in the same commit.
 *
 * Two contracts are permanent and must never be worked around:
 *
 *   EPSILON CONTRACT   internally `null`, displayed as `ε`.
 *                      `transition.symbol === null` means epsilon. Never use
 *                      "ε", "epsilon", "E", "EPSILON" or "" as internal values.
 *
 *   STATE ID CONTRACT  state ids are plain non-negative integers (0, 1, 2, ...).
 *                      The UI may render them as `q0`, `q1`, ... but the data
 *                      stays numeric. Never store "q0" as an id.
 *
 * See docs/DATA_CONTRACTS.md and docs/DECISIONS.md.
 */

/**
 * A single input symbol of the alphabet. Always exactly one character in the
 * current regex specification (see docs/REGEX_SPECIFICATION.md).
 *
 * Note: this shadows the global `Symbol` type inside modules that import it.
 * Prefer `AlphabetSymbol` in new code; both are the same type.
 */
export type Symbol = string;

/** Preferred, non-shadowing alias for {@link Symbol}. */
export type AlphabetSymbol = Symbol;

/** The internal representation of an epsilon (empty-string) transition. */
export type Epsilon = null;

/** The value used for epsilon everywhere inside the compiler. */
export const EPSILON: Epsilon = null;

/** The glyph used to display epsilon in the UI and in graphs. Never stored as data. */
export const EPSILON_DISPLAY = 'ε';

/**
 * A directed, labelled edge between two states.
 * `symbol === null` is an epsilon transition (NFA only — a DFA has none).
 */
export interface Transition {
  from: number;
  to: number;
  symbol: string | null;
}

/**
 * A non-deterministic finite automaton with epsilon transitions
 * (the output of Thompson's construction).
 *
 * Invariants:
 *  - `startState` is in `states`
 *  - every id in `acceptStates` is in `states`
 *  - every `from`/`to` in `transitions` is in `states`
 *  - `alphabet` never contains `null` — epsilon is not part of the alphabet
 */
export interface NFA {
  states: number[];
  alphabet: string[];
  startState: number;
  acceptStates: number[];
  transitions: Transition[];
}

/**
 * Syntax tree node types for direct regular expression to DFA construction.
 */
export type SyntaxNodeType = 'symbol' | 'union' | 'concat' | 'star';

/**
 * A node in the augmented syntax tree.
 */
export interface SyntaxNode {
  id: number;
  type: SyntaxNodeType;
  symbol?: string;
  position?: number;
  left?: SyntaxNode;
  right?: SyntaxNode;
  nullable: boolean;
  firstpos: number[];
  lastpos: number[];
}

/**
 * An entry in the leaf position table.
 */
export interface PositionInfo {
  position: number;
  symbol: string;
}

/**
 * Analysis summary for a syntax node or tree root.
 */
export interface SyntaxAnalysis {
  nullable: boolean;
  firstpos: number[];
  lastpos: number[];
}

/**
 * Per-node analysis entry.
 */
export interface NodeAnalysis {
  nodeId: number;
  nullable: boolean;
  firstpos: number[];
  lastpos: number[];
}

/**
 * An entry in the followpos table for a leaf position.
 */
export interface FollowPosEntry {
  position: number;
  symbol: string;
  followpos: number[];
}

/**
 * One state of a DFA.
 *
 * In the direct RE -> DFA construction, `positions` records the canonical,
 * sorted subset of syntax-tree leaf positions this state represents.
 */
export interface DFAState {
  id: number;
  /** Authoritative syntax-tree leaf positions represented by this DFA state. */
  positions: number[];
  /**
   * @deprecated
   * Legacy compatibility alias. Must always equal `positions`.
   */
  nfaStates?: number[];
  isAccepting: boolean;
}

/**
 * A deterministic finite automaton.
 *
 * Invariants:
 *  - `transitions` contains no epsilon (`symbol` is never `null`)
 *  - for each state and each symbol of `alphabet` there is at most one
 *    transition (partial DFA: missing transition means reject)
 *  - `acceptStates` agrees with `states[i].isAccepting`
 */
export interface DFA {
  states: DFAState[];
  alphabet: string[];
  startState: number;
  acceptStates: number[];
  transitions: Transition[];
}

/** Stable identifiers for the pipeline stages the UI can step through. */
export type CompilationStepId =
  | 'input'
  | 'tokens'
  | 'concatenation'
  | 'postfix'
  | 'syntaxTree'
  | 'followpos'
  | 'dfa'
  | 'minimized'
  | 'simulation'
  | 'nfa';

/**
 * A human-readable description of one pipeline stage, produced by the compiler
 * so the UI does not have to hard-code explanatory prose.
 */
export interface CompilationStep {
  id: string;
  title: string;
  description: string;
}

/**
 * The complete result of compiling one regular expression.
 * This is the ONLY value the compiler hands to the rest of the application.
 */
export interface CompilationResult {
  /** The regex exactly as the user typed it. */
  input: string;
  /** Tokens produced by the tokenizer, in order. */
  tokens: string[];
  /** The expression with explicit `.` concatenation operators inserted. */
  explicitConcatenation: string;
  /** The postfix (reverse Polish) form produced by the shunting-yard pass. */
  postfix: string;
  /** Augmented syntax tree rooted with concatenation to end-marker #. */
  syntaxTree: SyntaxNode;
  /** Leaf positions assigned left-to-right to symbols and the end-marker. */
  positions: PositionInfo[];
  /** Analysis (nullable, firstpos, lastpos) of the syntax tree root. */
  analysis: SyntaxAnalysis;
  /** Complete followpos table for every leaf position. */
  followpos: FollowPosEntry[];
  /** DFA directly constructed from syntax tree position sets. */
  dfa: DFA;
  /** DFA after minimization. */
  minimizedDfa: DFA;
  /** Ordered explanations of each stage, for the UI's step navigation. */
  steps: CompilationStep[];
  /**
   * @deprecated
   * Legacy NFA field retained for fixture compatibility.
   * Not produced by direct RE -> DFA compilation.
   */
  nfa?: NFA;
}

/* ------------------------------------------------------------------ */
/* String simulation                                                   */
/* ------------------------------------------------------------------ */

/** One step of running an input string through a DFA. */
export interface SimulationStep {
  /** Index of the consumed character within the input string. */
  index: number;
  /** The consumed character. */
  symbol: string;
  /** State before consuming `symbol`. */
  fromState: number;
  /**
   * State after consuming `symbol`, or `null` when the DFA has no transition
   * for this symbol (the string is rejected at this point).
   */
  toState: number | null;
}

/** The outcome of running an input string through a DFA. */
export interface SimulationResult {
  /** The string that was simulated. */
  input: string;
  /** Whether the DFA ended in an accepting state having consumed the whole input. */
  accepted: boolean;
  /** One entry per consumed character, in order. */
  steps: SimulationStep[];
  /**
   * The states visited, starting with the DFA's start state. Length is
   * `steps.length + 1` unless the run was rejected early.
   */
  path: number[];
  /** Total characters consumed before accepting or halting early. */
  consumed: number;
  /** Description of rejection or error reason, if any. */
  error?: string;
  /** Populated when the run stopped early (symbol outside the alphabet, or no transition). */
  rejectedAt?: number;
}
