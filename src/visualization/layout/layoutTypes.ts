/**
 * Layout types.
 *
 * OWNER: Person 2.
 *
 * The layout step decides where each state is drawn. It is deliberately
 * separate from the adapters so the algorithm can be swapped without touching
 * the node/edge mapping.
 */

/** A point in graph coordinates. */
export interface Position {
  x: number;
  y: number;
}

/** Tunable spacing for the layout algorithm. */
export interface LayoutOptions {
  /** Horizontal gap between layers. */
  rankSpacing: number;
  /** Vertical gap between nodes in the same layer. */
  nodeSpacing: number;
  /** Left-to-right (default) or top-to-bottom. */
  direction: 'LR' | 'TB';
}

/** Defaults used when a graph component passes no options. */
export const DEFAULT_LAYOUT_OPTIONS: LayoutOptions = {
  rankSpacing: 160,
  nodeSpacing: 90,
  direction: 'LR',
};

/** Result of laying out a graph: one position per state id. */
export type LayoutResult = Map<number, Position>;
