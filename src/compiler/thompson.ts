/**
 * Stage 5 - Thompson's construction.
 *
 * OWNER: Person 1.
 * CONTRACT: builds an epsilon-NFA from the postfix token list.
 *
 * Structural rules (one start state, one accept state per fragment):
 *   literal a   start -a-> accept
 *   concat  st  accept(s) -eps-> start(t)
 *   union   s|t new start -eps-> start(s), start(t); both accepts -eps-> new accept
 *   star    s*  new start -eps-> start(s) and -eps-> new accept;
 *               accept(s) -eps-> start(s) and -eps-> new accept
 *
 * Output invariants:
 *  - state ids are 0..n-1, assigned in allocation order (STATE ID CONTRACT)
 *  - `acceptStates` has exactly one element
 *  - epsilon transitions use `symbol: null` (EPSILON CONTRACT)
 *  - `alphabet` lists the distinct literals only, never `null`
 *
 * Every rule adds a constant number of states and transitions and never
 * revisits a state it already built, so the NFA is linear in the size of the
 * expression.
 */

import { InternalCompilerError } from './errors';
import { collectAlphabet, isLiteral } from './tokenizer';
import { EPSILON, type NFA, type Transition } from './types';

/**
 * A partially built automaton on the construction stack. Every fragment has
 * exactly one start and one accept state, which is what makes the four
 * combining rules uniform.
 */
interface Fragment {
  start: number;
  accept: number;
}

/** Builds an epsilon-NFA from a postfix token list. */
export function thompsonConstruction(postfix: string[]): NFA {
  // State ids are handed out in allocation order, which makes the whole
  // construction deterministic: the same postfix always yields the same NFA.
  let nextStateId = 0;
  const transitions: Transition[] = [];
  const stack: Fragment[] = [];

  const newState = (): number => {
    const id = nextStateId;
    nextStateId += 1;
    return id;
  };

  const connect = (from: number, to: number, symbol: string | null): void => {
    transitions.push({ from, to, symbol });
  };

  /** Pops one fragment, or reports the malformed postfix that caused it. */
  const pop = (operator: string): Fragment => {
    const fragment = stack.pop();
    if (fragment === undefined) {
      throw new InternalCompilerError(
        'The automaton could not be built from this expression.',
        `Operator ${JSON.stringify(operator)} had too few operands on the stack.`
      );
    }
    return fragment;
  };

  for (const token of postfix) {
    if (isLiteral(token)) {
      const start = newState();
      const accept = newState();
      connect(start, accept, token);
      stack.push({ start, accept });
      continue;
    }

    switch (token) {
      case '.': {
        // The right operand was pushed last, so it pops first.
        const right = pop('.');
        const left = pop('.');
        connect(left.accept, right.start, EPSILON);
        stack.push({ start: left.start, accept: right.accept });
        break;
      }

      case '|': {
        const right = pop('|');
        const left = pop('|');
        const start = newState();
        const accept = newState();
        connect(start, left.start, EPSILON);
        connect(start, right.start, EPSILON);
        connect(left.accept, accept, EPSILON);
        connect(right.accept, accept, EPSILON);
        stack.push({ start, accept });
        break;
      }

      case '*': {
        const inner = pop('*');
        const start = newState();
        const accept = newState();
        connect(start, inner.start, EPSILON); // enter the loop at least once
        connect(start, accept, EPSILON); // or skip it entirely (zero repetitions)
        connect(inner.accept, inner.start, EPSILON); // repeat
        connect(inner.accept, accept, EPSILON); // or leave
        stack.push({ start, accept });
        break;
      }

      default:
        throw new InternalCompilerError(
          'The automaton could not be built from this expression.',
          `Unrecognised postfix token ${JSON.stringify(token)}.`
        );
    }
  }

  if (stack.length !== 1) {
    throw new InternalCompilerError(
      'The automaton could not be built from this expression.',
      `Expected exactly one fragment on the stack, found ${stack.length}.`
    );
  }

  const fragment = stack[0];

  return {
    states: Array.from({ length: nextStateId }, (_, id) => id),
    alphabet: collectAlphabet(postfix),
    startState: fragment.start,
    acceptStates: [fragment.accept],
    transitions,
  };
}
