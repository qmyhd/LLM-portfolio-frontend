'use client';

import { clsx } from 'clsx';
import type { ReactNode } from 'react';

interface CardBlockProps {
  children: ReactNode;
  /** Optional title shown in the header */
  title?: string;
  /** Optional icon component shown next to title */
  icon?: React.ElementType;
  /** Icon color class override */
  iconColor?: string;
  /** Right-side header slot */
  headerRight?: ReactNode;
  /** Padding override (default: 'p-4') */
  padding?: string;
  className?: string;
}

export function CardBlock({
  children,
  title,
  icon: Icon,
  iconColor = 'text-foreground-muted',
  headerRight,
  padding = 'p-4',
  className,
}: CardBlockProps) {
  return (
    <div className={clsx('card', padding, className)}>
      {title && (
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {Icon && <Icon className={clsx('h-4 w-4', iconColor)} />}
            <span className="text-sm font-medium text-foreground-muted">
              {title}
            </span>
          </div>
          {headerRight}
        </div>
      )}
      {children}
    </div>
  );
}
