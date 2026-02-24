'use client';

import { motion } from 'motion/react';
import { ArrowRight, Play } from 'lucide-react';
import { AnimatedText } from './ui/animated-text';
import { Typewriter } from './ui/typewriter';
import { MagneticButton } from './ui/magnetic-button';
import { BrowserFrame } from './ui/browser-frame';
import { TiltImage } from './ui/tilt-image';
import { GradientOrb } from './ui/gradient-orb';

const USE_CASES = [
  'onboarding',
  'invoicing',
  'compliance',
  'payments',
  'time tracking',
  'offboarding',
];

export function HeroSection() {
  return (
    <section className="noise-bg relative min-h-screen overflow-hidden pt-28 pb-20 lg:pt-36 lg:pb-28">
      {/* Atmospheric orbs */}
      <GradientOrb
        className="-right-32 top-20"
        color="bg-brand-200/25"
        size={500}
      />
      <GradientOrb
        className="-left-24 bottom-20"
        color="bg-brand-100/20"
        size={350}
      />

      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left — Copy */}
          <div>
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-200/60 bg-brand-50/80 px-4 py-1.5 text-[13px] font-medium text-brand-700"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
              Contractor lifecycle platform
            </motion.div>

            {/* Headline */}
            <h1 className="font-display text-[2.75rem] font-bold leading-[1.1] tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
              <AnimatedText
                text="Contractor management,"
                delay={0.1}
              />
              <br />
              <AnimatedText
                text="finally organized."
                delay={0.5}
                gradient={{
                  text: 'organized.',
                  className: 'from-brand-500 to-brand-700',
                }}
              />
            </h1>

            {/* Subtitle with typewriter */}
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.7 }}
              className="mt-6 max-w-lg text-lg leading-relaxed text-slate-500"
            >
              One platform for{' '}
              <Typewriter
                words={USE_CASES}
                className="font-medium text-brand-600"
                interval={2500}
              />
              .<br />
              Built for teams managing 20–200 contractors.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.9 }}
              className="mt-8 flex flex-wrap items-center gap-4"
            >
              <MagneticButton href="/login" variant="primary">
                Get Started
                <ArrowRight className="h-4 w-4" />
              </MagneticButton>
              <MagneticButton href="#how-it-works" variant="secondary">
                <Play className="h-4 w-4 fill-current" />
                See How It Works
              </MagneticButton>
            </motion.div>

            {/* Trust signal */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 1.1 }}
              className="mt-8 flex items-center gap-3"
            >
              <div className="flex -space-x-2">
                {['SC', 'MR', 'EN', 'JW'].map((initials, i) => (
                  <div
                    key={initials}
                    className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-brand-100 text-[10px] font-semibold text-brand-700"
                    style={{ zIndex: 4 - i }}
                  >
                    {initials}
                  </div>
                ))}
              </div>
              <p className="text-sm text-slate-400">
                Trusted by <span className="font-medium text-slate-600">50+ teams</span> worldwide
              </p>
            </motion.div>
          </div>

          {/* Right — Hero screenshot */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
          >
            <TiltImage>
              <BrowserFrame
                src="/screenshots/screenshot-dashboard.png"
                alt="ContractorOS Dashboard — revenue charts, contractor stats, and risk overview"
                priority
                className="shadow-2xl"
              />
            </TiltImage>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
