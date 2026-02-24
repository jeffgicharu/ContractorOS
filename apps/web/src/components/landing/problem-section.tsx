'use client';

import { useRef } from 'react';
import { motion, useInView } from 'motion/react';
import {
  FileSpreadsheet,
  ShieldAlert,
  Clock,
  Wrench,
  type LucideIcon,
} from 'lucide-react';

interface PainPoint {
  icon: LucideIcon;
  title: string;
  body: string;
  color: string;
}

const PAIN_POINTS: PainPoint[] = [
  {
    icon: FileSpreadsheet,
    title: 'Scattered Spreadsheets',
    body: 'Contractor data lives in 5 different spreadsheets, 3 email threads, and someone\'s head.',
    color: 'bg-amber-50 text-amber-600',
  },
  {
    icon: ShieldAlert,
    title: 'Compliance Risk',
    body: 'One misclassification can cost $50K+ in penalties. Are you sure everyone\'s classified correctly?',
    color: 'bg-red-50 text-red-600',
  },
  {
    icon: Clock,
    title: 'Late Payments',
    body: 'Manual invoice tracking means contractors wait weeks. Some invoices fall through the cracks entirely.',
    color: 'bg-blue-50 text-blue-600',
  },
  {
    icon: Wrench,
    title: 'Manual Processes',
    body: 'Onboarding a new contractor takes 2 weeks of back-and-forth emails, forms, and follow-ups.',
    color: 'bg-emerald-50 text-emerald-600',
  },
];

export function ProblemSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section className="relative overflow-hidden py-24 lg:py-32" ref={ref}>
      {/* Subtle orb */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="h-[600px] w-[600px] rounded-full bg-red-100/20 blur-[150px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-2xl text-center"
        >
          <p className="mb-3 text-sm font-semibold text-brand-600">
            The Problem
          </p>
          <h2 className="font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
            Managing contractors shouldn&apos;t be this{' '}
            <span className="bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
              painful
            </span>
          </h2>
          <p className="mt-4 text-lg text-slate-500">
            Most teams cobble together spreadsheets, emails, and prayers. It
            works until it doesn&apos;t.
          </p>
        </motion.div>

        <div className="mx-auto mt-16 grid max-w-4xl gap-6 sm:grid-cols-2">
          {PAIN_POINTS.map((point, i) => {
            const Icon = point.icon;
            return (
              <motion.div
                key={point.title}
                initial={{ opacity: 0, y: 25 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.15 * i }}
                className="group rounded-2xl border border-slate-200/80 bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                <div
                  className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ${point.color}`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-slate-900">
                  {point.title}
                </h3>
                <p className="mt-2 text-[15px] leading-relaxed text-slate-500">
                  {point.body}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
