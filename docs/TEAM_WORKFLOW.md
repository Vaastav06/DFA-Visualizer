# Team Workflow

## Ownership

Three people, three areas, no overlap. Ownership means: you write it, you review
changes to it, and nobody edits it without asking you first.

### Person 1 - Compiler Core

**Owns**

```text
src/compiler/
tests/compiler/
```

**Responsible for**

```text
Validation
Tokenization
Explicit concatenation
Infix to postfix
Thompson construction
eps-NFA
eps-closure
Subset construction
DFA
DFA minimization
String simulation
Compiler tests
```

**Delivers** a working `compileRegex(regex): CompilationResult` and
`simulate(dfa, input): SimulationResult`, exported from `src/compiler/index.ts`.

**Must not** import React, touch the DOM, or edit anything under
`src/visualization/` or `src/components/`.

### Person 2 - Visualization

**Owns**

```text
src/visualization/
tests/visualization/
```

**Responsible for**

```text
NFA graph
DFA graph
Minimized DFA graph
Nodes
Edges
Graph layout
Graph controls
eps transitions
Start and final states
Highlighting
Visualization tests
```

**Delivers** `<NfaGraph nfa={...} />` and `<DfaGraph dfa={...} />`, exported
from `src/visualization/index.ts`.

**Must not** call `compileRegex`, read `AppContext`, or import from
`src/components/`.

### Person 3 - UI / Application

**Owns**

```text
src/components/
src/pages/
src/hooks/
src/context/
src/styles/
src/data/
tests/components/
```

**Responsible for**

```text
Regex input
Examples
Step navigation
Explanations
Tables
Simulation UI
Errors
Loading
Responsive UI
Accessibility
Application integration
```

**Delivers** the working application: input, steps, tables, simulator, error and
loading states.

**Must not** reach past a public index file into another module internals.

## Shared files

These require coordination. Post in the team channel before changing one, and
mention the change in your pull request description.

| File                           | Why it is shared                       |
| ------------------------------ | -------------------------------------- |
| `src/compiler/types.ts`        | THE contract - a change stops everyone |
| `src/compiler/index.ts`        | the compiler public API                |
| `src/visualization/index.ts`   | the visualization public API           |
| `src/App.tsx`                  | the application root                   |
| `src/main.tsx`                 | the entry point                        |
| `src/styles/variables.css`     | design tokens used by two people       |
| `src/test/setup.ts`            | affects all three test suites          |
| `tests/fixtures/`              | mock data all three rely on            |
| `package.json`                 | dependencies and scripts               |
| `vite.config.ts`               | build and test configuration           |
| `tsconfig*.json`               | compiler options and path aliases      |
| `eslint.config.js`             | lint rules                             |
| `README.md`, `ARCHITECTURE.md` | the front door                         |

"Coordination" means telling the other two before you change it, not asking
permission for a typo fix.

## Parallel development

**Person 2 and Person 3 must not wait for Person 1.**

This is the single most important workflow rule in the project. There are three
of you and roughly one critical path; if two people idle waiting for the
compiler, the project finishes at one third speed.

Work against:

```text
the shared types        src/compiler/types.ts
the mock fixtures       tests/fixtures/mockAutomata.ts
the documented APIs     docs/API_CONTRACT.md
```

Person 2 builds graphs from `MOCK_NFA` and `MOCK_DFA`. Person 3 builds the UI
from `MOCK_COMPILATION_RESULT`. When Person 1 lands the real compiler, swapping
a fixture for `compileRegex` output is a one-line change in each place - if the
contract was honoured.

**Equally: Person 1 must not wait for the UI or the visualization.** The
compiler is a library of pure functions tested with Vitest. It does not need a
page to render for Person 1 to know it works.

## Communication

- Update `TEAM_STATUS.md` when you start something, finish something or get
  blocked. It is the cheapest way to avoid two people doing the same task.
- Tick boxes in `TASKS.md` as you go.
- A contract change gets announced before it is made, not after.
- If you are blocked for more than a day, say so - the other two can usually
  unblock you in minutes.

## Code review

Every merge into `main` is reviewed by at least one other person.

A reviewer checks:

- Does it stay inside the author area?
- Does it honour the epsilon and state-id contracts?
- Do lint, typecheck, tests and build pass?
- If a contract changed, did the docs change in the same commit?
- Are there tests for the new behaviour?

Review the code, not the person. "This mutates the input DFA, which
`minimizeDfa` promises not to do" is a useful comment; "this is wrong" is not.

## Definition of done

A task is done when:

- [ ] it works
- [ ] it has tests
- [ ] `npm run lint` passes
- [ ] `npm run typecheck` passes
- [ ] `npm test` passes
- [ ] `npm run build` passes
- [ ] the docs match the code
- [ ] `TASKS.md` and `TEAM_STATUS.md` are updated
- [ ] another person reviewed it
