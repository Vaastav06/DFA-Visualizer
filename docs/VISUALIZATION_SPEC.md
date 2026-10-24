# Visualization Specification

Owner: Person 2. Everything under `src/visualization/`.

## What the module is responsible for

Turning an `NFA` or a `DFA` from the shared contract into a readable graph.
Nothing else. The visualization does not know that regular expressions exist, it
does not call the compiler, and it does not read application state.

## Public components

```tsx
<NfaGraph nfa={nfa} />
<DfaGraph dfa={dfa} />
<DfaGraph dfa={minimizedDfa} kind="minimized-dfa" />
```

Full prop tables are in `API_CONTRACT.md`. Both accept `highlight`, `height` and
`className`.

## Internal structure

```text
NfaGraph / DfaGraph          public, thin
        │
        ▼
    adapters/                NFA|DFA  ->  nodes + edges
        │                    the ONLY place that reads the contract shape
        ▼
    layout/                  node ids  ->  positions
        │
        ▼
  AutomataGraph              the single React Flow instance
        │
        ├── StateNode        one per state
        ├── TransitionEdge   one per transition (NFA merges per pair; DFA keeps one per symbol)
        ├── GraphControls    zoom / pan / fit / reset
        └── GraphLegend      explains the conventions
```

Keeping one React Flow instance in `AutomataGraph` is what stops the NFA and DFA
graphs from drifting apart visually as the project grows.

## State rendering

| State kind        | Rendering                                      |
| ----------------- | ---------------------------------------------- |
| normal            | circle, single border                          |
| accepting         | circle, **double border**                      |
| start             | circle with an **incoming arrow from nowhere** |
| start + accepting | double border AND the incoming arrow           |
| highlighted       | accent fill, while a simulation step is on it  |

The double border and the start arrow are the standard automata-theory notation.
Do not substitute colour for either: colour alone fails for colour-blind readers
and does not survive a printout or a projector.

Labels are `q0`, `q1`, `q2`, ... - produced at render time from the numeric id
(STATE ID CONTRACT). DFA nodes carry `nfaStates` so a tooltip can show
`q2 = {1, 3, 4}`.

Tokens to use: `--state-fill`, `--state-border`, `--state-start`,
`--state-accepting`, `--state-highlight`.

## Edge rendering

| Edge kind   | Rendering                                    |
| ----------- | -------------------------------------------- |
| symbol      | solid line, arrowhead, label `a`             |
| merged      | solid line, one label `a, b` (NFA only)      |
| parallel    | bowed to distinct sides, one label each      |
| long / back | arc on an outer lane around other states     |
| epsilon     | **dashed** line, label the glyph for epsilon |
| self-loop   | loop in the freest direction, label outside  |
| highlighted | accent colour and a heavier stroke           |

**Merging (NFA) vs parallel edges (DFA).** The NFA adapter merges two
transitions between the same ordered pair of states into ONE edge with a
combined label: `q0 -a-> q1` and `q0 -b-> q1` render as a single edge labelled
`a, b`. The DFA adapter does NOT merge — each transition keeps its own edge
(`e{from}-{to}-{symbol}`) so every symbol has its own curve and label.
Edge geometry comes from `layout/edgeRouting.ts` (see "Edge routing" below),
which separates edges sharing an _undirected_ pair (so `q0→q1` and `q1→q0`
separate too). Without it, a four-symbol alphabet would produce four coincident
curves and unreadable labels — merging was the old fix; routing is the new one
for DFA.

**Epsilon.** `transition.symbol === null` renders with the label
`EPSILON_DISPLAY` and a dashed stroke. The dash carries the meaning; the glyph
confirms it. Never render the literal text `null`.

A DFA has no epsilon transitions. If `adaptDfa` meets `symbol === null`, that is
a compiler bug - surface it rather than drawing it.

Tokens: `--edge`, `--edge-epsilon`, `--edge-highlight`.

## Layout

`layout/graphLayout.ts` returns one position per state id.

Recommended: BFS layering from the start state. A state's layer is its shortest
distance in transitions from the start; each layer is a column, and nodes spread
along the cross axis within it. Left-to-right by default, which matches how an
automaton is read and how the input string is consumed.

Requirements:

- **Deterministic.** The same automaton must lay out identically every time.
  A layout that shuffles on re-render makes the graph impossible to follow while
  a simulation steps through it.
- Self-loops and back-edges must not move a node into another layer.
- Unreachable states (possible in a hand-built fixture) still get a position.

`DEFAULT_LAYOUT_OPTIONS` in `layout/layoutTypes.ts` holds the spacing. The
110px in-layer spacing leaves room for a self-loop or a label between stacked
states.

## Edge routing

`layout/edgeRouting.ts` (`routeEdges`) computes every edge's path and label
position at once, from the current state centres, so edges can avoid each
other. `AutomataGraph` calls it through `adapters/flowEdges.ts` and passes the
result to `TransitionEdge` as `data.route`; the edge component only draws it.
React Flow handles do not determine geometry.

- **Pairs.** Edges between the same two states (either direction) fan out
  symmetrically around the chord, 44px apart: a lone forward edge is straight,
  a lone backward edge bows downward, `a`/`b` siblings and `q1↔q2` pairs bow
  to opposite sides.
- **Lanes.** If a pair's paths would pass within 12px of an unrelated state, or
  run alongside an already-placed edge, each edge is re-routed as an arc. Arcs
  try increasing heights (24px lanes); backward edges prefer the lower side,
  forward edges the upper side. Shorter spans are placed first so longer arcs
  nest outside them. A crossing is allowed; sharing a track is not.
- **Self-loops** go in the widest free direction around the state (away from
  incident edges and the start arrow, top preferred), clear of other states,
  labels and edges. Several loop symbols on one state get separate directions.
- **Labels** slide along their path (t = 0.5, then 0.42/0.58 …), and finally
  beside its midpoint, to the first spot clear of states, arrowheads, other
  labels and other edges' strokes.
- **Arrowheads.** Paths start on the source border and end 2px outside the
  target border, so arrowheads are never hidden under a state.
- **Fit.** `routeEdges` also returns content bounds (states, loops, arcs,
  labels). Fit, Reset and the initial view fit to those bounds, not to node
  boxes alone, so loops and outer arcs are never clipped.

Routing is pure and deterministic (no randomness, input order does not matter),
re-runs only when positions change (drag, new graph), never on highlight or
selection, and never mutates the adapted graph or compiler output.

## Graph controls

Four controls, all real `<button>` elements with accessible labels:

| Control  | Behaviour                               |
| -------- | --------------------------------------- |
| zoom in  | step the zoom up                        |
| zoom out | step the zoom down                      |
| fit      | fit the whole automaton in the viewport |
| reset    | restore the initial zoom and pan        |

Pan is drag-on-background. Zoom is scroll-wheel plus the buttons. Keyboard users
must be able to reach every control by Tab - the graph canvas itself does not
have to be keyboard-navigable, but the controls do.

## Highlighting

The UI passes a `GraphHighlight` while animating a simulation:

```tsx
<DfaGraph dfa={dfa} highlight={{ states: [2], transitions: [{ from: 1, to: 2, symbol: 'b' }] }} />
```

The graph applies `isHighlighted` to the matching nodes and edges. It does not
own the animation, does not hold a timer, and does not know what step the UI is
on. The UI drives; the graph draws.

Respect `prefers-reduced-motion` - `globals.css` already disables transitions
under it, so do not add JS-driven animation that bypasses that.

## Empty and edge cases

| Input                           | Behaviour                     |
| ------------------------------- | ----------------------------- |
| `nfa={null}` / `dfa={null}`     | `<EmptyGraphState />`         |
| an automaton with zero states   | `<EmptyGraphState />`         |
| a single state with a self-loop | draws correctly, loop visible |
| an automaton with ~50 states    | still readable after "fit"    |

None of these throw.

## Responsive behaviour

The graph fills its container's width and uses `--graph-height` by default.
Below 640px the controls stack and the legend wraps. The graph must remain
pannable on a touch screen.

## Testing

`tests/visualization/`. Test against the fixtures in `tests/fixtures/`, never
against `compileRegex` output.

Worth testing:

- a public component renders the empty state for `null`
- the NFA adapter merges parallel transitions into one edge; the DFA adapter
  keeps them separate (one edge per symbol, distinct ids/labels)
- the adapters mark `symbol === null` as `isEpsilon`
- the layout is deterministic: two calls give equal results
- accepting and start flags reach the node data
- the controls are reachable by their accessible names

Not worth testing: exact pixel positions, React Flow's own behaviour.
