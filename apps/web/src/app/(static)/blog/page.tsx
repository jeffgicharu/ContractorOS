'use client';

import { motion } from 'motion/react';
import { SectionWrapper } from '@/components/landing/ui/section-wrapper';
import { GradientOrb } from '@/components/landing/ui/gradient-orb';
import { BrowserFrame } from '@/components/landing/ui/browser-frame';

const FEATURED_POST = {
  date: 'Feb 18, 2026',
  category: 'Product',
  title: 'Introducing the Classification Risk Monitor',
  summary:
    'Three classification tests, one weighted score. How our risk engine catches misclassification before it becomes a penalty. We walk through the IRS common-law test, DOL economic realities, and California ABC — and how ContractorOS scores them automatically.',
  screenshot: '/screenshots/screenshot-classification.png',
  alt: 'Classification risk monitor dashboard',
};

const POSTS = [
  {
    date: 'Feb 10, 2026',
    category: 'Engineering',
    title: 'Why we chose raw SQL over ORMs',
    summary:
      'ORMs add convenience but hide complexity. Here\'s why we went with parameterized queries and how it shaped our architecture.',
  },
  {
    date: 'Jan 28, 2026',
    category: 'Compliance',
    title: 'IRS vs DOL vs California ABC: A practical guide',
    summary:
      'Understanding the three major contractor classification tests and what they mean for your business.',
  },
  {
    date: 'Jan 15, 2026',
    category: 'Product',
    title: 'The contractor portal: Built for both sides',
    summary:
      'Why giving contractors their own dashboard reduces admin overhead by 60% and keeps everyone happier.',
  },
  {
    date: 'Jan 5, 2026',
    category: 'Engineering',
    title: 'Designing the audit trail: Every action, every diff',
    summary:
      'How we built an immutable audit log that captures full before/after diffs on every state-changing operation.',
  },
  {
    date: 'Dec 20, 2025',
    category: 'Product',
    title: 'Kanban onboarding: From invite to active in 4 stages',
    summary:
      'A visual pipeline that tracks every contractor through invite, tax forms, contracts, and bank details.',
  },
  {
    date: 'Dec 8, 2025',
    category: 'Compliance',
    title: 'The true cost of contractor misclassification',
    summary:
      'Fines, back taxes, and lawsuits — why getting classification wrong can cost your company more than you think.',
  },
];

export default function BlogPage() {
  return (
    <>
      {/* Hero */}
      <section className="noise-bg relative overflow-hidden py-24 lg:py-32">
        <GradientOrb className="-left-32 top-20" color="bg-brand-200/20" size={400} />

        <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-3 text-sm font-semibold text-brand-600"
          >
            Blog
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-display text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl"
          >
            Insights &amp;{' '}
            <span className="bg-gradient-to-r from-brand-600 to-brand-500 bg-clip-text text-transparent">
              updates
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-4 max-w-lg text-lg text-slate-500"
          >
            Thoughts on contractor management, compliance, and building
            better tools.
          </motion.p>
        </div>
      </section>

      {/* Featured post */}
      <section className="py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <SectionWrapper>
            <div className="grid items-center gap-10 rounded-2xl border border-slate-200/80 bg-slate-50/50 p-6 lg:grid-cols-2 lg:gap-12 lg:p-10">
              <div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-600">
                    {FEATURED_POST.category}
                  </span>
                  <time className="text-slate-400">{FEATURED_POST.date}</time>
                </div>
                <h2 className="mt-4 font-display text-2xl font-bold text-slate-900 sm:text-3xl">
                  {FEATURED_POST.title}
                </h2>
                <p className="mt-4 text-[15px] leading-relaxed text-slate-500">
                  {FEATURED_POST.summary}
                </p>
                <span className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-brand-600">
                  Read more &rarr;
                </span>
              </div>
              <BrowserFrame
                src={FEATURED_POST.screenshot}
                alt={FEATURED_POST.alt}
                className="shadow-lg"
              />
            </div>
          </SectionWrapper>
        </div>
      </section>

      {/* Posts grid */}
      <section className="bg-slate-50/80 py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {POSTS.map((post, i) => (
              <SectionWrapper key={post.title} delay={0.08 * i}>
                <article className="group h-full rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-lg hover:shadow-brand-500/[0.06]">
                  <div className="flex items-center gap-3 text-sm">
                    <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-600">
                      {post.category}
                    </span>
                    <time className="text-slate-400">{post.date}</time>
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-slate-900 transition-colors duration-300 group-hover:text-brand-700">
                    {post.title}
                  </h3>
                  <p className="mt-2 text-[14px] leading-relaxed text-slate-500">
                    {post.summary}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-600 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    Read more &rarr;
                  </span>
                </article>
              </SectionWrapper>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
