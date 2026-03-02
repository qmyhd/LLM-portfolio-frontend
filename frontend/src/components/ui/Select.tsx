'use client';

import { useState, useRef, useEffect } from 'react';
import { clsx } from 'clsx';
import { ChevronUpDownIcon } from '@heroicons/react/24/outline';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  size?: 'sm' | 'md';
}

export function Select({
  value,
  onChange,
  options,
  placeholder = 'Select...',
  className,
  size = 'md',
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const handleMouseDown = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  const selectedOption = options.find((o) => o.value === value);
  const displayLabel = selectedOption?.label ?? placeholder;

  return (
    <div ref={wrapperRef} className={clsx('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={clsx(
          'flex items-center justify-between gap-2 w-full bg-background-secondary border border-border rounded-md text-foreground cursor-pointer',
          'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors',
          size === 'sm' ? 'px-2 py-1 text-xs' : 'px-3 py-2 text-sm',
        )}
      >
        <span className={clsx('truncate', !selectedOption && 'text-foreground-subtle')}>
          {displayLabel}
        </span>
        <ChevronUpDownIcon
          className={clsx('flex-shrink-0', size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4', 'text-foreground-muted')}
        />
      </button>

      {open && (
        <div className="absolute top-full left-0 w-full mt-1 bg-background-elevated border border-border rounded-md shadow-lg overflow-hidden z-50 fade-in-data">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
              className={clsx(
                'w-full text-left px-3 py-2 text-sm hover:bg-background-hover cursor-pointer transition-colors',
                option.value === value && 'bg-primary/10 text-primary',
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
