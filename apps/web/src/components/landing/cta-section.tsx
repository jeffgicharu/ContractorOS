'use client';

import { useRef } from 'react';
import { motion, useInView } from 'motion/react';
import { ArrowRight, CheckCircle } from 'lucide-react';
import { MagneticButton } from './ui/magnetic-button';
import { GradientOrb } from './ui/gradient-orb';

const TRUST_SIGNALS = [
  'No credit card required',
  'Set up in 5 minutes',
  'Cancel anytime',
];

export function CTASection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <section className="relative overflow-hidden py-24 lg:py-32" ref={ref}>
      <GradientOrb
        className="left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        color="bg-brand-200/15"
        size={600}
      />

      <div className="relative z-10 mx-auto max-w-3xl px-6 text-center lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <h2 className="font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
            Ready to bring order to{' '}
            <span className="bg-gradient-to-r from-brand-500 to-brand-700 bg-clip-text text-transparent">
              contractor chaos
            </span>
            ?
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-lg text-slate-500">
            Join teams that replaced spreadsheets, email chains, and compliance
            anxiety with a single platform.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-8"
        >
          <MagneticButton href="/login" variant="primary" className="text-base">
            Get Started Free
            <ArrowRight className="h-4 w-4" />
          </MagneticButton>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-6 flex flex-wrap items-center justify-center gap-5"
        >
          {TRUST_SIGNALS.map((signal) => (
            <div
              key={signal}
              className="flex items-center gap-1.5 text-sm text-slate-500"
            >
              <CheckCircle className="h-4 w-4 text-success-500" />
              {signal}
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
