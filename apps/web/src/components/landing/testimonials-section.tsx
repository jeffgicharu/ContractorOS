'use client';

import { useRef } from 'react';
import { motion, useInView } from 'motion/react';
import { Quote, Star } from 'lucide-react';

interface Testimonial {
  quote: string;
  name: string;
  role: string;
  company: string;
  initials: string;
  metric: string;
  metricLabel: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      'ContractorOS cut our onboarding time from 2 weeks to 3 days. The classification risk monitor alone saved us from a $40K penalty.',
    name: 'Sarah Chen',
    role: 'VP of People',
    company: 'TechScale Inc.',
    initials: 'SC',
    metric: '85%',
    metricLabel: 'Faster onboarding',
  },
  {
    quote:
      'Our contractors love the portal. Invoice submissions went from email chaos to a 2-minute process. Payments are always on time now.',
    name: 'Marcus Rivera',
    role: 'Finance Lead',
    company: 'BuildRight Co.',
    initials: 'MR',
    metric: '100%',
    metricLabel: 'On-time payments',
  },
  {
    quote:
      'Finally, a tool that takes compliance seriously without making it painful. The three-test risk scoring is brilliant.',
    name: 'Emily Nakamura',
    role: 'HR Director',
    company: 'Vertex Labs',
    initials: 'EN',
    metric: 'Zero',
    metricLabel: 'Misclassifications',
  },
];

export function TestimonialsSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <section
      id="testimonials"
      className="relative overflow-hidden bg-slate-50/60 py-24 lg:py-32"
      ref={ref}
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-2xl text-center"
        >
          <p className="mb-3 text-sm font-semibold text-brand-600">
            Testimonials
          </p>
          <h2 className="font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Teams that switched never looked back
          </h2>
        </motion.div>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 25 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.1 + i * 0.12 }}
              className="group relative rounded-2xl border border-slate-200/80 bg-white p-6 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
            >
              {/* Metric badge */}
              <div className="absolute -top-3 right-5">
                <div className="rounded-full bg-brand-600 px-3 py-1 text-xs font-bold text-white shadow-sm">
                  {t.metric}
                </div>
              </div>

              <Quote className="mb-3 h-8 w-8 text-brand-200" />

              {/* Stars */}
              <div className="mb-3 flex gap-0.5">
                {Array.from({ length: 5 }).map((_, si) => (
                  <Star
                    key={si}
                    className="h-4 w-4 fill-amber-400 text-amber-400"
                  />
                ))}
              </div>

              <p className="text-[15px] leading-relaxed text-slate-600 italic">
                &ldquo;{t.quote}&rdquo;
              </p>

              <div className="mt-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
                  {t.initials}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {t.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {t.role}, {t.company}
                  </p>
                </div>
              </div>

              <p className="mt-4 text-xs font-medium text-brand-600">
                {t.metricLabel}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
