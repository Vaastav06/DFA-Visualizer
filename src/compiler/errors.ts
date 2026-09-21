/**
 * Compiler error taxonomy — shared contract.
 *
 * The UI catches these and renders `error.message` directly to the user, so
 * every message must be written for a student, not for a developer. Put
 * developer detail in `details`, never in `message`.
 *
 * See docs/ERROR_HANDLING.md.
 */

/** Machine-readable error codes. The UI may switch on these. */
export type CompilerErrorCode =
  | 'EMPTY_INPUT'
  | 'INVALID_CHARACTER'
  | 'UNBALANCED_PARENTHESES'
  | 'EMPTY_GROUP'
  | 'INVALID_OPERATOR_POSITION'
  | 'DANGLING_OPERATOR'
  | 'INTERNAL_ERROR';

/** Base class for every error the compiler throws on purpose. */
export class CompilerError extends Error {
  readonly code: CompilerErrorCode;
  /** 0-based index into the original regex where the problem was found. */
  readonly position?: number;
  /** Developer-facing detail. Never shown to the user directly. */
  readonly details?: string;

  constructor(
    code: CompilerErrorCode,
    message: string,
    options?: { position?: number; details?: string }
  ) {
    super(message);
    this.name = 'CompilerError';
    this.code = code;
    this.position = options?.position;
    this.details = options?.details;
  }
}

/** Thrown by the validator/tokenizer for malformed user input. */
export class RegexSyntaxError extends CompilerError {
  constructor(
    code: CompilerErrorCode,
    message: string,
    options?: { position?: number; details?: string }
  ) {
    super(code, message, options);
    this.name = 'RegexSyntaxError';
  }
}

/** Thrown when an internal invariant breaks. Always a bug, never the user's fault. */
export class InternalCompilerError extends CompilerError {
  constructor(message: string, details?: string) {
    super('INTERNAL_ERROR', message, { details });
    this.name = 'InternalCompilerError';
  }
}

/** Narrowing helper for `catch` blocks in the UI. */
export function isCompilerError(value: unknown): value is CompilerError {
  return value instanceof CompilerError;
}

/**
 * The fallback message the UI shows for anything that is not a CompilerError.
 * Keep it blameless and actionable.
 */
export const GENERIC_ERROR_MESSAGE =
  'Something went wrong while building the automaton. Please check your expression and try again.';
