/**
 * PUBLIC API OF THE COMPILER MODULE.
 *
 * Persons 2 and 3 import from `@/compiler` (or `@compiler/...`) and from
 * nothing deeper. Anything not re-exported here is private to Person 1 and may
 * change without notice.
 *
 * Adding or removing an export here is a contract change: announce it, and
 * update docs/API_CONTRACT.md in the same commit.
 *
 *   import { compileRegex, simulate } from '@/compiler';
 *   import type { CompilationResult, NFA, DFA } from '@/compiler';
 */

/* ---- the primary entry point ---- */
export { compileRegex, PIPELINE_STEPS } from './compiler';

/* ---- on-demand string simulation ---- */
export { simulate } from './simulator';

/* ---- errors ---- */
export {
  CompilerError,
  RegexSyntaxError,
  InternalCompilerError,
  isCompilerError,
  GENERIC_ERROR_MESSAGE,
} from './errors';
export type { CompilerErrorCode } from './errors';

/* ---- shared data contract ---- */
export { EPSILON, EPSILON_DISPLAY } from './types';
export type {
  AlphabetSymbol,
  CompilationResult,
  CompilationStep,
  CompilationStepId,
  DFA,
  DFAState,
  Epsilon,
  NFA,
  SimulationResult,
  SimulationStep,
  Symbol,
  Transition,
} from './types';

/*
 * Intentionally NOT exported — internal stages, owned by Person 1:
 *   validate, tokenize, insertExplicitConcatenation, infixToPostfix,
 *   thompsonConstruction, epsilonClosure, move, subsetConstruction, minimizeDfa
 * They may be imported directly by tests in tests/compiler/ only.
 */
