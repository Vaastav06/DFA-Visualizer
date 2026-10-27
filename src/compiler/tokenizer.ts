/**
 * Stage 2 - Tokenization.
 *
 * OWNER: Person 1.
 * CONTRACT: `tokenize(regex)` returns one token per meaningful character, in
 * source order. With the current single-character-literal specification a token
 * is always a one-character string: a literal, or one of `| * ( )`.
 * Whitespace is dropped. Runs only on input that already passed `validate()`.
 *
 * The result becomes `CompilationResult.tokens` and is rendered verbatim by the
 * UI, so do not add synthetic tokens here - explicit concatenation is stage 3.
 */

/** Operator characters recognised by the tokenizer. */
export const OPERATORS = ['|', '*', '.'] as const;

/** Grouping characters recognised by the tokenizer. */
export const PARENTHESES = ['(', ')'] as const;

/** Splits a validated regular expression into tokens. */
export function tokenize(regex: string): string[] {
  const tokens: string[] = [];

  for (const char of regex) {
    // Whitespace carries no meaning in the grammar, so it never becomes a
    // token. The validator has already rejected every other unsupported
    // character, which is why this loop needs no error branch.
    if (/\s/.test(char)) {
      continue;
    }
    tokens.push(char);
  }

  return tokens;
}

/** True when `token` is a literal (i.e. neither an operator nor a parenthesis). */
export function isLiteral(token: string): boolean {
  return (
    token.length === 1 &&
    !(OPERATORS as readonly string[]).includes(token) &&
    !(PARENTHESES as readonly string[]).includes(token)
  );
}

/**
 * Return the distinct literals in ascending order for stable DFA transitions.
 */
export function collectAlphabet(tokens: string[]): string[] {
  const symbols = new Set<string>();

  for (const token of tokens) {
    if (isLiteral(token)) {
      symbols.add(token);
    }
  }

  return [...symbols].sort();
}
