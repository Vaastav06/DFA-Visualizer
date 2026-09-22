/**
 * Mock automata for development and tests.
 *
 * WHY THIS EXISTS: Person 2 and Person 3 must be able to build graphs, tables
 * and the simulator UI before Person 1's compiler works. Import these fixtures
 * instead of calling `compileRegex`.
 *
 * These values conform exactly to the shared contract in src/compiler/types.ts.
 * If that contract changes, these fixtures must change in the same commit — a
 * type error here is the early warning that a contract broke.
 *
 * They are hand-written illustrations of the RIGHT SHAPE. They are NOT a
 * specification of what Person 1's compiler must output for these expressions,
 * so never assert `compileRegex('a|b')` deep-equals `MOCK_NFA`.
 *
 *   import { MOCK_NFA, MOCK_DFA, MOCK_MINIMIZED_DFA } from '@fixtures/mockAutomata';
 */

import type { CompilationResult, DFA, NFA } from '../../src/compiler/types';

/**
 * Thompson-style ε-NFA for `a|b`.
 *
 *   0 -ε-> 1 -a-> 2 -ε-> 5
 *   0 -ε-> 3 -b-> 4 -ε-> 5
 */
export const MOCK_NFA: NFA = {
  states: [0, 1, 2, 3, 4, 5],
  alphabet: ['a', 'b'],
  startState: 0,
  acceptStates: [5],
  transitions: [
    { from: 0, to: 1, symbol: null },
    { from: 0, to: 3, symbol: null },
    { from: 1, to: 2, symbol: 'a' },
    { from: 3, to: 4, symbol: 'b' },
    { from: 2, to: 5, symbol: null },
    { from: 4, to: 5, symbol: null },
  ],
};

/**
 * Subset construction applied to {@link MOCK_NFA}.
 *
 *   q0 = {0, 1, 3}   q1 = {2, 5} (accepting)   q2 = {4, 5} (accepting)
 *
 * q1 and q2 are equivalent, which is what {@link MOCK_MINIMIZED_DFA} merges.
 */
export const MOCK_DFA: DFA = {
  states: [
    { id: 0, positions: [0, 1, 3], nfaStates: [0, 1, 3], isAccepting: false },
    { id: 1, positions: [2, 5], nfaStates: [2, 5], isAccepting: true },
    { id: 2, positions: [4, 5], nfaStates: [4, 5], isAccepting: true },
  ],
  alphabet: ['a', 'b'],
  startState: 0,
  acceptStates: [1, 2],
  transitions: [
    { from: 0, to: 1, symbol: 'a' },
    { from: 0, to: 2, symbol: 'b' },
  ],
};

/** {@link MOCK_DFA} with the two equivalent accepting states merged. */
export const MOCK_MINIMIZED_DFA: DFA = {
  states: [
    { id: 0, positions: [0, 1, 3], nfaStates: [0, 1, 3], isAccepting: false },
    { id: 1, positions: [2, 4, 5], nfaStates: [2, 4, 5], isAccepting: true },
  ],
  alphabet: ['a', 'b'],
  startState: 0,
  acceptStates: [1],
  transitions: [
    { from: 0, to: 1, symbol: 'a' },
    { from: 0, to: 1, symbol: 'b' },
  ],
};

/** A DFA with a self-loop, for testing edge rendering. `a*` over {a}. */
export const MOCK_DFA_WITH_SELF_LOOP: DFA = {
  states: [{ id: 0, positions: [0, 1], nfaStates: [0, 1], isAccepting: true }],
  alphabet: ['a'],
  startState: 0,
  acceptStates: [0],
  transitions: [{ from: 0, to: 0, symbol: 'a' }],
};

/** A complete `CompilationResult` for `a|b`, for UI work before the compiler lands. */
export const MOCK_COMPILATION_RESULT: CompilationResult = {
  input: 'a|b',
  tokens: ['a', '|', 'b'],
  explicitConcatenation: 'a|b',
  postfix: 'ab|',
  syntaxTree: {
    id: 5,
    type: 'concat',
    nullable: false,
    firstpos: [1, 2],
    lastpos: [3],
    left: {
      id: 3,
      type: 'union',
      nullable: false,
      firstpos: [1, 2],
      lastpos: [1, 2],
      left: { id: 1, type: 'symbol', symbol: 'a', position: 1, nullable: false, firstpos: [1], lastpos: [1] },
      right: { id: 2, type: 'symbol', symbol: 'b', position: 2, nullable: false, firstpos: [2], lastpos: [2] },
    },
    right: { id: 4, type: 'symbol', symbol: '#', position: 3, nullable: false, firstpos: [3], lastpos: [3] },
  },
  positions: [
    { position: 1, symbol: 'a' },
    { position: 2, symbol: 'b' },
    { position: 3, symbol: '#' },
  ],
  analysis: {
    nullable: false,
    firstpos: [1, 2],
    lastpos: [3],
  },
  followpos: [
    { position: 1, symbol: 'a', followpos: [3] },
    { position: 2, symbol: 'b', followpos: [3] },
    { position: 3, symbol: '#', followpos: [] },
  ],
  nfa: MOCK_NFA,
  dfa: MOCK_DFA,
  minimizedDfa: MOCK_MINIMIZED_DFA,
  steps: [
    { id: 'input', title: 'Regular Expression', description: 'The expression a|b.' },
    { id: 'tokens', title: 'Tokenization', description: 'Three tokens: a, |, b.' },
    {
      id: 'concatenation',
      title: 'Explicit Concatenation',
      description: 'No implicit concatenation to make explicit.',
    },
    { id: 'postfix', title: 'Postfix Notation', description: 'a|b becomes ab| in postfix.' },
    {
      id: 'nfa',
      title: 'ε-NFA (Thompson)',
      description: 'Six states joined by four ε-transitions and two symbol transitions.',
    },
    {
      id: 'dfa',
      title: 'DFA (Direct Construction)',
      description: 'Three deterministic states, one per position set.',
    },
    {
      id: 'minimized',
      title: 'Minimized DFA',
      description: 'The two equivalent accepting states merge into one.',
    },
    { id: 'simulation', title: 'String Simulation', description: 'Run a string against the DFA.' },
  ],
};
