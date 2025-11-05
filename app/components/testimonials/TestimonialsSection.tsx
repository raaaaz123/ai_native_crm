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
    quote: "Rexa has completely transformed our customer support. The AI agents handle 80% of inquiries automatically, and our response time dropped from hours to seconds.",
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
    quote: "Rexa's AI agents work 24/7 without breaks. We've seen a 60% reduction in support tickets and our team can focus on strategic initiatives.",
    author: "David Kim",
    company: "InnovateLab"
  }
];


export default function TestimonialsSection() {
  return (
    <section className="py-4 sm:py-6 lg:py-8 bg-muted/30">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 rounded-full bg-pink-100 px-3 py-1.5 text-xs font-semibold text-pink-700 mb-4">
            <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
            <span>Testimonials</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            What people say
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            With over 9000 clients served, here&apos;s what they have to say
          </p>
        </div>

        {/* Three Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Testimonial Card */}
          <div className="bg-card p-8 rounded-xl shadow-sm border border-border">
            <blockquote className="text-foreground text-lg leading-relaxed mb-6">
              &quot;{testimonials[0].quote}&quot;
            </blockquote>
            <div className="flex items-center">
              <Image 
                src="https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&h=100&fit=crop&crop=face&auto=format&q=80"
                alt={testimonials[0].author}
                width={48}
                height={48}
                className="h-12 w-12 rounded-full object-cover mr-4"
              />
              <div>
                <p className="font-bold text-foreground">{testimonials[0].author}</p>
                <p className="text-sm text-muted-foreground">{testimonials[0].company}</p>
              </div>
            </div>
          </div>

          {/* Middle Testimonial Card */}
          <div className="bg-card p-8 rounded-xl shadow-sm border border-border">
            <blockquote className="text-foreground text-lg leading-relaxed mb-6">
              &quot;{testimonials[1].quote}&quot;
            </blockquote>
            <div className="flex items-center">
              <Image 
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face&auto=format&q=80"
                alt={testimonials[1].author}
                width={48}
                height={48}
                className="h-12 w-12 rounded-full object-cover mr-4"
              />
              <div>
                <p className="font-bold text-foreground">{testimonials[1].author}</p>
                <p className="text-sm text-muted-foreground">{testimonials[1].company}</p>
              </div>
            </div>
          </div>

          {/* Right Stats Card */}
          <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
            <Image
              src="https://ik.imagekit.io/dtpiuu7ns/uploads/Gemini_Generated_Image_wsrbgfwsrbgfwsrb%20(1).png?updatedAt=1762281840941"
              alt="Rexa Engage trusted by businesses"
              width={400}
              height={192}
              className="w-full h-48 object-cover"
              loading="lazy"
            />
            <div className="p-8">
              <div className="text-4xl sm:text-5xl font-extrabold text-foreground mb-2">
                2000+
              </div>
              <div className="text-base sm:text-lg text-muted-foreground font-medium">
                businesses trust Rexa Engage
              </div>
            </div>
          </div>
        </div>

        {/* Second Testimonials Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-16">
          {/* Left Stats Card */}
          <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
            <Image
              src="https://ik.imagekit.io/dtpiuu7ns/uploads/Gemini_Generated_Image_7mglds7mglds7mgl%20(1).png?updatedAt=1762282099324"
              alt="Languages supported banner"
              width={400}
              height={192}
              className="w-full h-48 object-cover"
              loading="lazy"
            />
            <div className="p-8">
              <div className="text-4xl sm:text-5xl font-extrabold text-foreground mb-2">
                50+
              </div>
              <div className="text-base sm:text-lg text-muted-foreground font-medium">
                languages supported
              </div>
            </div>
          </div>

          {/* Middle Testimonial Card */}
          <div className="bg-card p-8 rounded-xl shadow-sm border border-border">
            <blockquote className="text-foreground text-lg leading-relaxed mb-6">
              &quot;{additionalTestimonials[0].quote}&quot;
            </blockquote>
            <div className="flex items-center">
              <Image 
                src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face&auto=format&q=80"
                alt={additionalTestimonials[0].author}
                width={48}
                height={48}
                className="h-12 w-12 rounded-full object-cover mr-4"
              />
              <div>
                <p className="font-bold text-foreground">{additionalTestimonials[0].author}</p>
                <p className="text-sm text-muted-foreground">{additionalTestimonials[0].company}</p>
              </div>
            </div>
          </div>

          {/* Right Testimonial Card */}
          <div className="bg-card p-8 rounded-xl shadow-sm border border-border">
            <blockquote className="text-foreground text-lg leading-relaxed mb-6">
              &quot;{additionalTestimonials[1].quote}&quot;
            </blockquote>
            <div className="flex items-center">
              <Image 
                src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face&auto=format&q=80"
                alt={additionalTestimonials[1].author}
                width={48}
                height={48}
                className="h-12 w-12 rounded-full object-cover mr-4"
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
