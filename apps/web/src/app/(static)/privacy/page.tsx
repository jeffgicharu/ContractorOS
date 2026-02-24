'use client';

import { motion } from 'motion/react';
import { SectionWrapper } from '@/components/landing/ui/section-wrapper';
import { GradientOrb } from '@/components/landing/ui/gradient-orb';

const SECTIONS = [
  {
    title: '1. Information We Collect',
    content:
      'We collect information you provide directly: name, email address, company name, and payment information when you create an account. We also collect contractor data you input into the platform, including tax documents, invoices, and classification assessments. Usage data (pages visited, features used, session duration) is collected to improve the product.',
  },
  {
    title: '2. How We Use Your Information',
    content:
      'Your data is used solely to provide and improve ContractorOS services. We use it to operate the platform, process payments, send service notifications, and generate compliance reports. We analyze aggregate usage patterns to improve the product. We never sell your data to third parties and never use it for advertising.',
  },
  {
    title: '3. Data Storage & Security',
    content:
      'All data is encrypted at rest (AES-256) and in transit (TLS 1.3). We use PostgreSQL with organization-scoped queries for data isolation. Passwords are hashed with bcrypt (cost factor 12). Authentication uses JWT tokens with 15-minute expiry and secure httpOnly refresh cookies with rotation. Audit logs track every data access and modification.',
  },
  {
    title: '4. Data Retention',
    content:
      'Active account data is retained for the duration of your subscription. Deleted contractor records are soft-deleted and retained for 90 days to support audit requirements, then permanently removed. Audit logs are retained for 7 years per compliance requirements. You may request immediate deletion at any time.',
  },
  {
    title: '5. Third-Party Services',
    content:
      'We use a minimal set of third-party services: payment processing (Stripe), email delivery (SendGrid), and error monitoring (Sentry). Each provider is contractually bound to data protection standards equivalent to our own. We do not share your data with any other third parties.',
  },
  {
    title: '6. Your Rights',
    content:
      'You may request access to, correction of, or deletion of your personal data at any time. You may export all your data in standard formats (CSV, JSON). You may request a copy of all data we hold about you. Contact privacy@contractoros.com and we will respond within 30 days.',
  },
];

export default function PrivacyPage() {
  return (
    <>
      {/* Hero */}
      <section className="noise-bg relative overflow-hidden py-24 lg:py-32">
        <GradientOrb className="-right-40 top-10" color="bg-brand-200/15" size={400} />

        <div className="relative z-10 mx-auto max-w-3xl px-6 lg:px-8">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-3 text-sm font-semibold text-brand-600"
          >
            Legal
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-display text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl"
          >
            Privacy Policy
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-4 text-sm text-slate-400"
          >
            Last updated: February 1, 2026
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-6 text-lg text-slate-500"
          >
            Your data is sensitive — contractor records, tax documents,
            financial information. Here&apos;s exactly how we handle it.
          </motion.p>
        </div>
      </section>

      {/* Content */}
      <section className="py-24 lg:py-32">
        <div className="mx-auto max-w-3xl px-6 lg:px-8">
          <div className="space-y-10">
            {SECTIONS.map((section, i) => (
              <SectionWrapper key={section.title} delay={0.08 * i}>
                <div className="rounded-2xl border border-slate-200/80 bg-white p-7 shadow-sm">
                  <h2 className="text-lg font-semibold text-slate-900">
                    {section.title}
                  </h2>
                  <p className="mt-4 text-[15px] leading-relaxed text-slate-600">
                    {section.content}
                  </p>
                </div>
              </SectionWrapper>
            ))}
          </div>

          <SectionWrapper delay={0.5}>
            <div className="mt-12 rounded-2xl border border-brand-200 bg-brand-50/50 p-7">
              <h3 className="font-semibold text-slate-900">Questions?</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                If you have any questions about this privacy policy or our data
                practices, contact us at{' '}
                <span className="font-medium text-brand-600">
                  privacy@contractoros.com
                </span>
                .
              </p>
            </div>
          </SectionWrapper>
        </div>
      </section>
    </>
  );
}
