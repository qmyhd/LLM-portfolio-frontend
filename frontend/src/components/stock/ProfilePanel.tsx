'use client';

import { useState } from 'react';
import { useBucket } from '@/contexts/BucketContext';
import { useThesisProfile } from '@/hooks';
import { BUCKET_NAMES, BUCKET_LABELS, type BucketName } from '@/lib/bucket';
import { Skeleton } from '@/components/ui/Skeleton';
import { pnlTextColor } from '@/lib/colors';
import { formatPercent } from '@/lib/format';
import type { InterviewQuestion, ProfileAutofill, ThesisProfile, TrackRecord } from '@/types/api';

interface ProfilePanelProps {
  ticker: string;
  /** Called after a successful save (used by the review-queue workspace). */
  onSaved?: () => void;
}

type BuildStep = 'idle' | 'autofilling' | 'interview' | 'review' | 'saving';

interface Draft {
  thesis: string;
  conviction: number;
  convictionRationale: string;
  bullCase: string;
  bearCase: string;
  catalystsText: string; // one per line
  risksText: string; // one per line
  entry: string;
  target: string;
  stop: string;
  tagsText: string; // comma-separated
}

const EMPTY_DRAFT: Draft = {
  thesis: '', conviction: 3, convictionRationale: '', bullCase: '', bearCase: '',
  catalystsText: '', risksText: '', entry: '', target: '', stop: '', tagsText: '',
};

function linesToItems(text: string): { text: string }[] {
  return text.split('\n').map((l) => l.trim()).filter(Boolean).map((t) => ({ text: t }));
}

function numOrUndef(s: string): number | undefined {
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : undefined;
}

function TrackRecordPanel({ tr }: { tr: TrackRecord }) {
  return (
    <div className="card p-3 mt-3">
      <p className="text-xs uppercase tracking-wider text-foreground-muted mb-2">Track record</p>
      <div className="grid grid-cols-3 gap-2 text-sm">
        <div><span className="text-foreground-muted text-xs">Trades</span><p className="font-mono">{tr.tradeCount}</p></div>
        <div><span className="text-foreground-muted text-xs">Realized</span>
          <p className={`font-mono ${pnlTextColor(tr.realizedPnlPct)}`}>{formatPercent(tr.realizedPnlPct, 1, { showSign: true })}</p></div>
        <div><span className="text-foreground-muted text-xs">Win rate</span><p className="font-mono">{tr.winRate}%</p></div>
        <div><span className="text-foreground-muted text-xs">Avg hold</span><p className="font-mono">{tr.avgHoldDays}d</p></div>
        <div><span className="text-foreground-muted text-xs">Weight</span><p className="font-mono">{formatPercent(tr.currentWeightPct, 1)}</p></div>
        <div><span className="text-foreground-muted text-xs">Best/Worst</span>
          <p className="font-mono text-xs">{formatPercent(tr.best, 0)} / {formatPercent(tr.worst, 0)}</p></div>
      </div>
    </div>
  );
}

function SavedView({ profile, ticker, bucket, onRefresh }: {
  profile: ThesisProfile; ticker: string; bucket: BucketName; onRefresh: () => void;
}) {
  const [revisions, setRevisions] = useState<Array<{ conviction: number | null; createdAt: string | null }> | null>(null);

  const loadRevisions = async () => {
    const res = await fetch(`/api/stocks/${ticker.toUpperCase()}/profile/revisions?bucket=${bucket}`);
    if (res.ok) setRevisions((await res.json()).revisions ?? []);
  };

  return (
    <div className="p-4 space-y-3 overflow-y-auto">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-foreground-muted">
          Thesis · {BUCKET_LABELS[bucket]}
        </span>
        <span className="text-xs font-mono">
          conviction {'●'.repeat(profile.conviction ?? 0)}{'○'.repeat(5 - (profile.conviction ?? 0))}
        </span>
      </div>
      {profile.thesis && <p className="text-sm text-foreground whitespace-pre-wrap">{profile.thesis}</p>}
      <div className="grid grid-cols-2 gap-3 text-sm">
        {profile.bullCase && <div><span className="text-xs text-profit">Bull</span><p className="text-foreground-muted">{profile.bullCase}</p></div>}
        {profile.bearCase && <div><span className="text-xs text-loss">Bear</span><p className="text-foreground-muted">{profile.bearCase}</p></div>}
      </div>
      {profile.catalysts.length > 0 && (
        <div><span className="text-xs text-foreground-muted">Catalysts</span>
          <ul className="list-disc list-inside text-sm">{profile.catalysts.map((c, i) => <li key={i}>{c.text ?? c.title}</li>)}</ul></div>
      )}
      {profile.risks.length > 0 && (
        <div><span className="text-xs text-foreground-muted">Risks</span>
          <ul className="list-disc list-inside text-sm">{profile.risks.map((r, i) => <li key={i}>{r.text}</li>)}</ul></div>
      )}
      {(profile.levels.entry || profile.levels.target || profile.levels.stop) && (
        <p className="text-sm font-mono">
          entry {profile.levels.entry ?? '—'} · target {profile.levels.target ?? '—'} · stop {profile.levels.stop ?? '—'}
        </p>
      )}
      {profile.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">{profile.tags.map((t) => <span key={t} className="text-[10px] px-2 py-0.5 rounded bg-background-tertiary">{t}</span>)}</div>
      )}
      {profile.trackRecord && <TrackRecordPanel tr={profile.trackRecord} />}

      <div className="pt-2 flex items-center gap-3">
        <button onClick={onRefresh} className="text-xs text-primary hover:underline">Refresh</button>
        <button onClick={loadRevisions} className="text-xs text-foreground-muted hover:text-foreground">History</button>
      </div>
      {revisions && (
        <div className="border-t border-border pt-2 space-y-1">
          {revisions.length === 0 && <p className="text-xs text-foreground-subtle">No revisions yet</p>}
          {revisions.map((r, i) => (
            <div key={i} className="flex justify-between text-[11px] text-foreground-muted">
              <span>{r.createdAt?.slice(0, 10)}</span>
              <span>conviction {r.conviction ?? '—'}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function ProfilePanel({ ticker, onSaved }: ProfilePanelProps) {
  const ctxBucket = useBucket();
  const [pickedBucket, setPickedBucket] = useState<BucketName | null>(null);
  const bucket = ctxBucket ?? pickedBucket;

  const { data: profile, isLoading, refresh } = useThesisProfile(ticker, bucket);

  const [step, setStep] = useState<BuildStep>('idle');
  const [autofill, setAutofill] = useState<ProfileAutofill | null>(null);
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [followUpDone, setFollowUpDone] = useState(false);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [err, setErr] = useState<string | null>(null);

  // Need a concrete bucket to do anything (backend requires it).
  if (!bucket) {
    return (
      <div className="p-4 space-y-3">
        <p className="text-sm text-foreground-muted">
          Pick a strategy bucket for this profile (a ticker can have a separate thesis per strategy).
        </p>
        <select
          className="bg-background-secondary border border-border rounded-md px-3 py-2 text-sm"
          defaultValue=""
          onChange={(e) => setPickedBucket((e.target.value || null) as BucketName | null)}
        >
          <option value="" disabled>Select bucket…</option>
          {BUCKET_NAMES.map((b) => <option key={b} value={b}>{BUCKET_LABELS[b]}</option>)}
        </select>
      </div>
    );
  }

  if (isLoading && step === 'idle') {
    return <div className="p-4 space-y-3"><Skeleton.Line className="h-4 w-32" /><Skeleton.Line className="h-3 w-full" /></div>;
  }

  // Saved profile exists -> show it.
  if (profile && step === 'idle') {
    return <SavedView profile={profile} ticker={ticker} bucket={bucket} onRefresh={refresh} />;
  }

  const runAutofill = async () => {
    setErr(null);
    setStep('autofilling');
    try {
      const aRes = await fetch(`/api/stocks/${ticker.toUpperCase()}/profile/autofill?bucket=${bucket}`, { method: 'POST' });
      if (!aRes.ok) throw new Error('Autofill failed');
      const af: ProfileAutofill = await aRes.json();
      setAutofill(af);
      const iRes = await fetch(`/api/stocks/${ticker.toUpperCase()}/profile/interview?bucket=${bucket}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ autofill: af, answers: [] }),
      });
      if (!iRes.ok) throw new Error('Interview failed');
      setQuestions((await iRes.json()).questions ?? []);
      setStep('interview');
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Build failed');
      setStep('idle');
    }
  };

  const submitAnswers = async () => {
    setErr(null);
    const answerList = questions.map((q) => ({ field: q.field, question: q.question, answer: answers[q.question] ?? '' }));
    try {
      if (!followUpDone) {
        const fRes = await fetch(`/api/stocks/${ticker.toUpperCase()}/profile/interview?bucket=${bucket}`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ autofill, answers: answerList }),
        });
        if (fRes.ok) {
          const followUps: InterviewQuestion[] = (await fRes.json()).questions ?? [];
          setFollowUpDone(true);
          if (followUps.length > 0) {
            setQuestions((prev) => [...prev, ...followUps]);
            return; // let the user answer the follow-ups
          }
        }
      }
      setStep('autofilling'); // reuse spinner state label
      const sRes = await fetch(`/api/stocks/${ticker.toUpperCase()}/profile/synthesize?bucket=${bucket}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ autofill, answers: answerList }),
      });
      if (!sRes.ok) throw new Error('Synthesis failed');
      const d = (await sRes.json()).draft ?? {};
      setDraft({
        thesis: d.thesis ?? '', conviction: d.conviction ?? 3,
        convictionRationale: d.convictionRationale ?? '',
        bullCase: d.bullCase ?? '', bearCase: d.bearCase ?? '',
        catalystsText: (d.catalysts ?? []).map((c: { text?: string }) => c.text ?? '').join('\n'),
        risksText: (d.risks ?? []).map((r: { text?: string }) => r.text ?? '').join('\n'),
        entry: d.levels?.entry?.toString() ?? '', target: d.levels?.target?.toString() ?? '',
        stop: d.levels?.stop?.toString() ?? '', tagsText: (d.tags ?? []).join(', '),
      });
      setStep('review');
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Synthesis failed');
      setStep('interview');
    }
  };

  const saveProfile = async () => {
    setErr(null);
    setStep('saving');
    try {
      const body = {
        thesis: draft.thesis, conviction: draft.conviction,
        convictionRationale: draft.convictionRationale, bullCase: draft.bullCase, bearCase: draft.bearCase,
        catalysts: linesToItems(draft.catalystsText), risks: linesToItems(draft.risksText),
        levels: { entry: numOrUndef(draft.entry), target: numOrUndef(draft.target), stop: numOrUndef(draft.stop) },
        tags: draft.tagsText.split(',').map((t) => t.trim()).filter(Boolean),
        status: 'active',
        aiAutofillJson: autofill ?? undefined,
        interviewJson: { questions, answers },
        dataSources: autofill?.dataSources ?? [],
      };
      const res = await fetch(`/api/stocks/${ticker.toUpperCase()}/profile?bucket=${bucket}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Save failed');
      setStep('idle');
      setFollowUpDone(false);
      refresh();
      onSaved?.();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Save failed');
      setStep('review');
    }
  };

  // Build flow UI
  return (
    <div className="p-4 space-y-3 overflow-y-auto">
      {err && <p className="text-sm text-loss">{err}</p>}

      {step === 'idle' && (
        <div className="text-center py-6">
          <p className="text-sm text-foreground-muted mb-3">
            No profile for {ticker.toUpperCase()} ({BUCKET_LABELS[bucket]}) yet.
          </p>
          <button onClick={runAutofill} className="btn-primary">Build profile with AI</button>
        </div>
      )}

      {step === 'autofilling' && (
        <div className="text-center py-6">
          <p className="text-sm text-foreground-muted">Gathering data &amp; thinking… (this can take a few seconds)</p>
          <Skeleton.Line className="h-3 w-full mt-3" />
        </div>
      )}

      {step === 'interview' && (
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-wider text-foreground-muted">A few questions</p>
          {questions.map((q) => (
            <div key={q.question}>
              <label className="text-sm text-foreground">{q.question}</label>
              <textarea
                rows={2}
                value={answers[q.question] ?? ''}
                onChange={(e) => setAnswers((prev) => ({ ...prev, [q.question]: e.target.value }))}
                className="w-full mt-1 bg-background-secondary border border-border rounded-md px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          ))}
          <button onClick={submitAnswers} className="btn-primary">Continue</button>
        </div>
      )}

      {step === 'review' && (
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-wider text-foreground-muted">Review &amp; edit</p>
          <textarea rows={4} value={draft.thesis} onChange={(e) => setDraft({ ...draft, thesis: e.target.value })}
            placeholder="Thesis" className="w-full bg-background-secondary border border-border rounded-md px-3 py-2 text-sm resize-none" />
          <div className="flex items-center gap-2">
            <span className="text-xs text-foreground-muted">Conviction</span>
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} onClick={() => setDraft({ ...draft, conviction: n })}
                className={`w-7 h-7 rounded text-xs ${draft.conviction === n ? 'bg-primary text-white' : 'bg-background-tertiary'}`}>{n}</button>
            ))}
          </div>
          <textarea rows={2} value={draft.bullCase} onChange={(e) => setDraft({ ...draft, bullCase: e.target.value })}
            placeholder="Bull case" className="w-full bg-background-secondary border border-border rounded-md px-3 py-2 text-sm resize-none" />
          <textarea rows={2} value={draft.bearCase} onChange={(e) => setDraft({ ...draft, bearCase: e.target.value })}
            placeholder="Bear case" className="w-full bg-background-secondary border border-border rounded-md px-3 py-2 text-sm resize-none" />
          <textarea rows={2} value={draft.catalystsText} onChange={(e) => setDraft({ ...draft, catalystsText: e.target.value })}
            placeholder="Catalysts (one per line)" className="w-full bg-background-secondary border border-border rounded-md px-3 py-2 text-sm resize-none" />
          <textarea rows={2} value={draft.risksText} onChange={(e) => setDraft({ ...draft, risksText: e.target.value })}
            placeholder="Risks (one per line)" className="w-full bg-background-secondary border border-border rounded-md px-3 py-2 text-sm resize-none" />
          <div className="grid grid-cols-3 gap-2">
            <input value={draft.entry} onChange={(e) => setDraft({ ...draft, entry: e.target.value })} placeholder="Entry"
              className="bg-background-secondary border border-border rounded-md px-2 py-1.5 text-sm" />
            <input value={draft.target} onChange={(e) => setDraft({ ...draft, target: e.target.value })} placeholder="Target"
              className="bg-background-secondary border border-border rounded-md px-2 py-1.5 text-sm" />
            <input value={draft.stop} onChange={(e) => setDraft({ ...draft, stop: e.target.value })} placeholder="Stop"
              className="bg-background-secondary border border-border rounded-md px-2 py-1.5 text-sm" />
          </div>
          <input value={draft.tagsText} onChange={(e) => setDraft({ ...draft, tagsText: e.target.value })} placeholder="Tags (comma-separated)"
            className="w-full bg-background-secondary border border-border rounded-md px-3 py-2 text-sm" />
          <button onClick={saveProfile} className="btn-primary w-full">Save profile</button>
        </div>
      )}

      {step === 'saving' && <p className="text-sm text-foreground-muted text-center py-6">Saving…</p>}
    </div>
  );
}
