# DFA Visualizer

An interactive web application that converts a regular expression into a DFA and
shows every stage of the construction — not just the final automaton.

Built as a Compiler Design course project. The goal is to make the direct
Regular Expression → DFA algorithm (syntax trees, position analysis, followpos,
direct DFA construction, minimization) visible and inspectable at every step.

## What it does

```text
(a|b)*abb
    |
    |-- tokens                  ( a | b ) * a b b
    |-- explicit concatenation  ( a | b ) * . a . b . b
    |-- postfix                 a b | * a . b . b .
    |-- syntax tree             augmented AST with leaf positions 1..6
    |-- node analysis           nullable, firstpos, lastpos for each node
    |-- followpos table         followpos sets for each position
    |-- direct DFA              states built from position subsets
    |-- minimized DFA           Moore partition refinement
    '-- simulation              run a string, watch it accept or reject step by step
```

Each stage has a table or interactive graph, plus the real data from your expression.
The algorithm is the **Dragon Book direct method (Algorithm 3.36)** — not Thompson NFA → subset construction.

## Supported syntax

| Syntax    | Meaning                  | Example    |
| --------- | ------------------------ | ---------- |
| `a`       | literal (letter/digit)   | `a`        |
| `ab`      | concatenation (implicit) | `ab`       |
| `a\|b`    | alternation              | `a\|b`     |
| `a*`      | Kleene star              | `a*`       |
| `(...)`   | grouping                 | `(a\|b)*`  |

Precedence: `*` binds tightest, then concatenation, then `|`. Whitespace is ignored.

Not supported: `+`, `?`, character classes, anchors, escapes, backreferences.
`.` is reserved internally for explicit concatenation. See [docs/REGEX_SPECIFICATION.md](docs/REGEX_SPECIFICATION.md).

Invalid input (empty expression, unbalanced parens, unsupported characters, bad operators) always produces a clear error — never a broken automaton.

## Getting started

```bash
npm install
npm run dev
```

Requires Node 20.19+ or 22.12+. Open `http://localhost:5173` in your browser.

## Commands

| Command               | What it does                                  |
| --------------------- | --------------------------------------------- |
| `npm install`         | Install dependencies                          |
| `npm run dev`         | Dev server with hot reload                    |
| `npm run build`       | Typecheck then build to `dist/`               |
| `npm run preview`     | Serve the production build locally            |
| `npm test`            | Run the full test suite once                  |
| `npm run test:watch`  | Re-run tests on change                        |
| `npm run lint`        | ESLint                                        |
| `npm run typecheck`   | TypeScript check only                         |
| `npm run format`      | Prettier (writes changes)                     |
| `npm run format:check`| Prettier check (no writes)                    |

## Architecture

The project is split into three strictly layered modules:

```
UI / Application  (HomePage, AppContext, useCompiler)
      │
      │  reads CompilationResult
      ▼
Compiler  ◄────────────────────────────────────────
  Pure TypeScript. No React, no DOM.              │
  Owns: validation, tokenization, syntax tree,    │
  position analysis, followpos, DFA construction, │
  minimization, simulation.                       │
                                                  │
Visualization  ──────────────────────────────────►
  React Flow graphs with custom renderers.
  Receives compiled data as props.
  Never calls compileRegex itself.
```

**Rule:** Compiler → nothing. Visualization → compiler types only (via props). UI → both.

## Project structure

```text
src/
├── compiler/        the algorithms — pure TypeScript, no React
├── visualization/   graph rendering — React Flow + custom nodes/edges
├── components/      UI components (StepNavigation, StringSimulator, tables…)
├── pages/           HomePage
├── hooks/           useCompiler
├── context/         AppContext
├── styles/          CSS custom properties and base styles
└── data/            built-in example expressions

tests/
├── compiler/        algorithm correctness tests
├── visualization/   graph adapter, layout, and component tests
├── components/      UI behavior tests (Testing Library)
├── integration/     full App render tests
└── fixtures/        mock automata for test isolation

docs/                architecture, contracts, and specifications
```

## Key features

- **Dead / trap state display** — when a DFA has implicit rejection (missing transitions), a virtual `qd` state is shown in the graph with all missing edges drawn, making rejections visually clear without polluting the automaton data
- **Simulation auto-advance** — step-through execution animates automatically with configurable speed; current state and active transition are highlighted live
- **Side-by-side DFA comparison** — view Direct DFA and Minimized DFA together with state mapping shown between them
- **PNG / JPEG export** — export the graph canvas at high resolution with correct arrowheads
- **Deterministic layout** — BFS layering with sorted neighbors; the same expression always produces the same graph layout

## Team

| Member      | Area                          | Owns                                                                                               |
| ----------- | ----------------------------- | -------------------------------------------------------------------------------------------------- |
| Vaastav06   | Visualization & UI features   | `src/visualization/`, `src/pages/`, `src/components/`, `tests/visualization/`, `tests/components/` |
| shrey1-1    | Styling & UI fixes            | `src/styles/`, theming, UI polish                                                                  |
| Gip-Coder / Vinayak | Compiler & documentation | `src/compiler/`, `tests/compiler/`, `docs/`                                                  |

## Documentation

| Document                                             | What it covers                         |
| ---------------------------------------------------- | -------------------------------------- |
| [ARCHITECTURE](docs/ARCHITECTURE.md)                 | Modules, boundaries, data flow         |
| [COMPILER_PIPELINE](docs/COMPILER_PIPELINE.md)       | All compiler stages with signatures    |
| [DATA_CONTRACTS](docs/DATA_CONTRACTS.md)             | Shared TypeScript types                |
| [REGEX_SPECIFICATION](docs/REGEX_SPECIFICATION.md)   | Exactly what syntax is supported       |
| [VISUALIZATION_SPEC](docs/VISUALIZATION_SPEC.md)     | How automata are adapted and drawn     |
| [TESTING_STRATEGY](docs/TESTING_STRATEGY.md)         | What to test and where                 |
| [DECISIONS](docs/DECISIONS.md)                       | Why things are the way they are        |
| [FUTURE_ENHANCEMENTS](docs/FUTURE_ENHANCEMENTS.md)   | Deliberately deferred ideas            |
| [FACULTY_PROJECT_REPORT](docs/FACULTY_PROJECT_REPORT.md) | Full project report for faculty    |

## Stack

React 18, TypeScript 5.6 (strict), Vite 6, `@xyflow/react` 12, Vitest 3, plain CSS with custom properties.
100% client-side — no server or API dependency.
Design rationale in [docs/DECISIONS.md](docs/DECISIONS.md).
