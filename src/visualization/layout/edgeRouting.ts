/**
 * Edge routing.
 *
 * OWNER: Person 2.
 *
 * CONTRACT: given state centres and the edges between them, return one routed
 * path (plus label position) per edge. Pure and deterministic: the same input
 * always yields the same geometry, so re-renders never shuffle edges.
 *
 * Strategy:
 *  1. Edges are grouped by UNORDERED state pair. A group whose straight/bowed
 *     paths clear every unrelated state is fanned out symmetrically around the
 *     chord: a lone forward edge stays straight, a lone backward edge gets a
 *     gentle bow, and a↔b / multi-symbol pairs bow to distinct sides so
 *     opposite directions never share a track.
 *  2. Any group that would cut through an unrelated state is re-routed edge by
 *     edge onto "lanes": arcs of increasing height, backward edges preferring
 *     the lower side and forward edges the upper side. Shorter spans are
 *     placed first so arcs nest, and a lane is rejected when it hits a state or
 *     runs alongside an already-placed edge.
 *  3. Self-loops are placed in the free angular gap around their state (away
 *     from incident edges and the start arrow), one direction per symbol.
 *  4. Labels slide along their path to the first spot that clears states and
 *     previously placed labels.
 *
 * Paths end on the state circle (plus a small gap) so arrowheads stay visible.
 */

/** Rendered diameter of a DFA state node; must match `.state-node` in AutomataGraph.css. */
export const STATE_NODE_SIZE = 52;

export interface Point {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** A state to route around: its CENTRE point. */
export interface RouteNode {
  id: string;
  x: number;
  y: number;
  /** Start states have an incoming arrow on their left that loops must avoid. */
  isStart?: boolean;
}

export interface RouteEdge {
  id: string;
  source: string;
  target: string;
  label: string;
}

export type EdgeRouteKind = 'straight' | 'parallel' | 'arc' | 'self-loop';

export interface EdgeRoute {
  kind: EdgeRouteKind;
  /** SVG path, `M … C …` (or `M … L …` for straight edges). */
  path: string;
  /** Cubic Bézier control points [start, c1, c2, end]. */
  points: [Point, Point, Point, Point];
  /** Centre of the label box. */
  label: Point;
  /**
   * Signed bow in px relative to the edge's own left-hand normal (0 = straight).
   * For self-loops: the loop direction in radians.
   */
  bow: number;
}

export interface RoutingResult {
  routes: Map<string, EdgeRoute>;
  /** Bounding box of states, paths and labels (for fit-to-view). */
  bounds: Rect;
}

export interface RoutingOptions {
  nodeRadius: number;
  /** Gap between the arrow tip and the state border. */
  arrowGap: number;
  /** Separation between sibling edges of the same state pair. */
  parallelSpread: number;
  /** Height step between successive arc lanes. */
  laneGap: number;
  /** Minimum distance a path keeps from unrelated state borders. */
  clearance: number;
  /** How far a self-loop reaches out from the state border. */
  loopReach: number;
}

export const DEFAULT_ROUTING_OPTIONS: RoutingOptions = {
  nodeRadius: STATE_NODE_SIZE / 2,
  arrowGap: 2,
  parallelSpread: 44,
  laneGap: 24,
  clearance: 12,
  loopReach: 40,
};

type Cubic = [Point, Point, Point, Point];

const SAMPLES = 32;
const MAX_LANES = 14;
/** Two paths closer than this for several samples are considered overlapping. */
const OVERLAP_DISTANCE = 11;
const OVERLAP_SAMPLE_LIMIT = 3;
const LABEL_HEIGHT = 20;
const LABEL_T_CANDIDATES = [0.5, 0.42, 0.58, 0.34, 0.66, 0.27, 0.73];
const LOOP_FREE_GAP = (70 * Math.PI) / 180;
/** Loop directions, ordered by preference: top first, bottom last. */
const LOOP_ANGLES = buildLoopAngles();

export function routeEdges(
  nodes: RouteNode[],
  edges: RouteEdge[],
  options: RoutingOptions = DEFAULT_ROUTING_OPTIONS
): RoutingResult {
  const routes = new Map<string, EdgeRoute>();
  const nodeById = new Map(nodes.map((n) => [n.id, n]));
  const r = options.nodeRadius;

  const drawable = edges
    .filter((e) => nodeById.has(e.source) && nodeById.has(e.target))
    .slice()
    .sort(compareEdges);

  const placed: Point[][] = [];

  // 1. Pair groups (non self-loops), in deterministic order.
  const groups = new Map<string, RouteEdge[]>();
  for (const edge of drawable) {
    if (edge.source === edge.target) continue;
    const key = pairKey(edge.source, edge.target);
    const group = groups.get(key);
    if (group) group.push(edge);
    else groups.set(key, [edge]);
  }

  /** Edges whose natural fan-out bow hits a state or runs along another edge. */
  const needsLane: { edge: RouteEdge; naturalBow: number }[] = [];
  for (const [key, group] of groups) {
    const [lo] = key.split('\u0000');
    // Canonical direction first, then by label, so offsets are stable.
    group.sort((a, b) => {
      const da = a.source === lo ? 0 : 1;
      const db = b.source === lo ? 0 : 1;
      return da - db || compareIds(a.label, b.label) || compareIds(a.id, b.id);
    });

    const k = group.length;
    const candidates = group.map((edge, i) => {
      const s = nodeById.get(edge.source)!;
      const t = nodeById.get(edge.target)!;
      const dir = edge.source === lo ? 1 : -1;
      let bow = dir * (i - (k - 1) / 2) * options.parallelSpread;
      // A lone backward edge still bows (downwards) so its direction reads clearly.
      if (k === 1 && isBackward(s, t)) {
        bow = sideSign(s, t, 'below') * (options.parallelSpread / 2);
      }
      const curve = buildArc(s, t, bow, r, options.arrowGap);
      return { edge, bow, curve, samples: sampleCubic(curve) };
    });

    const clear = candidates.every(
      (c) =>
        clearsNodes(c.samples, nodes, [c.edge.source, c.edge.target], r + options.clearance) &&
        !placed.some((other) => overlaps(c.samples, other, nodes, r))
    );

    if (clear) {
      for (const c of candidates) {
        routes.set(c.edge.id, {
          kind: Math.abs(c.bow) < 0.5 ? 'straight' : 'parallel',
          path: Math.abs(c.bow) < 0.5 ? linePath(c.curve) : cubicPath(c.curve),
          points: c.curve,
          label: c.curve[0],
          bow: c.bow,
        });
        placed.push(c.samples);
      }
    } else {
      for (const c of candidates) needsLane.push({ edge: c.edge, naturalBow: c.bow });
    }
  }

  // 2. Lane routing: short spans first so longer arcs nest outside them.
  needsLane.sort((a, b) => {
    const la = chordLength(nodeById.get(a.edge.source)!, nodeById.get(a.edge.target)!);
    const lb = chordLength(nodeById.get(b.edge.source)!, nodeById.get(b.edge.target)!);
    return la - lb || compareEdges(a.edge, b.edge);
  });

  for (const { edge, naturalBow } of needsLane) {
    const s = nodeById.get(edge.source)!;
    const t = nodeById.get(edge.target)!;
    const preferred = sideSign(s, t, isBackward(s, t) ? 'below' : 'above');
    const ignore = [edge.source, edge.target];
    const minDistance = r + options.clearance;

    // Candidate bows ranked by how far they stray from the natural route; the
    // non-preferred side costs six extra lanes so back edges stay below.
    const bows: { bow: number; cost: number }[] = [{ bow: naturalBow, cost: Math.abs(naturalBow) }];
    for (let lane = 0; lane < MAX_LANES; lane += 1) {
      const height = options.parallelSpread / 2 + lane * options.laneGap;
      bows.push({ bow: preferred * height, cost: height });
      bows.push({ bow: -preferred * height, cost: height + 6 * options.laneGap });
    }
    bows.sort((a, b) => a.cost - b.cost);

    let chosen: { bow: number; curve: Cubic; samples: Point[] } | null = null;
    let fallback: { bow: number; curve: Cubic; samples: Point[] } | null = null;

    for (const { bow } of bows) {
      const curve = buildArc(s, t, bow, r, options.arrowGap);
      const samples = sampleCubic(curve);
      if (!clearsNodes(samples, nodes, ignore, minDistance)) continue;
      if (!fallback) fallback = { bow, curve, samples };
      if (placed.some((other) => overlaps(samples, other, nodes, r))) continue;
      chosen = { bow, curve, samples };
      break;
    }

    if (!chosen) {
      // Every lane collides with something: take the first state-clear lane,
      // or the outermost preferred lane. Never drop the transition.
      const bow = preferred * (options.parallelSpread / 2 + (MAX_LANES - 1) * options.laneGap);
      const curve = buildArc(s, t, bow, r, options.arrowGap);
      chosen = fallback ?? { bow, curve, samples: sampleCubic(curve) };
    }

    routes.set(edge.id, {
      kind:
        Math.abs(chosen.bow) < 0.5 ? 'straight' : chosen.bow === naturalBow ? 'parallel' : 'arc',
      path: Math.abs(chosen.bow) < 0.5 ? linePath(chosen.curve) : cubicPath(chosen.curve),
      points: chosen.curve,
      label: chosen.curve[0],
      bow: chosen.bow,
    });
    placed.push(chosen.samples);
  }

  // 3. Self-loops, placed in the widest free direction around each state.
  const loopsByNode = new Map<string, RouteEdge[]>();
  for (const edge of drawable) {
    if (edge.source !== edge.target) continue;
    const list = loopsByNode.get(edge.source);
    if (list) list.push(edge);
    else loopsByNode.set(edge.source, [edge]);
  }

  const labelBoxes: Rect[] = [];

  for (const [nodeId, loops] of loopsByNode) {
    const node = nodeById.get(nodeId)!;
    const occupied = incidentAngles(node, drawable, routes);
    if (node.isStart) occupied.push(Math.PI);
    // Strokes of edges not touching this state: a loop should not cross them.
    const foreign = drawable
      .filter((e) => e.source !== nodeId && e.target !== nodeId && routes.has(e.id))
      .map((e) => sampleCubic(routes.get(e.id)!.points));

    for (const edge of loops) {
      const size = labelSize(edge.label);
      const angle = chooseLoopAngle(node, occupied, nodes, labelBoxes, foreign, size, options);
      occupied.push(angle);
      const curve = buildLoop(node, angle, options);
      const label = loopLabel(curve, angle, size);

      routes.set(edge.id, {
        kind: 'self-loop',
        path: cubicPath(curve),
        points: curve,
        label,
        bow: angle,
      });
      placed.push(sampleCubic(curve));
      labelBoxes.push(boxAt(label, size));
    }
  }

  // 4. Labels for non-loop edges, avoiding states, earlier labels and other
  //    edges' strokes (a label sitting on a crossing is ambiguous).
  const routeSamples = new Map<string, Point[]>();
  for (const [id, route] of routes) routeSamples.set(id, sampleCubic(route.points));

  for (const edge of drawable) {
    const route = routes.get(edge.id);
    if (!route || route.kind === 'self-loop') continue;
    const size = labelSize(edge.label);

    // On-path positions first, then beside the path's midpoint (for edges too
    // short to hold a label without covering the arrowhead).
    const [p0, , , p3] = route.points;
    const len = Math.hypot(p3.x - p0.x, p3.y - p0.y) || 1;
    const nx = -(p3.y - p0.y) / len;
    const ny = (p3.x - p0.x) / len;
    const mid = cubicAt(route.points, 0.5);
    const side = (Math.abs(nx) * size.width) / 2 + (Math.abs(ny) * size.height) / 2 + 4;
    const positions = [
      ...LABEL_T_CANDIDATES.map((t) => cubicAt(route.points, t)),
      { x: mid.x + nx * side, y: mid.y + ny * side },
      { x: mid.x - nx * side, y: mid.y - ny * side },
    ];

    let best: { point: Point; cost: number } | null = null;
    for (const point of positions) {
      const box = boxAt(point, size);
      let cost = labelCost(box, nodes, labelBoxes, r);
      for (const [otherId, samples] of routeSamples) {
        if (otherId !== edge.id && crossesBox(samples, inflate(box, 2))) cost += 6;
      }
      if (!best || cost < best.cost - 1e-9) best = { point, cost };
      if (cost === 0) break;
    }
    route.label = roundPoint(best!.point);
    labelBoxes.push(boxAt(route.label, size));
  }

  return { routes, bounds: computeBounds(nodes, routes, labelBoxes, r) };
}

/* -------------------------------------------------------------------------- */
/* Geometry helpers                                                           */
/* -------------------------------------------------------------------------- */

function buildArc(s: Point, t: Point, bow: number, r: number, gap: number): Cubic {
  const dx = t.x - s.x;
  const dy = t.y - s.y;
  const len = Math.hypot(dx, dy) || 1;
  const n = { x: -dy / len, y: dx / len };
  // Quadratic control point; the curve's midpoint then sits `bow` px off the chord.
  const ctrl = {
    x: (s.x + t.x) / 2 + n.x * 2 * bow,
    y: (s.y + t.y) / 2 + n.y * 2 * bow,
  };
  const p0 = towards(s, ctrl, r);
  const p3 = towards(t, ctrl, r + gap);
  return [
    roundPoint(p0),
    roundPoint({ x: p0.x + (2 / 3) * (ctrl.x - p0.x), y: p0.y + (2 / 3) * (ctrl.y - p0.y) }),
    roundPoint({ x: p3.x + (2 / 3) * (ctrl.x - p3.x), y: p3.y + (2 / 3) * (ctrl.y - p3.y) }),
    roundPoint(p3),
  ];
}

function buildLoop(node: Point, angle: number, options: RoutingOptions): Cubic {
  const r = options.nodeRadius;
  const footSpread = 0.42;
  const ctrlSpread = 0.62;
  const reach = r + options.loopReach * 1.35;
  const at = (a: number, dist: number) => ({
    x: node.x + Math.cos(a) * dist,
    y: node.y + Math.sin(a) * dist,
  });
  return [
    roundPoint(at(angle - footSpread, r)),
    roundPoint(at(angle - ctrlSpread, reach)),
    roundPoint(at(angle + ctrlSpread, reach)),
    roundPoint(at(angle + footSpread, r + options.arrowGap)),
  ];
}

function loopLabel(curve: Cubic, angle: number, size: { width: number; height: number }): Point {
  const apex = cubicAt(curve, 0.5);
  const dir = { x: Math.cos(angle), y: Math.sin(angle) };
  const push = (Math.abs(dir.x) * size.width) / 2 + (Math.abs(dir.y) * size.height) / 2 + 3;
  return roundPoint({ x: apex.x + dir.x * push, y: apex.y + dir.y * push });
}

function chooseLoopAngle(
  node: RouteNode,
  occupied: number[],
  nodes: RouteNode[],
  labels: Rect[],
  foreign: Point[][],
  size: { width: number; height: number },
  options: RoutingOptions
): number {
  const others = nodes.filter((n) => n.id !== node.id);
  let best = LOOP_ANGLES[0];
  let bestScore = -Infinity;
  for (const angle of LOOP_ANGLES) {
    const curve = buildLoop(node, angle, options);
    const box = boxAt(loopLabel(curve, angle, size), size);
    // Blocked when the loop or its label would touch another state or label.
    const blocked =
      !clearsNodes(sampleCubic(curve), nodes, [node.id], options.nodeRadius + 6) ||
      labelCost(box, others, labels, options.nodeRadius) > 0;
    const gap = occupied.length
      ? Math.min(...occupied.map((o) => angularDistance(o, angle)))
      : Math.PI;
    // Any gap of ~70° or more is "free enough"; then the preference order wins.
    const loopSamples = sampleCubic(curve);
    const crosses = foreign.some(
      (path) =>
        crossesBox(path, box) ||
        path.some((p) => loopSamples.some((q) => Math.hypot(p.x - q.x, p.y - q.y) < 6))
    );
    const score = Math.min(gap, LOOP_FREE_GAP) - (blocked ? 10 : 0) - (crosses ? 1 : 0);
    if (score > bestScore + 1e-6) {
      best = angle;
      bestScore = score;
    }
  }
  return best;
}

/** Departure directions of every routed edge touching `node`. */
function incidentAngles(
  node: RouteNode,
  edges: RouteEdge[],
  routes: Map<string, EdgeRoute>
): number[] {
  const angles: number[] = [];
  for (const edge of edges) {
    if (edge.source === edge.target) continue;
    const route = routes.get(edge.id);
    if (!route) continue;
    const [p0, c1, c2, p3] = route.points;
    if (edge.source === node.id) angles.push(Math.atan2(c1.y - p0.y, c1.x - p0.x));
    if (edge.target === node.id) angles.push(Math.atan2(c2.y - p3.y, c2.x - p3.x));
  }
  return angles;
}

function cubicAt([p0, p1, p2, p3]: Cubic, t: number): Point {
  const u = 1 - t;
  const a = u * u * u;
  const b = 3 * u * u * t;
  const c = 3 * u * t * t;
  const d = t * t * t;
  return {
    x: a * p0.x + b * p1.x + c * p2.x + d * p3.x,
    y: a * p0.y + b * p1.y + c * p2.y + d * p3.y,
  };
}

/** Points along a routed edge (for hit-testing and tests). */
export function sampleRoute(route: EdgeRoute, count = SAMPLES): Point[] {
  const out: Point[] = [];
  for (let i = 0; i <= count; i += 1) out.push(cubicAt(route.points, i / count));
  return out;
}

function sampleCubic(curve: Cubic): Point[] {
  const out: Point[] = [];
  for (let i = 0; i <= SAMPLES; i += 1) out.push(cubicAt(curve, i / SAMPLES));
  return out;
}

function clearsNodes(
  samples: Point[],
  nodes: RouteNode[],
  ignore: string[],
  minDistance: number
): boolean {
  for (const node of nodes) {
    if (ignore.includes(node.id)) continue;
    for (const p of samples) {
      if (Math.hypot(p.x - node.x, p.y - node.y) < minDistance) return false;
    }
  }
  return true;
}

/**
 * True when `a` runs alongside `b` for a stretch (a single crossing is fine).
 * Samples near states are ignored because edges legitimately converge there.
 */
function overlaps(a: Point[], b: Point[], nodes: RouteNode[], r: number): boolean {
  let close = 0;
  for (const p of a) {
    if (nodes.some((n) => Math.hypot(p.x - n.x, p.y - n.y) < r + 18)) continue;
    for (const q of b) {
      if (Math.hypot(p.x - q.x, p.y - q.y) < OVERLAP_DISTANCE) {
        close += 1;
        break;
      }
    }
    if (close >= OVERLAP_SAMPLE_LIMIT) return true;
  }
  return false;
}

function towards(from: Point, to: Point, dist: number): Point {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy) || 1;
  return { x: from.x + (dx / len) * dist, y: from.y + (dy / len) * dist };
}

/** Sign of `bow` that bends the s→t edge to the requested side of the screen. */
function sideSign(s: Point, t: Point, side: 'above' | 'below'): 1 | -1 {
  const dx = t.x - s.x;
  const dy = t.y - s.y;
  // Left-hand normal of s→t is (-dy, dx); "below" means +y (or +x for vertical chords).
  const ny = dx;
  const nx = -dy;
  const downish = Math.abs(ny) > 1e-6 ? ny > 0 : nx > 0;
  const below: 1 | -1 = downish ? 1 : -1;
  return side === 'below' ? below : (-below as 1 | -1);
}

function isBackward(s: Point, t: Point): boolean {
  return t.x < s.x - 1;
}

function chordLength(s: Point, t: Point): number {
  return Math.hypot(t.x - s.x, t.y - s.y);
}

function angularDistance(a: number, b: number): number {
  const d = Math.abs(a - b) % (2 * Math.PI);
  return d > Math.PI ? 2 * Math.PI - d : d;
}

function buildLoopAngles(): number[] {
  const top = -Math.PI / 2;
  const step = Math.PI / 8;
  const out = [top];
  for (let k = 1; k <= 8; k += 1) {
    out.push(top + k * step);
    if (k < 8) out.push(top - k * step);
  }
  return out;
}

function roundPoint(p: Point): Point {
  return { x: Math.round(p.x * 100) / 100, y: Math.round(p.y * 100) / 100 };
}

function cubicPath([p0, c1, c2, p3]: Cubic): string {
  return `M ${p0.x} ${p0.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${p3.x} ${p3.y}`;
}

function linePath([p0, , , p3]: Cubic): string {
  return `M ${p0.x} ${p0.y} L ${p3.x} ${p3.y}`;
}

/* -------------------------------------------------------------------------- */
/* Labels & bounds                                                            */
/* -------------------------------------------------------------------------- */

/** Approximate rendered size of `.transition-edge-label` (13px mono, 6px padding). */
export function labelSize(label: string): { width: number; height: number } {
  return { width: Math.max(20, label.length * 8 + 14), height: LABEL_HEIGHT };
}

function boxAt(center: Point, size: { width: number; height: number }): Rect {
  return {
    x: center.x - size.width / 2,
    y: center.y - size.height / 2,
    width: size.width,
    height: size.height,
  };
}

function labelCost(box: Rect, nodes: RouteNode[], labels: Rect[], r: number): number {
  let cost = 0;
  for (const node of nodes) {
    // Keep clear of the state and of arrowheads landing on it.
    const nearestX = clamp(node.x, box.x, box.x + box.width);
    const nearestY = clamp(node.y, box.y, box.y + box.height);
    const d = Math.hypot(node.x - nearestX, node.y - nearestY);
    if (d < r + 8) cost += r + 8 - d;
  }
  for (const other of labels) {
    cost += overlapArea(inflate(box, 3), other) / 10;
  }
  return cost;
}

function crossesBox(samples: Point[], box: Rect): boolean {
  // Check segment midpoints too: samples on long arcs can straddle a small box.
  for (let i = 0; i < samples.length; i += 1) {
    const p = samples[i];
    const q = samples[Math.min(i + 1, samples.length - 1)];
    for (const c of [p, { x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 }]) {
      if (c.x >= box.x && c.x <= box.x + box.width && c.y >= box.y && c.y <= box.y + box.height) {
        return true;
      }
    }
  }
  return false;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function inflate(rect: Rect, by: number): Rect {
  return {
    x: rect.x - by,
    y: rect.y - by,
    width: rect.width + by * 2,
    height: rect.height + by * 2,
  };
}

function overlapArea(a: Rect, b: Rect): number {
  const w = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
  const h = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);
  return w > 0 && h > 0 ? w * h : 0;
}

function computeBounds(
  nodes: RouteNode[],
  routes: Map<string, EdgeRoute>,
  labels: Rect[],
  r: number
): Rect {
  if (nodes.length === 0) return { x: 0, y: 0, width: 0, height: 0 };
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  const add = (x: number, y: number) => {
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  };
  for (const n of nodes) {
    add(n.x - r - (n.isStart ? 34 : 0), n.y - r);
    add(n.x + r, n.y + r);
  }
  for (const route of routes.values()) {
    for (const p of sampleCubic(route.points)) add(p.x, p.y);
  }
  for (const l of labels) {
    add(l.x, l.y);
    add(l.x + l.width, l.y + l.height);
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

/* -------------------------------------------------------------------------- */
/* Ordering                                                                   */
/* -------------------------------------------------------------------------- */

function pairKey(a: string, b: string): string {
  return compareIds(a, b) <= 0 ? `${a}\u0000${b}` : `${b}\u0000${a}`;
}

/** Numeric-aware, locale-independent id comparison. */
function compareIds(a: string, b: string): number {
  const na = Number(a);
  const nb = Number(b);
  if (a !== '' && b !== '' && Number.isFinite(na) && Number.isFinite(nb) && na !== nb) {
    return na - nb;
  }
  return a < b ? -1 : a > b ? 1 : 0;
}

function compareEdges(a: RouteEdge, b: RouteEdge): number {
  return (
    compareIds(a.source, b.source) ||
    compareIds(a.target, b.target) ||
    compareIds(a.label, b.label) ||
    compareIds(a.id, b.id)
  );
}
