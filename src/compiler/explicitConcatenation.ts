/**
 * Stage 3 - Explicit concatenation.
 *
 * CONTRACT: inserts the internal concatenation operator `.` wherever
 * concatenation is implied, so the shunting-yard pass can treat it like any
 * other binary operator.
 *
 * A `.` goes between `left` and `right` when:
 *   left  is a literal, `)` or `*`
 *   right is a literal or `(`
 *
 * Example: `(a|b)*abb` -> `(a|b)*.a.b.b`
 *
 * `.` is an INTERNAL operator only. It is never a literal the user can type -
 * see docs/REGEX_SPECIFICATION.md.
 */

import { isLiteral } from './tokenizer';

/** The internal explicit-concatenation operator. */
export const CONCAT_OPERATOR = '.';

/**
 * True when `token` can end an operand, so something following it would be
 * concatenated onto it.
 */
function endsOperand(token: string): boolean {
  return isLiteral(token) || token === ')' || token === '*';
}

/**
 * True when `token` can begin an operand, so it would be concatenated onto
 * whatever precedes it.
 */
function beginsOperand(token: string): boolean {
  return isLiteral(token) || token === '(';
}

/** Returns the token list with explicit `.` operators inserted. */
export function insertExplicitConcatenation(tokens: string[]): string[] {
  const result: string[] = [];

  for (let i = 0; i < tokens.length; i += 1) {
    const current = tokens[i];
    result.push(current);

    const next = i + 1 < tokens.length ? tokens[i + 1] : null;
    if (next !== null && endsOperand(current) && beginsOperand(next)) {
      result.push(CONCAT_OPERATOR);
    }
  }

  return result;
}
