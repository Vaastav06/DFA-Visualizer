# Project Overview

## What this is

An interactive web application that converts a regular expression into a DFA and
shows every intermediate stage of the conversion, rather than only the final
automaton. It is a Compiler Design course project built by three people.

The teaching goal drives every design choice: if a stage of the classical
pipeline is invisible in the UI, the project has failed at its purpose, even if
the final DFA is correct.

## What the user does

1. Types a regular expression, or picks one of the examples.
2. Presses **Convert**.
3. Steps through the pipeline: tokens, explicit concatenation, postfix,
   ε-NFA, DFA, minimized DFA.
4. Reads the transition tables and the DFA-state mapping alongside each graph.
5. Types a test string and watches it run through the DFA, accepted or rejected.

## Scope

**In scope**

- Regex syntax: literals, `|`, implicit concatenation, `*`, `()`
- Thompson's construction, subset construction, DFA minimization
- Graph visualization of the ε-NFA, the DFA and the minimized DFA
- Transition tables and the subset-construction mapping
- String simulation with a step-by-step trace
- Clear error messages for invalid expressions

**Out of scope for this version** (see `FUTURE_ENHANCEMENTS.md`)

- `+`, `?`, character classes, anchors, escapes, backreferences
- Multi-character literals
- Exporting automata as images or files
- Persisting work between sessions

## Team

| Person   | Area          | Owns                                                                                              |
| -------- | ------------- | ------------------------------------------------------------------------------------------------- |
| Person 1 | Compiler Core | `src/compiler/`, `tests/compiler/`                                                                |
| Person 2 | Visualization | `src/visualization/`, `tests/visualization/`                                                      |
| Person 3 | UI / App      | `src/components/`, `src/pages/`, `src/hooks/`, `src/context/`, `src/styles/`, `tests/components/` |

See `TEAM_WORKFLOW.md` for the full ownership rules.

## Technology

| Concern       | Choice                            |
| ------------- | --------------------------------- |
| Framework     | React 18 + TypeScript             |
| Build tool    | Vite 6                            |
| Graphs        | React Flow (`@xyflow/react`)      |
| Tests         | Vitest + React Testing Library    |
| Styling       | Plain CSS with custom properties  |
| Lint / format | ESLint 9 (flat config) + Prettier |

Rationale for each choice is in `DECISIONS.md`.

## Current state

The repository foundation is complete: structure, contracts, configuration,
tests infrastructure, documentation and a running application shell.

The algorithms, the graph rendering and the real UI are **not** implemented.
That is Phase 2 — see `IMPLEMENTATION_PLAN.md` and `../TASKS.md`.
