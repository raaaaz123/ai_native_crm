import React from "react";
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, MessageSquare, Shield, BarChart3, CheckCircle2, Sparkles, Users, Star, Play } from 'lucide-react';
import Hero from './components/layout/Hero';
import { TestimonialsSection } from './components/testimonials';
import { SecuritySection } from './components/security';
import { AdvantagesSection } from './components/advantages';

export default function Home() {
  return (
    <main>
      {/* Hero Section */}
      <Hero />

      {/* Platform Overview Section - Redesigned */}
      <section className="py-16 sm:py-20 lg:py-24 bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Main Header */}
          <div className="text-center mb-20">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6 leading-tight">
              The complete platform for AI support agents
            </h2>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
              Rexa Engage is designed for building AI support agents that solve your customers&apos; hardest problems while improving business outcomes.
            </p>
          </div>
          
          {/* Features Grid - Minimal Classic Design */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-20">
            
            {/* Left Column */}
            <div className="space-y-12">
              {/* Purpose-built for LLMs */}
              <div className="border-l-2 border-primary/20 pl-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <h3 className="text-xl font-bold text-foreground">Purpose-built for LLMs</h3>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Language models with reasoning capabilities for effective responses to complex queries.
                </p>
              </div>

              {/* Designed for simplicity */}
              <div className="border-l-2 border-primary/20 pl-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <h3 className="text-xl font-bold text-foreground">Designed for simplicity</h3>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Create, manage, and deploy AI Agents easily, even without technical skills.
                </p>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-12">
              {/* Create agent + Reply with AI */}
              <div className="border-l-2 border-primary/20 pl-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <h3 className="text-xl font-bold text-foreground">Create agent + Reply with AI</h3>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Build intelligent agents that can handle customer inquiries and provide automated responses with human-like understanding.
                </p>
              </div>

              {/* Engineered for security */}
              <div className="border-l-2 border-primary/20 pl-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <h3 className="text-xl font-bold text-foreground">Engineered for security</h3>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Enjoy peace of mind with robust encryption and strict compliance standards.
                </p>
              </div>
            </div>
          </div>

          {/* Bottom CTA */}
          <div className="text-center mt-16">
            <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-8 h-px bg-border"></div>
              <span>Start building today</span>
              <div className="w-8 h-px bg-border"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-8 sm:py-10 lg:py-12 bg-background" id="features">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1.5 text-xs font-semibold text-foreground/70 mb-6">
              ✨ Powerful Features
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6">
              Everything you need to <span className="font-normal">engage and retain</span>
            </h2>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              From collection to resolution, each tool is designed to work together with shared AI context.
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* AI Chat Widgets */}
            <div className="group bg-card p-8 rounded-xl shadow-sm border border-border hover:shadow-lg transition-all duration-300">
              <div className="h-12 w-12 bg-muted rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <MessageSquare className="h-6 w-6 text-foreground/60" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-4">AI Chat Widgets</h3>
              <p className="text-muted-foreground leading-relaxed">Customizable AI-powered chat widgets with real-time conversations and handover capabilities.</p>
            </div>
            
            {/* Conversations Management */}
            <div className="group bg-card p-8 rounded-xl shadow-sm border border-border hover:shadow-lg transition-all duration-300">
              <div className="h-12 w-12 bg-muted rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Users className="h-6 w-6 text-foreground/60" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-4">Conversations</h3>
              <p className="text-muted-foreground leading-relaxed">Real-time conversation management with AI responses, human handover, and message history.</p>
            </div>
            
            {/* Knowledge Base */}
            <div className="group bg-card p-8 rounded-xl shadow-sm border border-border hover:shadow-lg transition-all duration-300">
              <div className="h-12 w-12 bg-muted rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Shield className="h-6 w-6 text-foreground/60" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-4">Knowledge Base</h3>
              <p className="text-muted-foreground leading-relaxed">Manage FAQs, documents, and website content with AI-powered knowledge indexing and retrieval.</p>
            </div>
            
            {/* Review System */}
            <div className="group bg-card p-8 rounded-xl shadow-sm border border-border hover:shadow-lg transition-all duration-300">
              <div className="h-12 w-12 bg-muted rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Star className="h-6 w-6 text-foreground/60" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-4">Review System</h3>
              <p className="text-muted-foreground leading-relaxed">Create custom review forms, collect feedback, and analyze customer satisfaction metrics.</p>
            </div>
            
            {/* Analytics & Insights */}
            <div className="group bg-card p-8 rounded-xl shadow-sm border border-border hover:shadow-lg transition-all duration-300">
              <div className="h-12 w-12 bg-muted rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <BarChart3 className="h-6 w-6 text-foreground/60" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-4">Analytics</h3>
              <p className="text-muted-foreground leading-relaxed">Track conversation metrics, review analytics, and customer engagement insights.</p>
            </div>
            
            {/* Team Management */}
            <div className="group bg-card p-8 rounded-xl shadow-sm border border-border hover:shadow-lg transition-all duration-300">
              <div className="h-12 w-12 bg-muted rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Users className="h-6 w-6 text-foreground/60" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-4">Team Management</h3>
              <p className="text-muted-foreground leading-relaxed">Manage company settings, team members, and user permissions for collaborative workflows.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <TestimonialsSection />

      {/* Security Section */}
      <SecuritySection />

      {/* Advantages Section */}
      <AdvantagesSection />

      {/* CTA Section - Redesigned */}
      <section className="py-20 sm:py-24 lg:py-28 bg-gradient-to-br from-primary/5 via-background to-primary/10 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        
        <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-6 py-3 text-sm font-semibold text-primary mb-8">
              <Sparkles className="h-4 w-4" />
              <span>Transform Your Customer Experience</span>
            </div>
            
            {/* Main Heading */}
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-8 leading-tight">
              Ready to elevate your{' '}
              <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                customer engagement?
              </span>
            </h2>
            
            {/* Description */}
            <p className="text-xl sm:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed">
              Join thousands of businesses using Rexa Engage to deliver exceptional customer experiences and drive measurable growth.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
              <Link href="/dashboard">
                <Button className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground px-10 py-4 rounded-xl text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border-0">
                  Start Building Today
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="#demo">
                <Button variant="outline" className="w-full sm:w-auto border-2 border-border hover:border-primary/30 text-foreground hover:bg-primary/5 hover:text-primary px-10 py-4 rounded-xl text-lg font-semibold transition-all duration-300 hover:scale-105">
                  Watch Demo
                  <Play className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-12">
              <div className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-foreground mb-2">9000+</div>
                <div className="text-muted-foreground font-medium">Businesses Trust Us</div>
              </div>
              <div className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-foreground mb-2">80%</div>
                <div className="text-muted-foreground font-medium">Faster Response Time</div>
              </div>
              <div className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-foreground mb-2">24/7</div>
                <div className="text-muted-foreground font-medium">AI Support Available</div>
              </div>
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium">No credit card required</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium">7-day free trial</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium">Setup in minutes</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
