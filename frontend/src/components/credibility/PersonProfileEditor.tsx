'use client';

import { useState, useEffect } from 'react';
import { clsx } from 'clsx';
import { usePerson, usePersonRevisions, useCredibilityCategories } from '@/hooks/useCredibility';
import { Skeleton } from '@/components/ui/Skeleton';
import type { PersonTier, PersonBodyInput } from '@/types/credibility';

const MATCH_STATUS_COLORS: Record<string, string> = {
  confirmed: 'bg-profit/20 text-profit',
  suggested: 'bg-background-tertiary text-foreground-muted',
  unmatched: 'bg-status-warning/20 text-status-warning',
  conflict: 'bg-loss/20 text-loss',
  _default: 'bg-background-tertiary text-foreground-muted',
};

const TIER_OPTIONS = ['S', 'A', 'B', 'C', 'D'] as const;
const PLATFORM_OPTIONS = ['twitter', 'discord', 'youtube'] as const;

interface PersonProfileEditorProps {
  personId: number | null; // null = create mode
  onSaved: () => void;
  onCancel: () => void;
}

interface FormState {
  fullName: string;
  displayName: string;
  role: string;
  bio: string;
  notes: string;
  status: string;
  tiers: PersonTier[];
}

const EMPTY_FORM: FormState = {
  fullName: '',
  displayName: '',
  role: '',
  bio: '',
  notes: '',
  status: 'active',
  tiers: [],
};

export function PersonProfileEditor({ personId, onSaved, onCancel }: PersonProfileEditorProps) {
  const isCreate = personId == null;
  const { person, isLoading, refresh } = usePerson(personId);
  const { revisions, refresh: refreshRevisions } = usePersonRevisions(personId);
  const { categories } = useCredibilityCategories();

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Identity add form state.
  const [idPlatform, setIdPlatform] = useState<string>('twitter');
  const [idUserId, setIdUserId] = useState('');
  const [idHandle, setIdHandle] = useState('');
  const [idErr, setIdErr] = useState<string | null>(null);
  const [idBusy, setIdBusy] = useState(false);

  // Hydrate form when editing an existing person.
  useEffect(() => {
    if (person) {
      setForm({
        fullName: person.fullName ?? '',
        displayName: person.displayName ?? '',
        role: person.role ?? '',
        bio: person.bio ?? '',
        notes: person.notes ?? '',
        status: person.status ?? 'active',
        tiers: person.tiers.map((t) => ({ ...t })),
      });
    } else if (isCreate) {
      setForm(EMPTY_FORM);
    }
  }, [person, isCreate]);

  if (!isCreate && isLoading) {
    return (
      <div className="p-4 space-y-3">
        <Skeleton.Line className="h-5 w-40" />
        <Skeleton.Line className="h-3 w-full" />
        <Skeleton.Line className="h-3 w-3/4" />
      </div>
    );
  }

  const defaultCategory = categories[0]?.slug ?? '';

  const updateTier = (idx: number, patch: Partial<PersonTier>) => {
    setForm((f) => ({
      ...f,
      tiers: f.tiers.map((t, i) => (i === idx ? { ...t, ...patch } : t)),
    }));
  };

  const addTier = () => {
    setForm((f) => ({
      ...f,
      tiers: [...f.tiers, { categorySlug: defaultCategory, tier: 'B', muted: false, rationale: '' }],
    }));
  };

  const removeTier = (idx: number) => {
    setForm((f) => ({ ...f, tiers: f.tiers.filter((_, i) => i !== idx) }));
  };

  const save = async () => {
    setErr(null);
    if (!form.fullName.trim()) {
      setErr('Full name is required.');
      return;
    }
    setSaving(true);
    try {
      const body: PersonBodyInput = {
        fullName: form.fullName.trim(),
        displayName: form.displayName.trim() || null,
        role: form.role.trim() || null,
        bio: form.bio.trim() || null,
        notes: form.notes.trim() || null,
        status: form.status,
        tiers: form.tiers,
      };
      const url = isCreate ? '/api/people' : `/api/people/${personId}`;
      const res = await fetch(url, {
        method: isCreate ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || `Save failed (${res.status})`);
      }
      onSaved();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const addIdentity = async () => {
    if (isCreate || personId == null) return;
    setIdErr(null);
    if (!idUserId.trim()) {
      setIdErr('Platform user ID is required.');
      return;
    }
    setIdBusy(true);
    try {
      const res = await fetch(`/api/people/${personId}/identities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: idPlatform,
          platformUserId: idUserId.trim(),
          handle: idHandle.trim() || null,
        }),
      });
      if (res.status === 409) {
        const data = await res.json().catch(() => ({}));
        setIdErr(data?.error || 'Already linked to another person.');
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || `Add failed (${res.status})`);
      }
      setIdUserId('');
      setIdHandle('');
      refresh();
    } catch (e) {
      setIdErr(e instanceof Error ? e.message : 'Add failed');
    } finally {
      setIdBusy(false);
    }
  };

  const unlinkIdentity = async (sid: number) => {
    if (isCreate || personId == null) return;
    setIdErr(null);
    try {
      const res = await fetch(`/api/people/${personId}/identities/${sid}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || `Unlink failed (${res.status})`);
      }
      refresh();
    } catch (e) {
      setIdErr(e instanceof Error ? e.message : 'Unlink failed');
    }
  };

  const inputCls =
    'w-full bg-background-secondary border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary';

  return (
    <div className="p-4 space-y-4 overflow-y-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">
          {isCreate ? 'New person' : 'Edit person'}
        </h2>
        <button onClick={onCancel} className="text-xs text-foreground-muted hover:text-foreground">
          Cancel
        </button>
      </div>

      {err && <p className="text-sm text-loss">{err}</p>}

      <div className="space-y-2">
        <div>
          <label className="text-xs text-foreground-muted">Full name *</label>
          <input
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            className={inputCls}
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-foreground-muted">Display name</label>
            <input
              value={form.displayName}
              onChange={(e) => setForm({ ...form, displayName: e.target.value })}
              className={inputCls}
            />
          </div>
          <div>
            <label className="text-xs text-foreground-muted">Role</label>
            <input
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className={inputCls}
            />
          </div>
        </div>
        <div>
          <label className="text-xs text-foreground-muted">Bio</label>
          <textarea
            rows={3}
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            className={clsx(inputCls, 'resize-none')}
          />
        </div>
        <div>
          <label className="text-xs text-foreground-muted">Notes</label>
          <textarea
            rows={2}
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            className={clsx(inputCls, 'resize-none')}
          />
        </div>
        <div>
          <label className="text-xs text-foreground-muted">Status</label>
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            className={inputCls}
          >
            <option value="active">active</option>
            <option value="archived">archived</option>
          </select>
        </div>
      </div>

      {/* Tiers editor */}
      <div className="border-t border-border pt-3 space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-wider text-foreground-muted">Tiers</p>
          <button onClick={addTier} className="text-xs text-primary hover:underline">
            + Add tier
          </button>
        </div>
        {form.tiers.length === 0 && (
          <p className="text-xs text-foreground-subtle">No tiers. Add one to rank this source.</p>
        )}
        {form.tiers.map((t, i) => (
          <div key={i} className="flex flex-wrap items-center gap-2">
            <select
              value={t.categorySlug}
              onChange={(e) => updateTier(i, { categorySlug: e.target.value })}
              className="bg-background-secondary border border-border rounded-md px-2 py-1 text-sm"
            >
              {categories.length === 0 && <option value={t.categorySlug}>{t.categorySlug}</option>}
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.label}
                </option>
              ))}
            </select>
            <select
              value={t.tier}
              onChange={(e) => updateTier(i, { tier: e.target.value })}
              className="bg-background-secondary border border-border rounded-md px-2 py-1 text-sm"
            >
              {TIER_OPTIONS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
            <label className="flex items-center gap-1 text-xs text-foreground-muted">
              <input
                type="checkbox"
                checked={t.muted}
                onChange={(e) => updateTier(i, { muted: e.target.checked })}
              />
              muted
            </label>
            <input
              value={t.rationale ?? ''}
              onChange={(e) => updateTier(i, { rationale: e.target.value })}
              placeholder="rationale"
              className="flex-1 min-w-[120px] bg-background-secondary border border-border rounded-md px-2 py-1 text-sm"
            />
            <button
              onClick={() => removeTier(i)}
              className="text-xs text-loss hover:underline"
            >
              remove
            </button>
          </div>
        ))}
      </div>

      {/* Identities (edit mode only) */}
      {!isCreate && (
        <div className="border-t border-border pt-3 space-y-2">
          <p className="text-xs uppercase tracking-wider text-foreground-muted">Identities</p>
          {idErr && <p className="text-sm text-loss">{idErr}</p>}
          {(person?.identities ?? []).length === 0 ? (
            <p className="text-xs text-foreground-subtle">No linked identities.</p>
          ) : (
            <ul className="space-y-1">
              {person?.identities.map((id) => (
                <li key={id.id} className="flex items-center gap-2 text-sm">
                  <span className="text-foreground-muted">{id.platform}</span>
                  <span className="font-mono text-foreground">{id.handle ?? id.platformUserId}</span>
                  <span
                    className={clsx(
                      'text-[10px] px-1.5 py-0.5 rounded',
                      MATCH_STATUS_COLORS[id.matchStatus] ?? MATCH_STATUS_COLORS._default,
                    )}
                  >
                    {id.matchStatus}
                  </span>
                  <button
                    onClick={() => unlinkIdentity(id.id)}
                    className="text-xs text-loss hover:underline ml-auto"
                  >
                    unlink
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <select
              value={idPlatform}
              onChange={(e) => setIdPlatform(e.target.value)}
              className="bg-background-secondary border border-border rounded-md px-2 py-1 text-sm"
            >
              {PLATFORM_OPTIONS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <input
              value={idUserId}
              onChange={(e) => setIdUserId(e.target.value)}
              placeholder="platform user id"
              className="bg-background-secondary border border-border rounded-md px-2 py-1 text-sm"
            />
            <input
              value={idHandle}
              onChange={(e) => setIdHandle(e.target.value)}
              placeholder="handle"
              className="bg-background-secondary border border-border rounded-md px-2 py-1 text-sm"
            />
            <button
              onClick={addIdentity}
              disabled={idBusy}
              className="text-xs text-primary hover:underline disabled:opacity-50"
            >
              add identity
            </button>
          </div>
        </div>
      )}

      {/* Revision history (edit mode only) */}
      {!isCreate && (
        <div className="border-t border-border pt-3 space-y-1">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wider text-foreground-muted">Revision history</p>
            <button
              onClick={() => refreshRevisions()}
              className="text-xs text-foreground-muted hover:text-foreground"
            >
              refresh
            </button>
          </div>
          {revisions.length === 0 ? (
            <p className="text-xs text-foreground-subtle">No revisions yet.</p>
          ) : (
            revisions.map((r, i) => (
              <details key={i} className="text-[11px] text-foreground-muted">
                <summary className="cursor-pointer">
                  {r.createdAt ? r.createdAt.slice(0, 19).replace('T', ' ') : 'unknown date'}
                </summary>
                <pre className="mt-1 p-2 bg-background-tertiary rounded overflow-x-auto text-[10px] text-foreground-subtle">
                  {JSON.stringify(r.snapshot, null, 2)}
                </pre>
              </details>
            ))
          )}
        </div>
      )}

      <div className="border-t border-border pt-3">
        <button onClick={save} disabled={saving} className="btn-primary w-full disabled:opacity-50">
          {saving ? 'Saving…' : isCreate ? 'Create person' : 'Save changes'}
        </button>
      </div>
    </div>
  );
}
