/**
 * Interactive Followpos Table visualization.
 *
 * Renders the authoritative followpos mapping produced by Dragon Book Algorithm 3.36.
 */

import type { FollowPosEntry } from '../../compiler/types';
import { PositionBadge } from './PositionBadge';

interface FollowposTableProps {
  followpos: FollowPosEntry[] | null | undefined;
  selectedPosition?: number | null;
  onSelectPosition?: (position: number) => void;
  className?: string;
}

export function FollowposTable({
  followpos,
  selectedPosition,
  onSelectPosition,
  className,
}: FollowposTableProps) {
  if (!followpos || followpos.length === 0) {
    return (
      <div className="vis-empty-state" role="status">
        <p>No followpos data available.</p>
      </div>
    );
  }

  return (
    <div className={['vis-table-container', className].filter(Boolean).join(' ')}>
      <table className="vis-table followpos-table" aria-label="Followpos transition table">
        <caption className="vis-table__caption">
          followpos(p): the set of positions that can immediately follow position p
        </caption>
        <thead>
          <tr>
            <th scope="col">Node Position</th>
            <th scope="col">Symbol</th>
            <th scope="col">followpos</th>
          </tr>
        </thead>
        <tbody>
          {followpos.map((entry) => {
            const isSelected = selectedPosition === entry.position;
            const isEndMarker = entry.symbol === '#';
            const setStr =
              entry.followpos && entry.followpos.length > 0
                ? `{${entry.followpos.join(', ')}}`
                : '∅';

            return (
              <tr
                key={entry.position}
                className={[
                  isSelected ? 'vis-table__row--selected' : '',
                  onSelectPosition ? 'vis-table__row--clickable' : '',
                  isEndMarker ? 'followpos-table__row--end' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => onSelectPosition?.(entry.position)}
                onKeyDown={
                  onSelectPosition
                    ? (event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          onSelectPosition(entry.position);
                        }
                      }
                    : undefined
                }
                tabIndex={onSelectPosition ? 0 : undefined}
                aria-selected={onSelectPosition ? isSelected : undefined}
              >
                <td>
                  <PositionBadge position={entry.position} isEndMarker={isEndMarker} />
                </td>
                <td className="vis-table__code-cell">
                  <code>{entry.symbol}</code>
                  {isEndMarker && <span className="vis-tag">end</span>}
                </td>
                <td className="vis-table__set-cell">
                  <span className={entry.followpos.length === 0 ? 'vis-empty-set' : ''}>
                    {setStr}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
