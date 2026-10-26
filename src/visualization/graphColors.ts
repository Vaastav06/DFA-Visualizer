/**
 * Concrete graph colours for SVG strokes and arrow markers.
 *
 * SVG marker ids cannot contain `var(...)`, and exported images need literal
 * colours, so these mirror the edge tokens in src/styles/variables.css.
 * Keep the two in sync.
 */
export const GRAPH_COLORS = {
  /** Ordinary transition edges and arrowheads (--edge). */
  edge: '#c2cbc5',
  /** Epsilon transitions (--edge-epsilon). */
  edgeEpsilon: '#659579',
  /** Transition taken by the current simulation step (--edge-highlight). */
  edgeHighlight: '#65f8ff',
  /** Background behind exported diagrams (--surface). */
  exportBackground: '#090e0b',
} as const;

/** Stroke and marker colour for a transition edge in the given state. */
export function edgeColor(isHighlighted: boolean, isEpsilon: boolean): string {
  if (isHighlighted) return GRAPH_COLORS.edgeHighlight;
  return isEpsilon ? GRAPH_COLORS.edgeEpsilon : GRAPH_COLORS.edge;
}
