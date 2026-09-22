/**
 * Graph layout.
 *
 * OWNER: Person 2.
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

function buildAdjacencyList(states: number[], transitions: Transition[]): Map<number, number[]> {
  const adj = new Map<number, number[]>();
  for (const s of states) {
    adj.set(s, []);
  }
  for (const t of transitions) {
    if (t.from !== t.to) {
      // Self-loops don't affect BFS layering
      const neighbors = adj.get(t.from) || [];
      if (!neighbors.includes(t.to)) {
        neighbors.push(t.to);
      }
      adj.set(t.from, neighbors);
    }
  }
  return adj;
}

function bfsLayers(
  states: number[],
  transitions: Transition[],
  startState: number
): Map<number, number> {
  const layers = new Map<number, number>();
  const queue: number[] = [startState];
  layers.set(startState, 0);

  const adj = buildAdjacencyList(states, transitions);

  while (queue.length > 0) {
    const current = queue.shift()!;
    const currentLayer = layers.get(current)!;
    const neighbors = adj.get(current) || [];

    // Sort for deterministic traversal
    const sortedNeighbors = [...neighbors].sort((a, b) => a - b);

    for (const neighbor of sortedNeighbors) {
      if (!layers.has(neighbor)) {
        layers.set(neighbor, currentLayer + 1);
        queue.push(neighbor);
      }
    }
  }

  // Assign layer 0 to unreachable states (shouldn't happen in a proper DFA/NFA)
  for (const s of states) {
    if (!layers.has(s)) {
      layers.set(s, 0);
    }
  }

  return layers;
}

function positionsFromLayers(
  states: number[],
  layers: Map<number, number>,
  options: LayoutOptions
): LayoutResult {
  const result: LayoutResult = new Map();
  const layerGroups = new Map<number, number[]>();

  // Group states by layer
  for (const s of states) {
    const layer = layers.get(s) || 0;
    if (!layerGroups.has(layer)) {
      layerGroups.set(layer, []);
    }
    layerGroups.get(layer)!.push(s);
  }

  // Sort layers for deterministic output
  const sortedLayers = Array.from(layerGroups.keys()).sort((a, b) => a - b);

  for (const layer of sortedLayers) {
    const layerStates = layerGroups.get(layer)!;
    // Sort states within layer for deterministic output
    const sortedStates = [...layerStates].sort((a, b) => a - b);
    const count = sortedStates.length;

    for (let i = 0; i < count; i++) {
      const state = sortedStates[i];
      if (options.direction === 'LR') {
        // Left-to-right: layer = x axis, index = y axis
        const x = layer * options.rankSpacing;
        const y = (i - (count - 1) / 2) * options.nodeSpacing;
        result.set(state, { x, y });
      } else {
        // Top-to-bottom: layer = y axis, index = x axis
        const x = (i - (count - 1) / 2) * options.nodeSpacing;
        const y = layer * options.rankSpacing;
        result.set(state, { x, y });
      }
    }
  }

  return result;
}

export function layoutAutomaton(
  states: number[],
  transitions: Transition[],
  startState: number,
  options: LayoutOptions = DEFAULT_LAYOUT_OPTIONS
): LayoutResult {
  const layers = bfsLayers(states, transitions, startState);
  return positionsFromLayers(states, layers, options);
}
