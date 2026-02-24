'use client';

import { motion } from 'motion/react';
import { SectionWrapper } from '@/components/landing/ui/section-wrapper';
import { GradientOrb } from '@/components/landing/ui/gradient-orb';

const SECTIONS = [
  {
    title: '1. Acceptance of Terms',
    content:
      'By accessing or using ContractorOS, you agree to be bound by these Terms of Service. If you are using the service on behalf of an organization, you represent that you have the authority to bind that organization to these terms. If you do not agree to these terms, you may not use the service.',
  },
  {
    title: '2. Service Description',
    content:
      'ContractorOS provides a contractor lifecycle management platform including onboarding workflows, invoice processing, classification risk monitoring, document management, audit logging, and offboarding workflows. The platform is provided "as is" and we continuously improve it based on user feedback.',
  },
  {
    title: '3. User Responsibilities',
    content:
      'You are responsible for maintaining the confidentiality of your account credentials, ensuring the accuracy of contractor data you input, and complying with applicable labor and tax laws in your jurisdiction. ContractorOS provides classification risk scoring as a decision-support tool — it does not constitute legal advice.',
  },
  {
    title: '4. Data Ownership',
    content:
      'You retain full ownership of all data you input into ContractorOS. We do not claim any intellectual property rights over your contractor data, invoices, documents, or assessment records. You may export your data at any time in standard formats (CSV, JSON).',
  },
  {
    title: '5. Service Availability',
    content:
      'We target 99.9% uptime and will provide reasonable notice of planned maintenance. In the event of unplanned downtime, we will communicate status updates through our status page and email notifications to account administrators.',
  },
  {
    title: '6. Limitation of Liability',
    content:
      'ContractorOS shall not be liable for any indirect, incidental, or consequential damages arising from your use of the service, including but not limited to lost profits, data loss, or regulatory penalties. Our total liability shall not exceed the amount you paid for the service in the twelve months preceding the claim.',
  },
  {
    title: '7. Termination',
    content:
      'Either party may terminate this agreement at any time with 30 days written notice. Upon termination, your data will be available for export for 30 days, after which it will be permanently deleted in accordance with our data retention policy. We may suspend access immediately for violation of these terms.',
  },
];

export default function TermsPage() {
  return (
    <>
      {/* Hero */}
      <section className="noise-bg relative overflow-hidden py-24 lg:py-32">
        <GradientOrb className="-left-32 top-20" color="bg-brand-200/15" size={400} />

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
            Terms of Service
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
            Plain-language terms that explain how ContractorOS works and
            what you can expect from us.
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
              <h3 className="font-semibold text-slate-900">Questions about these terms?</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Contact our legal team at{' '}
                <span className="font-medium text-brand-600">
                  legal@contractoros.com
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
