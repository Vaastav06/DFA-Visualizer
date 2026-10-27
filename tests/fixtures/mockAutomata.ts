import { compileRegex, type CompilationResult, type DFA } from '../../src/compiler';

/** Direct construction of the DFA for a|b: q0={1,2}, q1={3=#}. */
export const MOCK_DFA: DFA = {
  states: [
    { id: 0, positions: [1, 2], isAccepting: false },
    { id: 1, positions: [3], isAccepting: true },
  ],
  alphabet: ['a', 'b'],
  startState: 0,
  acceptStates: [1],
  transitions: [
    { from: 0, to: 1, symbol: 'a' },
    { from: 0, to: 1, symbol: 'b' },
  ],
};

/** Direct construction of (a*)#: q0={1,2}; reading a returns to q0. */
export const MOCK_DFA_WITH_SELF_LOOP: DFA = {
  states: [{ id: 0, positions: [1, 2], isAccepting: true }],
  alphabet: ['a'],
  startState: 0,
  acceptStates: [0],
  transitions: [{ from: 0, to: 0, symbol: 'a' }],
};

/** Real compiler output used by table and tree visualization tests. */
export const MOCK_COMPILATION_RESULT: CompilationResult = compileRegex('a|b');
