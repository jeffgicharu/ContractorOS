'use client';

import { Navbar } from './navbar';
import { HeroSection } from './hero-section';
import { SocialProofStrip } from './social-proof-strip';
import { ProblemSection } from './problem-section';
import { HowItWorksSection } from './how-it-works-section';
import { FeaturesSection } from './features-section';
import { TestimonialsSection } from './testimonials-section';
import { CTASection } from './cta-section';
import { Footer } from './footer';

export function LandingPage() {
  return (
    <div className="bg-white">
      <Navbar />
      <HeroSection />
      <SocialProofStrip />
      <ProblemSection />
      <HowItWorksSection />
      <FeaturesSection />
      <TestimonialsSection />
      <CTASection />
      <Footer />
    </div>
  );
}
