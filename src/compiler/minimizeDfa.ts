/**
 * Stage 8 - DFA minimization.
 *
 * OWNER: Person 1.
 * CONTRACT: returns a NEW `DFA` recognising exactly the same language, with no
 * unreachable states, no dead states and no two distinguishable-equivalent
 * states.
 *
 * Algorithm: Moore's partition refinement.
 *   1. drop states unreachable from the start state
 *   2. drop dead states - those from which no accepting state is reachable
 *   3. split into accepting and non-accepting blocks
 *   4. refine: two states stay together only while, for every symbol, they
 *      lead into the same block. Repeat until no block splits.
 *   5. one state per surviving block, renumbered by BFS from the start block
 *
 * Step 2 is what keeps the result minimal under the partial-DFA contract
 * (docs/DECISIONS.md D-006). A state whose language is empty can simply be
 * deleted, because a missing transition already means "reject". Subset
 * construction never produces one - every state of a Thompson NFA can reach
 * the accept state - but `minimizeDfa` is also called on hand-built automata.
 *
 * The partial DFA also shapes step 4: "state p has no transition on a" is
 * itself a distinguishing property, so the signature below uses a dedicated
 * NO_BLOCK marker for it rather than ignoring the symbol.
 *
 * Output invariants:
 *  - the input DFA is not mutated
 *  - ids renumbered 0..m-1; state 0 is the start state
 *  - a merged state's `nfaStates` is the union of its members', ascending
 *    and unique
 */

import { InternalCompilerError } from './errors';
import type { DFA, DFAState, Transition } from './types';

/** Signature marker for "this state has no transition on this symbol". */
const NO_BLOCK = -1;

/** `from -> symbol -> to`, for the states given. */
type TransitionIndex = Map<number, Map<string, number>>;

function indexTransitions(transitions: Transition[]): TransitionIndex {
  const index: TransitionIndex = new Map();

  for (const transition of transitions) {
    if (transition.symbol === null) {
      throw new InternalCompilerError(
        'The automaton could not be minimized.',
        `A DFA must not contain epsilon transitions, but ${transition.from} -> ${transition.to} has one.`
      );
    }
    let row = index.get(transition.from);
    if (row === undefined) {
      row = new Map();
      index.set(transition.from, row);
    }
    row.set(transition.symbol, transition.to);
  }

  return index;
}

/** State ids reachable from `startState` by following transitions forwards. */
function findReachable(startState: number, index: TransitionIndex): Set<number> {
  const reachable = new Set<number>([startState]);
  const stack = [startState];

  while (stack.length > 0) {
    const state = stack.pop() as number;
    for (const target of index.get(state)?.values() ?? []) {
      if (!reachable.has(target)) {
        reachable.add(target);
        stack.push(target);
      }
    }
  }

  return reachable;
}

/**
 * State ids from which some accepting state is reachable. Computed by walking
 * the transitions backwards from the accepting states.
 */
function findLive(acceptStates: number[], transitions: Transition[]): Set<number> {
  const incoming = new Map<number, number[]>();
  for (const transition of transitions) {
    const sources = incoming.get(transition.to);
    if (sources === undefined) {
      incoming.set(transition.to, [transition.from]);
    } else {
      sources.push(transition.from);
    }
  }

  const live = new Set<number>(acceptStates);
  const stack = [...acceptStates];

  while (stack.length > 0) {
    const state = stack.pop() as number;
    for (const source of incoming.get(state) ?? []) {
      if (!live.has(source)) {
        live.add(source);
        stack.push(source);
      }
    }
  }

  return live;
}

/**
 * Moore's refinement. Returns one block (a list of state ids) per equivalence
 * class, given the states that survived pruning.
 */
function refinePartition(
  survivors: number[],
  alphabet: string[],
  index: TransitionIndex,
  accepting: Set<number>
): number[][] {
  // Accepting and non-accepting states can never be equivalent: the empty
  // string separates them. Everything else starts out assumed equivalent.
  let blocks: number[][] = [
    survivors.filter((state) => accepting.has(state)),
    survivors.filter((state) => !accepting.has(state)),
  ].filter((block) => block.length > 0);

  for (;;) {
    const blockOf = new Map<number, number>();
    blocks.forEach((block, blockIndex) => {
      for (const state of block) {
        blockOf.set(state, blockIndex);
      }
    });

    const next: number[][] = [];
    let didSplit = false;

    for (const block of blocks) {
      // Group this block's states by where each symbol takes them. States with
      // the same signature are still indistinguishable; the rest split off.
      const bySignature = new Map<string, number[]>();

      for (const state of block) {
        const signature = alphabet
          .map((symbol) => {
            const target = index.get(state)?.get(symbol);
            return target === undefined ? NO_BLOCK : (blockOf.get(target) ?? NO_BLOCK);
          })
          .join(',');

        const group = bySignature.get(signature);
        if (group === undefined) {
          bySignature.set(signature, [state]);
        } else {
          group.push(state);
        }
      }

      if (bySignature.size > 1) {
        didSplit = true;
      }
      next.push(...bySignature.values());
    }

    blocks = next;
    if (!didSplit) {
      return blocks;
    }
  }
}

/** Returns a minimized copy of `dfa`. */
export function minimizeDfa(dfa: DFA): DFA {
  const index = indexTransitions(dfa.transitions);
  const stateById = new Map(dfa.states.map((state) => [state.id, state]));
  const accepting = new Set(dfa.acceptStates);

  const reachable = findReachable(dfa.startState, index);
  const live = findLive(dfa.acceptStates, dfa.transitions);
  const survivors = dfa.states
    .map((state) => state.id)
    .filter((id) => reachable.has(id) && live.has(id));

  // Nothing survives only when the language is empty: no accepting state is
  // reachable from the start. The minimal automaton for that language is a
  // single non-accepting state with no transitions.
  if (!survivors.includes(dfa.startState)) {
    const start = stateById.get(dfa.startState);
    const startPositions = start?.positions
      ? [...start.positions]
      : start?.nfaStates
        ? [...start.nfaStates]
        : [];
    return {
      states: [
        { id: 0, positions: startPositions, nfaStates: [...startPositions], isAccepting: false },
      ],
      alphabet: [...dfa.alphabet],
      startState: 0,
      acceptStates: [],
      transitions: [],
    };
  }

  const blocks = refinePartition(survivors, dfa.alphabet, index, accepting);

  const blockOf = new Map<number, number>();
  blocks.forEach((block, blockIndex) => {
    for (const state of block) {
      blockOf.set(state, blockIndex);
    }
  });

  // Renumber by BFS from the start block, exploring symbols in alphabet order.
  // That makes the ids dense, deterministic, and 0 for the start state.
  const startBlock = blockOf.get(dfa.startState) as number;
  const newIdOfBlock = new Map<number, number>([[startBlock, 0]]);
  const order: number[] = [startBlock];

  for (let i = 0; i < order.length; i += 1) {
    // Any member represents the block: all of them agree on where each symbol
    // leads, which is exactly what refinement established.
    const representative = blocks[order[i]][0];
    for (const symbol of dfa.alphabet) {
      const target = index.get(representative)?.get(symbol);
      if (target === undefined) {
        continue;
      }
      const targetBlock = blockOf.get(target);
      if (targetBlock === undefined || newIdOfBlock.has(targetBlock)) {
        continue;
      }
      newIdOfBlock.set(targetBlock, newIdOfBlock.size);
      order.push(targetBlock);
    }
  }

  const states: DFAState[] = order.map((blockIndex) => {
    const members = blocks[blockIndex];
    // A merged state stands for all of its members, so its position set is the union
    // of theirs - see docs/DATA_CONTRACTS.md.
    const positions = new Set<number>();
    for (const member of members) {
      const memberState = stateById.get(member);
      const memberPositions = memberState?.positions ?? memberState?.nfaStates ?? [];
      for (const pos of memberPositions) {
        positions.add(pos);
      }
    }

    const sortedPositions = [...positions].sort((a, b) => a - b);
    return {
      id: newIdOfBlock.get(blockIndex) as number,
      positions: sortedPositions,
      nfaStates: [...sortedPositions],
      isAccepting: accepting.has(members[0]),
    };
  });

  const transitions: Transition[] = [];
  for (const blockIndex of order) {
    const representative = blocks[blockIndex][0];
    for (const symbol of dfa.alphabet) {
      const target = index.get(representative)?.get(symbol);
      if (target === undefined) {
        continue;
      }
      const targetBlock = blockOf.get(target);
      if (targetBlock === undefined) {
        continue;
      }
      transitions.push({
        from: newIdOfBlock.get(blockIndex) as number,
        to: newIdOfBlock.get(targetBlock) as number,
        symbol,
      });
    }
  }

  return {
    states: states.sort((a, b) => a.id - b.id),
    alphabet: [...dfa.alphabet],
    startState: 0,
    acceptStates: states.filter((state) => state.isAccepting).map((state) => state.id),
    transitions,
  };
}
