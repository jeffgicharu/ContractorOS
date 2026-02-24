'use client';

import { motion } from 'motion/react';
import { Mail, MapPin, MessageSquare, Clock } from 'lucide-react';
import { SectionWrapper } from '@/components/landing/ui/section-wrapper';
import { GradientOrb } from '@/components/landing/ui/gradient-orb';

const CHANNELS = [
  {
    icon: Mail,
    label: 'General inquiries',
    value: 'hello@contractoros.com',
    description: 'For partnerships, demos, and general questions.',
  },
  {
    icon: MessageSquare,
    label: 'Customer support',
    value: 'support@contractoros.com',
    description: 'For existing customers needing help with the platform.',
  },
  {
    icon: Clock,
    label: 'Response time',
    value: 'Under 4 hours',
    description: 'During business hours (9am–6pm PST, Monday–Friday).',
  },
  {
    icon: MapPin,
    label: 'Headquarters',
    value: 'San Francisco, CA',
    description: 'Remote-first team, headquartered in the Bay Area.',
  },
];

export default function ContactPage() {
  return (
    <>
      {/* Hero */}
      <section className="noise-bg relative overflow-hidden py-24 lg:py-32">
        <GradientOrb className="-left-32 bottom-10" color="bg-brand-200/20" size={400} />

        <div className="relative z-10 mx-auto max-w-3xl px-6 text-center lg:px-8">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-3 text-sm font-semibold text-brand-600"
          >
            Contact
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-display text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl"
          >
            Get in{' '}
            <span className="bg-gradient-to-r from-brand-600 to-brand-500 bg-clip-text text-transparent">
              touch
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-6 text-lg text-slate-500"
          >
            Have a question about ContractorOS? Want to see a demo?
            We&apos;d love to hear from you.
          </motion.p>
        </div>
      </section>

      {/* Contact cards */}
      <section className="py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {CHANNELS.map((channel, i) => {
              const Icon = channel.icon;
              return (
                <SectionWrapper key={channel.label} delay={0.1 * i}>
                  <div className="group h-full rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-lg hover:shadow-brand-500/[0.06]">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 transition-colors duration-300 group-hover:bg-brand-50">
                      <Icon className="h-5 w-5 text-slate-500 transition-colors duration-300 group-hover:text-brand-600" />
                    </div>
                    <h3 className="mt-4 font-semibold text-slate-900">
                      {channel.label}
                    </h3>
                    <p className="mt-1 text-sm font-medium text-brand-600">
                      {channel.value}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-slate-500">
                      {channel.description}
                    </p>
                  </div>
                </SectionWrapper>
              );
            })}
          </div>
        </div>
      </section>

      {/* Contact form */}
      <section className="bg-slate-50/80 py-24 lg:py-32">
        <div className="mx-auto max-w-xl px-6 lg:px-8">
          <SectionWrapper>
            <div className="text-center">
              <h2 className="font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Send us a message
              </h2>
              <p className="mt-4 text-slate-500">
                Fill out the form below and we&apos;ll get back to you within
                one business day.
              </p>
            </div>
          </SectionWrapper>

          <SectionWrapper delay={0.15}>
            <form className="mt-10 space-y-5" onSubmit={(e) => e.preventDefault()}>
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="first-name" className="block text-sm font-medium text-slate-700">
                    First name
                  </label>
                  <input
                    id="first-name"
                    type="text"
                    className="mt-1.5 w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-900 transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="last-name" className="block text-sm font-medium text-slate-700">
                    Last name
                  </label>
                  <input
                    id="last-name"
                    type="text"
                    className="mt-1.5 w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-900 transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  className="mt-1.5 w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-900 transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="company" className="block text-sm font-medium text-slate-700">
                  Company
                </label>
                <input
                  id="company"
                  type="text"
                  className="mt-1.5 w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-900 transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-slate-700">
                  Message
                </label>
                <textarea
                  id="message"
                  rows={4}
                  className="mt-1.5 w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-900 transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none resize-none"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-lg bg-brand-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-700 hover:shadow-md active:scale-[0.98]"
              >
                Send message
              </button>
            </form>
          </SectionWrapper>
        </div>
      </section>
    </>
  );
}
