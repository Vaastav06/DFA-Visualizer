/**
 * Concrete graph colours for SVG strokes and arrow markers.
 *
 * SVG marker ids cannot contain `var(...)`, and exported images need literal
 * colours, so these mirror the edge tokens in src/styles/variables.css.
 * Keep the two in sync.
 */
export const GRAPH_COLORS = {
  /** Ordinary transition edges and arrowheads (--edge / Rawhide Twine). */
  edge: '#6e5e52',
  /** Transition taken by active simulation step (--edge-highlight / Warm Brass). */
  edgeHighlight: '#d48c38',
  /** Background behind exported diagrams (--canvas / Charred Timber). */
  exportBackground: '#151210',
} as const;

/** Stroke and marker colour for a transition edge in the given state. */
export function edgeColor(isHighlighted: boolean): string {
  return isHighlighted ? GRAPH_COLORS.edgeHighlight : GRAPH_COLORS.edge;
}
