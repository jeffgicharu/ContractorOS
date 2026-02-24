'use client';

import { motion } from 'motion/react';
import { Shield, Lock, Eye, Database, Key, FileCheck } from 'lucide-react';
import { SectionWrapper } from '@/components/landing/ui/section-wrapper';
import { GradientOrb } from '@/components/landing/ui/gradient-orb';
import { BrowserFrame } from '@/components/landing/ui/browser-frame';
import { TiltImage } from '@/components/landing/ui/tilt-image';

const PRACTICES = [
  {
    icon: Lock,
    title: 'Encryption everywhere',
    description:
      'All data encrypted at rest (AES-256) and in transit (TLS 1.3). Database connections use SSL certificates. File uploads are encrypted before storage.',
  },
  {
    icon: Key,
    title: 'Modern authentication',
    description:
      'Bcrypt password hashing (cost 12), JWT with 15-minute expiry, refresh token rotation with revocation, and httpOnly secure cookies with SameSite=Strict.',
  },
  {
    icon: Shield,
    title: 'Role-based access',
    description:
      'Three-layer guard chain on every request: JWT verification, role enforcement (admin vs contractor), and organization isolation. No request bypasses all three.',
  },
  {
    icon: Database,
    title: 'Data isolation',
    description:
      'Multi-tenant with organization-scoped queries. Every database query is filtered by organization ID at the repository level. No cross-tenant data leakage.',
  },
  {
    icon: Eye,
    title: 'Immutable audit trail',
    description:
      'Every state-changing operation logged with full before/after diffs. Immutable records retained for 7 years. Filterable by user, entity, action, and date range.',
  },
  {
    icon: FileCheck,
    title: 'Input validation',
    description:
      'Zod schema validation on every API endpoint. Parameterized SQL queries prevent injection. No raw user input ever reaches the database directly.',
  },
];

export default function SecurityPage() {
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
                Security
              </motion.p>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="font-display text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl"
              >
                Security at{' '}
                <span className="bg-gradient-to-r from-brand-600 to-brand-500 bg-clip-text text-transparent">
                  every layer
                </span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="mt-6 text-lg leading-relaxed text-slate-500"
              >
                Contractor data is sensitive — tax documents, financial
                records, classification assessments. We built ContractorOS
                with security as a first-class concern, not an afterthought.
              </motion.p>
            </div>

            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
            >
              <TiltImage>
                <BrowserFrame
                  src="/screenshots/screenshot-documents.png"
                  alt="ContractorOS Document Vault — compliance tracking and W-9 status"
                  className="shadow-2xl"
                />
              </TiltImage>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Practices grid */}
      <section className="bg-slate-50/80 py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <SectionWrapper>
            <div className="mx-auto max-w-2xl text-center">
              <p className="mb-3 text-sm font-semibold text-brand-600">How we protect your data</p>
              <h2 className="font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Six layers of defense
              </h2>
            </div>
          </SectionWrapper>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {PRACTICES.map((practice, i) => {
              const Icon = practice.icon;
              return (
                <SectionWrapper key={practice.title} delay={0.08 * i}>
                  <div className="group h-full rounded-2xl border border-slate-200/80 bg-white p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-lg hover:shadow-brand-500/[0.06]">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 transition-colors duration-300 group-hover:bg-brand-50">
                      <Icon className="h-5 w-5 text-slate-500 transition-colors duration-300 group-hover:text-brand-600" />
                    </div>
                    <h3 className="mt-4 text-[17px] font-semibold text-slate-900">
                      {practice.title}
                    </h3>
                    <p className="mt-2 text-[14px] leading-relaxed text-slate-500">
                      {practice.description}
                    </p>
                  </div>
                </SectionWrapper>
              );
            })}
          </div>
        </div>
      </section>

      {/* Audit trail showcase */}
      <section className="py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <SectionWrapper>
              <TiltImage>
                <BrowserFrame
                  src="/screenshots/screenshot-audit.png"
                  alt="ContractorOS Audit Log — immutable trail of every system action"
                  className="shadow-xl"
                />
              </TiltImage>
            </SectionWrapper>

            <SectionWrapper delay={0.2}>
              <div>
                <p className="mb-3 text-sm font-semibold text-brand-600">Audit trail</p>
                <h2 className="font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                  Every action, every diff
                </h2>
                <p className="mt-6 text-[16px] leading-relaxed text-slate-600">
                  The audit log captures every state-changing operation across
                  the platform — invoice approvals, contractor status changes,
                  document uploads, classification assessments. Each entry
                  includes the user, timestamp, and full before/after diff of
                  the affected record.
                </p>
                <ul className="mt-6 space-y-3">
                  {[
                    'Immutable log entries — cannot be modified or deleted',
                    'Filter by user, entity type, action, or date range',
                    'Full JSON diff viewer for every change',
                    '7-year retention for compliance requirements',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm text-slate-600">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </SectionWrapper>
          </div>
        </div>
      </section>

      {/* Vulnerability report */}
      <section className="bg-slate-50/80 py-16 lg:py-20">
        <div className="mx-auto max-w-3xl px-6 lg:px-8">
          <SectionWrapper>
            <div className="rounded-2xl border border-brand-200 bg-brand-50/50 p-7 text-center">
              <h3 className="font-display text-xl font-bold text-slate-900">
                Report a vulnerability
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                If you discover a security issue, please report it responsibly to{' '}
                <span className="font-medium text-brand-600">
                  security@contractoros.com
                </span>
                . We take all reports seriously and will respond within 24 hours.
              </p>
            </div>
          </SectionWrapper>
        </div>
      </section>
    </>
  );
}
