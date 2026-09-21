/** Stage 3 - explicit concatenation. */

import { describe, expect, it } from 'vitest';
import { insertExplicitConcatenation } from '../../src/compiler/explicitConcatenation';
import { tokenize } from '../../src/compiler/tokenizer';

/** Convenience: regex in, the stage-3 result as a display string out. */
function explicit(regex: string): string {
  return insertExplicitConcatenation(tokenize(regex)).join('');
}

describe('inserts concatenation where it is implied', () => {
  it.each([
    ['ab', 'a.b'],
    ['abc', 'a.b.c'],
    ['a(b)', 'a.(b)'],
    ['(ab)c', '(a.b).c'],
    ['a(b|c)', 'a.(b|c)'],
    ['(a|b)c', '(a|b).c'],
    ['(a|b)(c|d)', '(a|b).(c|d)'],
    ['a*b', 'a*.b'],
    ['(a*)b', '(a*).b'],
    ['(a|b)*abb', '(a|b)*.a.b.b'],
    ['a(b|c)*', 'a.(b|c)*'],
  ])('%s becomes %s', (regex, expected) => {
    expect(explicit(regex)).toBe(expected);
  });
});

describe('does not insert concatenation where it would be wrong', () => {
  it.each(['a', 'a|b', 'a*', '(a)', '(a|b)', 'a|b|c'])('leaves %s unchanged', (regex) => {
    expect(explicit(regex)).toBe(regex);
  });

  it('never puts a dot after an opening parenthesis', () => {
    expect(explicit('(ab)')).not.toContain('(.');
  });

  it('never puts a dot before a closing parenthesis', () => {
    expect(explicit('(ab)')).not.toContain('.)');
  });

  it('never puts a dot next to a union operator', () => {
    const result = explicit('(a|b)(c|d)');
    expect(result).not.toContain('.|');
    expect(result).not.toContain('|.');
  });

  it('never puts a dot before a star, which is postfix', () => {
    expect(explicit('ab*')).toBe('a.b*');
    expect(explicit('ab*')).not.toContain('.*');
  });
});

describe('structural properties', () => {
  it('preserves the original tokens in order', () => {
    const tokens = tokenize('(a|b)*abb');
    const withDots = insertExplicitConcatenation(tokens);
    expect(withDots.filter((token) => token !== '.')).toEqual(tokens);
  });

  it('never starts or ends with a concatenation operator', () => {
    for (const regex of ['ab', 'a*b', '(a|b)(c|d)', 'abc']) {
      const result = insertExplicitConcatenation(tokenize(regex));
      expect(result[0]).not.toBe('.');
      expect(result[result.length - 1]).not.toBe('.');
    }
  });

  it('returns an empty list for an empty token list', () => {
    expect(insertExplicitConcatenation([])).toEqual([]);
  });
});
