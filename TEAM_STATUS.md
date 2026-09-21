# Team Status

Update this when you start something, finish something, or get blocked. It is
the cheapest way to stop two people doing the same task.

Statuses: `Not Started` / `In Progress` / `Blocked` / `In Review` / `Done`

Last updated: 2026-09-21 (Compiler Core complete)

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

Status: **In Review**

Branch: `feature/compiler-core`

Current task:

- Awaiting review, then merge to `main`

Completed:

- All nine pipeline stages: validation, tokenization, explicit concatenation,
  infix-to-postfix, Thompson construction, eps-closure, subset construction,
  minimization, simulation
- `compileRegex()` orchestration, returning a complete `CompilationResult`
  with run-specific step descriptions
- 349 compiler tests, including language equivalence across the NFA, the DFA
  and the minimized DFA for every example expression

Blocked:

-

Notes:

- **`compileRegex` is ready.** Persons 2 and 3 can swap fixtures for real
  output whenever they like; the fixtures stay valid either way.
- No contract change was needed: `src/compiler/types.ts` is untouched.
- `(a|b)*abb` gives a 14-state NFA, a 5-state DFA and a 4-state minimized DFA.

---

## Person 2 - Visualization

Status: **Not Started**

Branch: `feature/visualization`

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
