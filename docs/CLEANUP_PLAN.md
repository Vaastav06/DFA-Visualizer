# Cleanup plan

This plan is based on `docs/REPOSITORY_AUDIT.md`. Source code changes were not made during the audit. Tasks below preserve compatibility until maintainers decide otherwise.

## P0 — Correctness and safety

No confirmed compiler correctness or data-flow defect was found in the inspected implementation or current test results. The keyboard tab behavior below is the highest user-facing defect and should be addressed before broader cleanup.

## P1 — Maintainability

### P1.1 — Complete keyboard interaction for the step tablist

- **Files:** `src/components/StepNavigation.tsx`, `tests/components/ui.test.tsx`, possibly `docs/UI_UX_SPEC.md`.
- **Evidence/rationale:** Uses ARIA `tablist`/`tab` and selection attributes but has no arrow-key, Home/End, or roving tabindex behavior; the source TODO admits this gap. `docs/UI_UX_SPEC.md` describes keyboard behavior.
- **Minimal change:** Implement expected tab keyboard/focus behavior and add focused interaction tests.
- **Effort:** M. **Risk:** Medium accessibility regression risk; tests required for arrow direction, wraparound, Home/End, selection, and focus.
- **Dependencies:** None. Keep separate from documentation refresh so behavior review is clear.

### P1.2 — Correct stale active compiler comments and clarify compatibility surfaces

- **Files:** `src/compiler/types.ts`, `src/compiler/minimizeDfa.ts`, `src/compiler/tokenizer.ts`, `src/pages/HomePage.tsx`, and only if necessary active NFA exports/components.
- **Evidence/rationale:** Comments claim Thompson generation, an NFA pipeline stage, subset-construction alphabet effects, or `nfaStates` authority while active code uses direct position subsets. NFA fixture/visualization functionality exists, so deleting it is not proven safe.
- **Minimal change:** Fix comments and document retained NFA-facing exports as compatibility/sample support. Before any removal, search imports/consumers and obtain a team decision about external compatibility.
- **Effort:** S for comment corrections; M/L for a separately approved compatibility cleanup. **Risk:** Low for comments; high for public API removal. Regression tests: current compiler and visualization suites for any behavior/API work.
- **Dependencies:** Do the inventory before making any deprecation/removal change. Comment corrections can be combined with P2.1 only if kept in one reviewed scope.

### P1.3 — Consider linear-time queue and membership structures in graph layout

- **Files:** `src/visualization/layout/graphLayout.ts`, `tests/visualization/layout.test.ts`.
- **Evidence/rationale:** Repeated `states.includes`, `queue.shift`, and repeated max-layer scans create avoidable work at larger graph sizes. No performance defect has been measured.
- **Minimal change:** Profile against representative larger automata first; if material, use `Set` membership, an index cursor queue, and a running maximum while preserving stable traversal and output.
- **Effort:** S/M. **Risk:** Low/medium layout ordering risk; require deterministic-layout and unreachable-state tests, plus output comparison.
- **Dependencies:** Only proceed if performance evidence or an agreed graph-size goal justifies it. Separate from accessibility work.

## P2 — Documentation

### P2.1 — Reconcile current-state, scope, and integration documentation

- **Files:** `docs/PROJECT_OVERVIEW.md`, `docs/DEVELOPMENT_GUIDE.md`, `docs/INTEGRATION_GUIDE.md`, `docs/IMPLEMENTATION_PLAN.md`, `README.md`.
- **Evidence/rationale:** These direct readers to pending Thompson/subset compiler work, an unimplemented UI, or future integration although the current source and integration test implement direct DFA compilation and page wiring.
- **Minimal change:** Update overview, contributor workflow, and integration guide to direct-DFA seams. Mark the implementation plan as historical/complete instead of rewriting useful project history. Refresh README's current-state link and developer command list.
- **Effort:** M. **Risk:** Low code risk, medium coordination risk if task completion/ownership is asserted. No code regression tests; verify every claim against source and run `npm run format:check` on changed Markdown.
- **Dependencies:** Team confirmation needed before updating `TASKS.md`/`TEAM_STATUS.md` status checkboxes or ownership claims. Keep historical milestones dated.

### P2.2 — Make active contract docs agree with the source of truth

- **Files:** `docs/API_CONTRACT.md`, `docs/ARCHITECTURE.md`, `docs/DATA_CONTRACTS.md`, `docs/VISUALIZATION_SPEC.md`, `docs/TESTING_STRATEGY.md`, `docs/GLOSSARY.md`, `docs/FUTURE_ENHANCEMENTS.md`.
- **Evidence/rationale:** These documents repeat retired NFA/subset pipeline descriptions, old API usage, or stale test-stage expectations. `docs/COMPILER_PIPELINE.md` and `docs/REGEX_SPECIFICATION.md` already match the active core well and should remain detailed authorities.
- **Minimal change:** Describe direct syntax-tree position sets and active direct/minimized DFA path in current contracts; clearly label NFA models and terminology as legacy or theory/fixture support where retained. Keep decisions as historical records; add superseding decisions only if maintainers confirm choices changed.
- **Effort:** M/L. **Risk:** Low implementation risk; medium risk of accidentally erasing historical rationale. No code regression tests; review links, signatures, and examples against exported source APIs.
- **Dependencies:** P2.1 establishes current architecture terms first. Update related docs as one documentation review, but keep each authoritative contract focused to avoid duplication.

### P2.3 — Reconcile task and team status with the active product

- **Files:** `TASKS.md`, `TEAM_STATUS.md`, optionally `CONTRIBUTING.md`, `docs/TEAM_WORKFLOW.md`.
- **Evidence/rationale:** Current source shows implemented stages and real wiring while task lists say those tasks are not started; status test counts/date are older than the observed run.
- **Minimal change:** Ask current team members to confirm ownership and completion criteria; update only confirmed statuses and label historical validation with dates. Do not infer who did work or claim completion from code alone.
- **Effort:** S/M. **Risk:** Medium coordination risk. No code tests; validate status against team confirmation.
- **Dependencies:** Human/team decision required. Keep separate from mechanical technical-doc updates.

## P3 — Optional polish

### P3.1 — Restore the formatting check

- **Files:** Five files reported by Prettier: `docs/DECISIONS.md`, `docs/VISUALIZATION_SPEC.md`, `src/components/StringSimulator.tsx`, `src/visualization/components/AutomataGraph.tsx`, `src/visualization/components/SyntaxTreeGraph.tsx`.
- **Evidence/rationale:** `npm run format:check` fails only on these paths. Formatting is not a functional defect.
- **Minimal change:** Apply Prettier only to these files in an isolated style commit; inspect the diff for unrelated churn.
- **Effort:** S. **Risk:** Low; formatting-only diffs, run `npm run format:check`, lint, typecheck, and tests if TSX changes.
- **Dependencies:** Can be performed independently. Avoid mixing with algorithm or UX changes.

### P3.2 — Strengthen one end-to-end contract assertion

- **Files:** `tests/integration/appShell.test.tsx`.
- **Evidence/rationale:** The existing integration test confirms valid input compiles and leaves the empty state, but does not assert graph/table output or simulation acceptance; compiler behavior is otherwise extensively tested.
- **Minimal change:** Extend or add one UI-flow test to navigate to DFA and assert a known graph/state, and simulate a known accepted/rejected string where selectors permit.
- **Effort:** S/M. **Risk:** Low; avoid brittle React Flow internals and assert accessible output. Run integration and full test suites.
- **Dependencies:** None. Keep separate from compiler test refactoring.

## Safe execution sequence and commit boundaries

1. **Accessibility behavior:** implement P1.1 with its keyboard tests; run focused component tests, typecheck, lint, then all tests.
2. **Code-comment accuracy:** do P1.2's source-comment-only corrections. If a compatibility policy is not agreed, leave deprecated exports intact. Commit separately from removal discussions.
3. **Current workflow docs:** perform P2.1; mark old implementation planning as historical and do not rewrite decisions. Ask the team before changing task/status completion or ownership.
4. **Contracts/docs:** perform P2.2 after workflow wording settles; validate exported APIs and grammar against source/tests. Format changed Markdown only.
5. **Coordination status:** do P2.3 only with team input; update dated results, not authorship claims.
6. **Optional isolated work:** do P3.1 formatting as its own style-only commit; do P3.2 integration coverage as a separate test commit; do P1.3 only after performance evidence.
7. **Final checkpoint:** `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`; review `git diff --check` and the changed-file list before committing.

Keep compatibility API removal, formatting, documentation rewrites, and behavior changes in separate commits. The first cleanup task should be **P1.1 keyboard support** because it is a confirmed gap against the tablist contract and can be fixed and reviewed without waiting for team-status decisions.
