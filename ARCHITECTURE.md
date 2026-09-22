# Architecture

This is the summary. The full document is [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Shape

```text
                 ┌─────────────────────┐
                 │     SHARED TYPES    │
                 │  compiler/types.ts  │
                 └──────────┬──────────┘
                            │
          ┌─────────────────┼─────────────────┐
          │                 │                 │
          ▼                 ▼                 ▼
     PERSON 1          PERSON 2          PERSON 3
   COMPILER CORE     VISUALIZATION      UI / APP
          │                 │                 │
          └─────────────────┼─────────────────┘
                            │
                            ▼
                       INTEGRATION
```

Three modules, one shared contract, two narrow public APIs.

## Modules

| Module           | Directory             | Owner    | Public API                   |
| ---------------- | --------------------- | -------- | ---------------------------- |
| Compiler Core    | `src/compiler/`       | Person 1 | `src/compiler/index.ts`      |
| Visualization    | `src/visualization/`  | Person 2 | `src/visualization/index.ts` |
| UI / Application | `src/components/` etc | Person 3 | the app itself               |

## Dependency rules

| Module        | May import                                      | May NOT import                    |
| ------------- | ----------------------------------------------- | --------------------------------- |
| compiler      | itself only                                     | React, the DOM, visualization, UI |
| visualization | `src/compiler` types, itself                    | UI, app state, `compileRegex`     |
| UI            | `src/compiler`, `src/visualization` public APIs | either module internals           |

The compiler is pure TypeScript. The visualization draws whatever automaton it
is handed. The UI is the only place all three meet, in
`src/pages/HomePage.tsx`.

## The pipeline

```text
Regex -> Validation -> Tokenization -> Explicit Concatenation -> Postfix
      -> Syntax Tree & End-Marker (#) -> Position Numbering
      -> Nullable / Firstpos / Lastpos -> Followpos Table
      -> Direct DFA Construction -> DFA Minimization -> Simulation
```

Details in [docs/COMPILER_PIPELINE.md](docs/COMPILER_PIPELINE.md).

## The contracts

```text
EPSILON    internally null, displayed as the Greek letter
STATE ID   data is a number, display is qN
```

Defined in `src/compiler/types.ts`, described in
[docs/DATA_CONTRACTS.md](docs/DATA_CONTRACTS.md). The TypeScript file is the
real contract; the document describes the intent. A change to one is a change to
both, in the same commit.

## Public interfaces

```ts
// Compiler
compileRegex(regex: string): CompilationResult
simulate(dfa: DFA, input: string): SimulationResult
```

```tsx
// Visualization
<NfaGraph nfa={nfa} />
<DfaGraph dfa={dfa} />
<DfaGraph dfa={minimizedDfa} kind="minimized-dfa" />
```

Full signatures in [docs/API_CONTRACT.md](docs/API_CONTRACT.md).

## Stack

React 18, TypeScript 5.6, Vite 6, React Flow 12, Vitest 3, plain CSS with
custom properties. Reasons in [docs/DECISIONS.md](docs/DECISIONS.md).
