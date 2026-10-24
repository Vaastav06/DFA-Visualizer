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

### 1. Direct RE → DFA Pipeline Deliverables (Dragon Book Algorithm 3.36) [COMPLETE]

- [x] **Syntax Tree Visualization (`<SyntaxTreeGraph />`)**:
  - [x] React Flow v12 canvas with pan, zoom, fit-view, and reset controls
  - [x] Node rendering for union (`|`), concat (`•`), Kleene star (`*`), and alphabet leaves
  - [x] Augmented end-marker leaf (`#`) visually distinguished with accent styling
  - [x] 1-based leaf position badge tags (`[p]`) attached to syntax tree leaf nodes
  - [x] Accessible tooltips exposing node ID, nullable, firstpos, and lastpos sets
- [x] **Deterministic Hierarchical Tree Layout (`treeLayout.ts`)**:
  - [x] Post-order coordinate assignment with parent horizontal centering over subtrees
  - [x] Monotonic left-to-right leaf sequencing guaranteeing zero edge crossings
  - [x] 100% deterministic coordinate stability across re-renders
- [x] **Analysis & Position Data Tables**:
  - [x] `PositionBadge` & `PositionTable` displaying 1-based leaf positions and distinguishing `#` from user input
  - [x] `AstAnalysisTable` formatting node nullable (`true`/`false`), firstpos, and lastpos
  - [x] `FollowposTable` rendering `followpos(p)` sets with empty set (`∅`) handling and interactive row click selection
  - [x] `DfaPositionMapping` table mapping each DFA state `q_i` to its syntax-tree position subset `{pos1, pos2, ...}`
- [x] **Direct DFA & Minimized DFA Automata Graphs (`<DfaGraph />`)**:
  - [x] Canonical syntax-tree position subset display (`q0\n{1,2,3}`) without NFA references
  - [x] Double concentric border for accepting states containing end-marker position `#`
  - [x] Incoming start arrow (`→`) pointing from outside to start state `firstpos(root)`
  - [x] Smooth self-loop edge geometry and back-edge routing preventing edge overlap
  - [x] Merged parallel transitions (`a, b`) for shared source-target pairs
  - [x] Direct simulation playback props (`activeStateId`, `highlightedStateIds`, `highlightedTransition`)
  - [x] Context-aware `GraphLegend` explaining states, position sets, and simulation highlights
- [x] **Accessibility, Styling & Testing**:
  - [x] Responsive layout with design tokens from `variables.css` across light and dark themes
  - [x] Accessible controls and ARIA graphics-symbol descriptions on states and nodes
  - [x] Comprehensive test suite: 63 tests across 5 test suites (all passing)
  - [x] Clean public API exported from `src/visualization/index.ts`

### 2. Phase 3 UI Integration Support [COMPLETE]

- [x] Export unified visualization components and types from `src/visualization/index.ts`
- [x] Connect `SyntaxTreeGraph`, `PositionTable`, `AstAnalysisTable`, and `FollowposTable` into Person 3's step navigation tabs
- [x] Wire simulation playback engine directly into `DfaGraph`'s `activeStateId` and `highlightedTransition` props
- [x] Verify graph container queries and height responsiveness across mobile (360px), tablet (768px), and desktop (1440px)

### 3. Advanced Educational & Visual Enhancements (Future Value-Add)

- [ ] **Cross-Diagram Interactive Highlighting (Tree ↔ Table ↔ DFA)**:
  - [ ] Hovering/clicking a leaf node in `SyntaxTreeGraph` highlights its row in `FollowposTable` and `PositionTable`
  - [ ] Hovering a position in `FollowposTable` highlights all DFA states in `DfaGraph` whose position sets contain it
  - [ ] Hovering a DFA state in `DfaGraph` highlights its constituent leaf positions in `SyntaxTreeGraph`
- [ ] **Direct DFA vs. Minimized DFA Comparison View**:
  - [ ] Side-by-side visualization showing partition refinement and which direct DFA states were merged
- [ ] **High-Resolution Diagram Export**:
  - [ ] One-click export buttons to download `SyntaxTreeGraph` and `DfaGraph` as high-resolution PNG or SVG for student coursework, homework, and presentations
- [ ] **Simulation Edge Animation**:
  - [ ] Animated active token or pulse traveling along transition edges during string simulation playback
- [ ] **State Machine Keyboard Traversal**:
  - [ ] Arrow-key navigation between adjacent states following transitions (WCAG 2.1 AA enhancement)
- [ ] **MiniMap Overview**:
  - [ ] Toggleable MiniMap navigator for complex regular expressions generating large trees or automata
- [ ] **Zoom-to-Fit on Step Change**:
  - [ ] Automatically smooth-pan and fit the active diagram when users navigate between pipeline tabs

## UI / Application - Person 3

Files: `src/components/`, `src/pages/`, `src/hooks/`, `src/context/`,
`src/styles/`, `src/data/`, `tests/components/`

- [x] Regex input with validation feedback
- [x] Example expressions
- [x] Step navigation - tablist pattern with keyboard support
- [x] Step content routing
- [x] Tokens display
- [x] Explicit concatenation display
- [x] Postfix display
- [x] Syntax Tree & AST analysis view (mounting `<SyntaxTreeGraph />` and `<AstAnalysisTable />`)
- [x] Position numbering view (mounting `<PositionTable />`)
- [x] Followpos view (mounting `<FollowposTable />`)
- [x] Direct DFA view (mounting `<DfaGraph />` and `<DfaMapping />`)
- [x] DFA transition table
- [x] Minimized DFA view with transition table
- [x] Algorithm explanations for each Dragon Book step
- [x] String simulator UI with playback controls (step forward/backward, reset) and trace
- [x] Error states
- [x] Loading state
- [x] Empty state
- [x] Responsive design at 360, 768 and 1440
- [x] Accessibility pass
- [x] Component tests

## Integration - all three

- [x] Compiler to UI - swap fixtures for `useCompiler()`
- [x] Compiler to Visualization - real automata into the graphs
- [x] Visualization to UI - graphs placed in step content
- [x] Simulation to Visualization - `highlight` wired through
- [x] End-to-end flow verified against `docs/INTEGRATION_GUIDE.md` checklist
- [x] Integration test in `tests/integration/`
- [x] Final testing pass
- [x] Documentation review - docs match the code
- [x] Demo rehearsal

---

## Notes

- A task that turns out to be two tasks: split it and say so here.
- A task blocked on someone else: note it in `TEAM_STATUS.md` rather than
  leaving it silently unticked.
- Do not tick a box for code that has no test.
