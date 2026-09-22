/**
 * Stage 1 — Validation.
 *
 * OWNER: Person 1.
 * CONTRACT: accepts the raw user string, throws a `RegexSyntaxError` describing
 * the first problem found, or returns normally when the expression is well
 * formed. Must never return a partially-checked "maybe ok".
 *
 * Checks required by docs/REGEX_SPECIFICATION.md:
 *  - empty / whitespace-only input          -> EMPTY_INPUT
 *  - characters outside the supported set   -> INVALID_CHARACTER
 *  - unbalanced parentheses                 -> UNBALANCED_PARENTHESES
 *  - "()"                                   -> EMPTY_GROUP
 *  - leading "*" or "|", trailing "|"       -> INVALID_OPERATOR_POSITION
 *  - "**", "|*", "(|", "|)"                 -> DANGLING_OPERATOR
 */

import { RegexSyntaxError } from './errors';

const RESERVED = new Set(['|', '*', '(', ')', '.']);

function isValidLiteral(ch: string): boolean {
  return ch.length === 1 && !RESERVED.has(ch);
}

/** Throws a `RegexSyntaxError` if `regex` is not a valid expression. */
export function validate(regex: string): void {
  const trimmed = regex.trim();

  if (trimmed.length === 0) {
    throw new RegexSyntaxError('EMPTY_INPUT', 'The regular expression is empty.', { position: 0 });
  }

  // Check for invalid characters
  for (let i = 0; i < trimmed.length; i++) {
    const ch = trimmed[i];
    if (ch === '\\') {
      throw new RegexSyntaxError(
        'INVALID_CHARACTER',
        'Escape sequences are not supported. Use literals directly.',
        { position: i, details: 'Backslash is not a valid character in this regex flavour.' }
      );
    }
    if (!isValidLiteral(ch) && !['|', '*', '(', ')'].includes(ch)) {
      throw new RegexSyntaxError(
        'INVALID_CHARACTER',
        `Invalid character "${ch}". Only letters, digits, and operators | * ( ) are allowed.`,
        { position: i }
      );
    }
  }

  // Check for unbalanced parentheses
  let parenDepth = 0;
  for (let i = 0; i < trimmed.length; i++) {
    const ch = trimmed[i];
    if (ch === '(') {
      parenDepth++;
    } else if (ch === ')') {
      parenDepth--;
      if (parenDepth < 0) {
        throw new RegexSyntaxError(
          'UNBALANCED_PARENTHESES',
          'Unbalanced parentheses: closing parenthesis without a matching opening parenthesis.',
          { position: i }
        );
      }
    }
  }
  if (parenDepth !== 0) {
    throw new RegexSyntaxError(
      'UNBALANCED_PARENTHESES',
      'Unbalanced parentheses: some opening parentheses are not closed.',
      { position: trimmed.length - 1 }
    );
  }

  // Check for empty group ()
  if (trimmed.includes('()')) {
    const pos = trimmed.indexOf('()');
    throw new RegexSyntaxError(
      'EMPTY_GROUP',
      'Empty group "()" is not allowed. There is no syntax for the empty string.',
      { position: pos }
    );
  }

  // Check leading/trailing operators
  if (trimmed[0] === '*' || trimmed[0] === '|') {
    throw new RegexSyntaxError(
      'INVALID_OPERATOR_POSITION',
      'Expression cannot start with "*" or "|".',
      { position: 0 }
    );
  }
  if (trimmed[trimmed.length - 1] === '|') {
    throw new RegexSyntaxError(
      'INVALID_OPERATOR_POSITION',
      'Expression cannot end with "|".',
      { position: trimmed.length - 1 }
    );
  }

  // Check for dangling operators: **, |*, (|, |)
  for (let i = 0; i < trimmed.length - 1; i++) {
    const curr = trimmed[i];
    const next = trimmed[i + 1];

    if (curr === '*' && next === '*') {
      throw new RegexSyntaxError(
        'DANGLING_OPERATOR',
        'Consecutive "*" operators are not allowed.',
        { position: i }
      );
    }
    if (curr === '|' && next === '*') {
      throw new RegexSyntaxError(
        'DANGLING_OPERATOR',
        '"|*" is not valid — alternation must be followed by a valid expression.',
        { position: i }
      );
    }
    if (curr === '(' && next === '|') {
      throw new RegexSyntaxError(
        'DANGLING_OPERATOR',
        '"(|" is not valid — a group must start with a valid expression.',
        { position: i }
      );
    }
    if (curr === '|' && next === ')') {
      throw new RegexSyntaxError(
        'DANGLING_OPERATOR',
        '"|)" is not valid — alternation must be followed by a valid expression.',
        { position: i }
      );
    }
  }
}
