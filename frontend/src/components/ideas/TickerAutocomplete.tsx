'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { XMarkIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface SearchResult {
  symbol: string;
  name: string;
}

interface TickerAutocompleteProps {
  selectedSymbols: string[];
  onAdd: (symbol: string) => void;
  onRemove: (symbol: string) => void;
  placeholder?: string;
  className?: string;
}

export function TickerAutocomplete({
  selectedSymbols,
  onAdd,
  onRemove,
  placeholder = 'Add ticker...',
  className = '',
}: TickerAutocompleteProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.length < 1) {
      setResults([]);
      setSelectedIndex(-1);
      return;
    }

    setIsSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=8`);
        if (res.ok) {
          const data = await res.json();
          const items = (data.results || []).filter(
            (r: SearchResult) => !selectedSymbols.includes(r.symbol)
          );
          setResults(items);
        }
      } catch {
        setResults([]);
      } finally {
        setIsSearching(false);
        setSelectedIndex(-1);
      }
    }, 150);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, selectedSymbols]);

  const handleSelect = useCallback(
    (symbol: string) => {
      onAdd(symbol.toUpperCase());
      setQuery('');
      setResults([]);
      setIsFocused(false);
      inputRef.current?.focus();
    },
    [onAdd]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && results[selectedIndex]) {
        handleSelect(results[selectedIndex].symbol);
      } else if (query.trim().length >= 1) {
        // Direct entry if no result selected
        handleSelect(query.trim());
      }
    } else if (e.key === 'Escape') {
      setResults([]);
      setIsFocused(false);
    }
  };

  const showDropdown = isFocused && results.length > 0;

  return (
    <div className={`relative ${className}`}>
      {/* Selected symbols as chips */}
      {selectedSymbols.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-1.5">
          {selectedSymbols.map((s) => (
            <span
              key={s}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium font-mono bg-primary/20 text-primary"
            >
              {s}
              <button
                onClick={() => onRemove(s)}
                className="hover:text-primary/70 transition-colors"
                aria-label={`Remove ${s}`}
              >
                <XMarkIcon className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-subtle" />
        <input
          ref={inputRef}
          type="text"
          className="input pl-8 text-sm"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            // Delay to allow click on dropdown items
            setTimeout(() => setIsFocused(false), 200);
          }}
          onKeyDown={handleKeyDown}
          role="combobox"
          aria-expanded={showDropdown}
          aria-activedescendant={
            selectedIndex >= 0 ? `ticker-option-${selectedIndex}` : undefined
          }
        />
        {isSearching && (
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
            <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div
          ref={dropdownRef}
          className="absolute z-50 mt-1 w-full bg-background-secondary border border-border rounded-md shadow-lg max-h-48 overflow-y-auto"
          role="listbox"
        >
          {results.map((result, idx) => (
            <button
              key={result.symbol}
              id={`ticker-option-${idx}`}
              className={`w-full flex items-center justify-between px-3 py-2 text-sm transition-colors ${
                idx === selectedIndex
                  ? 'bg-primary/10 text-primary'
                  : 'text-foreground hover:bg-background-hover'
              }`}
              onClick={() => handleSelect(result.symbol)}
              role="option"
              aria-selected={idx === selectedIndex}
            >
              <span className="font-mono font-medium">{result.symbol}</span>
              <span className="text-xs text-foreground-muted truncate ml-2">
                {result.name}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
