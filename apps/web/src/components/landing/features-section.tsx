'use client';

import { useRef, useState, useCallback } from 'react';
import { motion, useInView } from 'motion/react';
import {
  BarChart3,
  Users,
  ShieldCheck,
  UserCircle,
  FolderOpen,
  ScrollText,
  type LucideIcon,
} from 'lucide-react';

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
  badge?: string;
}

const FEATURES: Feature[] = [
  {
    icon: BarChart3,
    title: 'Dashboard Analytics',
    description:
      'Real-time revenue tracking, invoice breakdowns, contractor distribution, and risk scoring in one unified view.',
    badge: 'Core',
  },
  {
    icon: Users,
    title: 'Kanban Onboarding',
    description:
      'Visual 4-stage pipeline. Track every contractor from invite to fully active with drag-and-drop simplicity.',
  },
  {
    icon: ShieldCheck,
    title: 'Risk Scoring Engine',
    description:
      'IRS common-law, DOL economic reality, California ABC — three classification tests, one weighted score.',
    badge: 'Compliance',
  },
  {
    icon: UserCircle,
    title: 'Contractor Portal',
    description:
      'Self-service portal for contractors to submit invoices, upload documents, log time, and track payments.',
  },
  {
    icon: FolderOpen,
    title: 'Document Vault',
    description:
      'W-9s, contracts, insurance, certifications — version-tracked with expiry alerts and compliance reports.',
  },
  {
    icon: ScrollText,
    title: 'Audit Trail',
    description:
      'Every action logged with full before/after diffs. Filter by user, entity, action, and date range.',
  },
];

export function FeaturesSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-60px' });
  const [mousePos, setMousePos] = useState({ x: -1000, y: -1000 });

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!gridRef.current) return;
      const rect = gridRef.current.getBoundingClientRect();
      setMousePos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    },
    [],
  );

  const handleMouseLeave = useCallback(() => {
    setMousePos({ x: -1000, y: -1000 });
  }, []);

  return (
    <section
      id="features"
      ref={sectionRef}
      className="relative overflow-hidden bg-slate-50/80 py-24 lg:py-32"
    >
      {/* Subtle dot pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.4]"
        style={{
          backgroundImage:
            'radial-gradient(circle, rgb(203 213 225) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-2xl text-center"
        >
          <p className="mb-3 text-sm font-semibold text-brand-600">
            Features
          </p>
          <h2 className="font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
            Everything you need,{' '}
            <span className="bg-gradient-to-r from-brand-600 to-brand-500 bg-clip-text text-transparent">
              nothing you don&apos;t
            </span>
          </h2>
          <p className="mt-4 text-lg text-slate-500">
            A complete toolkit for managing contractors from onboarding to
            offboarding.
          </p>
        </motion.div>

        {/* Spotlight grid */}
        <div
          ref={gridRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="relative mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
        >
          {/* Mouse-follow spotlight */}
          <div
            className="pointer-events-none absolute -inset-px z-0 transition-opacity duration-300"
            style={{
              opacity: mousePos.x > -500 ? 1 : 0,
              background: `radial-gradient(500px circle at ${mousePos.x}px ${mousePos.y}px, rgba(99, 102, 241, 0.08), transparent 40%)`,
            }}
          />

          {FEATURES.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 25 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.08 * i }}
                className="group relative"
              >
                <div className="relative h-full overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-lg hover:shadow-brand-500/[0.06]">
                  {/* Hover gradient overlay */}
                  <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-brand-50/80 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                  <div className="relative z-10">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 transition-all duration-300 group-hover:bg-brand-50">
                        <Icon className="h-5 w-5 text-slate-500 transition-colors duration-300 group-hover:text-brand-600" />
                      </div>
                      {feature.badge && (
                        <span className="rounded-full border border-brand-200 bg-brand-50 px-2.5 py-0.5 text-[11px] font-semibold text-brand-600">
                          {feature.badge}
                        </span>
                      )}
                    </div>

                    <h3 className="mt-4 text-[17px] font-semibold text-slate-900">
                      {feature.title}
                    </h3>
                    <p className="mt-2 text-[14px] leading-relaxed text-slate-500">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
