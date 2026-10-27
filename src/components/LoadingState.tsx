/**
 * Shown while a compilation is in flight.
 *
 */

interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = 'Building the automaton…' }: LoadingStateProps) {
  return (
    <div className="loading-state" role="status" aria-live="polite">
      <span className="loading-state__spinner" aria-hidden="true" />
      <p>{message}</p>
    </div>
  );
}
