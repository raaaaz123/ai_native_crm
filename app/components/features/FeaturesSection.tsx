'use client';

import React from 'react';
import { MessageSquare, Users, Shield, Star, BarChart3, Zap, Brain, Globe, Clock, Sparkles } from 'lucide-react';

interface Feature {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  highlighted?: boolean;
}

const features: Feature[] = [
  {
    id: '1',
    title: 'AI Chat Widgets',
    description: 'Deploy beautiful, customizable chat widgets on your website. Real-time AI responses with seamless human handover when needed.',
    icon: <MessageSquare className="h-6 w-6" />,
    color: 'from-blue-500 to-cyan-500',
    highlighted: true
  },
  {
    id: '2',
    title: 'Hybrid RAG Technology',
    description: 'Advanced dual vector search with 95%+ accuracy. Combines dense and sparse vectors with AI reranking for perfect responses.',
    icon: <Brain className="h-6 w-6" />,
    color: 'from-purple-500 to-pink-500',
    highlighted: true
  },
  {
    id: '3',
    title: 'Multi-Language Support',
    description: 'Communicate with customers in 50+ languages. Automatic translation and culturally aware responses.',
    icon: <Globe className="h-6 w-6" />,
    color: 'from-green-500 to-emerald-500'
  },
  {
    id: '4',
    title: 'Conversation Management',
    description: 'Monitor all conversations in real-time. Jump in when needed, review history, and gain insights from every interaction.',
    icon: <Users className="h-6 w-6" />,
    color: 'from-orange-500 to-red-500'
  },
  {
    id: '5',
    title: 'Knowledge Base',
    description: 'Import FAQs, documents, websites, and more. Our AI automatically indexes and retrieves the perfect information.',
    icon: <Shield className="h-6 w-6" />,
    color: 'from-indigo-500 to-purple-500'
  },
  {
    id: '6',
    title: 'Review & Feedback',
    description: 'Create custom review forms, collect feedback, and analyze satisfaction metrics to continuously improve.',
    icon: <Star className="h-6 w-6" />,
    color: 'from-yellow-500 to-orange-500'
  },
  {
    id: '7',
    title: 'Analytics Dashboard',
    description: 'Track conversations, measure performance, and understand customer needs with detailed analytics and insights.',
    icon: <BarChart3 className="h-6 w-6" />,
    color: 'from-pink-500 to-rose-500'
  },
  {
    id: '8',
    title: 'Instant Responses',
    description: 'Sub-second response times with our optimized infrastructure. Your customers never wait.',
    icon: <Zap className="h-6 w-6" />,
    color: 'from-cyan-500 to-blue-500'
  },
  {
    id: '9',
    title: '24/7 Availability',
    description: 'Your AI agents never sleep, take breaks, or go on vacation. Always available for your customers.',
    icon: <Clock className="h-6 w-6" />,
    color: 'from-teal-500 to-green-500'
  }
];

export default function FeaturesSection() {
  return (
    <section className="py-20 sm:py-24 lg:py-28 bg-background" id="features">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-4 py-2 text-sm font-semibold text-primary mb-6">
            <Sparkles className="h-4 w-4" />
            <span>Powerful Features</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Everything you need to{' '}
            <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              delight customers
            </span>
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            From AI-powered conversations to advanced analytics, every feature is designed to help you deliver exceptional customer experiences.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature) => (
            <div
              key={feature.id}
              className={`group relative bg-card p-8 rounded-2xl shadow-sm border transition-all duration-300 hover:-translate-y-1 ${
                feature.highlighted
                  ? 'border-primary/20 shadow-lg hover:shadow-2xl'
                  : 'border-border hover:shadow-xl'
              }`}
            >
              {/* Highlighted badge */}
              {feature.highlighted && (
                <div className="absolute -top-3 -right-3">
                  <div className="bg-gradient-to-r from-primary to-primary/70 text-primary-foreground px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                    Popular
                  </div>
                </div>
              )}

              {/* Icon */}
              <div className={`w-14 h-14 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center text-white mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                {feature.icon}
              </div>

              {/* Content */}
              <h3 className="text-xl font-bold text-foreground mb-4">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{feature.description}</p>

              {/* Hover gradient effect */}
              {feature.highlighted && (
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              )}
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16 p-8 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 rounded-2xl border border-primary/20">
          <h3 className="text-2xl font-bold text-foreground mb-4">
            Want to see all features in action?
          </h3>
          <p className="text-muted-foreground mb-6">
            Get a personalized demo and discover how Rexa Engage can transform your customer support.
          </p>
          <button
            onClick={() => window.location.href = '/dashboard'}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-all duration-300 hover:scale-105 shadow-lg cursor-pointer"
          >
            Start Free Trial
            <Zap className="h-5 w-5" />
          </button>
        </div>
      </div>
    </section>
  );
}
