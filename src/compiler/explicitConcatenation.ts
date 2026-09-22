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

/** The internal explicit-concatenation operator. */
export const CONCAT_OPERATOR = '.';

function canFollowConcat(token: string): boolean {
  return token === ')' || token === '*' || isLiteral(token);
}

function canPrecedeConcat(token: string): boolean {
  return token === '(' || isLiteral(token);
}

/** Returns the token list with explicit `.` operators inserted. */
export function insertExplicitConcatenation(tokens: string[]): string[] {
  if (tokens.length === 0) {
    return [];
  }

  const result: string[] = [tokens[0]];

  for (let i = 1; i < tokens.length; i++) {
    const prev = tokens[i - 1];
    const curr = tokens[i];

    if (canFollowConcat(prev) && canPrecedeConcat(curr)) {
      result.push(CONCAT_OPERATOR);
    }
    result.push(curr);
  }

  return result;
}

function isLiteral(token: string): boolean {
  return (
    token.length === 1 &&
    token !== '|' &&
    token !== '*' &&
    token !== '.' &&
    token !== '(' &&
    token !== ')'
  );
}
