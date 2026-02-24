'use client';

import { motion } from 'motion/react';
import { Code2, Shield, Users, Eye } from 'lucide-react';
import { SectionWrapper } from '@/components/landing/ui/section-wrapper';
import { GradientOrb } from '@/components/landing/ui/gradient-orb';
import { BrowserFrame } from '@/components/landing/ui/browser-frame';
import { TiltImage } from '@/components/landing/ui/tilt-image';

const VALUES = [
  {
    icon: Shield,
    title: 'Compliance first',
    description:
      'Three-test risk scoring engine (IRS, DOL, California ABC) runs continuously so you catch misclassification before it becomes a $50K problem.',
  },
  {
    icon: Users,
    title: 'Built for both sides',
    description:
      'The self-service contractor portal puts invoices, documents, and payment tracking in contractors\' hands — no more email chains.',
  },
  {
    icon: Eye,
    title: 'Full auditability',
    description:
      'Every state-changing action logged with full before/after diffs. Immutable audit trail filterable by user, entity, action, and date range.',
  },
  {
    icon: Code2,
    title: 'Engineering rigor',
    description:
      'Raw SQL for performance, TypeScript strict mode for reliability, Zod validation on every boundary. No ORMs, no shortcuts.',
  },
];

export default function AboutPage() {
  return (
    <>
      {/* Hero */}
      <section className="noise-bg relative overflow-hidden py-24 lg:py-32">
        <GradientOrb className="-right-40 top-10" color="bg-brand-200/20" size={450} />

        <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mb-3 text-sm font-semibold text-brand-600"
              >
                About
              </motion.p>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="font-display text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl"
              >
                Built for teams that rely on{' '}
                <span className="bg-gradient-to-r from-brand-600 to-brand-500 bg-clip-text text-transparent">
                  contractors
                </span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="mt-6 text-lg leading-relaxed text-slate-500"
              >
                Companies managing 20–200 contractors are stuck between
                spreadsheets and enterprise software that costs six figures.
                ContractorOS is the middle ground — powerful enough for
                compliance, simple enough for day one.
              </motion.p>
            </div>

            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
            >
              <TiltImage>
                <BrowserFrame
                  src="/screenshots/screenshot-dashboard.png"
                  alt="ContractorOS Dashboard"
                  className="shadow-2xl"
                />
              </TiltImage>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="bg-slate-50/80 py-24 lg:py-32">
        <div className="mx-auto max-w-3xl px-6 lg:px-8">
          <SectionWrapper>
            <h2 className="font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              The problem we&apos;re solving
            </h2>
          </SectionWrapper>
          <SectionWrapper delay={0.1}>
            <div className="mt-8 space-y-6 text-[16px] leading-relaxed text-slate-600">
              <p>
                Contractor management is fragmented. Onboarding lives in email,
                invoices in spreadsheets, compliance in someone&apos;s head, and
                documents in a shared drive nobody can find. When you&apos;re
                managing 50+ contractors, things fall through the cracks — and
                the IRS doesn&apos;t send friendly reminders.
              </p>
              <p>
                We built ContractorOS to unify the entire contractor lifecycle
                in one platform. From the first invite to final offboarding,
                every step is tracked, every document is versioned, and every
                risk is scored automatically.
              </p>
            </div>
          </SectionWrapper>
        </div>
      </section>

      {/* Values */}
      <section className="py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <SectionWrapper>
            <div className="mx-auto max-w-2xl text-center">
              <p className="mb-3 text-sm font-semibold text-brand-600">What we believe</p>
              <h2 className="font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Principles that shape the product
              </h2>
            </div>
          </SectionWrapper>

          <div className="mt-16 grid gap-6 sm:grid-cols-2">
            {VALUES.map((value, i) => {
              const Icon = value.icon;
              return (
                <SectionWrapper key={value.title} delay={0.1 * i}>
                  <div className="group h-full rounded-2xl border border-slate-200/80 bg-white p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-lg hover:shadow-brand-500/[0.06]">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 transition-colors duration-300 group-hover:bg-brand-50">
                      <Icon className="h-5 w-5 text-slate-500 transition-colors duration-300 group-hover:text-brand-600" />
                    </div>
                    <h3 className="mt-4 text-[17px] font-semibold text-slate-900">
                      {value.title}
                    </h3>
                    <p className="mt-2 text-[14px] leading-relaxed text-slate-500">
                      {value.description}
                    </p>
                  </div>
                </SectionWrapper>
              );
            })}
          </div>
        </div>
      </section>

      {/* Tech stack */}
      <section className="bg-slate-50/80 py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <SectionWrapper>
              <div>
                <p className="mb-3 text-sm font-semibold text-brand-600">The stack</p>
                <h2 className="font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                  No ORMs, no shortcuts
                </h2>
                <p className="mt-6 text-[16px] leading-relaxed text-slate-600">
                  ContractorOS is built with Next.js, NestJS, PostgreSQL, and
                  TypeScript in a monorepo architecture. Raw parameterized SQL
                  for performance, Zod schemas for validation at every boundary,
                  and strict mode TypeScript everywhere — because contractor
                  data demands reliability.
                </p>
                <div className="mt-8 flex flex-wrap gap-2">
                  {['Next.js', 'NestJS', 'PostgreSQL', 'TypeScript', 'Tailwind CSS', 'Zod'].map(
                    (tech) => (
                      <span
                        key={tech}
                        className="rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-sm font-medium text-slate-700"
                      >
                        {tech}
                      </span>
                    ),
                  )}
                </div>
              </div>
            </SectionWrapper>

            <SectionWrapper delay={0.2}>
              <TiltImage>
                <BrowserFrame
                  src="/screenshots/screenshot-audit.png"
                  alt="ContractorOS Audit Log — every action tracked with full diffs"
                  className="shadow-xl"
                />
              </TiltImage>
            </SectionWrapper>
          </div>
        </div>
      </section>
    </>
  );
}
