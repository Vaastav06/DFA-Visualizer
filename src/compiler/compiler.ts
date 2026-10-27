/** Orchestrates direct regular-expression-to-DFA construction. */
import { constructDirectDFA } from './directDfa';
import { CompilerError, InternalCompilerError } from './errors';
import { insertExplicitConcatenation } from './explicitConcatenation';
import { calculateFirstpos } from './firstpos';
import { calculateFollowpos } from './followpos';
import { infixToPostfix } from './infixToPostfix';
import { calculateLastpos } from './lastpos';
import { calculateNullable } from './nullable';
import { assignPositions } from './positions';
import { buildSyntaxTree } from './syntaxTree';
import { collectAlphabet, tokenize } from './tokenizer';
import { validate } from './validator';
import type { CompilationResult, CompilationStep, FollowPosEntry, PositionInfo } from './types';

/** Compile a supported regular expression directly into a DFA. */
export function compileRegex(regex: string): CompilationResult {
  try {
    validate(regex);
    const tokens = tokenize(regex);
    const withConcatenation = insertExplicitConcatenation(tokens);
    const postfix = infixToPostfix(withConcatenation);
    const syntaxTree = buildSyntaxTree(postfix, true);
    const { positions, endMarkerPosition } = assignPositions(syntaxTree);
    calculateNullable(syntaxTree);
    calculateFirstpos(syntaxTree);
    calculateLastpos(syntaxTree);
    const followpos = calculateFollowpos(syntaxTree, positions);
    const alphabet = collectAlphabet(tokens);
    const dfa = constructDirectDFA(syntaxTree, alphabet, followpos, endMarkerPosition);

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
      steps: describeSteps(regex, tokens, withConcatenation, postfix, positions, followpos, dfa),
    };
  } catch (error) {
    if (error instanceof CompilerError) throw error;
    throw new InternalCompilerError(
      'Something went wrong while building the automaton.',
      `Unexpected failure while compiling ${JSON.stringify(regex)}: ${String(error)}`
    );
  }
}

function count(n: number, singular: string, plural = `${singular}s`): string {
  return `${n} ${n === 1 ? singular : plural}`;
}

function describeSteps(
  input: string,
  tokens: string[],
  withConcatenation: string[],
  postfix: string[],
  positions: PositionInfo[],
  followpos: FollowPosEntry[],
  dfa: CompilationResult['dfa']
): CompilationStep[] {
  const alphabet = dfa.alphabet.length ? dfa.alphabet.join(', ') : 'none';
  const insertedDots = withConcatenation.length - tokens.length;
  const positionsSummary = positions.map((p) => `${p.position}→'${p.symbol}'`).join(', ');
  return [
    {
      id: 'input',
      title: 'Regular Expression',
      description: `Validated expression: "${input}". Alphabet: { ${alphabet} }.`,
    },
    {
      id: 'tokens',
      title: 'Tokenization',
      description: `The expression splits into ${count(tokens.length, 'token')}: ${tokens.join(' ')}`,
    },
    {
      id: 'concatenation',
      title: 'Explicit Concatenation',
      description:
        insertedDots === 0
          ? 'No concatenation was implied.'
          : `${count(insertedDots, 'concatenation operator')} inserted: ${withConcatenation.join('')}`,
    },
    {
      id: 'postfix',
      title: 'Postfix Notation',
      description: `Shunting-yard conversion produces ${postfix.join('')}.`,
    },
    {
      id: 'syntaxTree',
      title: 'Syntax Tree & Positions',
      description: `The expression is augmented with # and assigned positions: ${positionsSummary}.`,
    },
    {
      id: 'followpos',
      title: 'Followpos Table',
      description: `Tree properties produce followpos sets for ${count(followpos.length, 'position')}.`,
    },
    {
      id: 'dfa',
      title: 'Direct DFA Construction',
      description: `Built ${count(dfa.states.length, 'state')} and ${count(dfa.transitions.length, 'transition')} over { ${alphabet} } from syntax-tree positions.`,
    },
    {
      id: 'simulation',
      title: 'String Simulation',
      description: `Trace an input string through the constructed DFA over { ${alphabet} }.`,
    },
  ];
}

export const PIPELINE_STEPS: readonly CompilationStep[] = [
  {
    id: 'input',
    title: 'Regular Expression',
    description: 'The validated expression and its alphabet.',
  },
  {
    id: 'tokens',
    title: 'Tokenization',
    description: 'Split the expression into literals, operators and parentheses.',
  },
  {
    id: 'concatenation',
    title: 'Explicit Concatenation',
    description: 'Make implicit concatenation explicit.',
  },
  {
    id: 'postfix',
    title: 'Postfix Notation',
    description: 'Convert the expression to postfix form.',
  },
  {
    id: 'syntaxTree',
    title: 'Syntax Tree & Positions',
    description: 'Augment the tree with # and number its leaves.',
  },
  {
    id: 'followpos',
    title: 'Followpos Table',
    description: 'Compute the position sets used by direct construction.',
  },
  {
    id: 'dfa',
    title: 'Direct DFA Construction',
    description: 'Construct DFA states and transitions from position sets.',
  },
  {
    id: 'simulation',
    title: 'String Simulation',
    description: 'Trace a string through the constructed DFA.',
  },
];
