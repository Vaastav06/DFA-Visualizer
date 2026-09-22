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

import { RegexSyntaxError } from './errors';

/** Operator precedence. Higher binds tighter. */
export const PRECEDENCE: Readonly<Record<string, number>> = {
  '|': 1,
  '.': 2,
  '*': 3,
};

const LEFT_ASSOCIATIVE = new Set(['|', '.']);

function isOperator(token: string): boolean {
  return token === '|' || token === '.' || token === '*';
}

/** Converts an infix token list (with explicit `.`) into postfix order. */
export function infixToPostfix(tokens: string[]): string[] {
  const output: string[] = [];
  const stack: string[] = [];

  for (const token of tokens) {
    if (isLiteral(token)) {
      output.push(token);
    } else if (token === '(') {
      stack.push(token);
    } else if (token === ')') {
      while (stack.length > 0 && stack[stack.length - 1] !== '(') {
        output.push(stack.pop()!);
      }
      if (stack.length === 0) {
        throw new RegexSyntaxError(
          'UNBALANCED_PARENTHESES',
          'Mismatched parentheses during postfix conversion.',
        );
      }
      stack.pop(); // Remove '('
    } else if (isOperator(token)) {
      while (
        stack.length > 0 &&
        isOperator(stack[stack.length - 1]) &&
        (PRECEDENCE[stack[stack.length - 1]] > PRECEDENCE[token] ||
          (PRECEDENCE[stack[stack.length - 1]] === PRECEDENCE[token] &&
            LEFT_ASSOCIATIVE.has(token)))
      ) {
        output.push(stack.pop()!);
      }
      stack.push(token);
    } else {
      throw new RegexSyntaxError(
        'INVALID_CHARACTER',
        `Unknown token "${token}" during postfix conversion.`,
      );
    }
  }

  while (stack.length > 0) {
    const top = stack.pop()!;
    if (top === '(' || top === ')') {
      throw new RegexSyntaxError('UNBALANCED_PARENTHESES', 'Mismatched parentheses after postfix conversion.');
    }
    output.push(top);
  }

  return output;
}

function isLiteral(token: string): boolean {
  return (
    token.length === 1 &&
    token !== '|' &&
    token !== '.' &&
    token !== '*' &&
    token !== '(' &&
    token !== ')'
  );
}
