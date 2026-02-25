'use client';

import { useState, useRef } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface TagsInputProps {
  tags: string[];
  onAdd: (tag: string) => void;
  onRemove: (tag: string) => void;
  placeholder?: string;
  className?: string;
}

export function TagsInput({
  tags,
  onAdd,
  onRemove,
  placeholder = 'Add tags...',
  className = '',
}: TagsInputProps) {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const addTag = (raw: string) => {
    const tag = raw.trim().toLowerCase().slice(0, 30);
    if (tag && !tags.includes(tag)) {
      onAdd(tag);
    }
    setInputValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (inputValue.trim()) {
        addTag(inputValue);
      }
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      onRemove(tags[tags.length - 1]);
    }
  };

  return (
    <div className={className}>
      <div
        className="flex flex-wrap gap-1 items-center p-2 bg-background-secondary border border-border rounded-md focus-within:ring-2 focus-within:ring-primary focus-within:border-transparent transition-colors cursor-text min-h-[38px]"
        onClick={() => inputRef.current?.focus()}
      >
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-background-hover text-foreground-muted"
          >
            {tag}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove(tag);
              }}
              className="hover:text-foreground transition-colors"
              aria-label={`Remove tag ${tag}`}
            >
              <XMarkIcon className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          className="flex-1 min-w-[80px] bg-transparent outline-none text-sm text-foreground placeholder-foreground-subtle"
          placeholder={tags.length === 0 ? placeholder : ''}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            if (inputValue.trim()) addTag(inputValue);
          }}
        />
      </div>
    </div>
  );
}
