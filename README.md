# DFA Visualizer

An interactive web application that converts a regular expression into a DFA and
shows every stage of the conversion, rather than only the final automaton.

Built as a Compiler Design team project. The goal is to make the direct
Regular Expression → DFA construction pipeline — syntax trees, position numbering,
nullable, firstpos, lastpos, followpos, direct DFA construction, minimization — visible
and inspectable, so the algorithms stop being something that happens off-screen.

## What it does

```text
(a|b)*abb
    |
    |-- tokens                  ( a | b ) * a b b
    |-- explicit concatenation  ( a | b ) * . a . b . b
    |-- postfix                 a b | * a . b . b .
    |-- syntax tree (#)         augmented AST with leaf positions 1..6
    |-- node analysis           nullable, firstpos, lastpos for each node
    |-- followpos table         followpos sets for each position
    |-- direct DFA              direct DFA states from position subsets
    |-- minimized DFA           Moore partition refinement with dead state removal
    '-- simulation              run a string, watch it accept or reject
```

Each stage has a graph or a table, an explanation of the algorithm behind it,
and the real data from your expression.

## Supported syntax

| Syntax  | Meaning                  | Example   |
| ------- | ------------------------ | --------- |
| `a`     | literal                  | `a`       |
| `ab`    | concatenation (implicit) | `ab`      |
| `a\|b`  | alternation              | `a\|b`    |
| `a*`    | Kleene star              | `a*`      |
| `(...)` | grouping                 | `(a\|b)*` |

Precedence: `*` binds tightest, then concatenation, then `|`.

Not supported in this version: `+`, `?`, character classes, anchors, escapes,
backreferences. `.` is reserved as the internal concatenation operator and does
not mean "any character". See [docs/REGEX_SPECIFICATION.md](docs/REGEX_SPECIFICATION.md).

## Getting started

```bash
npm install
npm run dev
```

Requires Node 20.19+ or 22.12+.

> **Current state:** All three modules — Compiler Core (Person 1), Visualization
> (Person 2), and UI / Application (Person 3) — are complete and integrated on
> `main` with the direct Regular Expression → DFA construction pipeline (syntax
> trees, position numbering, nullable/firstpos/lastpos, followpos, direct DFA,
> minimization, and interactive string simulation). See [docs/IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md).

## Commands

| Command              | What it does                                 |
| -------------------- | -------------------------------------------- |
| `npm install`        | install dependencies                         |
| `npm run dev`        | dev server with hot reload                   |
| `npm run build`      | typecheck the project, then build to `dist/` |
| `npm run preview`    | serve the production build                   |
| `npm test`           | run the test suite once                      |
| `npm run test:watch` | re-run tests on change                       |
| `npm run lint`       | ESLint                                       |
| `npm run typecheck`  | TypeScript only                              |
| `npm run format`     | Prettier, writing changes                    |

## Project structure

```text
src/
├── compiler/        the algorithms - pure TypeScript, no React
├── visualization/   graph rendering - React Flow
├── components/      UI components
├── pages/           HomePage
├── hooks/           useCompiler
├── context/         AppContext
├── styles/          CSS tokens and base styles
└── data/            example expressions

tests/
├── compiler/        algorithm tests
├── visualization/   graph tests
├── components/      UI tests
├── integration/     end-to-end
└── fixtures/        mock automata

docs/                architecture, contracts and specifications
```

## Team

| Person   | Area          | Owns                                                                                              |
| -------- | ------------- | ------------------------------------------------------------------------------------------------- |
| Person 1 | Compiler Core | `src/compiler/`, `tests/compiler/`                                                                |
| Person 2 | Visualization | `src/visualization/`, `tests/visualization/`                                                      |
| Person 3 | UI / App      | `src/components/`, `src/pages/`, `src/hooks/`, `src/context/`, `src/styles/`, `tests/components/` |

See [CONTRIBUTING.md](CONTRIBUTING.md) and
[docs/TEAM_WORKFLOW.md](docs/TEAM_WORKFLOW.md).

## Documentation

| Document                                           | What it covers                  |
| -------------------------------------------------- | ------------------------------- |
| [PROJECT_OVERVIEW](docs/PROJECT_OVERVIEW.md)       | what this is and what it is not |
| [ARCHITECTURE](docs/ARCHITECTURE.md)               | modules, boundaries, data flow  |
| [DATA_CONTRACTS](docs/DATA_CONTRACTS.md)           | the shared types                |
| [API_CONTRACT](docs/API_CONTRACT.md)               | public functions and components |
| [COMPILER_PIPELINE](docs/COMPILER_PIPELINE.md)     | the nine stages                 |
| [REGEX_SPECIFICATION](docs/REGEX_SPECIFICATION.md) | exactly what syntax works       |
| [VISUALIZATION_SPEC](docs/VISUALIZATION_SPEC.md)   | how automata are drawn          |
| [UI_UX_SPEC](docs/UI_UX_SPEC.md)                   | screens, flow, accessibility    |
| [ERROR_HANDLING](docs/ERROR_HANDLING.md)           | errors, and who sees what       |
| [TESTING_STRATEGY](docs/TESTING_STRATEGY.md)       | what to test and where          |
| [INTEGRATION_GUIDE](docs/INTEGRATION_GUIDE.md)     | wiring the modules together     |
| [IMPLEMENTATION_PLAN](docs/IMPLEMENTATION_PLAN.md) | the phased plan                 |
| [DEVELOPMENT_GUIDE](docs/DEVELOPMENT_GUIDE.md)     | setup, commands, debugging      |
| [CODING_STANDARDS](docs/CODING_STANDARDS.md)       | conventions                     |
| [TEAM_WORKFLOW](docs/TEAM_WORKFLOW.md)             | ownership and coordination      |
| [GIT_WORKFLOW](docs/GIT_WORKFLOW.md)               | branches, commits, merges       |
| [DECISIONS](docs/DECISIONS.md)                     | why things are the way they are |
| [FUTURE_ENHANCEMENTS](docs/FUTURE_ENHANCEMENTS.md) | deliberately deferred ideas     |
| [GLOSSARY](docs/GLOSSARY.md)                       | terminology                     |

Project coordination: [TASKS.md](TASKS.md), [TEAM_STATUS.md](TEAM_STATUS.md).

## Stack

React 18, TypeScript 5.6, Vite 6, React Flow 12, Vitest 3, plain CSS with custom
properties. Reasons in [docs/DECISIONS.md](docs/DECISIONS.md).
