'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CreditCard, Play, Pause, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';

export default function Hero() {
  const [isPlaying, setIsPlaying] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <section className="relative py-12 sm:py-16 lg:py-24 bg-gradient-to-b from-background via-background to-primary/5">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-1/2 -left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative w-full mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Badge */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-4 py-2 text-sm font-semibold text-primary">
            <Sparkles className="h-4 w-4" />
            <span>AI-Powered Customer Engagement Platform</span>
          </div>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          {/* Left column: content */}
          <div className="space-y-8 text-center lg:text-left">
            {/* Main heading */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold leading-[1.1] tracking-tight text-foreground">
              Transform customer interactions with{' '}
              <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                AI agents
              </span>
            </h1>

            {/* Subheading */}
            <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto lg:mx-0">
              Build, deploy, and scale intelligent AI support agents that deliver exceptional experiences 24/7. No coding required.
            </p>

            {/* Key benefits */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <span>Setup in 5 minutes</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <span>14-day free trial</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link href="/dashboard" className="inline-block">
                <Button className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 rounded-xl text-base font-semibold transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl">
                  Start Building Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>

              <Link href="#demo" className="inline-block">
                <Button variant="outline" className="w-full sm:w-auto border-2 border-border hover:border-primary/30 text-foreground hover:bg-primary/5 px-8 py-6 rounded-xl text-base font-semibold transition-all duration-300 hover:scale-105">
                  Watch Demo
                  <Play className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Right column: Video player */}
          <div className="relative mt-8 lg:mt-0">
            {/* Video container */}
            <div className="relative bg-card/50 backdrop-blur-sm rounded-2xl p-3 shadow-2xl border border-border/50 max-w-2xl mx-auto">
              {/* Video player */}
              <div className="relative w-full h-80 sm:h-96 lg:h-[28rem] bg-muted/50 rounded-xl overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="w-full h-full object-cover"
                >
                  <source src="https://backend.chatbase.co/storage/v1/object/public/chatbase/landing/hero/hero.webm" type="video/webm" />
                  Your browser does not support the video tag.
                </video>

                {/* Play/Pause button */}
                <div className="absolute bottom-4 right-4">
                  <button
                    onClick={togglePlayPause}
                    className="w-12 h-12 bg-background/90 hover:bg-background rounded-full flex items-center justify-center shadow-lg transition-all duration-300 hover:scale-110 backdrop-blur-sm"
                  >
                    {isPlaying ? (
                      <Pause className="h-5 w-5 text-foreground/70" />
                    ) : (
                      <Play className="h-5 w-5 text-foreground/70" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Floating stats */}
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-full max-w-md px-4">
              <div className="grid grid-cols-3 gap-3 bg-card/90 backdrop-blur-md rounded-xl p-4 shadow-xl border border-border/50">
                <div className="text-center">
                  <div className="text-xl sm:text-2xl font-bold text-foreground">9000+</div>
                  <div className="text-xs text-muted-foreground">Businesses</div>
                </div>
                <div className="text-center border-x border-border/50">
                  <div className="text-xl sm:text-2xl font-bold text-foreground">80%</div>
                  <div className="text-xs text-muted-foreground">Faster</div>
                </div>
                <div className="text-center">
                  <div className="text-xl sm:text-2xl font-bold text-foreground">24/7</div>
                  <div className="text-xs text-muted-foreground">Available</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Trusted by banner */}
        <div className="mt-20 lg:mt-24">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-8 font-medium">
              Trusted by industry leaders worldwide
            </p>

            {/* Company logos */}
            <div className="flex items-center justify-center gap-8 lg:gap-12 xl:gap-16 opacity-70 overflow-x-auto pb-4">
              <div className="text-foreground font-bold text-xl whitespace-nowrap hover:opacity-100 transition-opacity">Siemens</div>
              <div className="text-foreground font-bold text-xl whitespace-nowrap hover:opacity-100 transition-opacity">Postman</div>
              <div className="text-foreground font-bold text-xl whitespace-nowrap hover:opacity-100 transition-opacity">PwC</div>
              <div className="text-foreground font-bold text-xl whitespace-nowrap hover:opacity-100 transition-opacity">Alpian</div>
              <div className="text-foreground font-bold text-xl whitespace-nowrap hover:opacity-100 transition-opacity">Opal</div>
              <div className="text-foreground font-bold text-xl whitespace-nowrap hover:opacity-100 transition-opacity">Al Baraka</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}