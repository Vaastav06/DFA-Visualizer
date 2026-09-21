# Development Guide

## Prerequisites

- Node.js 20.19+ or 22.12+ (Vite 6 requires it)
- npm 10+
- Git

Check:

```bash
node --version
npm --version
```

## First run

```bash
git clone <repository-url>
cd DFA-Visualizer
npm install
npm run dev
```

Open the URL Vite prints, usually <http://localhost:5173>.

You should see the project title, a regex input, the example list and an empty
state. Pressing **Convert** produces an error message saying the compiler is not
implemented yet. That is correct - the error path is wired, the algorithms are
not written.

## Commands

| Command                | What it does                                       |
| ---------------------- | -------------------------------------------------- |
| `npm install`          | install dependencies                               |
| `npm run dev`          | dev server with hot reload                         |
| `npm run build`        | typecheck the whole project, then build to `dist/` |
| `npm run preview`      | serve the production build locally                 |
| `npm test`             | run the test suite once                            |
| `npm run test:watch`   | re-run tests on change                             |
| `npm run lint`         | ESLint over the project                            |
| `npm run lint:fix`     | ESLint with autofix                                |
| `npm run typecheck`    | TypeScript only, no bundle                         |
| `npm run format`       | Prettier, writing changes                          |
| `npm run format:check` | Prettier, reporting only                           |

Run these four before every push:

```bash
npm run lint && npm run typecheck && npm test && npm run build
```

## Path aliases

Configured in both `tsconfig.app.json` and `vite.config.ts` - if you add one,
add it in both or the editor and the bundler will disagree.

| Alias              | Points to             |
| ------------------ | --------------------- |
| `@/*`              | `src/*`               |
| `@compiler/*`      | `src/compiler/*`      |
| `@visualization/*` | `src/visualization/*` |
| `@components/*`    | `src/components/*`    |
| `@fixtures/*`      | `tests/fixtures/*`    |

```ts
import { compileRegex } from '@/compiler';
import { MOCK_DFA } from '@fixtures/mockAutomata';
```

Import across a module boundary through the public index only - see
`API_CONTRACT.md`.

## Where to start

### Person 1

```bash
git checkout -b feature/compiler-core
```

Read `COMPILER_PIPELINE.md`, then `DATA_CONTRACTS.md`. Work through
`src/compiler/` in pipeline order: validator, tokenizer, explicit concatenation,
postfix, Thompson, closure, subset, minimize, simulate. Write the test alongside
each stage, in `tests/compiler/`.

Every stage file already has its contract in a header comment and a stub that
throws. Replace the stub; keep the comment.

### Person 2

```bash
git checkout -b feature/visualization
```

Read `VISUALIZATION_SPEC.md`. Start with the adapters - they are pure functions
and easy to test - then layout, then the React Flow canvas in `AutomataGraph`,
then nodes and edges, then controls.

Use `MOCK_NFA`, `MOCK_DFA` and `MOCK_DFA_WITH_SELF_LOOP` from
`tests/fixtures/`. Do not call the compiler.

React Flow (`@xyflow/react`) is already installed. Its stylesheet must be
imported once, in `AutomataGraph`:

```ts
import '@xyflow/react/dist/style.css';
```

### Person 3

```bash
git checkout -b feature/ui
```

Read `UI_UX_SPEC.md`. Start with what does not depend on the compiler: the
input, the examples, the empty/loading/error states. Then build the step
navigation and the tables against `MOCK_COMPILATION_RESULT`.

Swap the fixture for `useCompiler()` output once Person 1 lands.

## Debugging

**The app compiles but the page is blank.** Check the browser console. A React
error during render usually means a component got `undefined` where it expected
an array.

**`npm run build` fails but `npm run dev` works.** The dev server does not
typecheck; `build` does. Read the `tsc` output - it is a real type error.

**A test passes alone but fails in the suite.** Something leaked between tests.
`src/test/setup.ts` calls `cleanup()` after each test; if you added a module-level
mutable variable, reset it in a `beforeEach`.

**An import resolves in the editor but not at runtime.** The alias is in
`tsconfig` but not in `vite.config.ts`, or the other way round.

**An eps-closure never terminates.** You are not marking visited states. `a*`
always creates a cycle.

## Editor setup

Any editor works. For VS Code:

- ESLint extension
- Prettier extension, set as the default formatter
- Format on save

`.editorconfig` covers indentation and line endings for everything else.

Line endings are LF, enforced by `.editorconfig` and `.prettierrc`. On Windows,
if git is rewriting them, set `git config core.autocrlf false`.
