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

import { RegexSyntaxError } from './errors';

/** Operator characters recognised by the tokenizer. */
export const OPERATORS = ['|', '*', '.'] as const;

/** Grouping characters recognised by the tokenizer. */
export const PARENTHESES = ['(', ')'] as const;

/** True when `token` is a literal (i.e. neither an operator nor a parenthesis). */
export function isLiteral(token: string): boolean {
  return (
    token.length === 1 &&
    !OPERATORS.includes(token as typeof OPERATORS[number]) &&
    !PARENTHESES.includes(token as typeof PARENTHESES[number])
  );
}

/** Splits a validated regular expression into tokens. */
export function tokenize(regex: string): string[] {
  const trimmed = regex.trim();
  const tokens: string[] = [];

  for (let i = 0; i < trimmed.length; i++) {
    const ch = trimmed[i];

    if (ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r') {
      continue;
    }

    if (
      !isLiteral(ch) &&
      !OPERATORS.includes(ch as typeof OPERATORS[number]) &&
      !PARENTHESES.includes(ch as typeof PARENTHESES[number])
    ) {
      throw new RegexSyntaxError(
        'INVALID_CHARACTER',
        `Invalid character "${ch}". Only letters, digits, and operators | * ( ) are allowed.`,
        { position: i }
      );
    }

    tokens.push(ch);
  }

  return tokens;
}
