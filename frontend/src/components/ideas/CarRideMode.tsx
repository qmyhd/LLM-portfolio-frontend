'use client';

import { useState } from 'react';
import { clsx } from 'clsx';
import { TrashIcon, SparklesIcon } from '@heroicons/react/24/outline';
import type { CreateIdeaRequest } from '@/types/ideas';
import { cleanTranscription, extractTickers } from '@/lib/transcription';

interface CarRideModeProps {
  onSave: (req: CreateIdeaRequest) => Promise<void>;
  onExit: () => void;
}

export function CarRideMode({ onSave, onExit }: CarRideModeProps) {
  const [segments, setSegments] = useState<string[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [saving, setSaving] = useState(false);

  const addSegment = () => {
    const text = currentInput.trim();
    if (!text) return;
    setSegments((prev) => [...prev, text]);
    setCurrentInput('');
  };

  const removeSegment = (index: number) => {
    setSegments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleClean = () => {
    setSegments((prev) =>
      prev.map((s) => cleanTranscription(s)).filter(Boolean),
    );
  };

  const fullText = segments.join('\n\n');
  const detectedTickers = extractTickers(fullText);

  const handleSave = async () => {
    if (!fullText.trim() || saving) return;
    setSaving(true);
    try {
      await onSave({
        content: fullText.trim(),
        source: 'transcribe',
        symbols: detectedTickers.length > 0 ? detectedTickers : undefined,
      });
      setSegments([]);
      setCurrentInput('');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Dictation Mode</h2>
        <button className="btn-ghost text-sm" onClick={onExit}>
          Exit
        </button>
      </div>

      {/* Accumulated segments */}
      {segments.length > 0 && (
        <div className="mb-4 space-y-2 overflow-y-auto max-h-[40vh]">
          {segments.map((segment, i) => (
            <div
              key={i}
              className="card p-3 flex items-start gap-2 group"
            >
              <p className="flex-1 text-sm text-foreground whitespace-pre-wrap">
                {segment}
              </p>
              <button
                onClick={() => removeSegment(i)}
                className="opacity-0 group-hover:opacity-100 p-1 text-foreground-muted hover:text-loss transition-all flex-shrink-0"
                title="Remove segment"
              >
                <TrashIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}

          {/* Detected tickers */}
          {detectedTickers.length > 0 && (
            <div className="flex items-center gap-2 px-1">
              <span className="text-xs text-foreground-muted">Tickers:</span>
              {detectedTickers.map((t) => (
                <span
                  key={t}
                  className="px-1.5 py-0.5 text-xs font-mono bg-primary/10 text-primary rounded"
                >
                  ${t}
                </span>
              ))}
            </div>
          )}

          {/* Clean button */}
          <button
            onClick={handleClean}
            className="btn-ghost text-xs flex items-center gap-1.5"
          >
            <SparklesIcon className="w-3.5 h-3.5" />
            Clean text
          </button>
        </div>
      )}

      {/* Input for new segment */}
      <textarea
        className="input flex-1 text-lg p-4 resize-none min-h-[120px]"
        placeholder="Type or paste your transcription..."
        value={currentInput}
        onChange={(e) => setCurrentInput(e.target.value)}
        autoFocus
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            addSegment();
          }
        }}
      />

      <p className="text-[10px] text-foreground-muted mt-1 px-1">
        Ctrl+Enter to add segment
      </p>

      {/* Action buttons */}
      <div className="flex gap-3 mt-4">
        <button
          className={clsx(
            'btn-secondary flex-1 py-3 text-base font-semibold',
            !currentInput.trim() && 'opacity-50 cursor-not-allowed',
          )}
          disabled={!currentInput.trim()}
          onClick={addSegment}
        >
          Add Segment
        </button>
        <button
          className="btn-primary flex-1 py-3 text-base font-semibold"
          disabled={!fullText.trim() || saving}
          onClick={handleSave}
        >
          {saving ? 'Saving...' : 'Save as Idea'}
        </button>
      </div>
    </div>
  );
}
