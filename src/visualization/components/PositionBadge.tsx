/**
 * Reusable badge for displaying a syntax-tree leaf position.
 *
 */

interface PositionBadgeProps {
  position: number;
  symbol?: string;
  isEndMarker?: boolean;
  className?: string;
}

export function PositionBadge({
  position,
  symbol,
  isEndMarker = symbol === '#',
  className,
}: PositionBadgeProps) {
  const classNames = ['position-badge', isEndMarker ? 'position-badge--end' : '', className]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={classNames} aria-label={`Position ${position}${symbol ? ` (${symbol})` : ''}`}>
      <span className="position-badge__num">{position}</span>
      {symbol && <span className="position-badge__sym">{symbol}</span>}
    </span>
  );
}
