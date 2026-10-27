/**
 * Table displaying 1-based leaf position numbering.
 *
 * Renders the position table from `result.positions`, visually distinguishing
 * the augmented end-marker `#` from normal alphabet symbols.
 */

import type { PositionInfo } from '../../compiler/types';
import { PositionBadge } from './PositionBadge';

interface PositionTableProps {
  positions: PositionInfo[] | null | undefined;
  highlightedPosition?: number | null;
  onSelectPosition?: (position: number) => void;
  className?: string;
}

export function PositionTable({
  positions,
  highlightedPosition,
  onSelectPosition,
  className,
}: PositionTableProps) {
  if (!positions || positions.length === 0) {
    return (
      <div className="vis-empty-state" role="status">
        <p>No position information available.</p>
      </div>
    );
  }

  return (
    <div className={['vis-table-container', className].filter(Boolean).join(' ')}>
      <table className="vis-table position-table" aria-label="Syntax-tree leaf positions">
        <caption className="vis-table__caption">
          Leaf positions assigned left-to-right to symbols and augmented end-marker #
        </caption>
        <thead>
          <tr>
            <th scope="col">Position</th>
            <th scope="col">Symbol</th>
            <th scope="col">Character Type</th>
          </tr>
        </thead>
        <tbody>
          {positions.map((item) => {
            const isEndMarker = item.symbol === '#';
            const isSelected = highlightedPosition === item.position;

            return (
              <tr
                key={item.position}
                className={[
                  isEndMarker ? 'position-table__row--end-marker' : '',
                  isSelected ? 'vis-table__row--selected' : '',
                  onSelectPosition ? 'vis-table__row--clickable' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => onSelectPosition?.(item.position)}
                onKeyDown={
                  onSelectPosition
                    ? (event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          onSelectPosition(item.position);
                        }
                      }
                    : undefined
                }
                tabIndex={onSelectPosition ? 0 : undefined}
                aria-selected={onSelectPosition ? isSelected : undefined}
              >
                <td>
                  <PositionBadge position={item.position} isEndMarker={isEndMarker} />
                </td>
                <td className="vis-table__code-cell">
                  <code>{item.symbol}</code>
                </td>
                <td>
                  {isEndMarker ? (
                    <span className="vis-badge vis-badge--accent">Augmented end-marker (#)</span>
                  ) : (
                    <span className="vis-badge">Alphabet symbol</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
