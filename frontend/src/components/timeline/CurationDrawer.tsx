'use client';

import { useState, type ReactNode } from 'react';
import { TagsInput } from '@/components/ideas/TagsInput';
import { usePeople } from '@/hooks/useCredibility';
import { curateParsedIdea, updateIdeaCuration } from '@/hooks/useTimeline';
import { ATTRIBUTION_LABELS } from './badges';
import type {
  AttributionKind,
  ParsedIdeaReviewItem,
  ReviewStatus,
  UserIdea,
} from '@/types/ideas';

const LABEL = 'block text-xs font-medium text-foreground-muted mb-1';
const FIELD = 'w-full bg-background-secondary border border-border rounded-md px-2 py-1.5 text-sm';

function SectionHeader({ children }: { children: ReactNode }) {
  return (
    <h3 className="text-[11px] font-semibold uppercase tracking-wider text-foreground-subtle">
      {children}
    </h3>
  );
}

const REVIEW_OPTIONS: { value: ReviewStatus; label: string }[] = [
  { value: 'reviewed', label: 'Reviewed' },
  { value: 'needs_review', label: 'Needs review' },
  { value: 'unreviewed', label: 'Unreviewed' },
];

const ATTRIBUTION_OPTIONS = (
  Object.entries(ATTRIBUTION_LABELS) as [AttributionKind, string][]
).map(([value, label]) => ({ value, label }));

export type CurationTarget =
  | { kind: 'idea'; item: UserIdea }
  | { kind: 'parsed'; item: ParsedIdeaReviewItem };

interface CurationDrawerProps {
  target: CurationTarget;
  onClose: () => void;
  onSaved: () => void;
}

/**
 * Right-side drawer for correcting a single item: review status + notes,
 * attribution (self / person / institution incl. 13F filing fields), and —
 * depending on the item kind — tags (imported ideas) or labels/symbols/
 * direction (parsed Discord ideas).
 *
 * Once an item is saved as reviewed, reparses will never overwrite it; set
 * it back to "Unreviewed" here to re-open it for the NLP pipeline.
 */
export function CurationDrawer({ target, onClose, onSaved }: CurationDrawerProps) {
  const { people } = usePeople();
  const isParsed = target.kind === 'parsed';
  const item = target.item;

  const [reviewStatus, setReviewStatus] = useState<ReviewStatus>(
    item.reviewStatus === 'unreviewed' ? 'reviewed' : item.reviewStatus,
  );
  const [reviewNotes, setReviewNotes] = useState(item.reviewNotes ?? '');
  const [attributionKind, setAttributionKind] = useState<AttributionKind>(item.attributionKind);
  const [personId, setPersonId] = useState(
    item.attributedPersonId != null ? String(item.attributedPersonId) : '',
  );
  const [institutionName, setInstitutionName] = useState(item.institutionName ?? '');
  const [filingType, setFilingType] = useState(item.filingType ?? '');
  const [filingPeriod, setFilingPeriod] = useState(item.filingPeriod ?? '');

  // Idea-only fields
  const [tags, setTags] = useState<string[]>(target.kind === 'idea' ? target.item.tags : []);
  const [title, setTitle] = useState(target.kind === 'idea' ? (target.item.title ?? '') : '');

  // Parsed-only fields
  const [primarySymbol, setPrimarySymbol] = useState(
    target.kind === 'parsed' ? (target.item.primarySymbol ?? '') : '',
  );
  const [symbolsText, setSymbolsText] = useState(
    target.kind === 'parsed' ? target.item.symbols.join(', ') : '',
  );
  const [labelsText, setLabelsText] = useState(
    target.kind === 'parsed' ? target.item.labels.join(', ') : '',
  );
  const [thesisBucket, setThesisBucket] = useState(
    target.kind === 'parsed' ? (target.item.thesisBucket ?? '') : '',
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const splitList = (raw: string, upper = false) =>
    raw
      .split(',')
      .map((s) => (upper ? s.trim().toUpperCase() : s.trim()))
      .filter(Boolean);

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      const shared = {
        reviewStatus,
        reviewNotes: reviewNotes.trim() || null,
        attributionKind,
        attributedPersonId:
          attributionKind === 'external_person' && personId ? Number(personId) : null,
        institutionName:
          attributionKind === 'institution' && institutionName.trim()
            ? institutionName.trim()
            : null,
        filingType: filingType.trim() || null,
        filingPeriod: filingPeriod.trim() || null,
      };

      if (target.kind === 'parsed') {
        await curateParsedIdea(target.item.id, {
          ...shared,
          primarySymbol: primarySymbol.trim() ? primarySymbol.trim().toUpperCase() : null,
          symbols: splitList(symbolsText, true),
          labels: splitList(labelsText).map((l) => l.toUpperCase()),
          thesisBucket: thesisBucket.trim() || null,
        });
      } else {
        await updateIdeaCuration(target.item.id, {
          ...shared,
          tags,
          title: title.trim() || null,
        });
      }
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const sourceText =
    target.kind === 'parsed'
      ? (target.item.messageContent ?? target.item.ideaText ?? '')
      : target.item.content;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
      <div className="relative w-full max-w-[480px] h-full bg-background border-l border-border overflow-y-auto p-5 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">
            {isParsed ? 'Curate parsed idea' : 'Curate idea'}
          </h2>
          <button type="button" onClick={onClose} className="text-sm text-foreground-muted hover:text-foreground">
            Close
          </button>
        </div>

        {/* Original content, read-only for context */}
        <div className="space-y-2">
          <SectionHeader>{isParsed ? 'Source message' : 'Content'}</SectionHeader>
          <p className="text-sm text-foreground-muted whitespace-pre-wrap max-h-36 overflow-y-auto border border-border/50 rounded-md p-2 bg-background-secondary/50">
            {sourceText || '—'}
          </p>
          {target.kind === 'parsed' && target.item.ideaSummary && (
            <p className="text-xs text-foreground-subtle">
              NLP summary: {target.item.ideaSummary}
            </p>
          )}
        </div>

        {/* Review status */}
        <div className="space-y-3 border-t border-border pt-4">
          <SectionHeader>Review</SectionHeader>
          <div>
            <label className={LABEL}>Status</label>
            <select
              value={reviewStatus}
              onChange={(e) => setReviewStatus(e.target.value as ReviewStatus)}
              className={FIELD}
            >
              {REVIEW_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            {isParsed && (
              <p className="text-2xs text-foreground-subtle mt-1">
                Reviewed and needs-review items are frozen — NLP reparses will not
                overwrite them. Set back to Unreviewed to re-open.
              </p>
            )}
          </div>
          <div>
            <label className={LABEL}>Notes</label>
            <textarea
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              rows={2}
              className={FIELD}
              placeholder="why this was corrected (optional)"
            />
          </div>
        </div>

        {/* Attribution */}
        <div className="space-y-3 border-t border-border pt-4">
          <SectionHeader>Attribution</SectionHeader>
          <div>
            <label className={LABEL}>Who is this idea from?</label>
            <select
              value={attributionKind}
              onChange={(e) => setAttributionKind(e.target.value as AttributionKind)}
              className={FIELD}
            >
              {ATTRIBUTION_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          {attributionKind === 'external_person' && (
            <div>
              <label className={LABEL}>Person</label>
              <select value={personId} onChange={(e) => setPersonId(e.target.value)} className={FIELD}>
                <option value="">(select person)</option>
                {people.map((p) => (
                  <option key={p.id} value={String(p.id)}>
                    {p.displayName || p.fullName}
                  </option>
                ))}
              </select>
            </div>
          )}
          {attributionKind === 'institution' && (
            <>
              <div>
                <label className={LABEL}>Institution / fund</label>
                <input
                  value={institutionName}
                  onChange={(e) => setInstitutionName(e.target.value)}
                  className={FIELD}
                  placeholder="e.g. Berkshire Hathaway"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={LABEL}>Filing type</label>
                  <input
                    value={filingType}
                    onChange={(e) => setFilingType(e.target.value)}
                    className={FIELD}
                    placeholder="e.g. 13F"
                  />
                </div>
                <div>
                  <label className={LABEL}>Filing period</label>
                  <input
                    value={filingPeriod}
                    onChange={(e) => setFilingPeriod(e.target.value)}
                    className={FIELD}
                    placeholder="e.g. 2026-Q1"
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Kind-specific classification */}
        {target.kind === 'idea' ? (
          <div className="space-y-3 border-t border-border pt-4">
            <SectionHeader>Classification</SectionHeader>
            <div>
              <label className={LABEL}>Title</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} className={FIELD} placeholder="optional" />
            </div>
            <div>
              <label className={LABEL}>Tags</label>
              <TagsInput
                tags={tags}
                onAdd={(tag) => setTags((prev) => [...prev, tag])}
                onRemove={(tag) => setTags((prev) => prev.filter((t) => t !== tag))}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-3 border-t border-border pt-4">
            <SectionHeader>Classification</SectionHeader>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={LABEL}>Primary symbol</label>
                <input
                  value={primarySymbol}
                  onChange={(e) => setPrimarySymbol(e.target.value.toUpperCase())}
                  className={FIELD}
                  placeholder="e.g. NVDA"
                />
              </div>
              <div>
                <label className={LABEL}>Thesis bucket</label>
                <input
                  value={thesisBucket}
                  onChange={(e) => setThesisBucket(e.target.value)}
                  className={FIELD}
                  placeholder="e.g. berkshire-2026-q1-13f"
                />
              </div>
            </div>
            <div>
              <label className={LABEL}>All symbols</label>
              <input
                value={symbolsText}
                onChange={(e) => setSymbolsText(e.target.value)}
                className={FIELD}
                placeholder="comma-separated, e.g. AAPL, MSFT"
              />
            </div>
            <div>
              <label className={LABEL}>Labels</label>
              <input
                value={labelsText}
                onChange={(e) => setLabelsText(e.target.value)}
                className={FIELD}
                placeholder="comma-separated, e.g. INSTITUTIONAL_FLOW"
              />
            </div>
          </div>
        )}

        {error && <p className="text-sm text-loss">{error}</p>}

        <div className="flex gap-2 border-t border-border pt-4">
          <button type="button" onClick={save} disabled={saving} className="btn-primary disabled:opacity-50">
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button type="button" onClick={onClose} className="btn-ghost">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
