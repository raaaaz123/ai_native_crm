'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle2, MessageCircle, Globe, Sparkles, Zap, Shield, TrendingUp } from 'lucide-react';

export default function Hero() {
  const [currentFeatureIndex, setCurrentFeatureIndex] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const features = [
      'engagement',
      'support',
      'automation',
      'analytics',
      'conversations',
      'intelligence'
    ];
    
    const currentFeature = features[currentFeatureIndex];
    
    const timeout = setTimeout(() => {
      if (!isDeleting) {
        if (displayText.length < currentFeature.length) {
          setDisplayText(currentFeature.slice(0, displayText.length + 1));
        } else {
          setTimeout(() => setIsDeleting(true), 2000); // Wait 2 seconds before deleting
        }
      } else {
        if (displayText.length > 0) {
          setDisplayText(displayText.slice(0, -1));
        } else {
          setIsDeleting(false);
          setCurrentFeatureIndex((prev) => (prev + 1) % features.length);
        }
      }
    }, isDeleting ? 50 : 100); // Faster deletion, slower typing

    return () => clearTimeout(timeout);
  }, [displayText, isDeleting, currentFeatureIndex]);
  return (
    <section className="relative min-h-screen flex items-center bg-gradient-to-br from-white via-blue-50/20 to-indigo-50/30 overflow-hidden">
      <style jsx>{`
        @keyframes typewriter {
          from { width: 0; }
          to { width: 100%; }
        }
        
        @keyframes blink {
          50% { border-color: transparent; }
        }
        
        .typewriter {
          overflow: hidden;
          border-right: 3px solid #3b82f6;
          white-space: nowrap;
          animation: typewriter 2s steps(30) 1s forwards, blink 0.75s step-end infinite;
          display: inline-block;
          width: 0;
        }
        
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .fade-in-up {
          animation: fadeInUp 0.8s ease-out forwards;
        }
      `}</style>
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -right-20 w-96 h-96 bg-gradient-to-br from-blue-400/10 to-indigo-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-gradient-to-tr from-purple-400/10 to-pink-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-r from-blue-300/5 to-indigo-300/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative w-full mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
        {/* 2-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 xl:gap-16 items-center">
          {/* Left column: content */}
          <div className="space-y-6 lg:space-y-7">
            {/* Top badge */}
            <div className="fade-in-up inline-flex items-center gap-2 rounded-full border border-blue-200/60 bg-white/80 backdrop-blur-sm px-3 py-1.5 text-xs sm:text-sm font-semibold text-blue-700 shadow-sm hover:shadow-md transition-all">
              <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600" />
              <span>Introducing Rexa Engage 2.0</span>
            </div>

            {/* Heading */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-light leading-[1.15] tracking-tight">
              <span className="block text-slate-900 font-extralight">Transform customer engagement with</span>
              <span className="block mt-3 text-3xl sm:text-4xl lg:text-5xl">
                <span className="typewriter text-blue-600 font-normal">
                  AI-powered {displayText}
                </span>
              </span>
            </h1>

            {/* Subheading */}
            <p className="fade-in-up text-base sm:text-lg lg:text-xl text-slate-600 leading-relaxed max-w-2xl font-light" style={{ animationDelay: '0.3s' }}>
              Unify conversations, automate responses, and delight customers with intelligent support that scales seamlessly across all channels.
            </p>

            {/* CTAs */}
            <div className="fade-in-up" style={{ animationDelay: '0.7s' }}>
              <Link href="/dashboard" className="inline-block">
                <Button className="w-full sm:w-auto group relative bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-5 rounded-xl text-lg font-bold shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300">
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    Start free trial
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
                  </span>
                  <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 rounded-xl transition-opacity duration-300"></div>
                </Button>
              </Link>
            </div>

          </div>

          {/* Right column: Clean professional design */}
          <div className="relative mt-8 lg:mt-0">
            {/* Floating metrics */}
            <div className="hidden lg:block absolute -top-6 -left-8 z-20">
              <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-slate-200/60 px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Response Time</p>
                    <p className="text-lg font-bold text-slate-900">2.3s</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="hidden lg:block absolute -bottom-6 -right-8 z-20">
              <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-slate-200/60 px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                    <CheckCircle2 className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Satisfaction</p>
                    <p className="text-lg font-bold text-slate-900">98%</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Main visual container */}
            <div className="relative">
              {/* Background gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 rounded-2xl blur-3xl"></div>
              
              {/* Content grid */}
              <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 p-6 sm:p-8 shadow-xl">
                {/* Feature grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
                  {/* Feature 1 */}
                  <div className="flex items-start gap-4 p-4 rounded-2xl bg-gradient-to-br from-blue-50/50 to-blue-100/30 border-2 border-blue-500/40 hover:border-blue-600 transition-all duration-300 hover:shadow-lg">
                    <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center flex-shrink-0">
                      <Zap className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 text-sm mb-1">Instant Responses</h3>
                      <p className="text-xs text-slate-600 leading-relaxed">AI-powered replies in seconds</p>
                    </div>
                  </div>

                  {/* Feature 2 */}
                  <div className="flex items-start gap-4 p-4 rounded-2xl bg-gradient-to-br from-purple-50/50 to-purple-100/30 border-2 border-purple-500/40 hover:border-purple-600 transition-all duration-300 hover:shadow-lg">
                    <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center flex-shrink-0">
                      <Shield className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 text-sm mb-1">Secure & Private</h3>
                      <p className="text-xs text-slate-600 leading-relaxed">Enterprise-grade security</p>
                    </div>
                  </div>

                  {/* Feature 3 */}
                  <div className="flex items-start gap-4 p-4 rounded-2xl bg-gradient-to-br from-green-50/50 to-green-100/30 border-2 border-green-500/40 hover:border-green-600 transition-all duration-300 hover:shadow-lg">
                    <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center flex-shrink-0">
                      <Globe className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 text-sm mb-1">24/7 Available</h3>
                      <p className="text-xs text-slate-600 leading-relaxed">Always-on customer support</p>
                    </div>
                  </div>

                  {/* Feature 4 */}
                  <div className="flex items-start gap-4 p-4 rounded-2xl bg-gradient-to-br from-orange-50/50 to-orange-100/30 border-2 border-orange-500/40 hover:border-orange-600 transition-all duration-300 hover:shadow-lg">
                    <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-orange-600 to-red-600 flex items-center justify-center flex-shrink-0">
                      <MessageCircle className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 text-sm mb-1">Multi-Channel</h3>
                      <p className="text-xs text-slate-600 leading-relaxed">Website, mobile, social media</p>
                    </div>
                  </div>
                </div>

                {/* Bottom stats */}
                <div className="mt-6 sm:mt-7 pt-5 sm:pt-6 border-t border-slate-200/60">
                  <div className="grid grid-cols-3 gap-4 sm:gap-5 text-center">
                    <div>
                      <p className="text-xl sm:text-2xl font-bold text-slate-900">2.3s</p>
                      <p className="text-xs text-slate-500 font-medium mt-1">Avg Response</p>
                    </div>
                    <div>
                      <p className="text-xl sm:text-2xl font-bold text-slate-900">98%</p>
                      <p className="text-xs text-slate-500 font-medium mt-1">Satisfaction</p>
                    </div>
                    <div>
                      <p className="text-xl sm:text-2xl font-bold text-slate-900">24/7</p>
                      <p className="text-xs text-slate-500 font-medium mt-1">Availability</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}