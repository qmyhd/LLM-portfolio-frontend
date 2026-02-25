'use client';

import { useState } from 'react';
import type { CreateIdeaRequest } from '@/types/ideas';

interface CarRideModeProps {
  onSave: (req: CreateIdeaRequest) => Promise<void>;
  onExit: () => void;
}

export function CarRideMode({ onSave, onExit }: CarRideModeProps) {
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!content.trim() || saving) return;
    setSaving(true);
    try {
      await onSave({
        content: content.trim(),
        source: 'manual',
      });
      setContent('');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Quick Capture</h2>
        <button className="btn-ghost text-sm" onClick={onExit}>
          Exit
        </button>
      </div>

      {/* Big textarea */}
      <textarea
        className="input flex-1 text-lg p-4 resize-none min-h-[200px]"
        placeholder="Type or paste your idea..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        autoFocus
      />

      {/* Large save button */}
      <button
        className="btn-primary mt-4 py-4 text-lg font-semibold"
        disabled={!content.trim() || saving}
        onClick={handleSave}
      >
        {saving ? 'Saving...' : 'Save Draft'}
      </button>
    </div>
  );
}
