'use client';

import { SectionWrapper } from './ui/section-wrapper';

const STATS = [
  { value: '50+', label: 'Contractors managed' },
  { value: '99.9%', label: 'Uptime' },
  { value: '3 min', label: 'Avg. onboarding time' },
  { value: '0', label: 'Misclassifications' },
];

export function SocialProofStrip() {
  return (
    <section className="border-y border-slate-100 bg-slate-50/60 py-12">
      <SectionWrapper>
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <p className="mb-8 text-center text-sm font-medium text-slate-400">
            Trusted by forward-thinking teams
          </p>
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {STATS.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="font-display text-3xl font-bold text-slate-900">
                  {stat.value}
                </p>
                <p className="mt-1 text-sm text-slate-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </SectionWrapper>
    </section>
  );
}
