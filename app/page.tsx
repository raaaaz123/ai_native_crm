import React from "react";
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles, Play } from 'lucide-react';
import Hero from './components/layout/Hero';
import HowItWorksSection from './components/how-it-works/HowItWorksSection';
import FeaturesSection from './components/features/FeaturesSection';
import UseCasesSection from './components/use-cases/UseCasesSection';
import IntegrationsSection from './components/integrations/IntegrationsSection';
import { TestimonialsSection } from './components/testimonials';
import { SecuritySection } from './components/security';
import Script from 'next/script';
import { ChatWidget } from '@/app/components/chat-widget';

export default function Home() {
  // Support Agent configuration
  const agentId = 'reqyPMNcS3YWC46r2iNG';
  const workspaceSlug = 'rasheed-m-1761974210296';
  const channelId = ''; // Will be auto-detected from agent's chat-widget channel

  return (
    <>
    <main>
      {/* Hero Section */}
      <Hero />

      {/* How It Works Section */}
      <HowItWorksSection />

      {/* Features Section */}
      <FeaturesSection />

      {/* Use Cases Section */}
      <UseCasesSection />

      {/* Integrations Section */}
      <IntegrationsSection />

      {/* Testimonials Section */}
      <TestimonialsSection />

      {/* Security Section */}
      <SecuritySection />

      {/* CTA Section - Redesigned */}
      <section className="py-24 sm:py-28 lg:py-32 bg-gradient-to-br from-primary via-primary/90 to-primary/80 relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
        </div>

        <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 px-6 py-3 text-sm font-semibold text-white mb-8">
              <Sparkles className="h-4 w-4" />
              <span>Start Your Free Trial</span>
            </div>

            {/* Main Heading */}
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-8 leading-tight">
              Ready to transform your customer support?
            </h2>

            {/* Description */}
            <p className="text-xl sm:text-2xl text-white/90 mb-12 max-w-3xl mx-auto leading-relaxed">
              Join 9000+ businesses using AI agents to deliver exceptional experiences. Start free, no credit card required.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
              <Link href="/dashboard">
                <Button className="w-full sm:w-auto bg-white hover:bg-white/90 text-primary px-10 py-6 rounded-xl text-lg font-bold shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105">
                  Start Building Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="#demo">
                <Button variant="outline" className="w-full sm:w-auto border-2 border-white/30 bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 hover:border-white/50 px-10 py-6 rounded-xl text-lg font-bold transition-all duration-300 hover:scale-105">
                  Watch Demo
                  <Play className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
              <div className="flex items-center gap-2 text-white/90">
                <div className="w-5 h-5 rounded-full bg-green-400 flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-base font-medium">No credit card required</span>
              </div>
              <div className="flex items-center gap-2 text-white/90">
                <div className="w-5 h-5 rounded-full bg-green-400 flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-base font-medium">14-day free trial</span>
              </div>
              <div className="flex items-center gap-2 text-white/90">
                <div className="w-5 h-5 rounded-full bg-green-400 flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-base font-medium">Setup in 5 minutes</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
    {/* Native Chat Widget Component */}
    <ChatWidget
      agentId={agentId}
      workspaceSlug={workspaceSlug}
      channelId={channelId}
      position="bottom-right"
    />
    </>
  );
}
