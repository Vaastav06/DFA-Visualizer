# Tasks

Tick a box when the work is done to the standard in
`docs/TEAM_WORKFLOW.md#definition-of-done` - implemented, tested, lint clean,
build passing, reviewed.

Phase 1 is complete. Everything below is Phase 2 onward - see
`docs/IMPLEMENTATION_PLAN.md`.

---

## Phase 1 - Foundation (COMPLETE)

- [x] Vite + React + TypeScript project, verified building
- [x] Directory structure for all three areas
- [x] Shared type contract (`src/compiler/types.ts`)
- [x] Epsilon contract and state-id contract documented
- [x] Compiler module scaffolding and public API
- [x] Visualization module scaffolding and public API
- [x] UI component placeholders, hook, context, page
- [x] CSS tokens and base stylesheet, light and dark
- [x] Vitest + React Testing Library, seed tests passing
- [x] Mock automata fixtures
- [x] ESLint, Prettier, editorconfig
- [x] Documentation set in `docs/`
- [x] Application shell that starts

---

## Compiler Core - Person 1

Files: `src/compiler/`, `tests/compiler/`

- [ ] Validator - every error code in `docs/ERROR_HANDLING.md`
- [ ] Tokenizer
- [ ] Explicit concatenation
- [ ] Infix to postfix
- [ ] Thompson construction
- [ ] eps-closure and move
- [ ] Subset construction
- [ ] DFA minimization
- [ ] String simulation
- [ ] Pipeline orchestration in `compiler.ts`, including `steps`
- [ ] Compiler tests - one file per stage
- [ ] Language-level tests via `simulate` for every example expression

## Visualization - Person 2

Files: `src/visualization/`, `tests/visualization/`

- [ ] Graph foundation - React Flow mounted in `AutomataGraph`
- [ ] NFA adapter
- [ ] DFA adapter, with `nfaStates` on each node
- [ ] Graph layout - BFS layering, deterministic
- [ ] NFA graph
- [ ] DFA graph
- [ ] Minimized DFA graph
- [ ] Node styling - single border, double border, start arrow
- [ ] Edge styling - labels, arrowheads, self-loops
- [ ] eps transitions - dashed, labelled with the glyph
- [ ] Merged parallel transitions
- [ ] Graph controls - zoom, pan, fit, reset
- [ ] Graph legend
- [ ] Responsive graph
- [ ] Highlighting from the `highlight` prop
- [ ] Visualization tests

## UI / Application - Person 3

Files: `src/components/`, `src/pages/`, `src/hooks/`, `src/context/`,
`src/styles/`, `src/data/`, `tests/components/`

- [ ] Regex input with validation feedback
- [ ] Example expressions
- [ ] Step navigation - tablist pattern with keyboard support
- [ ] Step content routing
- [ ] Tokens display
- [ ] Explicit concatenation display
- [ ] Postfix display
- [ ] NFA information panel
- [ ] DFA information panel
- [ ] NFA transition table with an eps column
- [ ] DFA transition table
- [ ] DFA state mapping table
- [ ] Algorithm explanations
- [ ] String simulator UI with the trace
- [ ] Error states
- [ ] Loading state
- [ ] Empty state
- [ ] Responsive design at 360, 768 and 1440
- [ ] Accessibility pass
- [ ] Component tests

## Integration - all three

- [ ] Compiler to UI - swap fixtures for `useCompiler()`
- [ ] Compiler to Visualization - real automata into the graphs
- [ ] Visualization to UI - graphs placed in step content
- [ ] Simulation to Visualization - `highlight` wired through
- [ ] End-to-end flow verified against `docs/INTEGRATION_GUIDE.md` checklist
- [ ] Integration test in `tests/integration/`
- [ ] Final testing pass
- [ ] Documentation review - docs match the code
- [ ] Demo rehearsal

---

## Notes

- A task that turns out to be two tasks: split it and say so here.
- A task blocked on someone else: note it in `TEAM_STATUS.md` rather than
  leaving it silently unticked.
- Do not tick a box for code that has no test.
