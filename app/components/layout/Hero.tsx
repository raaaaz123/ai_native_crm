'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle2, MessageCircle, Globe, Sparkles, Zap, Shield, TrendingUp, Play, Users } from 'lucide-react';

export default function Hero() {
  const [currentFeatureIndex, setCurrentFeatureIndex] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
    <section className="relative min-h-screen flex items-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/40 overflow-hidden">
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }

        @keyframes pulse-glow {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 0.8; }
        }

        @keyframes shimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .fade-in-up {
          animation: fadeInUp 0.8s ease-out forwards;
        }

        .fade-in-scale {
          animation: fadeInScale 0.8s ease-out forwards;
        }

        .float {
          animation: float 6s ease-in-out infinite;
        }

        .shimmer {
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent);
          background-size: 1000px 100%;
          animation: shimmer 3s infinite;
        }
      `}</style>

      {/* Enhanced animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -right-32 w-[600px] h-[600px] bg-gradient-to-br from-blue-400/20 to-indigo-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-32 -left-32 w-[600px] h-[600px] bg-gradient-to-tr from-purple-400/15 to-pink-400/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/3 w-[400px] h-[400px] bg-gradient-to-r from-cyan-300/10 to-blue-400/10 rounded-full blur-3xl" style={{ animation: 'pulse-glow 4s ease-in-out infinite' }}></div>

        {/* Floating particles */}
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-blue-400/40 rounded-full" style={{ animation: 'float 8s ease-in-out infinite' }}></div>
        <div className="absolute top-1/3 right-1/3 w-3 h-3 bg-indigo-400/30 rounded-full" style={{ animation: 'float 6s ease-in-out infinite 1s' }}></div>
        <div className="absolute bottom-1/3 left-1/2 w-2 h-2 bg-purple-400/40 rounded-full" style={{ animation: 'float 7s ease-in-out infinite 2s' }}></div>
      </div>

      <div className="relative w-full mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 sm:py-24 lg:py-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 xl:gap-20 items-center">
          {/* Left column: Enhanced content */}
          <div className="space-y-8 lg:space-y-9">
            {/* Enhanced badge with glow effect */}
            <div className={`fade-in-up inline-flex items-center gap-2 rounded-full border-2 border-blue-300/50 bg-gradient-to-r from-blue-50 via-white to-indigo-50 backdrop-blur-md px-4 py-2 text-sm font-semibold text-blue-700 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
              <Sparkles className="h-4 w-4 text-blue-600 animate-pulse" />
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Introducing Rexa Engage 2.0</span>
            </div>

            {/* Enhanced heading with gradient text */}
            <h1 className={`text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.1] tracking-tight ${mounted ? 'fade-in-up' : 'opacity-0'}`} style={{ animationDelay: '0.2s' }}>
              <span className="block text-slate-900 font-light mb-2">Transform customer</span>
              <span className="block bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent font-extrabold">
                engagement
              </span>
              <span className="block mt-4 text-3xl sm:text-4xl lg:text-5xl font-normal text-slate-700">
                with AI-powered{' '}
                <span className="relative inline-block">
                  <span className="relative z-10 text-blue-600 font-bold border-r-4 border-blue-600 pr-1 animate-pulse">
                    {displayText}
                  </span>
                  <span className="absolute inset-0 bg-blue-100/50 blur-xl"></span>
                </span>
              </span>
            </h1>

            {/* Enhanced subheading */}
            <p className={`text-lg sm:text-xl lg:text-2xl text-slate-600 leading-relaxed max-w-2xl ${mounted ? 'fade-in-up' : 'opacity-0'}`} style={{ animationDelay: '0.4s' }}>
              Unify conversations, automate responses, and delight customers with{' '}
              <span className="font-semibold text-slate-800">intelligent support</span> that scales seamlessly across all channels.
            </p>

            {/* Enhanced CTAs with secondary button */}
            <div className={`flex flex-col sm:flex-row gap-4 ${mounted ? 'fade-in-up' : 'opacity-0'}`} style={{ animationDelay: '0.6s' }}>
              <Link href="/dashboard" className="inline-block">
                <Button className="w-full sm:w-auto group relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white px-10 py-6 rounded-2xl text-lg font-bold shadow-2xl hover:shadow-blue-500/50 hover:scale-105 transition-all duration-300">
                  <span className="relative z-10 flex items-center justify-center gap-3">
                    Start free trial
                    <ArrowRight className="h-6 w-6 group-hover:translate-x-2 transition-transform duration-300" />
                  </span>
                  <div className="shimmer absolute inset-0"></div>
                </Button>
              </Link>
              <Button variant="outline" className="w-full sm:w-auto group relative bg-white/80 backdrop-blur-sm border-2 border-slate-300 hover:border-blue-500 hover:bg-white text-slate-700 hover:text-blue-600 px-10 py-6 rounded-2xl text-lg font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300">
                <span className="flex items-center justify-center gap-3">
                  <Play className="h-5 w-5 group-hover:scale-110 transition-transform" />
                  Watch demo
                </span>
              </Button>
            </div>

            {/* Trust indicators */}
            <div className={`flex flex-wrap items-center gap-6 pt-4 ${mounted ? 'fade-in-up' : 'opacity-0'}`} style={{ animationDelay: '0.8s' }}>
              <div className="flex items-center gap-2 text-slate-700">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span className="text-sm font-medium">No credit card required</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span className="text-sm font-medium">7-day free trial</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <Users className="h-5 w-5 text-blue-500" />
                <span className="text-sm font-medium">10,000+ customers</span>
              </div>
            </div>
          </div>

          {/* Right column: Enhanced visual design */}
          <div className={`relative mt-12 lg:mt-0 ${mounted ? 'fade-in-scale' : 'opacity-0'}`} style={{ animationDelay: '0.5s' }}>
            {/* Enhanced floating metrics with animations */}
            <div className="hidden lg:block absolute -top-8 -left-10 z-20 float">
              <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border-2 border-green-200/60 px-6 py-5 hover:scale-110 transition-transform duration-300">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg">
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wide">Response Time</p>
                    <p className="text-2xl font-extrabold text-slate-900">2.3s</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="hidden lg:block absolute -bottom-8 -right-10 z-20 float" style={{ animationDelay: '1s' }}>
              <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border-2 border-blue-200/60 px-6 py-5 hover:scale-110 transition-transform duration-300">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center shadow-lg">
                    <CheckCircle2 className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wide">Satisfaction</p>
                    <p className="text-2xl font-extrabold text-slate-900">98%</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced main visual container */}
            <div className="relative">
              {/* Enhanced background gradient with glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-200/40 via-indigo-200/40 to-purple-200/40 rounded-3xl blur-3xl animate-pulse"></div>

              {/* Enhanced content grid with glassmorphism */}
              <div className="relative bg-white/90 backdrop-blur-xl rounded-3xl border-2 border-white/60 p-8 sm:p-10 shadow-2xl hover:shadow-blue-500/20 transition-shadow duration-500">
                {/* Enhanced feature grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Feature 1 - Enhanced */}
                  <div className="group flex items-start gap-4 p-5 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100/50 border-2 border-blue-400/60 hover:border-blue-600 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer">
                    <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <Zap className="h-7 w-7 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base mb-2">Instant Responses</h3>
                      <p className="text-sm text-slate-600 leading-relaxed">AI-powered replies in seconds</p>
                    </div>
                  </div>

                  {/* Feature 2 - Enhanced */}
                  <div className="group flex items-start gap-4 p-5 rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100/50 border-2 border-purple-400/60 hover:border-purple-600 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer">
                    <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <Shield className="h-7 w-7 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base mb-2">Secure & Private</h3>
                      <p className="text-sm text-slate-600 leading-relaxed">Enterprise-grade security</p>
                    </div>
                  </div>

                  {/* Feature 3 - Enhanced */}
                  <div className="group flex items-start gap-4 p-5 rounded-2xl bg-gradient-to-br from-green-50 to-green-100/50 border-2 border-green-400/60 hover:border-green-600 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer">
                    <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <Globe className="h-7 w-7 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base mb-2">24/7 Available</h3>
                      <p className="text-sm text-slate-600 leading-relaxed">Always-on customer support</p>
                    </div>
                  </div>

                  {/* Feature 4 - Enhanced */}
                  <div className="group flex items-start gap-4 p-5 rounded-2xl bg-gradient-to-br from-orange-50 to-orange-100/50 border-2 border-orange-400/60 hover:border-orange-600 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer">
                    <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <MessageCircle className="h-7 w-7 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base mb-2">Multi-Channel</h3>
                      <p className="text-sm text-slate-600 leading-relaxed">Website, mobile, social media</p>
                    </div>
                  </div>
                </div>

                {/* Enhanced bottom stats with better visual hierarchy */}
                <div className="mt-8 pt-7 border-t-2 border-slate-200">
                  <div className="grid grid-cols-3 gap-6 text-center">
                    <div className="group hover:scale-110 transition-transform duration-300">
                      <p className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">2.3s</p>
                      <p className="text-xs text-slate-500 font-bold uppercase tracking-wide mt-2">Avg Response</p>
                    </div>
                    <div className="group hover:scale-110 transition-transform duration-300">
                      <p className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">98%</p>
                      <p className="text-xs text-slate-500 font-bold uppercase tracking-wide mt-2">Satisfaction</p>
                    </div>
                    <div className="group hover:scale-110 transition-transform duration-300">
                      <p className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">24/7</p>
                      <p className="text-xs text-slate-500 font-bold uppercase tracking-wide mt-2">Availability</p>
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