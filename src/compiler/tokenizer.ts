/**
 * Stage 2 — Tokenization.
 *
 * OWNER: Person 1.
 * CONTRACT: `tokenize(regex)` returns one token per meaningful character, in
 * source order. With the current single-character-literal specification a token
 * is always a one-character string: a literal, or one of `| * ( )`.
 * Whitespace is dropped. Runs only on input that already passed `validate()`.
 *
 * The result becomes `CompilationResult.tokens` and is rendered verbatim by the
 * UI, so do not add synthetic tokens here — explicit concatenation is stage 3.
 */

import { InternalCompilerError } from './errors';

/** Splits a validated regular expression into tokens. */
export function tokenize(regex: string): string[] {
  throw new InternalCompilerError(
    'The tokenizer is not implemented yet.',
    `TODO(Person 1): implement tokenize() in src/compiler/tokenizer.ts. Received: ${JSON.stringify(regex)}`
  );
}

/** Operator characters recognised by the tokenizer. */
export const OPERATORS = ['|', '*', '.'] as const;

/** Grouping characters recognised by the tokenizer. */
export const PARENTHESES = ['(', ')'] as const;

/** True when `token` is a literal (i.e. neither an operator nor a parenthesis). */
export function isLiteral(token: string): boolean {
  return (
    token.length === 1 &&
    !(OPERATORS as readonly string[]).includes(token) &&
    !(PARENTHESES as readonly string[]).includes(token)
  );
}
