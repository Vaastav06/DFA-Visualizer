# Contributor and agent guide

## Project and boundaries

This is a browser based React application that shows the direct construction of a DFA from a regular expression. The compiler in `src/compiler/` owns validation, parsing, syntax tree analysis, followpos, DFA construction, minimization, and simulation. UI code in `src/components/`, `src/pages/`, `src/hooks/`, and `src/context/` owns presentation, navigation, and application state. `src/visualization/` adapts automata and syntax trees, lays them out, and renders interactive diagrams. `tests/` verifies each layer and their integration. Shared contracts are declared in `src/compiler/types.ts`; public entry points are `src/compiler/index.ts` and `src/visualization/index.ts`.

## Verified stack and conventions

- React 18, TypeScript 5.6, Vite 6, `@xyflow/react` 12, Vitest 3, Testing Library, ESLint 9, and Prettier 3 (see `package.json`). Styling is plain CSS with custom properties.
- TypeScript uses `strict`, `noUnusedLocals`, `noUnusedParameters`, and `noFallthroughCasesInSwitch`. Use the configured `@/`, `@compiler/`, `@visualization/`, `@components/`, and `@fixtures/` aliases. Import across module boundaries through their public entry points; module tests may use internals.
- Follow the checked-in Prettier configuration: two spaces, single quotes, semicolons, 100-column print width. Use descriptive camelCase functions/variables and PascalCase React components/types. Handle expected compiler failures as `CompilerError`; ordinary input rejection is a result, not an exception in simulation.

## Contracts to preserve

- Regex literals are one ASCII letter or digit. Whitespace is ignored. Supported operators are alternation `|`, implicit concatenation, postfix Kleene star `*`, and grouping `(...)`; `.` is reserved internally for concatenation. Empty input, empty groups, unsupported characters, malformed operator placement, and unbalanced groups are rejected. `+`, `?`, classes, escapes, anchors, and backreferences are unsupported.
- The compiler augments the syntax tree with end marker `#`; leaf positions are assigned left to right from 1. `firstpos`, `lastpos`, and `followpos` are sorted unique position arrays. Direct DFA construction interns canonical sorted position subsets, starts at state 0, assigns ids in discovery order, and accepts exactly states containing the end-marker position. A minimized DFA is renumbered by BFS from state 0.
- DFA state ids are numeric and displayed as `qN`. The current state type retains deprecated `nfaStates` and `nfa` compatibility fields; `positions` is the authoritative direct-DFA subset. DFA transitions have one target at most per state/symbol, contain no epsilon, and are partial: a missing transition rejects. A state is accepting when it contains the end-marker position; `acceptStates` and `isAccepting` agree. Simulation consumes characters and stops with rejection at the first symbol outside the alphabet or missing transition.
- Visualization adapts graph state ids to string node ids. DFA transitions are represented as distinct edges and parallel edges receive visual offsets; duplicate identical `(from,to,symbol)` rows are collapsed by the adapter. Layout is deterministic BFS layering with sorted state ids; self loops do not affect layers, and unreachable states still receive positions. Graph nodes are draggable/selectable; manual overrides reset when the graph identity changes. Selection/highlighting can be driven by props.

## Testing and change workflow

Inspect code, tests, docs, and `git status` before editing. Make the smallest behavior-preserving change, add a regression test for behavior changes, run relevant checks, then review the diff. Do not claim a command or manual browser check that was not performed.

Commands defined in `package.json`:

- `npm run typecheck` — TypeScript project references.
- `npm run lint` — ESLint.
- `npm test` — one-shot Vitest suite; use compiler, visualization, or component suites for local changes and integration tests when changing layer seams.
- `npm run build` — typecheck plus production Vite build.
- `npm run format:check` — Prettier check; `npm run format` writes files.

Run the relevant focused suite and typecheck for a local implementation change; run lint, typecheck, all tests, build, and formatting check for cross-layer or release changes. Do not run the write-mode formatter on unrelated files.

## Documentation and collaboration

Treat source and tests as the behavior authority. `README.md` is the user/developer entry point; `docs/REGEX_SPECIFICATION.md`, `docs/DATA_CONTRACTS.md`, `docs/COMPILER_PIPELINE.md`, and `docs/VISUALIZATION_SPEC.md` should describe verified contracts. Put lasting rationale in `docs/DECISIONS.md`; avoid copying long architecture explanations into multiple files. `TASKS.md` and `TEAM_STATUS.md` are coordination records and need a human team member to confirm current ownership/status before being treated as current.

Never infer AI authorship from style. Do not fabricate results, claim manual verification without doing it, blindly replace working code, introduce needless abstractions, or claim ownership of work not performed. Do not reset, rebase, force-push, merge, switch branches, or delete branches without explicit authorization. Never modify application behavior as part of a documentation-only task.
