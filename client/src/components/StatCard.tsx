import { ReactNode } from 'react';

interface StatCardProps {
  label: string;
  value: ReactNode;
  hint?: string;
  accent?: boolean;
  icon?: ReactNode;
}

export default function StatCard({ label, value, hint, accent = false, icon }: StatCardProps) {
  return (
    <div className="card">
      <div className="flex items-start justify-between">
        <p className="label-eyebrow">{label}</p>
        {icon && (
          <span
            className="w-9 h-9 rounded-lg flex items-center justify-center text-sm"
            style={{
              backgroundColor: accent ? 'var(--accent)' : 'var(--surface-2)',
              color: accent ? 'var(--accent-contrast)' : 'var(--text-muted)',
            }}
          >
            {icon}
          </span>
        )}
      </div>
      <p className="font-display text-3xl mt-1">{value}</p>
      {hint && (
        <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
          {hint}
        </p>
      )}
    </div>
  );
}
