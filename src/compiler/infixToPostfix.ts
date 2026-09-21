/**
 * Stage 4 - Infix to postfix (shunting-yard).
 *
 * OWNER: Person 1.
 * CONTRACT: converts the explicit-concatenation token list into postfix
 * (reverse Polish) order. Parentheses disappear; the result contains only
 * literals and operators.
 *
 * Precedence (highest first) - see docs/REGEX_SPECIFICATION.md:
 *   *   Kleene star     postfix, unary
 *   .   concatenation   binary, left-associative
 *   |   alternation     binary, left-associative
 *
 * Example: `(a|b)*.a.b.b` -> `ab|*a.b.b.`
 */

import { InternalCompilerError } from './errors';
import { isLiteral } from './tokenizer';

/** Operator precedence. Higher binds tighter. */
export const PRECEDENCE: Readonly<Record<string, number>> = {
  '|': 1,
  '.': 2,
  '*': 3,
};

/** True when `token` is one of the three operators the algorithm reorders. */
function isOperator(token: string): boolean {
  return token in PRECEDENCE;
}

/** Converts an infix token list (with explicit `.`) into postfix order. */
export function infixToPostfix(tokens: string[]): string[] {
  const output: string[] = [];
  const operators: string[] = [];

  for (const token of tokens) {
    if (isLiteral(token)) {
      // An operand is always ready to be emitted: postfix puts operands first.
      output.push(token);
      continue;
    }

    if (token === '(') {
      operators.push(token);
      continue;
    }

    if (token === ')') {
      // Everything pushed since the matching "(" belongs inside this group, so
      // it is emitted before anything outside the group can be.
      while (operators.length > 0 && operators[operators.length - 1] !== '(') {
        output.push(operators.pop() as string);
      }
      if (operators.length === 0) {
        throw new InternalCompilerError(
          'The expression could not be converted to postfix form.',
          'Unbalanced ")" reached infixToPostfix; validate() should have rejected it.'
        );
      }
      operators.pop(); // discard the "("
      continue;
    }

    if (isOperator(token)) {
      // All three operators are left-associative, so an operator of EQUAL
      // precedence on the stack is also popped. "*" is unary and postfix, but
      // its operand is already in the output by the time it is read, so it
      // needs no special case here.
      while (
        operators.length > 0 &&
        operators[operators.length - 1] !== '(' &&
        PRECEDENCE[operators[operators.length - 1]] >= PRECEDENCE[token]
      ) {
        output.push(operators.pop() as string);
      }
      operators.push(token);
      continue;
    }

    throw new InternalCompilerError(
      'The expression could not be converted to postfix form.',
      `Unrecognised token ${JSON.stringify(token)} reached infixToPostfix.`
    );
  }

  while (operators.length > 0) {
    const operator = operators.pop() as string;
    if (operator === '(') {
      throw new InternalCompilerError(
        'The expression could not be converted to postfix form.',
        'Unbalanced "(" reached infixToPostfix; validate() should have rejected it.'
      );
    }
    output.push(operator);
  }

  return output;
}
