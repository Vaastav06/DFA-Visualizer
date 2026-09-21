/**
 * Graph layout.
 *
 * OWNER: Person 2.
 * TODO(Person 2): implement.
 *
 * CONTRACT: given the states, the transitions and the start state, return one
 * `Position` per state id. Recommended approach for an automaton: BFS layering
 * from the start state (layer = shortest distance in transitions), then spread
 * each layer along the cross axis. Self-loops and back-edges must not move a
 * node into a different layer.
 *
 * Must be deterministic: the same automaton always lays out identically, so
 * re-rendering does not shuffle the graph.
 */

import { DEFAULT_LAYOUT_OPTIONS, type LayoutOptions, type LayoutResult } from './layoutTypes';
import type { Transition } from '../../compiler/types';

export function layoutAutomaton(
  states: number[],
  transitions: Transition[],
  startState: number,
  options: LayoutOptions = DEFAULT_LAYOUT_OPTIONS
): LayoutResult {
  void transitions;
  void startState;
  // TODO(Person 2): replace this placeholder with BFS layering.
  // Until then every state is stacked in a single column so the graph
  // components can be developed against real data without crashing.
  const result: LayoutResult = new Map();
  states.forEach((id, index) => {
    result.set(id, { x: 0, y: index * options.nodeSpacing });
  });
  return result;
}
