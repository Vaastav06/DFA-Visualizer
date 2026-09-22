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
- Tests passing including Dragon Book `(a|b)*abb#` verification, language equivalence across DFA
  and minimized DFA, and determinism checks.
- Zero Thompson construction, ε-NFA, ε-closure, or subset construction logic in active compiler.

Blocked:

- None

Notes:

- **`compileRegex` is ready.** Direct RE → DFA construction produces clean minimal DFAs directly
  from the syntax tree without generating an intermediate ε-NFA.
- `DFAState.positions` is the canonical representation. `nfaStates` is preserved as an identical
  alias for backwards compatibility with visualization and UI components.
- `(a|b)*abb` directly produces a 4-state DFA (q0={1,2,3}, q1={1,2,3,4}, q2={1,2,3,5}, q3={1,2,3,6}
  accepting), which is already minimal.

---

## Person 2 - Visualization

Status: **Done** (Ready for Phase 3 UI Integration)

Branch: `feature/visualization`

Current task:

- None. Available to help with Phase 3 integration with Person 3.

Completed:

- Complete visualization layer for Direct Regular Expression → DFA construction pipeline (Dragon Book Algorithm 3.36).
- Public component `<SyntaxTreeGraph />` with deterministic tree layout (`treeLayout.ts`), centering parent nodes over subtrees.
- Custom `SyntaxTreeNode` with operator styling (`•`, `|`, `*`), leaf position badges (`[p]`), augmented end-marker `#` accent styling, and analysis tooltips (nullable, firstpos, lastpos).
- Reusable `PositionBadge` and `PositionTable` displaying 1-based leaf positions and distinguishing `#` from user input symbols.
- `AstAnalysisTable` formatting authoritative node-level nullable, firstpos, and lastpos sets.
- Interactive `FollowposTable` rendering followpos sets with empty set (`∅`) handling and row selection.
- `DfaPositionMapping` table mapping each DFA state to its syntax-tree leaf position subset and acceptance status.
- `<DfaGraph />` with canonical `positions` subset display (`q0\n{1,2,3}`), double borders for accepting states, incoming start arrow (`→`), and direct simulation playback props (`activeStateId`, `highlightedStateIds`, `highlightedTransition`).
- Context-aware `GraphLegend` supporting syntax tree and DFA modes without NFA terminology.
- All 63 visualization tests passing (syntax tree, layout, adapters, tables, graphs).
- 100% typecheck clean, lint clean, format clean, and production build passing.

Blocked:

- None

Notes:

- Person 3 can directly import all visual components and tables from `@/visualization` or `src/visualization`.
- Primary components: `SyntaxTreeGraph`, `DfaGraph`, `PositionTable`, `AstAnalysisTable`, `FollowposTable`, `DfaPositionMapping`, `GraphControls`, `GraphLegend`, `PositionBadge`.

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
