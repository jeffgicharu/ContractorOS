'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { SectionWrapper } from './ui/section-wrapper';

const ARTIFACT_URL =
  'https://claude.ai/public/artifacts/455e139f-8935-4204-aa96-6061c232a735';

export function ArtifactLinkSection() {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const markCopied = () => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };
    const fallbackCopy = () => {
      const textarea = document.createElement('textarea');
      textarea.value = ARTIFACT_URL;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      markCopied();
    };
    navigator.clipboard
      .writeText(ARTIFACT_URL)
      .then(markCopied)
      .catch(fallbackCopy);
  };

  return (
    <section className="border-y border-slate-100 bg-slate-50/60 py-12">
      <SectionWrapper>
        <div className="mx-auto max-w-3xl px-6 text-center lg:px-8">
          <h2 className="font-display text-xl font-bold text-slate-900">
            Claude Artifact
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Click to copy the link below.
          </p>
          <button
            type="button"
            onClick={handleCopy}
            aria-label="Copy Claude artifact link"
            className="mt-5 inline-flex max-w-full items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm transition hover:border-brand-300 hover:text-slate-900"
          >
            <span className="truncate font-mono">{ARTIFACT_URL}</span>
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
            Link copied to clipboard
          </p>
        </div>
      </SectionWrapper>
    </section>
  );
}
