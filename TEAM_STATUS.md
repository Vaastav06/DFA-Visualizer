# Team Status

Update this when you start something, finish something, or get blocked. It is
the cheapest way to stop two people doing the same task.

Statuses: `Not Started` / `In Progress` / `Blocked` / `In Review` / `Done`

Last updated: 2026-09-21 (Phase 1 handoff)

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

Status: **Not Started**

Branch: `feature/compiler-core`

Current task:

-

Completed:

-

Blocked:

-

Notes:

- Start with `docs/COMPILER_PIPELINE.md`, then `docs/DATA_CONTRACTS.md`.
- Every file in `src/compiler/` has its contract in a header comment and a stub
  that throws. Replace the stub, keep the comment.
- You are the critical path. Landing `compileRegex` unblocks Phase 3.

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

| Date | Who | What changed | Who it affects |
| ---- | --- | ------------ | -------------- |
|      |     |              |                |

---

## Open questions

Things the team has not decided yet. Move a resolved one into
`docs/DECISIONS.md`.

-
