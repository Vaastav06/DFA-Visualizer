# Data Contracts

## Source of truth

```text
docs/DATA_CONTRACTS.md      describes the INTENT
            ↓
src/compiler/types.ts       IS the contract
```

The TypeScript file wins. If the two ever disagree, the code is right and this
document is stale — and whoever changed the code without updating this document
owes the team a fix. **A change to `types.ts` and a change to this file belong
in the same commit.**

## The two permanent contracts

### 1. Epsilon contract

```text
internally:  null
displayed:   ε
```

`transition.symbol === null` means an ε-transition. Nothing else does.

These are **banned** as internal representations of epsilon:

```text
"ε"   "epsilon"   "E"   "EPSILON"   ""   undefined
```

Two constants in `types.ts` make the boundary explicit:

```ts
export const EPSILON: Epsilon = null; // the data
export const EPSILON_DISPLAY = 'ε'; // the glyph
```

Use `EPSILON_DISPLAY` in a label, a table header or an edge caption. Never store
it, never compare against it, never put it in an `alphabet` array.

Why: string comparisons for epsilon are the single most common source of bugs in
a project like this, because `"ε"` and `"epsilon"` both look correct in a code
review and neither is obviously wrong in a debugger. `null` cannot be confused
with a symbol, and TypeScript forces every consumer to handle it.

### 2. State ID contract

```text
data:      0, 1, 2, 3, ...
displayed: q0, q1, q2, q3, ...
```

State ids are plain non-negative integers. They are dense (`0..n-1`) and
assigned in construction order, so state `0` is always the start state of a DFA.

`"q0"` is a **label**, produced at render time by `formatStateId(id)` in
`src/hooks/useCompiler.ts`. It never appears in an `NFA`, a `DFA`, a
`Transition` or a `SimulationResult`.

Why: ids get compared, sorted, used as `Set` members and as map keys. Numbers do
all of that correctly and cheaply; `"q10" < "q9"` is true for strings, which is
exactly the sort of bug nobody finds until the demo.

## The types

### `Transition`

```ts
interface Transition {
  from: number; // source state id
  to: number; // target state id
  symbol: string | null; // one alphabet symbol, or null for ε
}
```

A transition is a value, not an identity — two transitions with the same three
fields are the same transition. Do not add an `id` field.

### `NFA`

```ts
interface NFA {
  states: number[];
  alphabet: string[]; // never contains null
  startState: number;
  acceptStates: number[];
  transitions: Transition[];
}
```

Invariants the producer must guarantee and the consumers may rely on:

- `startState` ∈ `states`
- `acceptStates` ⊆ `states`
- for every transition, `from` ∈ `states` and `to` ∈ `states`
- `alphabet` holds only real symbols; ε is **not** an alphabet member
- after Thompson's construction, `acceptStates.length === 1`
- multiple transitions may share a `(from, symbol)` pair — that is what makes it
  non-deterministic

### `DFAState`

```ts
interface DFAState {
  id: number;
  nfaStates: number[]; // the NFA subset this state was built from
  isAccepting: boolean;
}
```

`nfaStates` is ascending and duplicate-free. It is what the "DFA mapping" table
shows the student:

```text
q0 = {0, 1, 3}
q1 = {2, 5}   accepting
```

After minimization a state may represent several original DFA states; its
`nfaStates` is then the union of theirs. The array stays meaningful (it is still
"the NFA states this DFA state corresponds to") but it is no longer a single
subset-construction result. The UI should say so where it matters.

### `DFA`

```ts
interface DFA {
  states: DFAState[];
  alphabet: string[];
  startState: number;
  acceptStates: number[];
  transitions: Transition[];
}
```

Additional invariants beyond the NFA ones:

- **no ε-transitions** — `symbol` is never `null`
- **deterministic** — at most one transition per `(from, symbol)` pair
- `acceptStates` contains exactly the ids of states with `isAccepting: true`
  (the duplication is deliberate: graphs want the flag, tables want the list)

Note the redundancy between `states[i].isAccepting` and `acceptStates`. Keeping
both in sync is the producer's job. `tests/compiler/contract.test.ts` checks it.

### `CompilationStep`

```ts
interface CompilationStep {
  id: string; // one of CompilationStepId
  title: string; // shown on the step tab
  description: string; // one or two sentences, for a student
}
```

The compiler produces these so the UI does not hard-code explanatory prose. The
canonical ordering and titles live in `PIPELINE_STEPS` in
`src/compiler/compiler.ts`.

### `CompilationResult`

```ts
interface CompilationResult {
  input: string; // exactly what the user typed
  tokens: string[]; // stage 2 output
  explicitConcatenation: string; // stage 3 output, as a display string
  postfix: string; // stage 4 output, as a display string
  nfa: NFA; // stage 5 output
  dfa: DFA; // stage 7 output
  minimizedDfa: DFA; // stage 8 output
  steps: CompilationStep[];
}
```

This is the **only** value the compiler hands to the rest of the app. If the UI
needs something, it goes in here — not into a second function that the UI has to
remember to call.

`explicitConcatenation` and `postfix` are display strings (`"(a|b)*.a.b.b"`),
not arrays, because that is what the UI renders. The stage functions work on
`string[]` internally; `compileRegex` joins them.

### `SimulationStep` and `SimulationResult`

```ts
interface SimulationStep {
  index: number; // position in the input string
  symbol: string; // the character consumed
  fromState: number;
  toState: number | null; // null = no transition, the run stops here
}

interface SimulationResult {
  input: string;
  accepted: boolean;
  steps: SimulationStep[];
  path: number[]; // path[0] is always dfa.startState
  rejectedAt?: number; // index where the run stopped early, if it did
}
```

Rejection is a **result**, not an error. `simulate` does not throw for a string
the DFA does not accept, and the UI does not route it to `<ErrorDisplay />`.

## Changing a contract

1. Raise it with the other two people first. A contract change stops both of
   them.
2. Change `src/compiler/types.ts`.
3. Update this document in the same commit.
4. Update `tests/fixtures/mockAutomata.ts` — it is typed against the contract,
   so a break shows up as a compile error immediately.
5. Run `npm run build` to see who else breaks.
6. Say so in the team channel and in `TEAM_STATUS.md`.

## Mock data

`tests/fixtures/mockAutomata.ts` holds hand-written automata that conform to
these types:

| Fixture                   | What it is                                     |
| ------------------------- | ---------------------------------------------- |
| `MOCK_NFA`                | Thompson ε-NFA for `a\|b`, 6 states            |
| `MOCK_DFA`                | subset construction of the above, 3 states     |
| `MOCK_MINIMIZED_DFA`      | the above minimized, 2 states                  |
| `MOCK_DFA_WITH_SELF_LOOP` | one state with a self-loop, for edge rendering |
| `MOCK_COMPILATION_RESULT` | a full `CompilationResult` for `a\|b`          |

They exist so Person 2 and Person 3 can work before Person 1 finishes. They are
illustrations of the right **shape**, not a specification of Person 1's output —
never assert that `compileRegex('a|b')` deep-equals `MOCK_NFA`.
