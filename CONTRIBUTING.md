# Contributing

Read this before your first commit. It is the short version; the long versions
are in `docs/`.

## Setup

```bash
npm install
npm run dev
```

Node 20.19+ or 22.12+. See `docs/DEVELOPMENT_GUIDE.md`.

## Who owns what

| Person   | Owns                                                                                                           |
| -------- | -------------------------------------------------------------------------------------------------------------- |
| Person 1 | `src/compiler/`, `tests/compiler/`                                                                             |
| Person 2 | `src/visualization/`, `tests/visualization/`                                                                   |
| Person 3 | `src/components/`, `src/pages/`, `src/hooks/`, `src/context/`, `src/styles/`, `src/data/`, `tests/components/` |

Stay in your area. If you need something changed in someone else area, ask them.

## Shared files - coordinate before changing

```text
src/compiler/types.ts          THE contract
src/compiler/index.ts          compiler public API
src/visualization/index.ts     visualization public API
src/App.tsx
src/main.tsx
src/styles/variables.css
src/test/setup.ts
tests/fixtures/
package.json
vite.config.ts
tsconfig*.json
eslint.config.js
README.md
ARCHITECTURE.md
```

Coordination means telling the other two before you change it. A typo fix does
not need a meeting; a new field in `CompilationResult` does.

## The two contracts you cannot break

```text
EPSILON    internally null, displayed as the Greek letter
           transition.symbol === null means epsilon
           never "eps", "epsilon", "E" or ""

STATE ID   data is a number: 0, 1, 2, 3
           display is a label: q0, q1, q2, q3
           never store "q0" as an id
```

See `docs/DATA_CONTRACTS.md`.

## Import rules

```ts
// Correct - through the public index
import { compileRegex } from '@/compiler';
import { NfaGraph } from '@/visualization';

// Wrong - reaching into another module internals
import { thompsonConstruction } from '@/compiler/thompson';
```

A module own tests may import its own internals. Nobody else may.

## Branches and commits

```text
main                       stable, no direct commits
feature/compiler-core      Person 1
feature/visualization      Person 2
feature/ui                 Person 3
```

Commit format:

```text
<area>: <what changed, imperative>

<why, if not obvious>
```

Areas: `compiler`, `visualization`, `ui`, `docs`, `test`, `config`, `chore`.

Full rules in `docs/GIT_WORKFLOW.md`.

## Before every push

```bash
npm run lint && npm run typecheck && npm test && npm run build
```

All four. `npm run build` typechecks the whole project, so it catches a contract
break that a single test run will not.

## Definition of done

- [ ] it works
- [ ] it has tests
- [ ] lint, typecheck, test and build all pass
- [ ] the docs match the code
- [ ] `TASKS.md` and `TEAM_STATUS.md` updated
- [ ] reviewed by one other person

## Do not wait for each other

Person 2 and Person 3 build against `tests/fixtures/mockAutomata.ts` until the
compiler lands. Person 1 tests the compiler with Vitest and does not need the UI.
All three tracks run in parallel through Phase 2 - that is the whole point of
the foundation.

## Where to read next

| You are                       | Read                                                  |
| ----------------------------- | ----------------------------------------------------- |
| new to the project            | `docs/PROJECT_OVERVIEW.md`, `ARCHITECTURE.md`         |
| about to write the compiler   | `docs/COMPILER_PIPELINE.md`, `docs/DATA_CONTRACTS.md` |
| about to write graphs         | `docs/VISUALIZATION_SPEC.md`                          |
| about to write UI             | `docs/UI_UX_SPEC.md`                                  |
| wiring modules together       | `docs/INTEGRATION_GUIDE.md`                           |
| unsure of a term              | `docs/GLOSSARY.md`                                    |
| wondering why something is so | `docs/DECISIONS.md`                                   |
