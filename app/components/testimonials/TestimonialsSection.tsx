'use client';

import React from 'react';
import Image from 'next/image';

interface Testimonial {
  id: string;
  quote: string;
  author: string;
  company: string;
}

const testimonials: Testimonial[] = [
  {
    id: '1',
    quote: "Ragzy has completely transformed our customer support. The AI agents handle 80% of inquiries automatically, and our response time dropped from hours to seconds.",
    author: "Sarah Chen",
    company: "TechFlow Inc"
  },
  {
    id: '2',
    quote: "The implementation was seamless and the results were immediate. Our customer satisfaction scores increased by 40% in just two months.",
    author: "Michael Rodriguez",
    company: "CloudScale Solutions"
  }
];

const additionalTestimonials: Testimonial[] = [
  {
    id: '3',
    quote: "Best investment we've made for customer experience. The AI understands context perfectly and escalates complex issues to our team when needed.",
    author: "Emily Watson",
    company: "DataVault Systems"
  },
  {
    id: '4',
    quote: "Ragzy's AI agents work 24/7 without breaks. We've seen a 60% reduction in support tickets and our team can focus on strategic initiatives.",
    author: "David Kim",
    company: "InnovateLab"
  }
];


export default function TestimonialsSection() {
  return (
    <section className="py-4 sm:py-2 lg:py-4 bg-gradient-to-b from-background to-muted/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-4 py-2 text-sm font-semibold text-primary mb-6">
            <div className="w-2 h-2 bg-primary rounded-full"></div>
            <span>Testimonials</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Loved by <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">9000+ businesses</span>
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Join thousands of companies that trust Ragzy to deliver exceptional customer experiences.
          </p>
        </div>

        {/* Three Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Testimonial Card */}
          <div className="bg-card p-8 rounded-2xl shadow-lg border border-border hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex gap-1 mb-6">
              {[...Array(5)].map((_, i) => (
                <svg key={i} className="w-5 h-5 fill-yellow-400" viewBox="0 0 20 20">
                  <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                </svg>
              ))}
            </div>
            <blockquote className="text-foreground text-lg leading-relaxed mb-6">
              &quot;{testimonials[0].quote}&quot;
            </blockquote>
            <div className="flex items-center">
              <Image
                src="https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&h=100&fit=crop&crop=face&auto=format&q=80"
                alt={testimonials[0].author}
                width={48}
                height={48}
                className="h-12 w-12 rounded-full object-cover mr-4 ring-2 ring-primary/20"
              />
              <div>
                <p className="font-bold text-foreground">{testimonials[0].author}</p>
                <p className="text-sm text-muted-foreground">{testimonials[0].company}</p>
              </div>
            </div>
          </div>

          {/* Middle Testimonial Card */}
          <div className="bg-card p-8 rounded-2xl shadow-lg border border-border hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex gap-1 mb-6">
              {[...Array(5)].map((_, i) => (
                <svg key={i} className="w-5 h-5 fill-yellow-400" viewBox="0 0 20 20">
                  <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                </svg>
              ))}
            </div>
            <blockquote className="text-foreground text-lg leading-relaxed mb-6">
              &quot;{testimonials[1].quote}&quot;
            </blockquote>
            <div className="flex items-center">
              <Image
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face&auto=format&q=80"
                alt={testimonials[1].author}
                width={48}
                height={48}
                className="h-12 w-12 rounded-full object-cover mr-4 ring-2 ring-primary/20"
              />
              <div>
                <p className="font-bold text-foreground">{testimonials[1].author}</p>
                <p className="text-sm text-muted-foreground">{testimonials[1].company}</p>
              </div>
            </div>
          </div>

          {/* Right Stats Card */}
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl shadow-lg border border-primary/20 overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <div className="p-8">
              <div className="text-5xl sm:text-6xl font-extrabold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent mb-4">
                9000+
              </div>
              <div className="text-lg text-foreground font-semibold mb-4">
                Businesses Trust Ragzy
              </div>
              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>99.9% Uptime</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>50+ Languages</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>24/7 Support</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Second Testimonials Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12">
          {/* Testimonial Card */}
          <div className="bg-card p-8 rounded-2xl shadow-lg border border-border hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex gap-1 mb-6">
              {[...Array(5)].map((_, i) => (
                <svg key={i} className="w-5 h-5 fill-yellow-400" viewBox="0 0 20 20">
                  <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                </svg>
              ))}
            </div>
            <blockquote className="text-foreground text-lg leading-relaxed mb-6">
              &quot;{additionalTestimonials[0].quote}&quot;
            </blockquote>
            <div className="flex items-center">
              <Image
                src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face&auto=format&q=80"
                alt={additionalTestimonials[0].author}
                width={48}
                height={48}
                className="h-12 w-12 rounded-full object-cover mr-4 ring-2 ring-primary/20"
              />
              <div>
                <p className="font-bold text-foreground">{additionalTestimonials[0].author}</p>
                <p className="text-sm text-muted-foreground">{additionalTestimonials[0].company}</p>
              </div>
            </div>
          </div>

          {/* Testimonial Card */}
          <div className="bg-card p-8 rounded-2xl shadow-lg border border-border hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex gap-1 mb-6">
              {[...Array(5)].map((_, i) => (
                <svg key={i} className="w-5 h-5 fill-yellow-400" viewBox="0 0 20 20">
                  <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                </svg>
              ))}
            </div>
            <blockquote className="text-foreground text-lg leading-relaxed mb-6">
              &quot;{additionalTestimonials[1].quote}&quot;
            </blockquote>
            <div className="flex items-center">
              <Image
                src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face&auto=format&q=80"
                alt={additionalTestimonials[1].author}
                width={48}
                height={48}
                className="h-12 w-12 rounded-full object-cover mr-4 ring-2 ring-primary/20"
              />
              <div>
                <p className="font-bold text-foreground">{additionalTestimonials[1].author}</p>
                <p className="text-sm text-muted-foreground">{additionalTestimonials[1].company}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
