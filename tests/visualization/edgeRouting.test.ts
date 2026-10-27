/**
 * Tests for deterministic edge routing (geometry only, no browser rendering).
 *
 * OWNER: Person 2.
 */

import { describe, expect, it } from 'vitest';
import { compileRegex } from '../../src/compiler';
import type { DFA } from '../../src/compiler/types';
import { adaptDfa } from '../../src/visualization/adapters/dfaAdapter';
import { layoutAutomaton } from '../../src/visualization/layout/graphLayout';
import {
  DEFAULT_ROUTING_OPTIONS,
  STATE_NODE_SIZE,
  labelSize,
  routeEdges,
  sampleRoute,
  type EdgeRoute,
  type Point,
  type RouteEdge,
  type RouteNode,
} from '../../src/visualization/layout/edgeRouting';

const R = DEFAULT_ROUTING_OPTIONS.nodeRadius;

const dist = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);

function node(id: number, x: number, y = 0, isStart = false): RouteNode {
  return { id: String(id), x, y, isStart };
}

function edge(from: number, to: number, symbol: string): RouteEdge {
  return {
    id: `e${from}-${to}-${symbol}`,
    source: String(from),
    target: String(to),
    label: symbol,
  };
}

/** Mirror of what AutomataGraph feeds the router for a compiled DFA. */
function routeDfa(dfa: DFA) {
  const graph = adaptDfa(dfa);
  const layout = layoutAutomaton(
    dfa.states.map((s) => s.id),
    dfa.transitions,
    dfa.startState
  );
  const half = STATE_NODE_SIZE / 2;
  const nodes: RouteNode[] = graph.nodes.map((n) => {
    const p = layout.get(n.data.stateId)!;
    return { id: n.id, x: p.x + half, y: p.y + half, isStart: n.data.isStart };
  });
  const edges: RouteEdge[] = graph.edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    label: e.data.label,
  }));
  return { graph, nodes, edges, result: routeEdges(nodes, edges) };
}

function labelBox(route: EdgeRoute, label: string) {
  const size = labelSize(label);
  return {
    x: route.label.x - size.width / 2,
    y: route.label.y - size.height / 2,
    width: size.width,
    height: size.height,
  };
}

function boxesOverlap(a: ReturnType<typeof labelBox>, b: ReturnType<typeof labelBox>): boolean {
  return a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
}

describe('routeEdges — pairs of states', () => {
  it('routes opposite-direction transitions on distinct sides of the chord', () => {
    const nodes = [node(0, 0), node(1, 160)];
    const { routes } = routeEdges(nodes, [edge(0, 1, 'a'), edge(1, 0, 'b')]);
    const forward = routes.get('e0-1-a')!;
    const backward = routes.get('e1-0-b')!;

    expect(forward.path).not.toBe(backward.path);
    // Midpoints on opposite sides of the horizontal chord (y = 0).
    const fMid = sampleRoute(forward, 2)[1];
    const bMid = sampleRoute(backward, 2)[1];
    expect(Math.sign(fMid.y)).toBe(-Math.sign(bMid.y));
    expect(Math.abs(fMid.y - bMid.y)).toBeGreaterThanOrEqual(
      DEFAULT_ROUTING_OPTIONS.parallelSpread - 1
    );
    // Labels separated by more than a label's height.
    expect(dist(forward.label, backward.label)).toBeGreaterThan(20);
  });

  it('keeps several symbols between the same states on distinct paths and labels', () => {
    const nodes = [node(0, 0), node(1, 160)];
    const edges = [edge(0, 1, 'a'), edge(0, 1, 'b'), edge(0, 1, 'c')];
    const { routes } = routeEdges(nodes, edges);

    const paths = edges.map((e) => routes.get(e.id)!.path);
    expect(new Set(paths).size).toBe(3);

    const boxes = edges.map((e) => labelBox(routes.get(e.id)!, e.label));
    for (let i = 0; i < boxes.length; i += 1) {
      for (let j = i + 1; j < boxes.length; j += 1) {
        expect(boxesOverlap(boxes[i], boxes[j])).toBe(false);
      }
    }
  });

  it('starts every path on the source border and ends it on the target border', () => {
    const nodes = [node(0, 0), node(1, 160, 0), node(2, 320, 110)];
    const edges = [edge(0, 1, 'a'), edge(1, 2, 'b'), edge(2, 0, 'a'), edge(1, 0, 'b')];
    const { routes } = routeEdges(nodes, edges);
    const byId = new Map(nodes.map((n) => [n.id, n]));

    for (const e of edges) {
      const [start, , , end] = routes.get(e.id)!.points;
      const s = byId.get(e.source)!;
      const t = byId.get(e.target)!;
      expect(dist(start, s)).toBeCloseTo(R, 0);
      // Arrow tip sits just outside the target border, never inside the state.
      expect(dist(end, t)).toBeGreaterThanOrEqual(R);
      expect(dist(end, t)).toBeLessThanOrEqual(R + DEFAULT_ROUTING_OPTIONS.arrowGap + 0.5);
    }
  });

  it('keeps a lone forward transition straight and bows a lone backward one', () => {
    const nodes = [node(0, 0), node(1, 160), node(2, 320, 110)];
    const { routes } = routeEdges(nodes, [edge(0, 1, 'a'), edge(2, 1, 'b')]);
    expect(routes.get('e0-1-a')!.kind).toBe('straight');
    expect(routes.get('e0-1-a')!.path).toMatch(/^M [\d.-]+ [\d.-]+ L /);
    expect(routes.get('e2-1-b')!.kind).not.toBe('straight');
  });
});

describe('routeEdges — long and backward transitions', () => {
  const chain = [node(0, 0, 0, true), node(1, 160), node(2, 320), node(3, 480)];
  const forward = [edge(0, 1, 'a'), edge(1, 2, 'a'), edge(2, 3, 'a')];

  it('routes a long return edge around intermediate states, below the row', () => {
    const { routes } = routeEdges(chain, [...forward, edge(3, 0, 'b')]);
    const back = routes.get('e3-0-b')!;
    expect(back.kind).toBe('arc');

    for (const p of sampleRoute(back, 64)) {
      for (const mid of [chain[1], chain[2]]) {
        expect(dist(p, mid)).toBeGreaterThan(R);
      }
    }
    expect(sampleRoute(back, 2)[1].y).toBeGreaterThan(R);
  });

  it('assigns nested lanes to overlapping return edges instead of one shared track', () => {
    const { routes } = routeEdges(chain, [...forward, edge(3, 0, 'b'), edge(3, 1, 'a')]);
    const outer = routes.get('e3-0-b')!;
    const inner = routes.get('e3-1-a')!;
    expect(outer.path).not.toBe(inner.path);
    // Both below; the longer span uses the deeper lane.
    const outerDepth = Math.max(...sampleRoute(outer).map((p) => p.y));
    const innerDepth = Math.max(...sampleRoute(inner).map((p) => p.y));
    expect(innerDepth).toBeGreaterThan(R);
    expect(outerDepth).toBeGreaterThan(innerDepth + 10);
    // Labels never collide.
    expect(boxesOverlap(labelBox(outer, 'b'), labelBox(inner, 'a'))).toBe(false);
  });

  it('routes a forward edge that skips a state around it, above the row', () => {
    const { routes } = routeEdges(chain, [...forward, edge(0, 2, 'b')]);
    const skip = routes.get('e0-2-b')!;
    expect(skip.kind).toBe('arc');
    expect(sampleRoute(skip, 2)[1].y).toBeLessThan(-R);
  });
});

describe('routeEdges — self-loops', () => {
  it('draws a loop outside the state with its label clear of the state', () => {
    const nodes = [node(0, 0)];
    const { routes } = routeEdges(nodes, [edge(0, 0, 'a')]);
    const loop = routes.get('e0-0-a')!;
    expect(loop.kind).toBe('self-loop');
    for (const p of sampleRoute(loop)) {
      expect(dist(p, nodes[0])).toBeGreaterThanOrEqual(R - 0.5);
    }
    // The loop reaches well outside the circle.
    expect(Math.max(...sampleRoute(loop).map((p) => dist(p, nodes[0])))).toBeGreaterThan(R + 25);
    const box = labelBox(loop, 'a');
    const nearestX = Math.max(box.x, Math.min(0, box.x + box.width));
    const nearestY = Math.max(box.y, Math.min(0, box.y + box.height));
    expect(Math.hypot(nearestX, nearestY)).toBeGreaterThan(R);
  });

  it('prefers the top, and never the start arrow side', () => {
    const { routes } = routeEdges([node(0, 0, 0, true)], [edge(0, 0, 'a')]);
    const apex = sampleRoute(routes.get('e0-0-a')!, 2)[1];
    expect(apex.y).toBeLessThan(-R);
  });

  it('gives each self-loop symbol its own direction', () => {
    const nodes = [node(0, 0, 0, true), node(1, 160)];
    const edges = [edge(0, 1, 'a'), edge(1, 1, 'a'), edge(1, 1, 'b'), edge(1, 1, 'c')];
    const { routes } = routeEdges(nodes, edges);
    const angles = ['a', 'b', 'c'].map((s) => routes.get(`e1-1-${s}`)!.bow);
    expect(new Set(angles.map((a) => a.toFixed(3))).size).toBe(3);
    // No loop points back along the incoming edge (direction π, to the left).
    for (const a of angles) {
      const d = Math.abs(((a - Math.PI + 3 * Math.PI) % (2 * Math.PI)) - Math.PI);
      expect(d).toBeGreaterThan(0.5);
    }
    const boxes = ['a', 'b', 'c'].map((s) => labelBox(routes.get(`e1-1-${s}`)!, s));
    expect(boxesOverlap(boxes[0], boxes[1])).toBe(false);
    expect(boxesOverlap(boxes[1], boxes[2])).toBe(false);
    expect(boxesOverlap(boxes[0], boxes[2])).toBe(false);
  });
});

describe('routeEdges — determinism and completeness', () => {
  const nodes = [node(0, 0, 0, true), node(1, 160), node(2, 320, -55), node(3, 320, 55)];
  const edges = [
    edge(0, 1, 'a'),
    edge(1, 2, 'a'),
    edge(1, 3, 'b'),
    edge(2, 1, 'b'),
    edge(3, 0, 'a'),
    edge(3, 3, 'b'),
    edge(2, 0, 'a'),
  ];

  it('produces identical geometry on repeated runs', () => {
    const a = routeEdges(nodes, edges);
    const b = routeEdges(nodes, edges);
    expect([...a.routes.entries()]).toEqual([...b.routes.entries()]);
    expect(a.bounds).toEqual(b.bounds);
  });

  it('does not depend on the order edges or nodes are supplied in', () => {
    const a = routeEdges(nodes, edges);
    const b = routeEdges([...nodes].reverse(), [...edges].reverse());
    for (const e of edges) {
      expect(b.routes.get(e.id)).toEqual(a.routes.get(e.id));
    }
  });

  it('routes every transition exactly once and never invents edges', () => {
    const { routes } = routeEdges(nodes, edges);
    expect(routes.size).toBe(edges.length);
    for (const e of edges) expect(routes.has(e.id)).toBe(true);
  });

  it('does not mutate its inputs', () => {
    const nodesCopy = structuredClone(nodes);
    const edgesCopy = structuredClone(edges);
    routeEdges(nodes, edges);
    expect(nodes).toEqual(nodesCopy);
    expect(edges).toEqual(edgesCopy);
  });

  it('returns content bounds that contain every state, path and label', () => {
    const { routes, bounds } = routeEdges(nodes, edges);
    const inside = (p: Point) =>
      p.x >= bounds.x - 0.5 &&
      p.x <= bounds.x + bounds.width + 0.5 &&
      p.y >= bounds.y - 0.5 &&
      p.y <= bounds.y + bounds.height + 0.5;
    for (const n of nodes) {
      expect(inside({ x: n.x - R, y: n.y - R })).toBe(true);
      expect(inside({ x: n.x + R, y: n.y + R })).toBe(true);
    }
    for (const route of routes.values()) {
      for (const p of sampleRoute(route)) expect(inside(p)).toBe(true);
      expect(inside(route.label)).toBe(true);
    }
  });

  it('handles an empty graph and a single state', () => {
    expect(routeEdges([], []).routes.size).toBe(0);
    const single = routeEdges([node(0, 0, 0, true)], []);
    expect(single.routes.size).toBe(0);
    expect(single.bounds.width).toBeGreaterThan(0);
  });
});

describe('routeEdges — compiled direct DFAs', () => {
  const expressions = [
    '(a|b)*abb',
    '(a|b)*a(a|b)(a|b)',
    'a*',
    '(ab|ba)*',
    'a(b|c)*d|e*f',
    '(a|b)*',
    'ab*c|a(bc)*',
  ];

  for (const regex of expressions) {
    const compiled = compileRegex(regex);
    const dfa = compiled.dfa;
    it(`${regex}: every transition is routed, directed and readable`, () => {
      const { graph, nodes, edges, result } = routeDfa(dfa);

      // Adapter: one edge per transition, no duplicates.
      expect(graph.edges.length).toBe(dfa.transitions.length);
      expect(new Set(graph.edges.map((e) => e.id)).size).toBe(graph.edges.length);
      expect(result.routes.size).toBe(edges.length);

      const byId = new Map(nodes.map((n) => [n.id, n]));
      const placedBoxes: { id: string; box: ReturnType<typeof labelBox> }[] = [];

      for (const e of edges) {
        const route = result.routes.get(e.id)!;
        const [start, , , end] = route.points;
        // Direction preserved: starts at source, arrow ends at target.
        expect(dist(start, byId.get(e.source)!)).toBeLessThan(R + 3);
        expect(dist(end, byId.get(e.target)!)).toBeLessThan(R + 3);

        // Path never passes through an unrelated state.
        for (const p of sampleRoute(route, 48)) {
          for (const n of nodes) {
            if (n.id === e.source || n.id === e.target) continue;
            expect(dist(p, n)).toBeGreaterThan(R);
          }
        }

        // Label never sits on top of a state.
        const box = labelBox(route, e.label);
        for (const n of nodes) {
          const nx = Math.max(box.x, Math.min(n.x, box.x + box.width));
          const ny = Math.max(box.y, Math.min(n.y, box.y + box.height));
          expect(Math.hypot(n.x - nx, n.y - ny)).toBeGreaterThan(R - 1);
        }
        placedBoxes.push({ id: e.id, box });
      }

      // No two labels stacked on each other.
      for (let i = 0; i < placedBoxes.length; i += 1) {
        for (let j = i + 1; j < placedBoxes.length; j += 1) {
          expect(
            boxesOverlap(placedBoxes[i].box, placedBoxes[j].box),
            `${placedBoxes[i].id} vs ${placedBoxes[j].id}`
          ).toBe(false);
        }
      }

      // Opposite-direction pairs never share a path.
      for (const a of edges) {
        for (const b of edges) {
          if (a.id < b.id && a.source === b.target && a.target === b.source) {
            expect(result.routes.get(a.id)!.path).not.toBe(result.routes.get(b.id)!.path);
          }
        }
      }
    });
  }

  it('routes every transition of the direct DFA', () => {
    const compiled = compileRegex('(a|b)*abb');
    const direct = routeDfa(compiled.dfa).result;
    for (const edge of adaptDfa(compiled.dfa).edges) {
      expect(direct.routes.has(edge.id)).toBe(true);
    }
    expect(direct.routes.size).toBe(compiled.dfa.transitions.length);
  });
});
