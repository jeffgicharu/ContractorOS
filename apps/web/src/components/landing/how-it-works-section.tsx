'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence, useInView } from 'motion/react';
import {
  LayoutDashboard,
  UserPlus,
  ShieldCheck,
  CreditCard,
  ArrowRight,
  type LucideIcon,
} from 'lucide-react';
import { BrowserFrame } from './ui/browser-frame';

interface Step {
  icon: LucideIcon;
  number: string;
  title: string;
  description: string;
  screenshot: string;
  alt: string;
}

const STEPS: Step[] = [
  {
    icon: LayoutDashboard,
    number: '01',
    title: 'Set up your workspace',
    description:
      'Get a bird\'s-eye view of your entire contractor operation. Revenue, compliance status, and risk — all in one dashboard.',
    screenshot: '/screenshots/screenshot-dashboard.png',
    alt: 'Admin dashboard with revenue charts and risk overview',
  },
  {
    icon: UserPlus,
    number: '02',
    title: 'Onboard contractors seamlessly',
    description:
      'Automated 4-stage pipeline. Invite, tax forms, contracts, and bank details — tracked visually on a kanban board.',
    screenshot: '/screenshots/screenshot-onboarding.png',
    alt: 'Kanban board showing contractor onboarding pipeline',
  },
  {
    icon: ShieldCheck,
    number: '03',
    title: 'Monitor classification risk',
    description:
      'Three-test risk scoring (IRS, DOL, California ABC). Catch misclassification before it becomes a $50K problem.',
    screenshot: '/screenshots/screenshot-classification.png',
    alt: 'Classification risk monitor with risk distribution',
  },
  {
    icon: CreditCard,
    number: '04',
    title: 'Manage from either side',
    description:
      'Contractors get their own portal. Submit invoices, upload documents, track payments — no more email chains.',
    screenshot: '/screenshots/screenshot-portal.png',
    alt: 'Contractor portal dashboard with earnings and invoices',
  },
];

const AUTO_ROTATE_MS = 4000;

export function HowItWorksSection() {
  const [activeStep, setActiveStep] = useState(0);
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: false, margin: '-100px' });

  const advance = useCallback(() => {
    setActiveStep((prev) => (prev + 1) % STEPS.length);
  }, []);

  // Auto-rotate when in view
  useEffect(() => {
    if (!isInView) return;
    const timer = setInterval(advance, AUTO_ROTATE_MS);
    return () => clearInterval(timer);
  }, [isInView, advance, activeStep]);

  const currentStep = STEPS[activeStep];

  return (
    <section
      id="how-it-works"
      ref={sectionRef}
      className="relative overflow-hidden bg-gradient-to-b from-slate-50/80 to-white py-24 lg:py-32"
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Header */}
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-3 text-sm font-semibold text-brand-600">
            How It Works
          </p>
          <h2 className="font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
            Four steps to contractor clarity
          </h2>
          <p className="mt-4 text-lg text-slate-500">
            From scattered spreadsheets to a single platform in minutes. Here&apos;s
            how ContractorOS transforms your workflow.
          </p>
        </div>

        {/* Desktop: interactive step selector */}
        <div className="mt-16 hidden lg:block">
          <div className="grid grid-cols-5 gap-10">
            {/* Left — Clickable steps */}
            <div className="col-span-2 flex flex-col gap-2">
              {STEPS.map((step, i) => {
                const Icon = step.icon;
                const isActive = i === activeStep;

                return (
                  <button
                    key={step.number}
                    onClick={() => setActiveStep(i)}
                    className={`group relative rounded-xl p-5 text-left transition-all duration-300 ${
                      isActive
                        ? 'bg-white shadow-md'
                        : 'hover:bg-white/60'
                    }`}
                  >
                    {/* Active indicator bar */}
                    <div
                      className={`absolute left-0 top-4 bottom-4 w-[3px] rounded-full transition-all duration-300 ${
                        isActive ? 'bg-brand-600' : 'bg-transparent'
                      }`}
                    />

                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors duration-300 ${
                          isActive
                            ? 'bg-brand-600 text-white'
                            : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <span
                        className={`text-xs font-bold transition-colors duration-300 ${
                          isActive ? 'text-brand-600' : 'text-slate-300'
                        }`}
                      >
                        {step.number}
                      </span>
                      {isActive && (
                        <motion.div
                          initial={{ opacity: 0, x: -5 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="ml-auto"
                        >
                          <ArrowRight className="h-4 w-4 text-brand-500" />
                        </motion.div>
                      )}
                    </div>

                    <h3
                      className={`mt-3 text-lg font-semibold transition-colors duration-300 ${
                        isActive ? 'text-slate-900' : 'text-slate-500'
                      }`}
                    >
                      {step.title}
                    </h3>
                    <p
                      className={`mt-1.5 text-[14px] leading-relaxed transition-colors duration-300 ${
                        isActive ? 'text-slate-500' : 'text-slate-400'
                      }`}
                    >
                      {step.description}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Right — Screenshot with AnimatePresence */}
            <div className="col-span-3 flex items-center">
              <div className="relative w-full overflow-hidden rounded-2xl border border-slate-200/60 bg-slate-50/50 p-3">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeStep}
                    initial={{ opacity: 0, y: 20, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.97 }}
                    transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                  >
                    <BrowserFrame
                      src={currentStep.screenshot}
                      alt={currentStep.alt}
                      className="shadow-lg"
                    />
                  </motion.div>
                </AnimatePresence>

                {/* Step indicator dots */}
                <div className="mt-4 flex items-center justify-center gap-2">
                  {STEPS.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveStep(i)}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        i === activeStep
                          ? 'w-8 bg-brand-600'
                          : 'w-2 bg-slate-300 hover:bg-slate-400'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile: vertical cards */}
        <div className="mt-12 space-y-8 lg:hidden">
          {STEPS.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.number}
                className="rounded-2xl border border-slate-200/80 bg-white p-5"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50">
                    <Icon className="h-5 w-5 text-brand-600" />
                  </div>
                  <span className="text-xs font-bold text-brand-400">
                    {step.number}
                  </span>
                </div>
                <h3 className="mt-3 text-lg font-semibold text-slate-900">
                  {step.title}
                </h3>
                <p className="mt-1.5 text-[14px] leading-relaxed text-slate-500">
                  {step.description}
                </p>
                <div className="mt-4">
                  <BrowserFrame
                    src={step.screenshot}
                    alt={step.alt}
                    className="shadow-md"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
