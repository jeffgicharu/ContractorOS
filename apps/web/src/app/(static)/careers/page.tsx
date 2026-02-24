'use client';

import { motion } from 'motion/react';
import { Heart, Zap, Globe, BookOpen } from 'lucide-react';
import { SectionWrapper } from '@/components/landing/ui/section-wrapper';
import { GradientOrb } from '@/components/landing/ui/gradient-orb';
import { BrowserFrame } from '@/components/landing/ui/browser-frame';
import { TiltImage } from '@/components/landing/ui/tilt-image';

const PERKS = [
  {
    icon: Globe,
    title: 'Remote-first',
    description: 'Work from anywhere. Async by default, meetings by exception.',
  },
  {
    icon: Zap,
    title: 'Ship fast',
    description: 'Small team, minimal process. We deploy multiple times a day.',
  },
  {
    icon: BookOpen,
    title: 'Learning budget',
    description: '$2,000/year for courses, conferences, books — whatever helps you grow.',
  },
  {
    icon: Heart,
    title: 'Health & wellness',
    description: 'Full medical, dental, and vision. Plus a wellness stipend.',
  },
];

const ROLES = [
  {
    title: 'Senior Full-Stack Engineer',
    team: 'Engineering',
    location: 'Remote',
    type: 'Full-time',
    description:
      'Build and ship features across our Next.js frontend and NestJS backend. You\'ll write raw SQL, design APIs, and own features end-to-end.',
  },
  {
    title: 'Product Designer',
    team: 'Design',
    location: 'Remote',
    type: 'Full-time',
    description:
      'Design interfaces that make contractor management feel effortless. Strong systems thinking, Figma fluency, and an eye for detail.',
  },
  {
    title: 'Compliance Specialist',
    team: 'Operations',
    location: 'Remote',
    type: 'Full-time',
    description:
      'Help shape our classification risk engine. Deep knowledge of IRS, DOL, and state-level contractor classification tests.',
  },
];

export default function CareersPage() {
  return (
    <>
      {/* Hero */}
      <section className="noise-bg relative overflow-hidden py-24 lg:py-32">
        <GradientOrb className="-right-32 top-20" color="bg-brand-200/20" size={450} />

        <div className="relative z-10 mx-auto max-w-3xl px-6 text-center lg:px-8">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-3 text-sm font-semibold text-brand-600"
          >
            Careers
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-display text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl"
          >
            Help us build the future of{' '}
            <span className="bg-gradient-to-r from-brand-600 to-brand-500 bg-clip-text text-transparent">
              contractor management
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-6 text-lg text-slate-500"
          >
            We&apos;re a small, focused team that values craft over credentials.
            Show us what you&apos;ve built.
          </motion.p>
        </div>
      </section>

      {/* What you'll build */}
      <section className="py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <SectionWrapper>
              <div>
                <p className="mb-3 text-sm font-semibold text-brand-600">What you&apos;ll build</p>
                <h2 className="font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                  Real product, real impact
                </h2>
                <p className="mt-6 text-[16px] leading-relaxed text-slate-600">
                  You won&apos;t be building throwaway features. ContractorOS handles
                  onboarding pipelines, classification risk scoring, invoice
                  workflows, and compliance monitoring — systems where correctness
                  matters and good engineering makes a measurable difference.
                </p>
                <ul className="mt-6 space-y-3">
                  {[
                    'Visual kanban onboarding with drag-and-drop stages',
                    'Three-test risk scoring engine (IRS, DOL, ABC)',
                    'Full audit trail with before/after diffs',
                    'Dual-portal architecture for admins and contractors',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm text-slate-600">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </SectionWrapper>

            <SectionWrapper delay={0.2}>
              <TiltImage>
                <BrowserFrame
                  src="/screenshots/screenshot-onboarding.png"
                  alt="ContractorOS Kanban onboarding pipeline"
                  className="shadow-xl"
                />
              </TiltImage>
            </SectionWrapper>
          </div>
        </div>
      </section>

      {/* Perks */}
      <section className="bg-slate-50/80 py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <SectionWrapper>
            <div className="mx-auto max-w-2xl text-center">
              <p className="mb-3 text-sm font-semibold text-brand-600">Why join us</p>
              <h2 className="font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                A team that ships
              </h2>
            </div>
          </SectionWrapper>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {PERKS.map((perk, i) => {
              const Icon = perk.icon;
              return (
                <SectionWrapper key={perk.title} delay={0.1 * i}>
                  <div className="group h-full rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-lg hover:shadow-brand-500/[0.06]">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 transition-colors duration-300 group-hover:bg-brand-50">
                      <Icon className="h-5 w-5 text-slate-500 transition-colors duration-300 group-hover:text-brand-600" />
                    </div>
                    <h3 className="mt-4 font-semibold text-slate-900">{perk.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-500">
                      {perk.description}
                    </p>
                  </div>
                </SectionWrapper>
              );
            })}
          </div>
        </div>
      </section>

      {/* Open roles */}
      <section className="py-24 lg:py-32">
        <div className="mx-auto max-w-3xl px-6 lg:px-8">
          <SectionWrapper>
            <div className="text-center">
              <p className="mb-3 text-sm font-semibold text-brand-600">Open positions</p>
              <h2 className="font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Find your role
              </h2>
            </div>
          </SectionWrapper>

          <div className="mt-12 space-y-4">
            {ROLES.map((role, i) => (
              <SectionWrapper key={role.title} delay={0.1 * i}>
                <div className="group rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition-all duration-300 hover:border-brand-200 hover:shadow-lg hover:shadow-brand-500/[0.06]">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">
                        {role.title}
                      </h3>
                      <p className="mt-1 text-sm text-slate-400">
                        {role.team} &middot; {role.location} &middot; {role.type}
                      </p>
                      <p className="mt-3 text-[14px] leading-relaxed text-slate-500">
                        {role.description}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition-all duration-300 group-hover:border-brand-400 group-hover:bg-brand-50 group-hover:text-brand-600">
                      Apply
                    </span>
                  </div>
                </div>
              </SectionWrapper>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
