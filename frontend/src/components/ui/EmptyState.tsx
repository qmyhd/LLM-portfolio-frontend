'use client';

import type { ComponentType, SVGProps } from 'react';
import { clsx } from 'clsx';

interface EmptyStateProps {
  icon?: ComponentType<SVGProps<SVGSVGElement>>;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={clsx('flex flex-col items-center justify-center py-8 px-4 text-center fade-in-data', className)}>
      {Icon && <Icon className="h-10 w-10 text-foreground-muted/50 mb-3" />}
      <p className="text-sm font-medium text-foreground-muted">{title}</p>
      {description && (
        <p className="text-xs text-foreground-subtle mt-1">{description}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-3 text-xs text-primary hover:text-primary/80 transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
