'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CreditCard, Play, Pause } from 'lucide-react';

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
    <section className="relative py-8 sm:py-12 lg:py-16 bg-background">
      <div className="relative w-full mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 xl:gap-16 items-center">
          {/* Left column: content */}
          <div className="space-y-6 lg:space-y-8">
            {/* Main heading - reduced size with thin bold font */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-semibold leading-[1.1] tracking-tight text-foreground">
              Intelligent AI agents that transform customer interactions
            </h1>

            {/* Subheading - exact font size from reference */}
            <p className="text-xl lg:text-lg font-semibold text-muted-foreground leading-relaxed max-w-2xl">
              Build, deploy, and scale powerful AI support agents that deliver exceptional customer experiences across all channels.
            </p>

            {/* CTA Button with reduced curve and increased height */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <Link href="/dashboard" className="inline-block">
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 rounded-md text-base font-semibold transition-all duration-300 hover:scale-105 cursor-pointer h-14">
                  Build your agent
                </Button>
              </Link>
              
              {/* Credit card disclaimer */}
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <CreditCard className="h-4 w-4" />
                <span>No credit card required</span>
              </div>
            </div>
          </div>

          {/* Right column: Video player */}
          <div className="relative mt-8 lg:mt-0">
            {/* Video container - reduced width */}
            <div className="relative bg-muted rounded-xl p-4 shadow-sm max-w-md mx-auto lg:mx-0">
              {/* Video player with reduced height to match left section */}
              <div className="relative w-full h-80 sm:h-96 lg:h-[24rem] xl:h-[28rem] bg-muted/50 rounded-lg overflow-hidden">
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
                
                {/* Play/Pause button - moved to right bottom */}
                <div className="absolute bottom-4 right-4">
                  <button 
                    onClick={togglePlayPause}
                    className="w-12 h-12 bg-background/90 hover:bg-background rounded-full flex items-center justify-center shadow-lg transition-all duration-300 hover:scale-110"
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
          </div>
        </div>

        {/* Trusted by banner */}
        <div className="mt-6 lg:mt-8">
          <div className="text-center">
            <p className="text-base text-muted-foreground mb-6 font-bold">
              Trusted by 9000+ businesses worldwide
            </p>
            
            {/* Company logos - single horizontal line */}
            <div className="flex items-center justify-center gap-6 lg:gap-8 xl:gap-12 opacity-90 overflow-x-auto">
              <div className="text-foreground/70 font-semibold text-lg whitespace-nowrap">Siemens</div>
              <div className="text-foreground/70 font-semibold text-lg whitespace-nowrap">Postman</div>
              <div className="text-foreground/70 font-semibold text-lg whitespace-nowrap">PwC</div>
              <div className="text-foreground/70 font-semibold text-lg whitespace-nowrap">Alpian</div>
              <div className="text-foreground/70 font-semibold text-lg whitespace-nowrap">Opal</div>
              <div className="text-foreground/70 font-semibold text-lg whitespace-nowrap">Al Baraka</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}