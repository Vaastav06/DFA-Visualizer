/**
 * Pipeline orchestrator.
 *
 * OWNER: Person 1.
 * CONTRACT: `compileRegex` runs every stage in order and assembles the single
 * `CompilationResult` that the rest of the application consumes. It throws
 * `CompilerError` (or a subclass) and nothing else - anything unexpected is
 * wrapped in `InternalCompilerError`.
 *
 *   validate -> tokenize -> insertExplicitConcatenation -> infixToPostfix
 *            -> thompsonConstruction -> subsetConstruction -> minimizeDfa
 *
 * `epsilonClosure` is used inside subset construction; `simulate` is exported
 * separately because the UI calls it on demand, not as part of compilation.
 *
 * This file orchestrates only. Every algorithm lives in its own stage module,
 * so a reader can follow the pipeline here and then read one stage at a time.
 *
 * See docs/COMPILER_PIPELINE.md.
 */

import { CompilerError, InternalCompilerError } from './errors';
import { insertExplicitConcatenation } from './explicitConcatenation';
import { infixToPostfix } from './infixToPostfix';
import { minimizeDfa } from './minimizeDfa';
import { subsetConstruction } from './subsetConstruction';
import { thompsonConstruction } from './thompson';
import { tokenize } from './tokenizer';
import { validate } from './validator';
import {
  EPSILON_DISPLAY,
  type CompilationResult,
  type CompilationStep,
  type DFA,
  type NFA,
} from './types';

/**
 * Compiles a regular expression into tokens, postfix, an epsilon-NFA, a DFA and
 * a minimized DFA, together with per-stage explanations for the UI.
 *
 * @throws {CompilerError} for invalid input or an internal failure.
 */
export function compileRegex(regex: string): CompilationResult {
  try {
    validate(regex);

    const tokens = tokenize(regex);
    const withConcatenation = insertExplicitConcatenation(tokens);
    const postfix = infixToPostfix(withConcatenation);
    const nfa = thompsonConstruction(postfix);
    const dfa = subsetConstruction(nfa);
    const minimizedDfa = minimizeDfa(dfa);

    return {
      input: regex,
      tokens,
      // The UI renders these two as strings, so they are joined here rather
      // than leaving every consumer to do it.
      explicitConcatenation: withConcatenation.join(''),
      postfix: postfix.join(''),
      nfa,
      dfa,
      minimizedDfa,
      steps: describeSteps(regex, tokens, withConcatenation, postfix, nfa, dfa, minimizedDfa),
    };
  } catch (error) {
    // Callers only ever need to handle one error shape. A CompilerError is
    // already in that shape; anything else is a bug and becomes an internal one.
    if (error instanceof CompilerError) {
      throw error;
    }
    throw new InternalCompilerError(
      'Something went wrong while building the automaton.',
      `Unexpected failure while compiling ${JSON.stringify(regex)}: ${String(error)}`
    );
  }
}

/** Pluralises a count so the generated descriptions read naturally. */
function count(n: number, singular: string, plural = `${singular}s`): string {
  return `${n} ${n === 1 ? singular : plural}`;
}

/**
 * Builds the per-run stage explanations.
 *
 * These describe what actually happened to THIS expression - the counts and
 * strings come from the real pipeline output, never from a lookup table. The
 * ids and titles match `PIPELINE_STEPS`, which Person 3 builds the step
 * navigation against.
 */
function describeSteps(
  input: string,
  tokens: string[],
  withConcatenation: string[],
  postfix: string[],
  nfa: NFA,
  dfa: DFA,
  minimizedDfa: DFA
): CompilationStep[] {
  const alphabet = nfa.alphabet.length > 0 ? nfa.alphabet.join(', ') : 'none';
  const insertedDots = withConcatenation.length - tokens.length;
  const epsilonCount = nfa.transitions.filter((transition) => transition.symbol === null).length;
  const removed = dfa.states.length - minimizedDfa.states.length;

  return [
    {
      id: 'input',
      title: 'Regular Expression',
      description: `"${input}" passed validation. Its alphabet is { ${alphabet} }.`,
    },
    {
      id: 'tokens',
      title: 'Tokenization',
      description: `The expression split into ${count(tokens.length, 'token')}: ${tokens.join(' ')}`,
    },
    {
      id: 'concatenation',
      title: 'Explicit Concatenation',
      description:
        insertedDots === 0
          ? 'No concatenation was implied, so the expression is unchanged.'
          : `${count(insertedDots, 'concatenation operator')} inserted where concatenation was implied: ${withConcatenation.join('')}`,
    },
    {
      id: 'postfix',
      title: 'Postfix Notation',
      description: `The shunting-yard algorithm reordered the expression into ${postfix.join('')}, removing the parentheses.`,
    },
    {
      id: 'nfa',
      title: `${EPSILON_DISPLAY}-NFA (Thompson)`,
      description: `Thompson's construction built ${count(nfa.states.length, 'state')} joined by ${count(nfa.transitions.length, 'transition')}, ${count(epsilonCount, `${EPSILON_DISPLAY}-transition`)} of them.`,
    },
    {
      id: 'dfa',
      title: 'DFA (Subset Construction)',
      description: `Each ${EPSILON_DISPLAY}-closed set of NFA states became one deterministic state, giving ${count(dfa.states.length, 'state')} of which ${count(dfa.acceptStates.length, 'is accepting', 'are accepting')}.`,
    },
    {
      id: 'minimized',
      title: 'Minimized DFA',
      description:
        removed === 0
          ? `The DFA was already minimal: ${count(minimizedDfa.states.length, 'state')}, none equivalent.`
          : `Merging equivalent states and dropping unreachable ones removed ${count(removed, 'state')}, leaving ${count(minimizedDfa.states.length, 'state')}.`,
    },
    {
      id: 'simulation',
      title: 'String Simulation',
      description: `Run a string over { ${alphabet} } through the minimized DFA to see it accepted or rejected.`,
    },
  ];
}

/**
 * The canonical stage list - ids, titles and generic descriptions.
 *
 * Person 3 builds the step navigation against this; `compileRegex` returns
 * run-specific descriptions with the same ids and titles in
 * `CompilationResult.steps`. Keep the ids in sync with `CompilationStepId`.
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
    title: `${EPSILON_DISPLAY}-NFA (Thompson)`,
    description: `Thompson's construction builds a non-deterministic automaton with ${EPSILON_DISPLAY}-transitions from the postfix form.`,
  },
  {
    id: 'dfa',
    title: 'DFA (Subset Construction)',
    description: `Subset construction turns each ${EPSILON_DISPLAY}-closed set of NFA states into a single deterministic state.`,
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
