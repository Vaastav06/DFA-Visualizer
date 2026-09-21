/**
 * Stage 3 — Explicit concatenation.
 *
 * OWNER: Person 1.
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
 * `.` is an INTERNAL operator only. It is never a literal the user can type —
 * see docs/REGEX_SPECIFICATION.md.
 */

import { InternalCompilerError } from './errors';

/** The internal explicit-concatenation operator. */
export const CONCAT_OPERATOR = '.';

/** Returns the token list with explicit `.` operators inserted. */
export function insertExplicitConcatenation(tokens: string[]): string[] {
  throw new InternalCompilerError(
    'Explicit concatenation is not implemented yet.',
    `TODO(Person 1): implement insertExplicitConcatenation() in src/compiler/explicitConcatenation.ts. Received ${tokens.length} tokens.`
  );
}
