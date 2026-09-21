/**
 * User-facing error message.
 *
 * OWNER: Person 3.
 *
 * Shows ONLY the message. Developer detail (`CompilerError.details`, stack
 * traces) must never reach this component — see docs/ERROR_HANDLING.md.
 */

interface ErrorDisplayProps {
  message: string | null;
  onDismiss?: () => void;
}

export function ErrorDisplay({ message, onDismiss }: ErrorDisplayProps) {
  if (message === null || message === '') {
    return null;
  }

  return (
    <div className="error-display" role="alert">
      <p className="error-display__message">{message}</p>
      {onDismiss && (
        <button type="button" className="error-display__dismiss" onClick={onDismiss}>
          Dismiss
        </button>
      )}
    </div>
  );
}
