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

### Direct Regular Expression → DFA Construction Pipeline

Files: `src/compiler/`, `tests/compiler/`

- [x] Validator - every error code in `docs/ERROR_HANDLING.md`
- [x] Tokenizer (deterministic tokens)
- [x] Explicit concatenation (canonical insertion)
- [x] Infix to postfix (shunting-yard algorithm)
- [x] Syntax tree construction with end-marker `#` (`CONCAT(r, #)`)
- [x] Position numbering (1-based, left-to-right deterministic leaf numbering)
- [x] Nullable computation (recursive AST calculation)
- [x] Firstpos computation (sorted, deduplicated position sets)
- [x] Lastpos computation (sorted, deduplicated position sets)
- [x] Followpos computation (concatenation and star rules)
- [x] Direct DFA construction from position subsets (canonical `"1,2,3"` state keys)
- [x] DFA minimization (Moore partition refinement with dead state pruning)
- [x] String simulation with step tracking (`simulate`, `simulateDFA`)
- [x] Pipeline orchestration in `compiler.ts`, including run-specific `steps`
- [x] Compiler tests - one file per stage (AST, positions, nullable, firstpos, lastpos, followpos, direct DFA, minimization, simulation)
- [x] Language-level tests via `simulate` for every example expression
- [x] Legacy Thompson/subset modules removed; `DFAState.positions` canonical with `nfaStates` compatibility alias

## Visualization - Person 2

Files: `src/visualization/`, `tests/visualization/`

- [x] Graph foundation - React Flow mounted in `AutomataGraph`
- [x] DFA adapter with canonical `positions` set on each node (and `nfaStates` compatibility alias)
- [x] Deterministic BFS layered graph layout (`graphLayout.ts`)
- [x] Syntax Tree Graph (`<SyntaxTreeGraph />`) representing operators (`•`, `|`, `*`), symbols, and augmented end-marker (`#`)
- [x] Deterministic hierarchical tree layout algorithm (`layoutSyntaxTree`) with parent centering
- [x] Custom `SyntaxTreeNode` with leaf position badges (`[p]`), `#` distinction, and analysis tooltips (nullable, firstpos, lastpos)
- [x] Reusable `PositionBadge` and `PositionTable` displaying 1-based leaf positions and distinguishing `#`
- [x] `AstAnalysisTable` displaying authoritative nullable, firstpos, and lastpos calculations
- [x] `FollowposTable` displaying followpos sets with empty set (`∅`) handling and interactive row selection
- [x] `DfaPositionMapping` displaying DFA states with their syntax-tree leaf position subsets `{1, 2, 3}`
- [x] DFA graph (`<DfaGraph />`) displaying states with syntax-tree position subsets (`q0\n{1,2,3}`) without NFA references
- [x] Minimized DFA graph displaying merged state position subsets
- [x] Node styling - single border, double border for accepting states, incoming start arrow (`→`)
- [x] Edge styling - labels, arrowheads, self-loops, back-edge routing
- [x] Merged parallel transitions (`a, b`)
- [x] Graph controls - zoom in, zoom out, fit, reset
- [x] Context-aware `GraphLegend` for both Syntax Tree and DFA graphs
- [x] Direct simulation playback props (`activeStateId`, `highlightedStateIds`, `highlightedTransition`)
- [x] Responsive graph canvas and styling across light and dark themes
- [x] Comprehensive visualization tests (63 tests across 5 test suites)

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
