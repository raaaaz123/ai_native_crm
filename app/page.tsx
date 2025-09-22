import React from "react";
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Container, Section, FeatureCard, Stat, Testimonial } from '@/components/layout';

export default function Home() {
  return (
    <main>
      {/* Hero */}
      <Section className="bg-gradient-to-b from-white to-[--color-surface]">
        <Container className="grid items-center gap-8 md:grid-cols-2">
          <div>
            <Badge>AI‑native customer engagement</Badge>
            <h1 className="mt-4 text-4xl/tight sm:text-5xl/tight font-semibold text-[--color-foreground]">
              Retain customers and grow LTV with Rexa Engage
            </h1>
            <p className="mt-4 text-base text_BLACK/70">
              Unified suite for review collection, support desk, and embeddable support widgets — powered by native AI engines and agents.
            </p>
            <div className="mt-6 flex gap-3">
              <Link href="#demo">
                <Button>Request demo</Button>
              </Link>
              <Link href="#docs">
                <Button variant="outline">Explore docs</Button>
              </Link>
            </div>
            <div className="mt-8 grid grid-cols-2 gap-4">
              <Stat label="Avg. CSAT" value="4.9/5" />
              <Stat label="Retention uplift" value="+18%" />
            </div>
          </div>
          <div className="relative rounded-[var(--radius-xl)] border border-[--color-border] bg-[--color-card] p-6">
            <div className="grid grid-cols-2 gap-4">
              <FeatureCard title="Review collection" description="Automated, personalized review requests across channels with intelligent timing." />
              <FeatureCard title="Support desk" description="AI‑assisted triage, summaries, and suggested replies for faster resolutions." />
              <FeatureCard title="Support widget" description="Embeddable self‑service widget with native agents that run privately." />
              <FeatureCard title="Analytics" description="Retention, sentiment, and revenue impact — in one dashboard." />
            </div>
          </div>
        </Container>
      </Section>

      {/* Features */}
      <Section id="features">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-2xl sm:text-3xl font-semibold">Everything you need to engage and retain</h2>
            <p className="mt-3 text-black/70">From collection to resolution, each tool is designed to work together with shared AI context.</p>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 md:grid-cols-3">
            <FeatureCard title="Multichannel reviews" description="Email, SMS, WhatsApp with intelligent pacing and personalization." />
            <FeatureCard title="Agentic support" description="Native agents summarize, route, and propose next actions automatically." />
            <FeatureCard title="Widget SDK" description="Drop‑in widget that respects privacy with on‑device inference options." />
            <FeatureCard title="Knowledge sync" description="Auto‑index docs, tickets, and chats to keep answers aligned." />
            <FeatureCard title="Workflow builder" description="Compose automations with prompts, tools, and human‑in‑the‑loop." />
            <FeatureCard title="Insights" description="Track churn risks, sentiment shifts, and revenue influence." />
          </div>
        </Container>
      </Section>

      {/* Testimonials */}
      <Section>
        <Container className="grid gap-6 sm:grid-cols-3">
          <Testimonial quote="Rexa Engage turned our support into a growth lever." author="Ava M." role="Head of Support, D2C Brand" />
          <Testimonial quote="The review flows feel personal yet fully automated." author="Leo P." role="Growth Lead, SaaS" />
          <Testimonial quote="Widget is private, fast, and actually helpful." author="Maya R." role="Product Manager" />
        </Container>
      </Section>

      {/* CTA */}
      <Section>
        <Container className="rounded-[var(--radius-xl)] border border-[--color-border] bg-[--color-info-soft] p-8 text-center">
          <h3 className="text-xl font-semibold">Ready to elevate retention?</h3>
          <p className="mt-2 text-black/70">Request a demo to see AI agents drive measurable customer outcomes.</p>
          <div className="mt-5 flex justify-center">
            <Link href="#demo">
              <Button>Request demo</Button>
            </Link>
          </div>
        </Container>
      </Section>
    </main>
  );
}
