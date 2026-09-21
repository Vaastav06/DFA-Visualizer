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

- All nine pipeline stages: validation, tokenization, explicit concatenation,
  infix-to-postfix, Thompson construction, eps-closure, subset construction,
  minimization, simulation
- `compileRegex()` orchestration, returning a complete `CompilationResult`
  with run-specific step descriptions
- 417 compiler tests, including language equivalence across the NFA, the DFA
  and the minimized DFA for every example expression

Blocked:

-

Notes:

- **`compileRegex()` and `simulate()` are on `main`.** Persons 2 and 3 can swap
  fixtures for real output whenever they like; the fixtures stay valid either
  way, so there is no rush and no breakage.
- No contract change was needed: `src/compiler/types.ts` and both public
  `index.ts` files are untouched.
- `(a|b)*abb` gives a 14-state NFA, a 5-state DFA and a 4-state minimized DFA.
- Algorithm choices are recorded in `docs/DECISIONS.md` (D-015 covers
  minimization); `docs/COMPILER_PIPELINE.md` matches the implementation.

---

## Person 2 - Visualization

Status: **In Progress**

Branch: `feature/visualization` (5 commits pushed; fill in the detail below)

Current task:

-

Completed:

-

Blocked:

-

Notes:

- Start with `docs/VISUALIZATION_SPEC.md`.
- Build against `tests/fixtures/mockAutomata.ts`. Do not wait for Person 1 and
  do not call the compiler.
- Adapters first - they are pure functions and easy to test.
- **Heads-up:** this branch was created before the compiler merged, so its
  merge-base is the foundation commit. Nothing is broken - the fixtures did not
  change - but pick up the new `main` before integration:
  `git pull origin main --rebase`.

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

| Date       | Who      | What changed                                        | Who it affects |
| ---------- | -------- | --------------------------------------------------- | -------------- |
| 2026-09-21 | Person 1 | None. `types.ts` and both public APIs are unchanged | nobody         |

---

## Open questions

Things the team has not decided yet. Move a resolved one into
`docs/DECISIONS.md`.

-
