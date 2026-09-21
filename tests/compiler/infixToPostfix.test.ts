/** Stage 4 - shunting-yard conversion to postfix. */

import { describe, expect, it } from 'vitest';
import { infixToPostfix } from '../../src/compiler/infixToPostfix';
import { insertExplicitConcatenation } from '../../src/compiler/explicitConcatenation';
import { tokenize } from '../../src/compiler/tokenizer';

/** Convenience: regex in, postfix display string out (stages 2 to 4). */
function postfix(regex: string): string {
  return infixToPostfix(insertExplicitConcatenation(tokenize(regex))).join('');
}

describe('basic conversions', () => {
  it.each([
    ['a', 'a'],
    ['a|b', 'ab|'],
    ['ab', 'ab.'],
    ['a*', 'a*'],
    ['abc', 'ab.c.'],
    ['a|b|c', 'ab|c|'],
  ])('%s becomes %s', (regex, expected) => {
    expect(postfix(regex)).toBe(expected);
  });
});

describe('precedence: star binds tighter than concatenation', () => {
  it('reads ab* as a.(b*)', () => {
    expect(postfix('ab*')).toBe('ab*.');
  });

  it('reads a*b as (a*).b', () => {
    expect(postfix('a*b')).toBe('a*b.');
  });

  it('applies a star to a whole group when parenthesised', () => {
    expect(postfix('(ab)*')).toBe('ab.*');
  });
});

describe('precedence: concatenation binds tighter than union', () => {
  it('reads a|bc as a|(b.c)', () => {
    expect(postfix('a|bc')).toBe('abc.|');
  });

  it('reads ab|c as (a.b)|c', () => {
    expect(postfix('ab|c')).toBe('ab.c|');
  });

  it('reads a|b* as a|(b*)', () => {
    expect(postfix('a|b*')).toBe('ab*|');
  });
});

describe('parentheses override precedence and then disappear', () => {
  it.each([
    ['(a|b)c', 'ab|c.'],
    ['(a|b)*', 'ab|*'],
    ['a(b|c)', 'abc|.'],
    ['(a|b)(c|d)', 'ab|cd|.'],
    ['(a|b)*abb', 'ab|*a.b.b.'],
    ['a(b|c)*', 'abc|*.'],
  ])('%s becomes %s', (regex, expected) => {
    expect(postfix(regex)).toBe(expected);
  });

  it('removes every parenthesis from the output', () => {
    for (const regex of ['(a|b)*abb', '(((a)))', '(a|b)(c|d)']) {
      expect(postfix(regex)).not.toContain('(');
      expect(postfix(regex)).not.toContain(')');
    }
  });

  it('collapses redundant parentheses', () => {
    expect(postfix('(((a)))')).toBe('a');
    expect(postfix('((ab))')).toBe('ab.');
  });
});

describe('associativity', () => {
  it('groups union to the left', () => {
    // (a|b)|c, not a|(b|c) - both describe the same language, but the tree
    // shape determines the NFA Thompson builds.
    expect(postfix('a|b|c')).toBe('ab|c|');
  });

  it('groups concatenation to the left', () => {
    expect(postfix('abcd')).toBe('ab.c.d.');
  });
});

describe('structural properties', () => {
  it('preserves the operands in order', () => {
    const operands = postfix('(a|b)*abb')
      .split('')
      .filter((token) => !'|.*'.includes(token));
    expect(operands).toEqual(['a', 'b', 'a', 'b', 'b']);
  });

  it('returns an empty list for an empty token list', () => {
    expect(infixToPostfix([])).toEqual([]);
  });

  it('is deterministic', () => {
    expect(postfix('(a|b)*abb')).toBe(postfix('(a|b)*abb'));
  });
});
