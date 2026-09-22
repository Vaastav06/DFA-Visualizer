import { describe, expect, it } from 'vitest';
import { buildSyntaxTree } from '../../src/compiler/syntaxTree';
import { assignPositions } from '../../src/compiler/positions';
import { calculateNullable } from '../../src/compiler/nullable';
import { calculateFirstpos } from '../../src/compiler/firstpos';
import { calculateLastpos } from '../../src/compiler/lastpos';
import { calculateFollowpos } from '../../src/compiler/followpos';
import { constructDirectDFA } from '../../src/compiler/directDfa';
import { infixToPostfix } from '../../src/compiler/infixToPostfix';
import { insertExplicitConcatenation } from '../../src/compiler/explicitConcatenation';
import { collectAlphabet, tokenize } from '../../src/compiler/tokenizer';
import { assertDenseIds, assertDfaInvariants } from './support/automata';

function buildDirectDfa(regex: string) {
  const tokens = tokenize(regex);
  const postfix = infixToPostfix(insertExplicitConcatenation(tokens));
  const tree = buildSyntaxTree(postfix, true);
  const { positions, endMarkerPosition } = assignPositions(tree);
  calculateNullable(tree);
  calculateFirstpos(tree);
  calculateLastpos(tree);
  const followpos = calculateFollowpos(tree, positions);
  const alphabet = collectAlphabet(tokens);
  return {
    dfa: constructDirectDFA(tree, alphabet, followpos, endMarkerPosition),
    endMarkerPosition,
    positions,
  };
}

describe('direct DFA construction', () => {
  it('constructs textbook 4-state DFA for (a|b)*abb', () => {
    const { dfa, endMarkerPosition } = buildDirectDfa('(a|b)*abb');

    expect(dfa.states).toHaveLength(4);
    expect(dfa.startState).toBe(0);
    expect(dfa.alphabet).toEqual(['a', 'b']);
    expect(dfa.alphabet).not.toContain('#');

    // D0 = {1, 2, 3}
    expect(dfa.states[0].positions).toEqual([1, 2, 3]);
    expect(dfa.states[0].isAccepting).toBe(false);

    // Only state with position 6 (#) accepts
    expect(dfa.acceptStates).toHaveLength(1);
    const acceptState = dfa.states.find((s) => s.id === dfa.acceptStates[0]);
    expect(acceptState?.positions).toContain(endMarkerPosition);
    expect(acceptState?.positions).toEqual([1, 2, 3, 6]);

    // Check all transition triples
    const transitions = dfa.transitions.map((t) => `${t.from}-${t.symbol}->${t.to}`).sort();
    expect(transitions).toEqual([
      '0-a->1',
      '0-b->0',
      '1-a->1',
      '1-b->2',
      '2-a->1',
      '2-b->3',
      '3-a->1',
      '3-b->0',
    ]);
  });

  it('sets start state as accepting for expressions matching empty string (a*)', () => {
    const { dfa, endMarkerPosition } = buildDirectDfa('a*');

    expect(dfa.states[0].isAccepting).toBe(true);
    expect(dfa.states[0].positions).toContain(endMarkerPosition);
    expect(dfa.acceptStates).toContain(0);
  });

  it('sets start state as accepting for (a|b)*', () => {
    const { dfa, endMarkerPosition } = buildDirectDfa('(a|b)*');

    expect(dfa.states[0].isAccepting).toBe(true);
    expect(dfa.states[0].positions).toContain(endMarkerPosition);
  });

  it('builds a direct 2-state DFA for a|b without redundant states', () => {
    const { dfa } = buildDirectDfa('a|b');

    expect(dfa.states).toHaveLength(2);
    expect(dfa.states[0].isAccepting).toBe(false);
    expect(dfa.states[1].isAccepting).toBe(true);
  });

  it('satisfies all DFA invariants and dense ID numbering', () => {
    const testCases = ['a', 'a|b', 'ab', 'a*', '(a|b)*', '(a|b)*abb', 'a(b|c)*', '(a|b)(c|d)'];

    for (const regex of testCases) {
      const { dfa } = buildDirectDfa(regex);
      expect(() => assertDfaInvariants(dfa)).not.toThrow();
      expect(() => assertDenseIds(dfa)).not.toThrow();
    }
  });

  it('ensures nfaStates equals positions for legacy compatibility', () => {
    const { dfa } = buildDirectDfa('(a|b)*abb');

    for (const state of dfa.states) {
      expect(state.nfaStates).toEqual(state.positions);
    }
  });

  it('is strictly deterministic across repeated runs', () => {
    const dfa1 = buildDirectDfa('(a|b)*abb').dfa;
    const dfa2 = buildDirectDfa('(a|b)*abb').dfa;

    expect(dfa1).toEqual(dfa2);
  });
});
