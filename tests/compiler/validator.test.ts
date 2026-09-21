/**
 * Stage 1 - validator.
 *
 * Asserts error CODES, never message text: see docs/TESTING_STRATEGY.md.
 * Asserting wording makes every copy improvement break a test, which teaches
 * the team to stop improving the wording.
 */

import { describe, expect, it } from 'vitest';
import { validate } from '../../src/compiler/validator';
import { CompilerError, type CompilerErrorCode } from '../../src/compiler/errors';

/** Runs `validate` and returns the error it threw, or null if it accepted. */
function codeFor(regex: string): CompilerErrorCode | null {
  try {
    validate(regex);
    return null;
  } catch (error) {
    if (error instanceof CompilerError) {
      return error.code;
    }
    throw error;
  }
}

describe('valid expressions', () => {
  const valid = [
    'a',
    'a|b',
    'ab',
    'a*',
    '(a|b)*',
    '(a|b)*abb',
    'a(b|c)*',
    '(a|b)(c|d)',
    'abc',
    '(((a)))',
    'a|b|c',
    'a*b*c*',
    '(ab)*',
    '(a|b)*(c|d)*',
    '0|1',
    'Z9',
  ];

  it.each(valid)('accepts %s', (regex) => {
    expect(codeFor(regex)).toBeNull();
  });

  it('ignores whitespace', () => {
    expect(codeFor('  a | b  ')).toBeNull();
    expect(codeFor('( a | b ) * a b b')).toBeNull();
  });
});

describe('empty input', () => {
  it.each(['', '   ', '\t\n'])('rejects %j as EMPTY_INPUT', (regex) => {
    expect(codeFor(regex)).toBe('EMPTY_INPUT');
  });
});

describe('invalid characters', () => {
  it.each(['a#b', 'a+b', 'a?', '[a-z]', 'a' + String.fromCharCode(92) + '*b', 'a^b', 'a$'])(
    'rejects %s as INVALID_CHARACTER',
    (regex) => {
      expect(codeFor(regex)).toBe('INVALID_CHARACTER');
    }
  );

  it('rejects "." because it is the internal concatenation operator', () => {
    expect(codeFor('a.b')).toBe('INVALID_CHARACTER');
  });

  it('reports the position of the offending character', () => {
    try {
      validate('ab#c');
      expect.unreachable('should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(CompilerError);
      expect((error as CompilerError).position).toBe(2);
    }
  });
});

describe('unbalanced parentheses', () => {
  it.each(['(a', 'a)', '((a)', '(a))', '(', ')'])(
    'rejects %s as UNBALANCED_PARENTHESES',
    (regex) => {
      expect(codeFor(regex)).toBe('UNBALANCED_PARENTHESES');
    }
  );
});

describe('empty group', () => {
  it.each(['()', 'a()', '(())'])('rejects %s as EMPTY_GROUP', (regex) => {
    expect(codeFor(regex)).toBe('EMPTY_GROUP');
  });
});

describe('operator placement', () => {
  it.each(['*', '*a', '|', '|a', '|ab'])(
    'rejects leading operator %s as INVALID_OPERATOR_POSITION',
    (regex) => {
      expect(codeFor(regex)).toBe('INVALID_OPERATOR_POSITION');
    }
  );

  it.each(['a|', 'ab|', '(a|b)|'])(
    'rejects trailing operator %s as INVALID_OPERATOR_POSITION',
    (regex) => {
      expect(codeFor(regex)).toBe('INVALID_OPERATOR_POSITION');
    }
  );

  it('rejects a star with nothing to repeat at the start of a group', () => {
    expect(codeFor('(*a)')).toBe('INVALID_OPERATOR_POSITION');
  });
});

describe('dangling operators', () => {
  it.each(['a**', 'a***'])('rejects %s as DANGLING_OPERATOR', (regex) => {
    expect(codeFor(regex)).toBe('DANGLING_OPERATOR');
  });

  it.each(['a||b', 'a|*b', '(|a)', '(a|)'])('rejects %s as DANGLING_OPERATOR', (regex) => {
    expect(codeFor(regex)).toBe('DANGLING_OPERATOR');
  });
});
