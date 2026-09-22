/**
 * Pipeline orchestrator - Direct Regular Expression to DFA Construction.
 *
 * OWNER: Person 1.
 * CONTRACT: `compileRegex` runs every stage of the direct construction pipeline
 * in order and assembles the inspectable `CompilationResult` that the rest of the
 * application consumes. It throws `CompilerError` (or a subclass) and nothing else.
 * Anything unexpected is wrapped in `InternalCompilerError`.
 *
 * Pipeline:
 *   validate -> tokenize -> insertExplicitConcatenation -> infixToPostfix
 *            -> buildSyntaxTree (augmented with #) -> assignPositions
 *            -> calculateNullable -> calculateFirstpos -> calculateLastpos
 *            -> calculateFollowpos -> constructDirectDFA -> minimizeDfa
 *
 * Direct DFA construction builds deterministic states directly from sets of
 * syntax tree leaf positions and followpos transitions — NO Thompson's construction,
 * NO ε-NFA, NO ε-closure, and NO subset construction.
 *
 * See docs/COMPILER_PIPELINE.md.
 */

import { constructDirectDFA } from './directDfa';
import { CompilerError, InternalCompilerError } from './errors';
import { insertExplicitConcatenation } from './explicitConcatenation';
import { calculateFirstpos } from './firstpos';
import { calculateFollowpos } from './followpos';
import { infixToPostfix } from './infixToPostfix';
import { calculateLastpos } from './lastpos';
import { minimizeDfa } from './minimizeDfa';
import { calculateNullable } from './nullable';
import { assignPositions } from './positions';
import { buildSyntaxTree } from './syntaxTree';
import { collectAlphabet, tokenize } from './tokenizer';
import { validate } from './validator';
import type {
  CompilationResult,
  CompilationStep,
  DFA,
  FollowPosEntry,
  PositionInfo,
} from './types';

/**
 * Compiles a regular expression directly into a DFA using syntax trees,
 * position numbering, nullable, firstpos, lastpos, and followpos calculation,
 * followed by DFA minimization.
 *
 * @throws {CompilerError} for invalid input or an internal failure.
 */
export function compileRegex(regex: string): CompilationResult {
  try {
    // 1. Validation
    validate(regex);

    // 2. Tokenization
    const tokens = tokenize(regex);

    // 3. Explicit Concatenation
    const withConcatenation = insertExplicitConcatenation(tokens);

    // 4. Infix to Postfix (Shunting-Yard)
    const postfix = infixToPostfix(withConcatenation);

    // 5. Augmented Syntax Tree with end-marker '#'
    const syntaxTree = buildSyntaxTree(postfix, true);

    // 6. Position Numbering (1-based left-to-right)
    const { positions, endMarkerPosition } = assignPositions(syntaxTree);

    // 7. Nullable, Firstpos, Lastpos
    calculateNullable(syntaxTree);
    calculateFirstpos(syntaxTree);
    calculateLastpos(syntaxTree);

    // 8. Followpos Table
    const followpos = calculateFollowpos(syntaxTree, positions);

    // 9. Direct DFA Construction
    const alphabet = collectAlphabet(tokens);
    const dfa = constructDirectDFA(syntaxTree, alphabet, followpos, endMarkerPosition);

    // 10. DFA Minimization
    const minimizedDfa = minimizeDfa(dfa);

    return {
      input: regex,
      tokens,
      explicitConcatenation: withConcatenation.join(''),
      postfix: postfix.join(''),
      syntaxTree,
      positions,
      analysis: {
        nullable: syntaxTree.nullable,
        firstpos: [...syntaxTree.firstpos],
        lastpos: [...syntaxTree.lastpos],
      },
      followpos,
      dfa,
      minimizedDfa,
      steps: describeSteps(
        regex,
        tokens,
        withConcatenation,
        postfix,
        positions,
        followpos,
        dfa,
        minimizedDfa
      ),
    };
  } catch (error) {
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
 * Builds the per-run stage explanations describing what actually happened to this expression.
 */
function describeSteps(
  input: string,
  tokens: string[],
  withConcatenation: string[],
  postfix: string[],
  positions: PositionInfo[],
  followpos: FollowPosEntry[],
  dfa: DFA,
  minimizedDfa: DFA
): CompilationStep[] {
  const alphabet = dfa.alphabet.length > 0 ? dfa.alphabet.join(', ') : 'none';
  const insertedDots = withConcatenation.length - tokens.length;
  const removed = dfa.states.length - minimizedDfa.states.length;
  const positionsSummary = positions.map((p) => `${p.position}→'${p.symbol}'`).join(', ');

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
      id: 'syntaxTree',
      title: 'Syntax Tree & Positions',
      description: `The expression was augmented with end-marker "#". Left-to-right leaf numbering assigned ${count(positions.length, 'position')}: ${positionsSummary}.`,
    },
    {
      id: 'followpos',
      title: 'Followpos Table',
      description: `Calculated nullable, firstpos, and lastpos for all tree nodes to produce followpos sets across ${count(followpos.length, 'position')}.`,
    },
    {
      id: 'dfa',
      title: 'Direct DFA Construction',
      description: `Direct DFA construction created ${count(dfa.states.length, 'state')} and ${count(dfa.transitions.length, 'transition')} using position sets, of which ${count(dfa.acceptStates.length, 'is accepting', 'are accepting')}.`,
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
    id: 'syntaxTree',
    title: 'Syntax Tree & Positions',
    description:
      'The expression is augmented with end-marker "#", parsed into a syntax tree, and leaf positions are numbered.',
  },
  {
    id: 'followpos',
    title: 'Followpos Table',
    description:
      'Nullable, firstpos, lastpos and followpos are computed for each position in the syntax tree.',
  },
  {
    id: 'dfa',
    title: 'Direct DFA Construction',
    description:
      'DFA states are constructed directly from sets of syntax-tree positions using followpos.',
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
