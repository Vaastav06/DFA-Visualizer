/** Compare direct DFA behavior with JavaScript's anchored regex semantics. */
import { describe, expect, it } from 'vitest';
import { compileRegex, simulate, MAX_REGEX_LENGTH } from '../../src/compiler';
import { allStringsUpTo, assertDenseIds, assertDfaInvariants } from './support/automata';

const expressions = [
  'a',
  'a|b',
  'ab',
  'a*',
  '(a|b)*',
  '(a|b)*abb',
  'a(b|c)*',
  '(a|b)(c|d)',
  '(a|b)*a(a|b)',
  '(aa|aaa)*',
  '(a*b*)*',
  '(0|1(01*0)*1)*',
  '((a|b)*c)*',
  '(ab|aba)*',
  'a*b*c*',
];

function regexAccepts(expression: string, input: string): boolean {
  return new RegExp(`^(?:${expression})$`).test(input);
}

describe('direct DFA language behavior', () => {
  it.each(expressions)('matches the supported regex language for %s', (expression) => {
    const dfa = compileRegex(expression).dfa;
    assertDfaInvariants(dfa);
    assertDenseIds(dfa);
    for (const input of allStringsUpTo(dfa.alphabet, 5)) {
      expect(simulate(dfa, input).accepted).toBe(regexAccepts(expression, input));
    }
    for (const input of ['z', `z${dfa.alphabet[0] ?? ''}`]) {
      expect(simulate(dfa, input).accepted).toBe(regexAccepts(expression, input));
    }
  });

  it('enforces the input-length limit without a stack overflow', () => {
    expect(() => compileRegex('a'.repeat(MAX_REGEX_LENGTH + 1))).toThrow(/too long/i);
    const expression = 'a'.repeat(50);
    const dfa = compileRegex(expression).dfa;
    expect(simulate(dfa, expression).accepted).toBe(true);
    expect(simulate(dfa, 'a'.repeat(49)).accepted).toBe(false);
  });
});
