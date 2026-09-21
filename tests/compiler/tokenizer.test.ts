/** Stage 2 - tokenizer, and the alphabet helper built on it. */

import { describe, expect, it } from 'vitest';
import { collectAlphabet, isLiteral, tokenize } from '../../src/compiler/tokenizer';

describe('tokenize', () => {
  it('produces one token per character', () => {
    expect(tokenize('(a|b)*abb')).toEqual(['(', 'a', '|', 'b', ')', '*', 'a', 'b', 'b']);
  });

  it('handles a single literal', () => {
    expect(tokenize('a')).toEqual(['a']);
  });

  it('keeps operators and parentheses as their own tokens', () => {
    expect(tokenize('(a|b)')).toEqual(['(', 'a', '|', 'b', ')']);
    expect(tokenize('a*')).toEqual(['a', '*']);
  });

  it('drops whitespace', () => {
    expect(tokenize(' a | b ')).toEqual(['a', '|', 'b']);
    expect(tokenize('(\ta\n|\tb\n)')).toEqual(['(', 'a', '|', 'b', ')']);
  });

  it('preserves source order', () => {
    expect(tokenize('abc')).toEqual(['a', 'b', 'c']);
  });

  it('adds no synthetic tokens - concatenation is stage 3', () => {
    expect(tokenize('ab')).toEqual(['a', 'b']);
    expect(tokenize('ab')).not.toContain('.');
  });

  it('accepts digits as literals', () => {
    expect(tokenize('0|1')).toEqual(['0', '|', '1']);
  });
});

describe('isLiteral', () => {
  it.each(['a', 'b', 'Z', '0', '9'])('treats %s as a literal', (token) => {
    expect(isLiteral(token)).toBe(true);
  });

  it.each(['|', '*', '.', '(', ')'])('treats %s as not a literal', (token) => {
    expect(isLiteral(token)).toBe(false);
  });
});

describe('collectAlphabet', () => {
  it('returns the distinct literals in ascending order', () => {
    expect(collectAlphabet(tokenize('(b|a)*aba'))).toEqual(['a', 'b']);
  });

  it('excludes operators and parentheses', () => {
    expect(collectAlphabet(tokenize('(a|b)*'))).toEqual(['a', 'b']);
  });

  it('is deterministic regardless of the order symbols first appear', () => {
    expect(collectAlphabet(tokenize('cab'))).toEqual(collectAlphabet(tokenize('bca')));
  });

  it('returns an empty alphabet for a token list with no literals', () => {
    expect(collectAlphabet([])).toEqual([]);
  });
});
