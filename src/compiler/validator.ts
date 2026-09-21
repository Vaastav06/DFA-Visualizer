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

import { InternalCompilerError } from './errors';

/** Throws a `RegexSyntaxError` if `regex` is not a valid expression. */
export function validate(regex: string): void {
  throw new InternalCompilerError(
    'The regular expression validator is not implemented yet.',
    `TODO(Person 1): implement validate() in src/compiler/validator.ts. Received: ${JSON.stringify(regex)}`
  );
}
