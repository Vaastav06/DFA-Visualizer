/**
 * Stage 4 — Infix to postfix (shunting-yard).
 *
 * OWNER: Person 1.
 * CONTRACT: converts the explicit-concatenation token list into postfix
 * (reverse Polish) order. Parentheses disappear; the result contains only
 * literals and operators.
 *
 * Precedence (highest first) — see docs/REGEX_SPECIFICATION.md:
 *   *   Kleene star     postfix, unary
 *   .   concatenation   binary, left-associative
 *   |   alternation     binary, left-associative
 *
 * Example: `(a|b)*.a.b.b` -> `ab|*ab.b.` (exact spacing/order per the algorithm).
 */

import { InternalCompilerError } from './errors';

/** Operator precedence. Higher binds tighter. */
export const PRECEDENCE: Readonly<Record<string, number>> = {
  '|': 1,
  '.': 2,
  '*': 3,
};

/** Converts an infix token list (with explicit `.`) into postfix order. */
export function infixToPostfix(tokens: string[]): string[] {
  throw new InternalCompilerError(
    'Infix to postfix conversion is not implemented yet.',
    `TODO(Person 1): implement infixToPostfix() in src/compiler/infixToPostfix.ts. Received ${tokens.length} tokens.`
  );
}
