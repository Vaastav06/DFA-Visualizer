# Team Status

Update this when you start something, finish something, or get blocked. It is
the cheapest way to stop two people doing the same task.

Statuses: `Not Started` / `In Progress` / `Blocked` / `In Review` / `Done`

Last updated: 2026-09-21 (Compiler Core merged to main)

---

## Phase 1 - Foundation

Status: **Done**

The repository foundation is complete: structure, contracts, configuration,
test infrastructure, documentation and a running application shell.

Verified before handoff:

```text
npm install       ok
npm run build     ok   (typecheck + bundle)
npm test          ok   (19 tests, 4 files)
npm run lint      ok   (0 errors, 0 warnings)
npm run dev       ok   (serves and renders)
```

---

## Person 1 - Compiler Core

Status: **Done** - merged to `main` in PR #1 (`27a636d`)

Branch: `feature/compiler-core` (kept for follow-up work)

Current task:

- None. Available to help with Phase 3 integration.

Completed:

- Complete direct Regular Expression → DFA construction pipeline: validation, tokenization,
  explicit concatenation, infix-to-postfix, augmented syntax tree with end-marker `#`,
  1-based left-to-right leaf position numbering, nullable, firstpos, lastpos, followpos
  calculation, direct DFA construction via position subsets, DFA minimization (Moore refinement
  with dead state pruning), and string simulation with step tracking.
- `compileRegex()` orchestration returning a complete `CompilationResult` with
  `syntaxTree`, `positions`, `analysis`, `followpos`, `dfa`, `minimizedDfa`, and run-specific `steps`.
- 349 tests passing across 18 test files, including Dragon Book `(a|b)*abb#` 9-component
  verification, language equivalence across DFA and minimized DFA, and determinism checks.
- Zero Thompson construction, ε-NFA, ε-closure, or subset construction logic in active compiler.

Blocked:

- None

Notes:

- **`compileRegex` is ready on `main`.** Direct RE → DFA construction produces clean minimal DFAs directly
  from the syntax tree without generating an intermediate ε-NFA.
- `DFAState.positions` is the canonical representation. `nfaStates` is preserved as an identical
  alias for backwards compatibility with visualization and UI components.
- `(a|b)*abb` directly produces a 4-state DFA (q0={1,2,3}, q1={1,2,3,4}, q2={1,2,3,5}, q3={1,2,3,6}
  accepting), which is already minimal.

---

## Person 2 - Visualization

Status: **Done** - merged to `main`

Branch: `feature/visualization`

Current task:

- None. Available to help with Phase 3 integration.

Completed:

- Graph shell in `AutomataGraph` with React Flow v12 (`@xyflow/react`)
- NFA adapter with parallel transition merging and epsilon translation (`null -> ε`)
- DFA adapter preserving `nfaStates` subset mappings, enforcing no-epsilon invariant
- Deterministic BFS layered layout algorithm (`graphLayout.ts`)
- Custom `StateNode` with concentric double border, incoming start arrow (`→`), and simulation highlight
- Custom `TransitionEdge` with self-loop geometry, back-edge curves, and dashed epsilon edges
- Accessible `GraphControls` (+, −, Fit, Reset) and `GraphLegend`
- Responsive layout and theme support via project CSS custom properties
- 34 visualization tests (12 adapter tests, 7 layout tests, 15 component/graph tests)

Blocked:

-

Notes:

- `<NfaGraph />` and `<DfaGraph />` are fully implemented and on `main`.
- Person 3 can directly consume them from `@/visualization`.

---

## Person 3 - UI / Application

Status: **Not Started**

Branch: `feature/ui`

Current task:

-

Completed:

-

Blocked:

-

Notes:

- Start with `docs/UI_UX_SPEC.md`.
- Build against `MOCK_COMPILATION_RESULT`. Do not wait for Person 1.
- The input, examples and empty/loading/error states need no compiler at all.

---

## Contract changes

Log every change to `src/compiler/types.ts` or a public `index.ts` here, so
nobody discovers one by way of a broken build.

| Date       | Who      | What changed                                                                                                                                                                                          | Who it affects                                                                |
| ---------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| 2026-09-21 | Person 1 | Initial setup                                                                                                                                                                                         | nobody                                                                        |
| 2026-09-22 | Person 1 | Added `DFAState.positions` (canonical) with `nfaStates` compatibility alias; added `syntaxTree`, `positions`, `analysis`, `followpos` to `CompilationResult`; marked `nfa?: NFA` optional/deprecated. | non-breaking; enables direct AST and followpos visualization for Person 2 & 3 |

---

## Open questions

Things the team has not decided yet. Move a resolved one into
`docs/DECISIONS.md`.

-
