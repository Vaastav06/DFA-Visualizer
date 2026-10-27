/**
 * PUBLIC API OF THE COMPILER MODULE.
 *
 * Direct Regular Expression -> DFA Construction.
 *
 *   import { compileRegex, simulate } from '@/compiler';
 *   import type { CompilationResult, DFA, DFAState } from '@/compiler';
 */

/* ---- primary entry point ---- */
export { compileRegex, PIPELINE_STEPS } from './compiler';

/* ---- pipeline stage functions ---- */
export { validate, MAX_REGEX_LENGTH } from './validator';
export { tokenize, isLiteral, collectAlphabet } from './tokenizer';
export {
  insertExplicitConcatenation,
  CONCAT_OPERATOR,
} from './explicitConcatenation';
export { infixToPostfix, PRECEDENCE } from './infixToPostfix';
export { buildSyntaxTree, END_MARKER } from './syntaxTree';
export { assignPositions } from './positions';
export type { PositionAssignmentResult } from './positions';
export { calculateNullable } from './nullable';
export { calculateFirstpos, unionPositions } from './firstpos';
export { calculateLastpos } from './lastpos';
export { calculateFollowpos } from './followpos';
export {
  constructDirectDFA,
  positionSetKey,
} from './directDfa';

/* ---- string simulation ---- */
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
export type {
  AlphabetSymbol,
  CompilationResult,
  CompilationStep,
  CompilationStepId,
  DFA,
  DFAState,
  FollowPosEntry,
  PositionInfo,
  SimulationResult,
  SimulationStep,
  Symbol,
  SyntaxAnalysis,
  SyntaxNode,
  SyntaxNodeType,
  Transition,
} from './types';
