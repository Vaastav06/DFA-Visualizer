/**
 * Shown before the user has compiled anything.
 *
 * OWNER: Person 3.
 */

import type { ReactNode } from 'react';

interface EmptyStateProps {
  title?: string;
  message?: string;
  children?: ReactNode;
}

export function EmptyState({
  title = 'Nothing to show yet',
  message = 'Enter a regular expression above, or pick one of the examples, to see it converted step by step.',
  children,
}: EmptyStateProps) {
  return (
    <div className="empty-state">
      <h2 className="empty-state__title">{title}</h2>
      <p className="empty-state__message">{message}</p>
      {children}
    </div>
  );
}
