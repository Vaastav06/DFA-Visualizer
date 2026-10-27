/**
 * User-facing error message.
 *
 *
 * Shows ONLY the message. Developer detail (`CompilerError.details`, stack
 * traces) must never reach this component — see docs/ERROR_HANDLING.md.
 */

interface ErrorDisplayProps {
  message: string | null;
  onDismiss?: () => void;
  id?: string;
}

export function ErrorDisplay({
  message,
  onDismiss,
  id = 'regex-error-message',
}: ErrorDisplayProps) {
  if (message === null || message === '') {
    return null;
  }

  return (
    <div id={id} className="error-display" role="alert">
      <p className="error-display__message">{message}</p>
      {onDismiss && (
        <button type="button" className="error-display__dismiss" onClick={onDismiss}>
          Dismiss
        </button>
      )}
    </div>
  );
}
