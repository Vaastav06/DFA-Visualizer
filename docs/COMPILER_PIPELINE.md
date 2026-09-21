# Compiler Pipeline

## The pipeline

```text
          Regular Expression        "(a|b)*abb"
                  │
                  ▼
        ┌───────────────────┐
        │  1  Validation    │  validator.ts        throws or returns
        └─────────┬─────────┘
                  ▼
        ┌───────────────────┐
        │  2  Tokenization  │  tokenizer.ts        string   -> string[]
        └─────────┬─────────┘
                  ▼
        ┌───────────────────┐
        │  3  Explicit "."  │  explicitConcatenation.ts
        └─────────┬─────────┘                      string[] -> string[]
                  ▼
        ┌───────────────────┐
        │  4  Postfix       │  infixToPostfix.ts   string[] -> string[]
        └─────────┬─────────┘
                  ▼
        ┌───────────────────┐
        │  5  Thompson      │  thompson.ts         string[] -> NFA
        └─────────┬─────────┘
                  ▼               epsilon-NFA
        ┌───────────────────┐
        │  6  eps-closure   │  epsilonClosure.ts   helper for stage 7
        └─────────┬─────────┘
                  ▼
        ┌───────────────────┐
        │  7  Subset constr.│  subsetConstruction.ts   NFA -> DFA
        └─────────┬─────────┘
                  ▼               DFA
        ┌───────────────────┐
        │  8  Minimization  │  minimizeDfa.ts      DFA -> DFA
        └─────────┬─────────┘
                  ▼               minimized DFA
        ┌───────────────────┐
        │  9  Simulation    │  simulator.ts        DFA x string -> SimulationResult
        └───────────────────┘                      (on demand, not part of compile)
```

Stages 1-8 run inside `compileRegex`. Stage 9 runs when the user types a test
string, so it is exported separately.

---

## Stage 1 - Validation

**File** `src/compiler/validator.ts` - **Signature** `validate(regex: string): void`

Rejects malformed input before any other stage sees it. Returns nothing on
success; throws `RegexSyntaxError` on failure.

| Condition                           | Code                        |
| ----------------------------------- | --------------------------- |
| empty or whitespace-only            | `EMPTY_INPUT`               |
| character outside the supported set | `INVALID_CHARACTER`         |
| `(` without `)` or vice versa       | `UNBALANCED_PARENTHESES`    |
| `()`                                | `EMPTY_GROUP`               |
| leading star or bar, trailing bar   | `INVALID_OPERATOR_POSITION` |
| `**`, bar-star, open-bar, bar-close | `DANGLING_OPERATOR`         |

Every later stage may assume its input is well formed. That assumption is what
lets stages 2-8 stay short: they do not each re-check the syntax.

**Contract:** never returns a partial verdict. Either the expression is valid or
an error is thrown with a `position` pointing at the offending character.

---

## Stage 2 - Tokenization

**File** `src/compiler/tokenizer.ts` - **Signature** `tokenize(regex: string): string[]`

Splits the expression into one token per meaningful character. With the current
specification every token is a one-character string, so this stage is almost
trivial. It exists because the visible token list is part of the teaching value,
and because it is where multi-character literals would be added later.

```text
"(a|b)*abb"  ->  ["(", "a", "|", "b", ")", "*", "a", "b", "b"]
```

Whitespace is dropped. No synthetic tokens are added here; explicit
concatenation is stage 3, deliberately separate so the student can watch the
insertion happen.

---

## Stage 3 - Explicit concatenation

**File** `src/compiler/explicitConcatenation.ts`

**Signature** `insertExplicitConcatenation(tokens: string[]): string[]`

Concatenation is written by juxtaposition (`ab` means "a then b"), which the
shunting-yard algorithm cannot see. This stage makes it visible by inserting the
internal operator `.`.

Insert a `.` between `left` and `right` when:

| `left` is             | and `right` is   |
| --------------------- | ---------------- |
| a literal, `)` or `*` | a literal or `(` |

```text
["(", "a", "|", "b", ")", "*", "a", "b", "b"]
     ->  ["(", "a", "|", "b", ")", "*", ".", "a", ".", "b", ".", "b"]
```

`.` is an INTERNAL operator. The user cannot type it as a literal - see
`REGEX_SPECIFICATION.md`.

---

## Stage 4 - Infix to postfix

**File** `src/compiler/infixToPostfix.ts`

**Signature** `infixToPostfix(tokens: string[]): string[]`

The shunting-yard algorithm. Parentheses disappear; the output contains only
literals and operators, in an order where every operator's operands are already
available on the stack.

Precedence, highest binds tightest:

| Operator | Meaning       | Arity          | Precedence |
| -------- | ------------- | -------------- | ---------- |
| `*`      | Kleene star   | unary, postfix | 3          |
| `.`      | concatenation | binary, left   | 2          |
| bar      | alternation   | binary, left   | 1          |

```text
["(", "a", "|", "b", ")", "*", ".", "a", ".", "b", ".", "b"]
     ->  ["a", "b", "|", "*", "a", ".", "b", ".", "b", "."]
```

Postfix is what makes stage 5 a single left-to-right pass over a stack. That is
the whole reason this stage exists.

---

## Stage 5 - Thompson construction

**File** `src/compiler/thompson.ts`

**Signature** `thompsonConstruction(postfix: string[]): NFA`

Walks the postfix tokens with a stack of NFA fragments. Every fragment has
exactly one start state and exactly one accept state, which is what makes the
combining rules uniform.

```text
literal a       (s) --a--> (f)

concatenation   accept(s) gets an eps-transition to start(t);
  s . t         new start = start(s), new accept = accept(t)

alternation            .--eps--> start(s) ... accept(s) --eps--.
  s | t         (new)--|                                        |--> (new)
                       '--eps--> start(t) ... accept(t) --eps--'

Kleene star            .-------------- eps --------------.
  s*            (new)--|                                  |--> (new)
                       '--eps--> start(s) ... accept(s) --'
                                     ^             |
                                     '---- eps ----'
```

**Output invariants**

- state ids `0..n-1`, assigned in allocation order
- exactly one accept state
- eps-transitions use `symbol: null`
- `alphabet` holds the distinct literals, never `null`

**Why this construction:** every rule adds a constant number of states and
transitions, so the NFA is linear in the size of the regex, and no rule ever
revisits states it already built. That makes it easy to implement and easy to
draw.

---

## Stage 6 - Epsilon closure

**File** `src/compiler/epsilonClosure.ts`

**Signatures** `epsilonClosure(nfa, states): number[]` and
`move(nfa, states, symbol): number[]`

Pure set operations, no mutation.

- `epsilonClosure(nfa, S)` - every state reachable from `S` by zero or more
  eps-transitions, INCLUDING `S` itself. Implement with a stack or a queue, and
  mark visited states: a cycle (which `*` always creates) will otherwise hang it.
- `move(nfa, S, a)` - every state reachable from `S` by exactly one transition
  on `a`. No eps steps.

Both return sorted, duplicate-free arrays. That is not cosmetic: subset
construction uses the array as a set identity, and `stateSetKey()` depends on a
canonical order.

---

## Stage 7 - Subset construction

**File** `src/compiler/subsetConstruction.ts`

**Signature** `subsetConstruction(nfa: NFA): DFA`

Each DFA state IS an eps-closed set of NFA states.

```text
start:  D0 = eps-closure({nfa.startState})
loop:   for each unmarked DFA state D and each symbol a:
            U = eps-closure(move(D, a))
            if U is non-empty:
                if U is new, add it as a new DFA state
                add transition D --a--> U
accept: a DFA state accepts iff its set contains an NFA accept state
```

**Output invariants**

- ids `0..n-1` in discovery order; `0` is the start state
- `DFAState.nfaStates` holds the subset, ascending and unique
- no eps-transitions

**Dead-state policy:** the empty set is NOT materialised as a state. A missing
transition means "reject". The DFA is therefore partial, not total.

Why: a trap state adds a node with a self-loop on every symbol to every graph,
which multiplies the visual noise for something that carries no information for
a student. The simulator handles a missing transition explicitly
(`toState: null`) and the UI renders it as an em dash. If a total DFA is ever
needed, add the dead state as a display option, not in the data.

---

## Stage 8 - Minimization

**File** `src/compiler/minimizeDfa.ts` - **Signature** `minimizeDfa(dfa: DFA): DFA`

Produces the smallest DFA recognising the same language.

1. Remove states unreachable from the start state.
2. Remove dead states - those from which no accepting state is reachable.
3. Partition the rest into accepting and non-accepting.
4. Refine: split any block whose members disagree on which block a symbol leads
   to. Repeat until nothing splits. The implementation uses Moore's partition
   refinement; Hopcroft and the table-filling method give the same answer.
5. Each final block becomes one state, renumbered by BFS from the start block.

**Output invariants**

- the input DFA is NOT mutated - return a new object
- ids renumbered `0..m-1`; `0` is the start state
- a merged state's `nfaStates` is the union of its members', ascending and unique

Step 2 is what keeps the result minimal under the partial-DFA contract (D-006).
A state whose language is empty can simply be deleted, because a missing
transition already means "reject". Subset construction never produces one -
every state of a Thompson NFA can reach the accept state - but `minimizeDfa` is
also called on hand-built automata, and it must be minimal for those too.

Note the partial-DFA subtlety in step 4: with no dead state, "state p has no
transition on a" is itself a distinguishing property. Two states are equivalent
only if they agree on both which symbols they are defined for and where those
symbols lead. The implementation gives a missing transition its own signature
marker rather than ignoring the symbol. See `DECISIONS.md` D-015.

If every state is removed by steps 1 and 2, the language is empty and the result
is a single non-accepting state with no transitions.

---

## Stage 9 - Simulation

**File** `src/compiler/simulator.ts`

**Signature** `simulate(dfa: DFA, input: string): SimulationResult`

Runs a string through the DFA and records the full trace so the UI can animate
it.

```text
current = dfa.startState
for each character c at index i:
    find the transition (current, c)
    no transition, or c not in alphabet
        -> record toState: null, set rejectedAt: i, stop
    otherwise
        -> record the step, current = target
accepted = whole input consumed AND current is an accept state
```

**Rules**

- the empty string is valid input; accepted iff the start state accepts
- `path[0]` is always `dfa.startState`
- rejection is a RESULT, not an error: `simulate` does not throw for a string
  the DFA rejects
- the trace is complete even on rejection, so the UI can show where it failed

---

## Worked example

```text
input           (a|b)*abb
tokens          ( a | b ) * a b b
explicit .      ( a | b ) * . a . b . b
postfix         a b | * a . b . b .
eps-NFA         Thompson: 14 states, one accept state
DFA             subset construction: 5 reachable states
minimized DFA   4 states (two of the five were equivalent)
simulate "abb"  accepted
simulate "ab"   rejected
```

The NFA has 14 states because concatenation joins two fragments with an
eps-transition rather than merging their states. The dragon book's figure shows
11 for the same expression because it draws the merged form; both recognise the
same language, and the DFA that comes out of subset construction is the same
either way.

Exact state counts depend on the implementation's allocation order, which is why
they are not asserted in the fixtures. See `TESTING_STRATEGY.md` for what to
assert instead.
