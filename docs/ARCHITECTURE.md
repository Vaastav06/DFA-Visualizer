# Architecture

## The one-sentence version

Three independent modules — compiler, visualization, UI — communicate only
through the type contract in `src/compiler/types.ts` and through two narrow
public APIs (`src/compiler/index.ts`, `src/visualization/index.ts`).

## Module map

```text
                       ┌──────────────────────────┐
                       │      SHARED CONTRACT     │
                       │   src/compiler/types.ts  │
                       │  NFA · DFA · Transition  │
                       │  CompilationResult       │
                       └────────────┬─────────────┘
                                    │ imported by all three
           ┌────────────────────────┼────────────────────────┐
           │                        │                        │
           ▼                        ▼                        ▼
  ┌─────────────────┐     ┌──────────────────┐     ┌──────────────────┐
  │  COMPILER CORE  │     │  VISUALIZATION   │     │     UI / APP     │
  │  (Person 1)     │     │  (Person 2)      │     │  (Person 3)      │
  │                 │     │                  │     │                  │
  │ src/compiler/   │     │ src/visualization│     │ src/components/  │
  │                 │     │                  │     │ src/pages/       │
  │ pure functions  │     │ React components │     │ src/hooks/       │
  │ no React        │     │ no compiler calls│     │ src/context/     │
  │ no DOM          │     │ no app state     │     │ src/styles/      │
  └────────┬────────┘     └─────────┬────────┘     └────────┬─────────┘
           │                        │                       │
           │  compileRegex()        │ <NfaGraph/>           │
           │  simulate()            │ <DfaGraph/>           │
           └────────────────────────┴───────────────────────┘
                                    │
                                    ▼
                          ┌──────────────────┐
                          │   HomePage.tsx   │
                          │  the only place  │
                          │ all three meet   │
                          └──────────────────┘
```

## Dependency rules

These are the rules that keep three people out of each other's way. They are
one-directional and there are no exceptions.

| Module        | May import from                                  | May NOT import from                                                 |
| ------------- | ------------------------------------------------ | ------------------------------------------------------------------- |
| compiler      | itself only                                      | React, the DOM, visualization, UI                                   |
| visualization | `src/compiler` (types only), itself              | UI components, app state, `compileRegex`                            |
| UI            | `src/compiler` (public API), `src/visualization` | anything under `visualization/components/` or a compiler stage file |

Concretely:

- **The compiler never imports React.** It is a library of pure functions. This
  is what makes it testable without a DOM and reusable outside this app.
- **The visualization never calls the compiler.** It receives an `NFA` or a
  `DFA` as a prop and draws it. It does not know a regex exists.
- **The UI never reaches past a public index file.** `import { NfaGraph } from
'@/visualization'`, never `from '@/visualization/components/NfaGraph'`.

## Data flow

```text
user types "(a|b)*abb"
        │
        ▼
RegexInput  ──onSubmit──▶  useCompiler().compile()
                                    │
                                    ▼
                          compileRegex(regex)          ← Person 1
                                    │
                    ┌───────────────┴───────────────┐
                    │      CompilationResult         │
                    │  tokens, postfix, syntaxTree,  │
                    │  positions, analysis,          │
                    │  followpos, dfa, minimizedDfa  │
                    └───────────────┬───────────────┘
                                    │
             ┌──────────────────────┼──────────────────────┐
             ▼                      ▼                      ▼
     StepNavigation         <SyntaxTreeGraph .../>   <TransitionTable dfa=…/>
      (Person 3)              <DfaGraph dfa=…/>        <DfaMapping dfa=…/>
                                (Person 2)               (Person 3)
                                    │
                                    ▼
                          StringSimulator (Person 3)
                                    │
                                    ▼
                          simulate(dfa, input)        ← Person 1
                                    │
                                    ▼
                    SimulationResult ──highlight──▶ <DfaGraph highlight=…/>
```

State lives in exactly one place: `AppContext`. Components receive what they
need as props. There is no global store, no Redux, no data fetching — the whole
application is a pure function of the text in the input field.

## Directory layout

```text
src/
├── compiler/            Person 1 — pure algorithms, no React
│   ├── types.ts           THE shared contract
│   ├── errors.ts          error taxonomy
│   ├── validator.ts       stage 1
│   ├── tokenizer.ts       stage 2
│   ├── explicitConcatenation.ts   stage 3
│   ├── infixToPostfix.ts  stage 4
│   ├── syntaxTree.ts      stage 5 (augmented AST with end-marker #)
│   ├── positions.ts       stage 6 (1-based leaf position numbering)
│   ├── nullable.ts        stage 7a (nullable calculation)
│   ├── firstpos.ts        stage 7b (firstpos calculation)
│   ├── lastpos.ts         stage 7c (lastpos calculation)
│   ├── followpos.ts       stage 8 (followpos calculation)
│   ├── directDfa.ts       stage 9 (direct DFA construction)
│   ├── minimizeDfa.ts     stage 10
│   ├── simulator.ts       stage 11
│   ├── compiler.ts        orchestrator
│   └── index.ts           PUBLIC API
│
├── visualization/       Person 2 — graph rendering
│   ├── components/        NfaGraph, DfaGraph and their internals
│   ├── adapters/          NFA/DFA -> nodes and edges
│   ├── layout/            where each state is drawn
│   ├── types.ts           visualization-local types
│   └── index.ts           PUBLIC API
│
├── components/          Person 3 — presentational UI
├── pages/               Person 3 — HomePage
├── hooks/               Person 3 — useCompiler
├── context/             Person 3 — AppContext
├── styles/              Person 3 — variables.css, globals.css, components/
├── data/                Person 3 — examples.ts
├── test/                shared — Vitest setup
├── App.tsx              SHARED — providers only
└── main.tsx             SHARED — entry point

tests/
├── compiler/            Person 1
├── visualization/       Person 2
├── components/          Person 3
├── integration/         joint
└── fixtures/            SHARED — mock automata
```

## Why this shape

**Why is the contract inside `src/compiler/` rather than a neutral `src/types/`?**
Because the compiler is the only module that _produces_ these values. The other
two consume them. Putting the definition next to the producer means there is no
question about who updates it when an algorithm changes shape.

**Why adapters in the visualization module?**
So exactly one file in the entire graph layer knows what an `NFA` looks like. If
the contract changes, Person 2 fixes one file, not eight components.

**Why a `useCompiler` hook instead of calling `compileRegex` in components?**
So error handling and loading state exist in one place. Without it, every
component that compiles would need its own try/catch and its own idea of what a
user-facing error message is.

## Related documents

- `DATA_CONTRACTS.md` — the shapes in detail
- `API_CONTRACT.md` — the public function and component signatures
- `COMPILER_PIPELINE.md` — what each stage does
- `INTEGRATION_GUIDE.md` — how the three modules get wired together
- `DECISIONS.md` — why each technology and convention was chosen
