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
  if (kind === 'syntax-tree') {
    return (
      <ul className="graph-legend" aria-label="Syntax tree legend">
        <li>
          <span className="graph-legend__swatch graph-legend__swatch--op" aria-hidden="true">
            •
          </span>
          operator node
        </li>
        <li>
          <span className="graph-legend__swatch graph-legend__swatch--symbol" aria-hidden="true">
            a
          </span>
          alphabet symbol
        </li>
        <li>
          <span
            className="graph-legend__swatch graph-legend__swatch--end-marker"
            aria-hidden="true"
          >
            #
          </span>
          augmented end-marker
        </li>
        <li>
          <span className="graph-legend__swatch graph-legend__swatch--pos" aria-hidden="true">
            1
          </span>
          leaf position
        </li>
      </ul>
    );
  }

  return (
    <ul className="graph-legend" aria-label="Graph legend">
      <li>
        <span className="graph-legend__swatch graph-legend__swatch--start" aria-hidden="true">
          →
        </span>
        start state
      </li>
      <li>
        <span className="graph-legend__swatch graph-legend__swatch--accepting" aria-hidden="true" />
        accepting state (double border)
      </li>
      <li>
        <span className="graph-legend__swatch graph-legend__swatch--positions" aria-hidden="true">
          {'{…}'}
        </span>
        leaf position set
      </li>
      <li>
        <span className="graph-legend__swatch graph-legend__swatch--active" aria-hidden="true" />
        active / highlighted
      </li>
      <li>
        <span className="graph-legend__swatch graph-legend__swatch--dead" aria-hidden="true">
          qd
        </span>
        implicit sink for missing transitions
      </li>
    </ul>
  );
}
