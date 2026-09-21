/**
 * Shown by a graph component when there is no automaton to draw.
 * OWNER: Person 2.
 */

interface EmptyGraphStateProps {
  message?: string;
}

export function EmptyGraphState({
  message = 'No automaton to display yet. Enter a regular expression to begin.',
}: EmptyGraphStateProps) {
  return (
    <div className="graph-empty" role="status">
      <p>{message}</p>
    </div>
  );
}
