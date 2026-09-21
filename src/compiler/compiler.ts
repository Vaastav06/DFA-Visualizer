/**
 * Pipeline orchestrator.
 *
 * OWNER: Person 1.
 * CONTRACT: `compileRegex` runs every stage in order and assembles the single
 * `CompilationResult` that the rest of the application consumes. It throws
 * `CompilerError` (or a subclass) and nothing else — wrap anything unexpected
 * in `InternalCompilerError`.
 *
 *   validate -> tokenize -> insertExplicitConcatenation -> infixToPostfix
 *            -> thompsonConstruction -> subsetConstruction -> minimizeDfa
 *
 * `epsilonClosure` is used inside subset construction; `simulate` is exported
 * separately because the UI calls it on demand, not as part of compilation.
 *
 * See docs/COMPILER_PIPELINE.md.
 */

import { InternalCompilerError } from './errors';
import type { CompilationResult, CompilationStep } from './types';

/**
 * Compiles a regular expression into tokens, postfix, an epsilon-NFA, a DFA and
 * a minimized DFA, together with per-stage explanations for the UI.
 *
 * @throws {CompilerError} for invalid input or an internal failure.
 */
export function compileRegex(regex: string): CompilationResult {
  throw new InternalCompilerError(
    'The compiler pipeline is not implemented yet.',
    `TODO(Person 1): implement compileRegex() in src/compiler/compiler.ts. Received: ${JSON.stringify(regex)}`
  );
}

/**
 * The stage explanations shown by the UI's step navigation.
 *
 * Person 1 fills the per-run detail into `CompilationResult.steps`; these titles
 * and the ordering are the shared contract Person 3 builds the navigation
 * against, so keep the ids in sync with `CompilationStepId` in types.ts.
 */
export const PIPELINE_STEPS: readonly CompilationStep[] = [
  {
    id: 'input',
    title: 'Regular Expression',
    description: 'The expression as entered, after validation of its syntax.',
  },
  {
    id: 'tokens',
    title: 'Tokenization',
    description: 'The expression split into literals, operators and parentheses.',
  },
  {
    id: 'concatenation',
    title: 'Explicit Concatenation',
    description: 'Implicit concatenation is made explicit with the internal "." operator.',
  },
  {
    id: 'postfix',
    title: 'Postfix Notation',
    description:
      'The shunting-yard algorithm reorders the expression into postfix form, removing parentheses.',
  },
  {
    id: 'nfa',
    title: 'ε-NFA (Thompson)',
    description:
      "Thompson's construction builds a non-deterministic automaton with ε-transitions from the postfix form.",
  },
  {
    id: 'dfa',
    title: 'DFA (Subset Construction)',
    description:
      'Subset construction turns each ε-closed set of NFA states into a single deterministic state.',
  },
  {
    id: 'minimized',
    title: 'Minimized DFA',
    description:
      'Unreachable states are removed and equivalent states are merged, giving the smallest equivalent DFA.',
  },
  {
    id: 'simulation',
    title: 'String Simulation',
    description: 'Run an input string through the DFA and watch it accept or reject.',
  },
];
