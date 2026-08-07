import { ReactNode } from 'react';

interface EmptyStateProps {
  title: string;
  description: string;
  action?: ReactNode;
}

export default function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <p className="font-display text-xl mb-2" style={{ color: 'var(--text)' }}>
        {title}
      </p>
      <p className="text-sm max-w-sm mb-5">{description}</p>
      {action}
    </div>
  );
}
