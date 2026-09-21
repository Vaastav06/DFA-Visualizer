/**
 * Explains the graph's visual conventions to the reader.
 *
 * OWNER: Person 2.
 */

import type { AutomatonKind } from '../types';

interface GraphLegendProps {
  kind: AutomatonKind;
}

export function GraphLegend({ kind }: GraphLegendProps) {
  return (
    <ul className="graph-legend" aria-label="Graph legend">
      <li>
        <span className="graph-legend__swatch graph-legend__swatch--start" /> start state
      </li>
      <li>
        <span className="graph-legend__swatch graph-legend__swatch--accepting" /> accepting state
        (double border)
      </li>
      {kind === 'nfa' && (
        <li>
          <span className="graph-legend__swatch graph-legend__swatch--epsilon" /> ε-transition
          (dashed)
        </li>
      )}
      {kind !== 'nfa' && <li>each state maps to a subset of NFA states</li>}
    </ul>
  );
}
