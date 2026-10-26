# Repository audit

**Audit date:** 2026-10-25  
**Scope:** source, tests, configuration, documentation, repository state. No application source was changed.

## Verified repository shape

- `package.json` identifies a private Vite/React/TypeScript app. Dependencies are React/React DOM `^18.3.1`, TypeScript `~5.6.3`, Vite `^6.0.5`, `@xyflow/react` `^12.3.5`, Vitest `^3.2.7`, Testing Library, ESLint `^9.17.0`, and Prettier `^3.4.2`. `package-lock.json` is present. The installed Vite reported itself as 6.4.3 during build; package ranges are not exact installed versions.
- TypeScript project references split app and node configuration. App strictness includes `strict`, unused locals/parameters, no fallthrough, and unchecked side-effect import checks. Vite config enables Vitest with jsdom, `src/test/setup.ts`, and `tests/**/*.{test,spec}.{ts,tsx}` / matching source tests.
- Compiler source is separated by stage: validator, tokenizer, explicit concatenation, postfix conversion, syntax tree, position/nullable/firstpos/lastpos/followpos analysis, direct DFA construction, minimization, simulator, and orchestration. Tests are organized into compiler, visualization, components, and integration with shared fixtures.
- UI is in active source, not a placeholder: `HomePage` wires context/hook to input, stages, syntax tree, direct and minimized DFA, tables, and simulator. Visualization uses React Flow with dedicated adapters, graph components, tree/automata layouts, and edge routing.
- Working tree was clean at start; branch `main`, tracking `origin/main`. Recent history includes direct-DFA migration and visualization improvements. No root/nested `AGENTS.md`, `CLAUDE.md`, or `GEMINI.md` instruction file was found. No existing repository audit or cleanup plan report was present.

## Confirmed engineering findings

### F1 — Step navigation exposes a tablist without arrow-key tab navigation

- **Location:** `src/components/StepNavigation.tsx:5-6,19-35`; `docs/UI_UX_SPEC.md` tab interaction contract.
- **Problem/evidence:** Buttons use `role="tab"`, `aria-selected`, and `aria-controls`, but the component implements only click selection; its own TODO explicitly says arrow keys and Home/End support are unfinished. Native buttons are individually tabbable, unlike the expected roving-tabindex behavior for a tablist.
- **Why it matters:** Keyboard and assistive technology users do not get the expected tab interaction, and the UI spec identifies keyboard support as required.
- **Minimal fix:** Implement roving `tabIndex`, arrow-key wraparound, Home/End, and focus movement; add keyboard tests for the tablist.
- **Severity/risk:** Medium. **Confidence:** High.

### F2 — Important project documentation still describes the superseded pipeline and pending implementation

- **Location:** `docs/PROJECT_OVERVIEW.md:15-18,24-29,63-66`; `docs/IMPLEMENTATION_PLAN.md:27-90`; `docs/INTEGRATION_GUIDE.md:6-10,36-45,74-110`; `docs/DEVELOPMENT_GUIDE.md:27-29,75-123`.
- **Problem/evidence:** These documents describe Thompson construction/subset conversion, a compiler that is not implemented, and integration as future work. In contrast, `src/compiler/compiler.ts` orchestrates the direct pipeline, `src/pages/HomePage.tsx` renders the real result, and `tests/integration/appShell.test.tsx:36-44` compiles a real expression.
- **Why it matters:** Contributors are directed toward nonexistent modules and obsolete seams, obscuring current architecture and creating unnecessary work.
- **Minimal fix:** Update current-state and developer workflow documents to the implementation; retain implementation-plan milestones as explicitly historical/complete where useful. Preserve historical decision records.
- **Severity/risk:** High documentation correctness issue, low implementation risk. **Confidence:** High.

### F3 — Source comments and shared type APIs preserve the retired NFA model as if active

- **Location:** `src/compiler/types.ts:54-70,163-174,213-218`; `src/compiler/minimizeDfa.ts:17-21,27-31`; `src/compiler/tokenizer.ts:49-50`; `src/pages/HomePage.tsx:7-8`.
- **Problem/evidence:** Active comments still call `NFA` a Thompson output, imply alphabet ordering drives subset construction, describe `nfaStates` output as the merged-state contract, and document an `nfa` step. The active compiler creates no NFA and `HomePage` has no NFA stage. Actual use of deprecated NFA types, fixtures, adapters, and graph/table components remains, so this is compatibility code rather than proven dead code.
- **Why it matters:** Future edits can follow obsolete contracts and misunderstand what state position sets mean.
- **Minimal fix:** Correct misleading comments and mark retained NFA-facing APIs clearly as compatibility/fixture support. Decide with maintainers separately whether a compatibility removal is warranted; do not remove it as part of the documentation correction.
- **Severity/risk:** Medium. **Confidence:** High.

### F4 — The shared-position vocabulary in minimization remains stale

- **Location:** `src/compiler/minimizeDfa.ts:27-31`.
- **Problem/evidence:** The output invariant says merged state's `nfaStates` is the union. Implementation also unions `positions` and sets the legacy alias equal to that sorted array. `DFAState.positions` is documented as authoritative in `src/compiler/types.ts:130-143`.
- **Why it matters:** The comment misidentifies the canonical direct-DFA data and makes compatibility naming look authoritative.
- **Minimal fix:** State that `positions` is the union and `nfaStates` mirrors it only for compatibility.
- **Severity/risk:** Low. **Confidence:** High.

### F5 — Prettier check currently fails on five tracked files

- **Location:** `docs/DECISIONS.md`, `docs/VISUALIZATION_SPEC.md`, `src/components/StringSimulator.tsx`, `src/visualization/components/AutomataGraph.tsx`, `src/visualization/components/SyntaxTreeGraph.tsx`.
- **Problem/evidence:** `npm run format:check` exits 1 and identifies exactly these files. This is style drift, not evidence of runtime failure.
- **Why it matters:** The declared formatting gate cannot pass, and bulk formatting risks unrelated churn.
- **Minimal fix:** Format the listed files in a separate style-only change after reviewing the formatter diff.
- **Severity/risk:** Low. **Confidence:** High.

### F6 — Historical status and test-count claims are presented as current

- **Location:** `TEAM_STATUS.md:12-27,69-100,104-125`; `TASKS.md:89-154`.
- **Problem/evidence:** Status dates to 2026-09-21 and labels UI as not started with many integrations unchecked, though `HomePage` and the integration test demonstrate those paths are implemented. The 19-test and 63-visualization-test claims are historical; current observed suite is 413 tests in 22 files.
- **Why it matters:** Team members may duplicate completed work. Ownership and live team status cannot be inferred from repository source alone.
- **Minimal fix:** Ask the team to reconcile current ownership/status and update checklists; preserve old verification as a dated historical record rather than presenting it as current.
- **Severity/risk:** Medium coordination/documentation risk. **Confidence:** High.

## Possible improvements (not confirmed defects)

### P1 — Graph layout has avoidable repeated linear operations

- **Location:** `src/visualization/layout/graphLayout.ts:36-40,60-69,76-98`.
- **Evidence:** Each transition checks membership with `states.includes`; BFS uses `Array.shift`; detached components repeatedly compute `Math.max(...layers.values())`. These add repeated work for larger hand-built graphs. No measured performance failure is established; UI specification discusses graphs around 50 states.
- **Minimal fix:** If profiling or an agreed graph-size target warrants it, use a state `Set`, an index-based queue, and one running maximum layer. Preserve deterministic ordering and add layout equivalence/performance coverage.
- **Severity/risk:** Low. **Confidence:** Medium.

### P2 — Broad legacy NFA model remains, but removal is not established as safe

- **Location:** `src/compiler/types.ts`, `src/compiler/index.ts`, `src/visualization/adapters/nfaAdapter.ts`, `src/visualization/components/NfaGraph.tsx`, `src/components/NfaTable.tsx`, `tests/fixtures/mockAutomata.ts`, and related tests/docs.
- **Evidence:** Direct compilation does not generate an NFA, yet these remain exported/tested and `CompilationResult.nfa` is explicitly deprecated. This may support fixture/consumer compatibility. No package consumers or compatibility requirements were available to prove safe removal.
- **Minimal fix:** Inventory actual imports and agree a deprecation/removal policy before changing public exports. Correct active wording first.
- **Severity/risk:** Low until compatibility is known. **Confidence:** Medium.

## Tests and verification gaps

- The integration test verifies compile success and error display, but does not assert that a DFA graph appears or that simulation accepts/rejects a string (`tests/integration/appShell.test.tsx:36-44`). The compiler behavior is strongly covered separately (`tests/compiler/compiler.test.ts` has 80 tests); an end-to-end contract assertion would strengthen the layer seam.
- Existing compiler tests include property/behavior-oriented checks and explicit minimization invariants. Visualization tests cover adapters, layout, and graph components. No `any`/`@ts-ignore` issue surfaced in the targeted source scan; no duplicate active compiler algorithm was found.
- Browser rendering, responsive breakpoints, and manual keyboard/screen-reader behavior were not manually tested in this audit.

## Documentation disposition

Classifications describe the recommended next action, not edits made by this audit.

| Document                      | Action  | Reason / dependency                                                                                                                                                                            |
| ----------------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `README.md`                   | UPDATE  | Correctly introduces direct DFA, but “current state” links readers to stale implementation plan; refresh team/current status and list `format:check`.                                          |
| `ARCHITECTURE.md`             | KEEP    | Concise summary largely matches current boundaries; note its API/types claims should remain subordinate to source.                                                                             |
| `CONTRIBUTING.md`             | UPDATE  | Ownership, imports, and safety are useful; shared-file coordination and “before push” checks should reflect active team practice and formatting gate. Human confirmation needed for ownership. |
| `TASKS.md`                    | UPDATE  | Many UI/integration boxes conflict with implemented `HomePage`; team must decide what completion means before ticking items. Preserve future enhancements.                                     |
| `TEAM_STATUS.md`              | UPDATE  | Stale date, task statuses, and test counts; update only with team confirmation. Keep dated historical results.                                                                                 |
| `docs/API_CONTRACT.md`        | UPDATE  | Public API inventory still includes active NFA-shaped path and should distinguish current direct DFA API from compatibility surfaces.                                                          |
| `docs/ARCHITECTURE.md`        | UPDATE  | Layer boundaries remain useful; examples and claims currently center NFA/epsilon and old source shape.                                                                                         |
| `docs/CODING_STANDARDS.md`    | KEEP    | General guidance remains applicable; recheck any NFA-specific examples when next edited.                                                                                                       |
| `docs/COMPILER_PIPELINE.md`   | KEEP    | Stage sequence matches active compiler; preserve as the detailed compiler authority.                                                                                                           |
| `docs/DATA_CONTRACTS.md`      | UPDATE  | Core DFA/position contracts are useful, but NFA guarantees/mock descriptions and deprecated field framing need clear current-vs-compatibility labels.                                          |
| `docs/DECISIONS.md`           | KEEP    | Decisions are historical rationale; do not erase retired choices. Add a dated superseding decision only if team confirms a changed policy. Formatting check currently flags it.                |
| `docs/DEVELOPMENT_GUIDE.md`   | UPDATE  | Setup/scripts are mostly valid, but dev behavior and contributor starting points refer to unimplemented compiler and Thompson stages.                                                          |
| `docs/ERROR_HANDLING.md`      | KEEP    | Error-layer guidance appears compatible; verify error code table against `src/compiler/errors.ts` when editing.                                                                                |
| `docs/FUTURE_ENHANCEMENTS.md` | UPDATE  | Labelled future-only, but animation/NFA simulation/property-testing language assumes retired path; reconcile with current direct pipeline while preserving ideas.                              |
| `docs/GIT_WORKFLOW.md`        | KEEP    | Workflow remains generic and useful; branch/ownership assumptions need team confirmation.                                                                                                      |
| `docs/GLOSSARY.md`            | UPDATE  | Thompson/subset terms are still valid theory, but current stage descriptions and project-specific wording are stale. Keep historical/theory definitions and distinguish active pipeline.       |
| `docs/IMPLEMENTATION_PLAN.md` | ARCHIVE | The plan is historical and most phases are implemented; retain it as history, move/link it as historical only after team decision, or add a clear completion banner. Do not delete.            |
| `docs/INTEGRATION_GUIDE.md`   | UPDATE  | Actual wiring is complete and its integration order/checklist is obsolete. Preserve useful seam contracts after replacing old NFA steps.                                                       |
| `docs/PROJECT_OVERVIEW.md`    | UPDATE  | Scope and current-state statements directly contradict implementation.                                                                                                                         |
| `docs/REGEX_SPECIFICATION.md` | KEEP    | Supported grammar and unsupported constructs align with validator; detailed source of truth.                                                                                                   |
| `docs/TEAM_WORKFLOW.md`       | KEEP    | Workflow/ownership rules need a human current-team review, but no implementation contradiction was established in this pass.                                                                   |
| `docs/TESTING_STRATEGY.md`    | UPDATE  | Strong testing principles, but stage inventory and integration test description remain pre-migration.                                                                                          |
| `docs/UI_UX_SPEC.md`          | KEEP    | Its keyboard interaction guidance identifies a real outstanding accessibility item; compare visual/current-screen details when UI changes.                                                     |
| `docs/VISUALIZATION_SPEC.md`  | UPDATE  | Contains useful edge-routing and deterministic layout detail, but describes active NFA pipeline and adapter behavior as core.                                                                  |
| `docs/REPOSITORY_AUDIT.md`    | KEEP    | This audit deliverable; refresh only on a later audit.                                                                                                                                         |
| `docs/CLEANUP_PLAN.md`        | KEEP    | This plan deliverable; track completion in follow-up work.                                                                                                                                     |

No files were classified REMOVE. No historical decision was recommended for deletion. No nested agent instruction files were found, so no instruction conflicts exist; several docs duplicate stale workflow/current-state descriptions and should be consolidated during updates around README, source contracts, and historical coordination records.

## Validation results

Commands were run with the existing `node_modules`; no package install or dependency change was made.

| Command                | Result                                                                  |
| ---------------------- | ----------------------------------------------------------------------- |
| `npm run typecheck`    | PASS (`tsc -b`, exit 0)                                                 |
| `npm run lint`         | PASS (exit 0)                                                           |
| `npm test`             | PASS — 22 files, 413 tests (exit 0)                                     |
| `npm run build`        | PASS — TypeScript build and Vite production bundle (Vite 6.4.3, exit 0) |
| `npm run format:check` | FAIL — five files listed in F5 (exit 1)                                 |

`npm run format` is a write-mode formatter, not a formatting check; it was not run. Browser behavior was not manually verified.
