/**
 * Graph layout.
 *
 * OWNER: Person 2.
 *
 * CONTRACT: given the states, the transitions and the start state, return one
 * `Position` per state id. Approach: deterministic BFS layering from the start
 * state (layer = shortest distance in transitions), then spread each layer
 * along the cross axis. Self-loops and back-edges must not move a node into a
 * different layer.
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
  const result: LayoutResult = new Map();
  if (!states || states.length === 0) {
    return result;
  }

  // 1. Build adjacency list (excluding self-loops)
  const adjacency = new Map<number, number[]>();
  for (const state of states) {
    adjacency.set(state, []);
  }

  for (const t of transitions ?? []) {
    if (states.includes(t.from) && states.includes(t.to) && t.from !== t.to) {
      const neighbors = adjacency.get(t.from);
      if (neighbors && !neighbors.includes(t.to)) {
        neighbors.push(t.to);
      }
    }
  }

  // Sort outgoing neighbors for deterministic BFS traversal
  for (const neighbors of adjacency.values()) {
    neighbors.sort((a, b) => a - b);
  }

  // 2. BFS layering from start state
  const layers = new Map<number, number>();
  const visited = new Set<number>();
  const queue: number[] = [];

  if (states.includes(startState)) {
    layers.set(startState, 0);
    visited.add(startState);
    queue.push(startState);

    while (queue.length > 0) {
      const current = queue.shift()!;
      const currentLayer = layers.get(current)!;
      const neighbors = adjacency.get(current) ?? [];

      for (const next of neighbors) {
        if (!visited.has(next)) {
          visited.add(next);
          layers.set(next, currentLayer + 1);
          queue.push(next);
        }
      }
    }
  }

  // 3. Handle unreachable states deterministically
  const unvisitedStates = states.filter((s) => !visited.has(s)).sort((a, b) => a - b);
  for (const s of unvisitedStates) {
    if (!visited.has(s)) {
      const currentMaxLayer = layers.size > 0 ? Math.max(...layers.values()) : -1;
      const startLayer = currentMaxLayer + 1;
      layers.set(s, startLayer);
      visited.add(s);
      queue.push(s);

      while (queue.length > 0) {
        const current = queue.shift()!;
        const currentLayer = layers.get(current)!;
        const neighbors = adjacency.get(current) ?? [];

        for (const next of neighbors) {
          if (!visited.has(next)) {
            visited.add(next);
            layers.set(next, currentLayer + 1);
            queue.push(next);
          }
        }
      }
    }
  }

  // 4. Group states by layer
  const layerMap = new Map<number, number[]>();
  for (const state of states) {
    const layer = layers.get(state) ?? 0;
    if (!layerMap.has(layer)) {
      layerMap.set(layer, []);
    }
    layerMap.get(layer)!.push(state);
  }

  // Sort each layer's states deterministically by state id.
  // Positive states sort ascending (q0, q1, ...); dead state (-1) sorts last (bottom).
  for (const layerStates of layerMap.values()) {
    layerStates.sort((a, b) => {
      if (a < 0) return 1;
      if (b < 0) return -1;
      return a - b;
    });
  }

  // 5. Calculate coordinates
  const rankSpacing = options.rankSpacing || DEFAULT_LAYOUT_OPTIONS.rankSpacing;
  const nodeSpacing = options.nodeSpacing || DEFAULT_LAYOUT_OPTIONS.nodeSpacing;
  const isHorizontal = options.direction !== 'TB';

  const sortedLayerKeys = Array.from(layerMap.keys()).sort((a, b) => a - b);
  const layerToRankIndex = new Map<number, number>();
  sortedLayerKeys.forEach((layerKey, idx) => {
    layerToRankIndex.set(layerKey, idx);
  });

  const centerOffset = 180;
  const startOffset = 80; // Margin on start side for the incoming arrow

  for (const [layerKey, nodesInLayer] of layerMap.entries()) {
    const rankIndex = layerToRankIndex.get(layerKey) ?? 0;
    const count = nodesInLayer.length;
    const totalSpan = (count - 1) * nodeSpacing;
    const spanStart = centerOffset - totalSpan / 2;

    nodesInLayer.forEach((stateId, index) => {
      const mainPos = startOffset + rankIndex * rankSpacing;
      const crossPos = spanStart + index * nodeSpacing;

      if (isHorizontal) {
        result.set(stateId, {
          x: Math.round(mainPos),
          y: Math.round(crossPos),
        });
      } else {
        result.set(stateId, {
          x: Math.round(crossPos),
          y: Math.round(mainPos),
        });
      }
    });
  }

  return result;
}
