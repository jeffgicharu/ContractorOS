'use client';

import { useEffect, useState } from 'react';
import { Check, Copy, Loader2 } from 'lucide-react';
import {
  CLIPBOARD_CONTENT_MAX_LENGTH,
  type SharedClipboard,
} from '@contractor-os/shared';
import { api } from '@/lib/api-client';
import { SectionWrapper } from './ui/section-wrapper';

export function ClipboardSection() {
  const [clipboard, setClipboard] = useState<SharedClipboard | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [draft, setDraft] = useState('');
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .get<SharedClipboard>('/clipboard')
      .then((res) => {
        if (!cancelled) setClipboard(res.data);
      })
      .catch(() => {
        if (!cancelled) setLoadFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const content = clipboard?.content ?? '';
  const isLoading = clipboard === null && !loadFailed;

  const handleCopy = () => {
    if (!content) return;
    const markCopied = () => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };
    const fallbackCopy = () => {
      const textarea = document.createElement('textarea');
      textarea.value = content;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      markCopied();
    };
    navigator.clipboard.writeText(content).then(markCopied).catch(fallbackCopy);
  };

  const handleSave = () => {
    const trimmed = draft.trim();
    if (!trimmed || saving) return;
    setSaving(true);
    setSaveError(null);
    api
      .patch<SharedClipboard>('/clipboard', { content: trimmed })
      .then((res) => {
        setClipboard(res.data);
        setDraft('');
        setJustSaved(true);
        setTimeout(() => setJustSaved(false), 2000);
      })
      .catch(() => {
        setSaveError('Could not save right now — please try again in a minute.');
      })
      .finally(() => {
        setSaving(false);
      });
  };

  return (
    <section className="border-y border-slate-100 bg-slate-50/60 py-12">
      <SectionWrapper>
        <div className="mx-auto max-w-3xl px-6 text-center lg:px-8">
          <h2 className="font-display text-xl font-bold text-slate-900">
            Shared Clipboard
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Paste a link or note below — it stays here and can be copied any
            time, from any device.
          </p>

          <button
            type="button"
            onClick={handleCopy}
            disabled={!content}
            aria-label="Copy shared clipboard content"
            className="mt-5 inline-flex w-full max-w-2xl items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm transition hover:border-brand-300 hover:text-slate-900 disabled:cursor-default disabled:hover:border-slate-200 disabled:hover:text-slate-600"
          >
            {isLoading ? (
              <span className="inline-flex items-center gap-2 text-slate-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading…
              </span>
            ) : (
              <span className="max-h-32 overflow-y-auto whitespace-pre-wrap break-all text-left font-mono">
                {loadFailed
                  ? 'Could not load the shared clipboard — try again later.'
                  : content || 'Nothing here yet — paste something below.'}
              </span>
            )}
            {copied ? (
              <Check className="h-4 w-4 shrink-0 text-success-500" />
            ) : (
              <Copy className="h-4 w-4 shrink-0 text-slate-400" />
            )}
          </button>
          <p
            aria-live="polite"
            className={`mt-2 text-xs text-success-500 transition-opacity ${copied ? 'opacity-100' : 'opacity-0'}`}
          >
            Copied to clipboard
          </p>

          <div className="mx-auto mt-4 flex w-full max-w-2xl flex-col gap-2 sm:flex-row">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              maxLength={CLIPBOARD_CONTENT_MAX_LENGTH}
              rows={2}
              placeholder="Paste a new link or note here…"
              aria-label="New shared clipboard content"
              className="flex-1 resize-y rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm placeholder:text-slate-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
            <button
              type="button"
              onClick={handleSave}
              disabled={!draft.trim() || saving}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-5 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-default disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : justSaved ? (
                <Check className="h-4 w-4" />
              ) : null}
              {justSaved ? 'Saved' : 'Save'}
            </button>
          </div>
          <p
            aria-live="polite"
            className={`mt-2 text-xs ${saveError ? 'text-red-500' : 'text-transparent'}`}
          >
            {saveError ?? '.'}
          </p>
        </div>
      </SectionWrapper>
    </section>
  );
}
