'use client';

import React from 'react';
import { Upload, Bot, Zap, Rocket } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface Step {
  id: string;
  number: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const steps: Step[] = [
  {
    id: '1',
    number: '01',
    title: 'Upload Your Knowledge',
    description: 'Import your documents, FAQs, website content, or connect your knowledge base. Our AI will learn everything about your business.',
    icon: <Upload className="h-6 w-6" />,
    color: 'from-blue-500 to-cyan-500'
  },
  {
    id: '2',
    number: '02',
    title: 'Configure Your Agent',
    description: 'Customize your AI agent\'s personality, tone, and behavior. Set up workflows and define how it should handle different scenarios.',
    icon: <Bot className="h-6 w-6" />,
    color: 'from-purple-500 to-pink-500'
  },
  {
    id: '3',
    number: '03',
    title: 'Train & Test',
    description: 'Our advanced AI processes your content using hybrid RAG technology. Test conversations to ensure perfect responses.',
    icon: <Zap className="h-6 w-6" />,
    color: 'from-orange-500 to-red-500'
  },
  {
    id: '4',
    number: '04',
    title: 'Deploy & Scale',
    description: 'Embed your agent on your website, integrate with your tools, and watch it handle customer inquiries 24/7 automatically.',
    icon: <Rocket className="h-6 w-6" />,
    color: 'from-green-500 to-emerald-500'
  }
];

export default function HowItWorksSection() {
  return (
    <section className="py-2 sm:py-2 lg:py-4 bg-muted/30" id="how-it-works">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-4 py-2 text-sm font-semibold text-primary mb-6">
            <Zap className="h-4 w-4" />
            <span>How It Works</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Get started in <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">4 simple steps</span>
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            From setup to deployment, creating your AI agent is quick and intuitive. No technical expertise required.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={step.id} className="relative">
              {/* Connector line for desktop */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-16 left-[60%] w-full h-0.5 bg-gradient-to-r from-border to-transparent"></div>
              )}

              <Card className="relative border border-border hover:shadow-2xl hover:border-primary/30 transition-all duration-300 hover:-translate-y-2 h-full group overflow-visible">
                <CardContent className="relative p-8">
                  {/* Step number */}
                  <div className="absolute -top-4 -left-4 w-12 h-12 bg-gradient-to-br from-primary to-primary/70 rounded-lg flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <span className="text-primary-foreground font-bold text-lg">{step.number}</span>
                  </div>

                  {/* Background gradient overlay */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${step.color} opacity-0 group-hover:opacity-5 rounded-lg transition-opacity duration-300 pointer-events-none`}></div>

                  {/* Icon */}
                  <div className={`relative w-16 h-16 bg-gradient-to-br ${step.color} rounded-lg flex items-center justify-center text-white mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    {step.icon}
                  </div>

                  {/* Content */}
                  <div className="relative">
                    <h3 className="text-xl font-bold text-foreground mb-4 group-hover:text-primary transition-colors duration-300">{step.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{step.description}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <p className="text-muted-foreground mb-4">Ready to transform your customer support?</p>
          <button
            onClick={() => window.location.href = '/dashboard'}
            className="inline-flex items-center gap-2 text-primary font-semibold hover:underline transition-all duration-200 hover:gap-3 cursor-pointer"
          >
            Start building your AI agent now
            <Rocket className="h-5 w-5" />
          </button>
        </div>
      </div>
    </section>
  );
}
