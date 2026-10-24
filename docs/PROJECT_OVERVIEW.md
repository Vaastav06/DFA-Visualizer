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
2. Presses **Convert** (or clicks an example chip).
3. Steps through the pipeline: regular expression, tokens, explicit concatenation,
   postfix, syntax tree & positions, followpos table, direct DFA, minimized DFA,
   and string simulation.
4. Reads the position tables, node analysis, followpos sets, transition tables,
   and DFA-state mappings alongside each graph.
5. Types a test string and watches it run through the DFA, accepted or rejected.

## Scope

**In scope**

- Regex syntax: literals, `|`, implicit concatenation, `*`, `()`
- Direct RE → DFA construction via augmented syntax tree `(r)#`, position numbering, `nullable`, `firstpos`, `lastpos`, `followpos`, and DFA minimization
- Graph visualization of the syntax tree, direct DFA, and minimized DFA
- Position tables, AST analysis tables, followpos tables, transition tables, and DFA position-set mappings
- String simulation with a step-by-step trace and graph highlighting
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

All three tracks (Compiler Core, Visualization, and UI / Application) are
implemented, integrated, and verified against the direct Regular Expression → DFA
construction pipeline. See `IMPLEMENTATION_PLAN.md` and `../TASKS.md`.
