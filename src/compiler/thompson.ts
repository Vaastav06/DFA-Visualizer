/**
 * Stage 5 — Thompson's construction.
 *
 * OWNER: Person 1.
 * CONTRACT: builds an epsilon-NFA from the postfix token list.
 *
 * Structural rules (one start state, one accept state per fragment):
 *   literal a   start -a-> accept
 *   concat  st  accept(s) -ε-> start(t)
 *   union   s|t new start -ε-> start(s), start(t); both accepts -ε-> new accept
 *   star    s*  new start -ε-> start(s) and -ε-> new accept;
 *               accept(s) -ε-> start(s) and -ε-> new accept
 *
 * Output invariants:
 *  - state ids are 0..n-1, assigned in allocation order (STATE ID CONTRACT)
 *  - `acceptStates` has exactly one element
 *  - epsilon transitions use `symbol: null` (EPSILON CONTRACT)
 *  - `alphabet` lists the distinct literals only, never `null`
 */

import { RegexSyntaxError } from './errors';
import type { NFA, Transition } from './types';
import { EPSILON } from './types';

interface NFAFragment {
  start: number;
  accept: number;
}

function createState(): number {
  return stateCounter++;
}

let stateCounter = 0;

function resetStateCounter(): void {
  stateCounter = 0;
}

function addTransition(transitions: Transition[], from: number, to: number, symbol: string | null): void {
  transitions.push({ from, to, symbol });
}

/** Builds an epsilon-NFA from a postfix token list. */
export function thompsonConstruction(postfix: string[]): NFA {
  resetStateCounter();

  const transitions: Transition[] = [];
  const alphabet = new Set<string>();
  const stack: NFAFragment[] = [];

  for (const token of postfix) {
    if (isLiteral(token)) {
      const start = createState();
      const accept = createState();
      addTransition(transitions, start, accept, token);
      alphabet.add(token);
      stack.push({ start, accept });
    } else if (token === '.') {
      // Concatenation: pop two fragments, connect first's accept to second's start via epsilon
      if (stack.length < 2) {
        throw new RegexSyntaxError('INTERNAL_ERROR', 'Stack underflow during concatenation.');
      }
      const right = stack.pop()!;
      const left = stack.pop()!;
      addTransition(transitions, left.accept, right.start, EPSILON);
      stack.push({ start: left.start, accept: right.accept });
    } else if (token === '|') {
      // Union: pop two fragments, create new start and accept
      if (stack.length < 2) {
        throw new RegexSyntaxError('INTERNAL_ERROR', 'Stack underflow during union.');
      }
      const right = stack.pop()!;
      const left = stack.pop()!;
      const start = createState();
      const accept = createState();
      addTransition(transitions, start, left.start, EPSILON);
      addTransition(transitions, start, right.start, EPSILON);
      addTransition(transitions, left.accept, accept, EPSILON);
      addTransition(transitions, right.accept, accept, EPSILON);
      stack.push({ start, accept });
    } else if (token === '*') {
      // Kleene star: pop one fragment, create new start and accept with epsilon loops
      if (stack.length < 1) {
        throw new RegexSyntaxError('INTERNAL_ERROR', 'Stack underflow during star.');
      }
      const fragment = stack.pop()!;
      const start = createState();
      const accept = createState();
      addTransition(transitions, start, fragment.start, EPSILON);
      addTransition(transitions, start, accept, EPSILON);
      addTransition(transitions, fragment.accept, fragment.start, EPSILON);
      addTransition(transitions, fragment.accept, accept, EPSILON);
      stack.push({ start, accept });
    } else {
      throw new RegexSyntaxError('INVALID_CHARACTER', `Unknown token "${token}" in postfix.`);
    }
  }

  if (stack.length !== 1) {
    throw new RegexSyntaxError('INTERNAL_ERROR', `Invalid postfix expression: stack has ${stack.length} elements.`);
  }

  const { start, accept } = stack[0];

  // Collect all states (0 to stateCounter-1)
  const states: number[] = [];
  for (let i = 0; i < stateCounter; i++) {
    states.push(i);
  }

  return {
    states,
    alphabet: Array.from(alphabet).sort(),
    startState: start,
    acceptStates: [accept],
    transitions,
  };
}

function isLiteral(token: string): boolean {
  return (
    token.length === 1 &&
    token !== '|' &&
    token !== '.' &&
    token !== '*' &&
    token !== '(' &&
    token !== ')'
  );
}
