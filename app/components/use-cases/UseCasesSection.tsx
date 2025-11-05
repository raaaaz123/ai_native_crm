'use client';

import React from 'react';
import { ShoppingCart, Headphones, GraduationCap, Building2, Heart, Code } from 'lucide-react';

interface UseCase {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  benefits: string[];
  color: string;
}

const useCases: UseCase[] = [
  {
    id: '1',
    title: 'E-commerce',
    description: 'Help customers find products, track orders, and resolve issues instantly',
    icon: <ShoppingCart className="h-6 w-6" />,
    benefits: ['Product recommendations', 'Order tracking', 'Return assistance'],
    color: 'from-blue-500 to-cyan-500'
  },
  {
    id: '2',
    title: 'SaaS & Tech',
    description: 'Provide technical support, onboarding guidance, and feature explanations',
    icon: <Code className="h-6 w-6" />,
    benefits: ['Technical troubleshooting', 'Feature demos', 'API documentation'],
    color: 'from-purple-500 to-pink-500'
  },
  {
    id: '3',
    title: 'Education',
    description: 'Answer student questions, assist with enrollment, and provide course info',
    icon: <GraduationCap className="h-6 w-6" />,
    benefits: ['Course information', 'Enrollment help', 'Student support'],
    color: 'from-green-500 to-emerald-500'
  },
  {
    id: '4',
    title: 'Healthcare',
    description: 'Schedule appointments, answer FAQs, and provide patient support',
    icon: <Heart className="h-6 w-6" />,
    benefits: ['Appointment booking', 'Patient FAQs', '24/7 assistance'],
    color: 'from-red-500 to-orange-500'
  },
  {
    id: '5',
    title: 'Real Estate',
    description: 'Share property details, schedule viewings, and qualify leads',
    icon: <Building2 className="h-6 w-6" />,
    benefits: ['Property inquiries', 'Virtual tours', 'Lead qualification'],
    color: 'from-yellow-500 to-orange-500'
  },
  {
    id: '6',
    title: 'Customer Support',
    description: 'Handle common queries, troubleshoot issues, and route to specialists',
    icon: <Headphones className="h-6 w-6" />,
    benefits: ['Instant responses', 'Ticket deflection', 'Smart routing'],
    color: 'from-indigo-500 to-purple-500'
  }
];

export default function UseCasesSection() {
  return (
    <section className="py-20 sm:py-24 lg:py-28 bg-background" id="use-cases">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-4 py-2 text-sm font-semibold text-primary mb-6">
            <Building2 className="h-4 w-4" />
            <span>Use Cases</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Built for every <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">industry</span>
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Whether you&apos;re in e-commerce, healthcare, education, or any other industry, our AI agents adapt to your unique needs.
          </p>
        </div>

        {/* Use Cases Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {useCases.map((useCase) => (
            <div
              key={useCase.id}
              className="group relative bg-card p-8 rounded-2xl shadow-sm border border-border hover:shadow-xl transition-all duration-300 hover:-translate-y-2"
            >
              {/* Icon */}
              <div className={`w-14 h-14 bg-gradient-to-br ${useCase.color} rounded-xl flex items-center justify-center text-white mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                {useCase.icon}
              </div>

              {/* Content */}
              <h3 className="text-xl font-bold text-foreground mb-3">{useCase.title}</h3>
              <p className="text-muted-foreground leading-relaxed mb-6">{useCase.description}</p>

              {/* Benefits */}
              <div className="space-y-2">
                {useCase.benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className={`w-1.5 h-1.5 bg-gradient-to-br ${useCase.color} rounded-full`}></div>
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>

              {/* Hover effect border */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity duration-300 pointer-events-none" style={{ background: `linear-gradient(135deg, var(--primary) 0%, var(--primary-foreground) 100%)` }}></div>
            </div>
          ))}
        </div>

        {/* Bottom note */}
        <div className="text-center mt-16">
          <p className="text-muted-foreground text-lg">
            Don&apos;t see your industry?{' '}
            <button
              onClick={() => window.location.href = '#contact'}
              className="text-primary font-semibold hover:underline cursor-pointer"
            >
              Contact us
            </button>{' '}
            to learn how we can help your business.
          </p>
        </div>
      </div>
    </section>
  );
}
