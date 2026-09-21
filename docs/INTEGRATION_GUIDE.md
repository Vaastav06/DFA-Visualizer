# Integration Guide

How the three modules get wired together in Phase 3, and what to do when they
disagree.

## The three seams

```text
seam 1   compiler ──▶ UI          compileRegex() result into React state
seam 2   compiler ──▶ visualization   NFA/DFA into graph props
seam 3   visualization ──▶ UI     graph components placed in the page
```

All three meet in one file: `src/pages/HomePage.tsx`. That is deliberate - if
integration goes wrong, there is exactly one place to look.

## Seam 1 - compiler into the UI

Already wired. `useCompiler` calls `compileRegex`, catches `CompilerError` and
exposes `{ result, error, isCompiling, compile, reset }`. `AppContext` provides
it; `HomePage` consumes it.

Nothing to do at integration time except delete the fixture Person 3 was using:

```tsx
// during Phase 2
const result = MOCK_COMPILATION_RESULT;

// after integration
const { result } = useAppContext();
```

**Watch for:** `result` is `CompilationResult | null`. Every consumer must
handle `null`. The fixture is never null, so this is the first thing that breaks.

## Seam 2 - compiler into the visualization

The graphs take contract types directly:

```tsx
<NfaGraph nfa={result.nfa} />
<DfaGraph dfa={result.dfa} />
<DfaGraph dfa={result.minimizedDfa} kind="minimized-dfa" />
```

No transformation in between. If a transformation seems necessary, the contract
is wrong and the fix belongs in `types.ts`, not in an ad-hoc mapper in
`HomePage`.

**Watch for:**

- an empty `alphabet` for an expression over one symbol
- an NFA with a state that has no outgoing transitions (normal - the accept
  state)
- a DFA whose `transitions` is shorter than `states.length * alphabet.length`,
  because the dead state is not materialised

## Seam 3 - visualization into the UI

The UI places the graphs inside `StepContent` and passes `highlight` during
simulation:

```tsx
<DfaGraph
  dfa={result.minimizedDfa}
  highlight={{ states: [currentState], transitions: [currentTransition] }}
/>
```

The UI owns the animation timer and the current step index. The graph only
draws. Do not move the timer into the graph to "make it simpler" - then two
graphs on one page animate independently and neither matches the trace.

## Integration order

Do it in this order. Each step is verifiable before the next.

1. **Compiler alone.** Person 1 runs `compileRegex` on every example and checks
   the results against the textbook. No UI involved.
2. **Compiler into graphs.** Replace `MOCK_NFA` with `compileRegex(...).nfa` in
   one visualization test. If the graph still renders, seam 2 is good.
3. **Compiler into the UI.** Person 3 swaps `MOCK_COMPILATION_RESULT` for
   `useAppContext().result` and handles `null`.
4. **Graphs into the page.** Place `<NfaGraph />` and `<DfaGraph />` in
   `StepContent`.
5. **Simulation.** Wire `simulate()` into `StringSimulator`, then the
   `highlight` prop back into the graph.
6. **End-to-end test** in `tests/integration/`.

## Verification checklist

Walk through this together, all three people, with `(a|b)*abb`:

- [ ] the expression compiles without an error
- [ ] tokens show as nine tokens
- [ ] explicit concatenation inserted the dots in the right places
- [ ] the postfix string is well formed
- [ ] the NFA graph draws, with dashed epsilon edges
- [ ] the NFA has exactly one accept state, double-bordered
- [ ] the start state has an incoming arrow
- [ ] the DFA graph draws with no epsilon edges
- [ ] the DFA mapping table shows subsets like `{1, 3, 4}`
- [ ] the minimized DFA has no more states than the DFA
- [ ] `abb`, `aabb`, `babb` are accepted
- [ ] `ab`, `a`, empty string are rejected
- [ ] simulation highlights the right state at each step
- [ ] an invalid expression shows a readable error, and the app stays usable
- [ ] nothing in the console

Then repeat for `a`, `a*` and `(a|b)(c|d)`. Those three catch the edge cases:
single state, self-loop, and a four-symbol alphabet.

## When the modules disagree

A mismatch at integration is a contract question, not a patching exercise.

1. **Read `DATA_CONTRACTS.md`.** Whoever violated the documented contract fixes
   their side.
2. **If the contract is silent**, the three of you decide, then write the
   decision into `DATA_CONTRACTS.md` so it cannot recur.
3. **If the contract is wrong**, change `types.ts` and the doc together, then
   run `npm run build` to find everyone it affects.

Never adapt around a mismatch in `HomePage`. A conversion function that exists
only because two modules disagree is the mismatch, preserved.

## Likely mismatches

Worth checking early, because they are the ones that actually happen:

| Symptom                                    | Cause                                                                    |
| ------------------------------------------ | ------------------------------------------------------------------------ |
| epsilon edges labelled `null`              | the adapter compares against a string, not `null`                        |
| a state labelled `undefined`               | a label built from a missing id                                          |
| the graph shows fewer edges than the table | parallel transitions merged (correct) - the table should still list both |
| the minimized DFA has more states          | minimization added a dead state it should have dropped                   |
| `acceptStates` and `isAccepting` disagree  | one was updated after minimization and not the other                     |
| an accepting state has no double border    | the flag did not reach the node data                                     |

## After integration

- Delete fixture imports from production code. Fixtures stay in `tests/`.
- Update `TEAM_STATUS.md`.
- Tick the integration items in `TASKS.md`.
- Run all four checks on `main`.
