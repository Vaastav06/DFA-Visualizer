# Decisions

A record of choices that were not obvious, and why they went the way they did.
When a decision changes, edit the entry and add a line saying what changed -
do not delete the history.

---

## D-001 - Epsilon is `null` internally, the glyph only in display

**Status** Accepted - permanent

**Decision** `transition.symbol === null` is the one representation of an
epsilon transition. `EPSILON_DISPLAY` exists only for rendering.

**Alternatives** the glyph as a string; the literal `"epsilon"`; the empty
string; a separate `epsilonTransitions` array.

**Why** String representations of epsilon are the classic source of bugs here,
because `"eps"` and the glyph both look correct in review and in a debugger. The
empty string is worse: it compares falsy and silently behaves like a missing
value. `null` cannot be mistaken for a symbol, and TypeScript forces every
consumer to handle the case.

A separate array was rejected because then every consumer has to remember to
read two collections, and forgetting one produces a graph that is subtly wrong
rather than obviously broken.

**Consequence** Everyone writes `symbol === null`. The alphabet never contains
epsilon.

---

## D-002 - State ids are numbers, qN is a label

**Status** Accepted - permanent

**Decision** Ids are dense non-negative integers. `"q0"` is produced at render
time.

**Why** Ids are compared, sorted, used as Set members and as Map keys. Numbers
do all of that correctly. String ids sort wrongly, cost more to compare, and
tempt people to parse them back out.

**Consequence** `formatStateId()` is the single conversion point. No automaton
data ever contains a `q`.

---

## D-003 - The shared contract lives in `src/compiler/types.ts`

**Status** Accepted

**Decision** The shared types live with the compiler, not in a neutral
`src/types/`.

**Why** The compiler is the only module that produces these values; the other
two consume them. Putting the definition next to the producer removes any
question about who updates it. A neutral directory sounds fairer but leaves the
contract unowned, and an unowned contract drifts.

**Consequence** Person 1 hosts the file, but changing it needs team agreement -
see `TEAM_WORKFLOW.md`.

---

## D-004 - Plain CSS with custom properties, not Tailwind or CSS-in-JS

**Status** Accepted

**Decision** Plain CSS files, semantic custom properties in `variables.css`,
component styles in `styles/components/`.

**Alternatives** Tailwind; CSS Modules; styled-components.

**Why** This is an academic project whose readers are three students and an
examiner. Plain CSS is the thing every one of them can already read. Tailwind
would add a build step, a config file and a vocabulary to learn, in exchange for
speed we do not need at this size. CSS-in-JS adds a runtime cost to a page whose
job is rendering graphs.

Custom properties give the one thing that genuinely matters with three authors:
a single place where colours are defined, so nobody hard-codes a blue.

**Consequence** Dark mode comes free via `prefers-color-scheme`. Adding a colour
means adding a token.

---

## D-005 - React Flow for graph rendering

**Status** Accepted

**Decision** `@xyflow/react` (React Flow v12).

**Alternatives** raw SVG; D3; Cytoscape.js; vis-network.

**Why** Pan, zoom, fit, custom nodes and custom edges are all needed, and all of
them are fiddly to write by hand. React Flow provides them with a React-shaped
API, so Person 2 writes components rather than imperative DOM code.

Raw SVG was seriously considered - it has no dependency and full control - but
pan and zoom alone would cost a day, and that day is better spent on the
compiler. D3 is a data-visualization toolkit, not a graph editor, and its force
layout is non-deterministic, which is disqualifying (see D-007). Cytoscape is
excellent but sits outside React, which makes highlighting from React state
awkward.

**Consequence** One dependency in `dependencies`. The adapters exist to keep
React Flow types from leaking into the rest of the app, so this choice can be
reversed by rewriting two files.

---

## D-006 - No dead state in the DFA

**Status** Accepted

**Decision** Subset construction does not materialise the empty set. A missing
transition means reject.

**Alternatives** a total DFA with an explicit trap state.

**Why** A trap state adds a node with a self-loop on every alphabet symbol to
every DFA graph. For a two-symbol alphabet that is one extra node and two extra
edges carrying no information a student needs; for a four-symbol alphabet the
graph becomes noticeably harder to read. The teaching value is in the reachable
structure.

**Consequence** The DFA is partial. `simulate` handles a missing transition
explicitly and the UI renders an em dash. Minimization has to treat "no
transition" as a distinguishing property - see `COMPILER_PIPELINE.md` stage 8.
If a total DFA is wanted later, add the dead state as a display option, not in
the data.

---

## D-007 - Layout must be deterministic

**Status** Accepted

**Decision** The layout algorithm produces identical positions for identical
input. No force-directed or randomised layout.

**Why** The graph is watched while a simulation steps through it. If nodes move
between renders, the student loses track of which circle is which, and the
animation teaches nothing. Determinism also makes the layout testable.

**Consequence** BFS layering rather than a physics simulation. Slightly less
pretty on dense graphs, far more useful.

---

## D-008 - Parallel transitions merge into one edge

**Status** Accepted - revisited (DFA no longer merges)

**Decision** Transitions sharing a `(from, to)` pair render as a single edge
with a combined label. **Revisited:** this still holds for the NFA adapter. The
DFA adapter now emits one edge per symbol (`e{from}-{to}-{symbol}`), and
edge geometry is computed by `layout/edgeRouting.ts`, which bows edges sharing
an _undirected_ pair to distinct sides so the curves never overlap (see D-017).

**Why** Without merging, an alphabet of four symbols produces four overlapping
curves between the same two circles, and the labels collide. With merging the
graph stays readable as the alphabet grows. Geometric offsets solve the same
readability problem for the DFA without hiding which symbol drives which edge —
useful now that simulation highlighting targets a single symbol per edge.

**Consequence** For the NFA, the graph shows fewer edges than the transition
table has rows; that is correct and worth a line in the legend — the table
remains the exhaustive view. For the DFA, edge count matches the transition
table row count, and each row highlights exactly one edge.

---

## D-009 - Plus and question-mark operators are not supported in v1

**Status** Accepted - revisitable

**Decision** The supported syntax is literals, alternation, concatenation,
Kleene star and parentheses.

**Why** Both extra operators are sugar, so neither teaches a concept the student
does not already meet. Each adds validator rules, precedence entries, Thompson
cases and tests. The cost is small but real, and the benefit is zero for the
project purpose.

**Consequence** The validator rejects them explicitly rather than mis-parsing
them. If the team adds them later, follow the checklist in
`REGEX_SPECIFICATION.md` and update this entry.

---

## D-010 - The compiler is pure TypeScript with no React

**Status** Accepted

**Decision** Nothing under `src/compiler/` imports React or touches the DOM.

**Why** The algorithms are the academic core. Keeping them framework-free means
they are tested without a DOM, run in milliseconds, and can be read by someone
who does not know React - including the examiner. It also makes the boundary
between Person 1 and the others unambiguous.

**Consequence** The compiler throws rather than rendering an error. The UI
translates errors into messages.

---

## D-011 - compileRegex returns everything at once

**Status** Accepted

**Decision** One call returns tokens, postfix, NFA, DFA, minimized DFA and the
step descriptions.

**Alternatives** a function per stage, called by the UI; a lazy or streaming API.

**Why** The UI needs every stage anyway - that is the whole product. A single
result is one thing to pass around, one thing to cache, one thing to type. A
per-stage API would make the UI responsible for the pipeline order, which is
compiler knowledge leaking upward.

**Consequence** `CompilationResult` is a wide type. Everything in it is needed
by some step of the UI; nothing is speculative.

---

## D-012 - Vitest rather than Jest

**Status** Accepted

**Decision** Vitest with jsdom and React Testing Library.

**Why** It reads the existing Vite config, so aliases and transforms work with
no extra setup, and the Jest-compatible API means any Jest knowledge transfers.
Jest would need its own transform and module-resolution configuration to agree
with Vite - a second source of truth for how imports resolve.

**Consequence** `vite.config.ts` carries the test config too.

---

## D-013 - Vitest 3, not Vitest 2

**Status** Accepted

**Decision** `vitest@^3` alongside `vite@^6`.

**Why** Vitest 2 depends on Vite 5. Installed next to Vite 6 it produced a
nested second copy of Vite, and the two copies of the plugin types are not
assignable to each other, so `vite.config.ts` failed to typecheck. Vitest 3
shares the project Vite 6 installation and the duplicate disappears.

**Consequence** Keep the Vitest and Vite major versions compatible when
upgrading either. If `npm ls vite --all` ever shows two versions, that is the
cause.

---

## D-014 - React 18, not React 19

**Status** Accepted

**Decision** React 18.3 with `@types/react@18`.

**Why** React Flow v12 and the testing-library ecosystem are both well proven on 18. Nothing in this project needs a React 19 feature, and a course project is
the wrong place to debug an ecosystem that has not caught up.

**Consequence** Revisit only if a dependency requires 19.

---

## D-015 - Moore refinement, with dead-state removal, for minimization

**Status** Accepted

**Decision** `minimizeDfa` prunes unreachable states, then dead states (those
from which no accepting state is reachable), then refines the remaining states
with Moore's partition refinement. A missing transition gets its own signature
marker during refinement rather than being ignored.

**Alternatives** Hopcroft's algorithm; the table-filling method; refining
without pruning dead states first.

**Why Moore** All three give the same partition. Moore's is the one whose code
reads like its description - "split a block whenever its members disagree about
which block a symbol leads to, repeat until nothing splits" - which matters more
than its worse asymptotic bound at the scale of a course project. Hopcroft is
faster and considerably harder to read; the table-filling method is equivalent
but more bookkeeping for the same result.

**Why prune dead states** Under D-006 the DFA is partial, so a state whose
language is empty is redundant: deleting it and the transitions into it leaves
the language unchanged, because a missing transition already means "reject". A
minimization that kept such a state would not be returning the minimal automaton.

Subset construction never produces one, since every state of a Thompson NFA can
reach its accept state. But `minimizeDfa` takes any `DFA`, including hand-built
ones from tests and any future editor feature, and it should be correct for
those too.

**Why the signature marker** With no dead state in the data, "state p has no
transition on a" is a real distinguishing property: it means reading `a` from
`p` rejects. Ignoring undefined symbols during refinement would merge states
that accept different languages.

**Consequence** If pruning removes every state, the language is empty and the
result is a single non-accepting state with no transitions - the minimal
automaton for that language. Only reachable by hand-built input.

---

## D-016 - Direct Regular Expression → DFA Construction via Syntax Trees and Followpos

**Status** Accepted - mandatory architecture requirement

**Decision** Implement the direct RE → DFA construction algorithm (Dragon Book algorithm 3.36)
based on syntax tree position assignment, nullable, firstpos, lastpos, and followpos computation,
rather than Thompson's construction + subset construction.

**Alternatives** Thompson's ε-NFA construction followed by powerset/subset construction.

**Why**

1. **Instructional focus:** Direct RE → DFA construction is the standard syntax-tree method taught
   in Compiler Design courses. It provides direct, inspectable intermediate tables (nullable,
   firstpos, lastpos, followpos) that cleanly demonstrate compiler frontend concepts.
2. **Deterministic and compact:** Direct construction avoids generating an intermediate 14-state
   ε-NFA for an expression like `(a|b)*abb`, producing a clean 4-state DFA directly.
3. **State representation:** In direct construction, each DFA state is a subset of 1-based syntax-tree
   leaf positions (`positions: number[]`). Acceptance is determined directly by whether the position
   assigned to the unique end-marker `#` is contained in the state's position set.

**Consequence**

- Obsolete Thompson construction, ε-NFA, ε-closure, and subset construction files have been removed.
- `DFAState.positions` is the canonical, authoritative representation of a DFA state.
- `DFAState.nfaStates` is preserved as a deprecated alias pointing directly to `positions` to ensure
  backward compatibility with existing visualization adapters and fixtures.
- The compilation result exposes `syntaxTree`, `positions`, `analysis`, and `followpos` for the UI
  to render rich intermediate syntax analysis steps.

---

## D-017 - Central, obstacle-aware edge routing for DFA graphs

**Status** Accepted

**Decision** Edge paths are computed once for the whole graph by a pure router
(`layout/edgeRouting.ts`), not per edge from React Flow handle positions. The
router fans out same-pair edges, moves edges that would cross an unrelated
state or share a track onto arc lanes, places self-loops in the freest
direction, and slides labels to collision-free spots. Fitting uses the routed
content bounds.

**Why** Per-edge geometry cannot see other edges. The previous version classed
an edge as "back" by comparing state ids and sent every back edge through the
same bottom handles, so return edges shared a track and their labels stacked.
Straight paths also ran through intermediate states, and `fitView` clipped
self-loops because it only measures nodes.

**Consequence** `TransitionEdgeData.parallelOffset` is replaced by `route`.
Routing re-runs only when positions change. It is O(E · lanes · samples ·
(N + E)), negligible at teaching-size DFAs. Some crossings remain where the
automaton's structure forces them; the router guarantees distinct tracks and
readable labels, not crossing-free drawings.
