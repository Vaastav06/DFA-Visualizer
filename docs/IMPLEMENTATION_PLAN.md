# Implementation Plan

## Phase 1 - Repository foundation (COMPLETE)

Done by the project architect before the three developers started.

- [x] Vite + React + TypeScript project, verified building
- [x] Complete directory structure for all three areas
- [x] Shared type contract in `src/compiler/types.ts`
- [x] Epsilon contract and state-id contract decided and documented
- [x] Compiler module boundaries and public API
- [x] Visualization module boundaries and public API
- [x] UI component placeholders, hook, context, page
- [x] CSS token system, light and dark
- [x] Vitest + React Testing Library, with seed tests passing
- [x] Mock automata fixtures conforming to the contract
- [x] ESLint, Prettier, editorconfig
- [x] Full documentation set
- [x] `TASKS.md`, `TEAM_STATUS.md`, `CONTRIBUTING.md`
- [x] Application shell that starts and renders

**Outcome:** three people can clone and start implementing without creating a
directory or deciding an interface.

---

## Phase 2 - Parallel implementation

All three work simultaneously. Nobody waits.

### Person 1 - Compiler Core

Work in pipeline order; each stage is testable the moment it exists.

1. `validator.ts` - every error code from `ERROR_HANDLING.md`
2. `tokenizer.ts`
3. `explicitConcatenation.ts`
4. `infixToPostfix.ts`
5. `thompson.ts` - the biggest single piece
6. `epsilonClosure.ts`
7. `subsetConstruction.ts`
8. `minimizeDfa.ts`
9. `simulator.ts`
10. `compiler.ts` - wire the stages, build `steps`
11. Tests for each stage, plus language-level tests via `simulate`

**Milestone:** `compileRegex('(a|b)*abb')` returns a complete
`CompilationResult`, and `simulate(result.minimizedDfa, 'abb').accepted` is
`true`.

### Person 2 - Visualization

Build bottom-up; each layer is testable with fixtures.

1. `adapters/nfaAdapter.ts` - nodes, merged edges, epsilon flags
2. `adapters/dfaAdapter.ts` - plus `nfaStates` on each node
3. `layout/graphLayout.ts` - BFS layering, deterministic
4. `AutomataGraph` - mount React Flow, wire node and edge types
5. `StateNode` - single/double border, start arrow, highlight
6. `TransitionEdge` - solid, dashed for epsilon, self-loops, labels
7. `GraphControls` - zoom, pan, fit, reset
8. `GraphLegend`
9. Responsive behaviour
10. Highlighting from the `highlight` prop
11. Visualization tests

**Milestone:** `<NfaGraph nfa={MOCK_NFA} />` draws a readable automaton with
dashed epsilon edges, a start arrow and a double-bordered accept state.

### Person 3 - UI / Application

Start with what does not depend on the compiler.

1. `RegexInput` with real validation feedback
2. `ExampleExpressions`
3. Empty, loading and error states
4. `StepNavigation` - the tablist pattern, keyboard support
5. `StepContent` - per-step rendering
6. `TransitionTable`, `NfaTable`, `DfaMapping`
7. `AlgorithmExplanation` copy
8. `StringSimulator`
9. Responsive layout
10. Accessibility pass
11. Component tests

**Milestone:** the whole UI works end to end against
`MOCK_COMPILATION_RESULT`, with no compiler.

---

## Phase 3 - Integration

Once Person 1 reaches their milestone.

1. Person 3 replaces fixtures with `useCompiler()` output in `HomePage`.
2. Person 3 passes `result.nfa`, `result.dfa` and `result.minimizedDfa` into
   Person 2 graphs.
3. Person 3 wires `simulate()` into `StringSimulator` and the resulting
   `highlight` back into `<DfaGraph />`.
4. All three walk through every example expression together and compare against
   what the textbook says.
5. Fix the contract mismatches that surface. There will be some - that is what
   this phase is for.
6. Write the end-to-end test in `tests/integration/`.

Timebox this. Integration that takes longer than a day means a contract was not
honoured somewhere, and the fix is to find that, not to patch around it.

---

## Phase 4 - Testing

1. Fill the gaps each person knows they left.
2. Language-level tests for every example expression.
3. Every error code has a test.
4. Keyboard-only walkthrough of the whole app.
5. Screen-reader pass over the tables and the step navigation.
6. Check at 360px, 768px and 1440px.
7. Try the expressions a student would actually type, including the invalid
   ones: `a**`, `(((a)))`, `a|`, `()`, a 40-character expression.

---

## Phase 5 - Polish and demonstration

1. Visual consistency pass - spacing, alignment, dark mode.
2. Make sure every explanation reads correctly to someone seeing the app for the
   first time.
3. Performance sanity check on a large expression.
4. Update `README.md` with screenshots.
5. Reread the docs against the code; fix what drifted.
6. Rehearse the demo: enter `(a|b)*abb`, walk every step, simulate an accepted
   string and a rejected one, then show an invalid expression.

---

## Dependencies between the tracks

```text
Person 1 ──── compileRegex ────┐
                               ├──▶ Phase 3 integration
Person 2 ──── graphs ──────────┤
                               │
Person 3 ──── UI ──────────────┘
```

Inside Phase 2 there are **no cross-person dependencies**. That is the whole
point of Phase 1.

## If someone falls behind

The compiler is the critical path - it is the only thing the other two
eventually need. If Person 1 is behind, Person 2 and 3 keep working against
fixtures; their work is not blocked, only the final integration is.

If Person 2 or 3 is behind, the other two can integrate the parts that exist.
The app degrades gracefully: tables without graphs, or graphs without tables,
are still a working demonstration.
