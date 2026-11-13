'use client';

import { useState } from 'react';
import { fieldInput, fieldLabel } from './styles';

/**
 * Password input with a show/hide toggle. Sends nothing anywhere itself; the
 * parent owns the value and clears it after a successful submit.
 */
export function PasswordField({
  id,
  label,
  value,
  onChange,
  disabled,
  describedBy,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  describedBy?: string;
}) {
  const [shown, setShown] = useState(false);
  return (
    <div>
      <label htmlFor={id} className={fieldLabel}>
        {label}
      </label>
      <div className="flex gap-2">
        <input
          id={id}
          type={shown ? 'text' : 'password'}
          autoComplete="new-password"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          value={value}
          disabled={disabled}
          aria-describedby={describedBy}
          onChange={(e) => onChange(e.target.value)}
          className={`${fieldInput} min-w-0 flex-1`}
        />
        <button
          type="button"
          onClick={() => setShown((s) => !s)}
          aria-pressed={shown}
          aria-label={shown ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          className="btn-secondary btn min-h-[44px] sm:min-h-[40px] px-3 text-xs shrink-0"
        >
          {shown ? 'Hide' : 'Show'}
        </button>
      </div>
    </div>
  );
}
