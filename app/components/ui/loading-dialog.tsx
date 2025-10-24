"use client";

import React from 'react';
import { Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface LoadingDialogProps {
  open?: boolean;
  message?: string;
  submessage?: string;
  variant?: 'default' | 'gradient' | 'glass';
  icon?: React.ReactNode;
}

export function LoadingDialog({ 
  open = true,
  message = 'Loading...', 
  submessage,
  icon
}: LoadingDialogProps) {
  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="max-w-xs border-0 shadow-lg p-0">
        {/* Hidden title for accessibility */}
        <AlertDialogTitle className="sr-only">{message}</AlertDialogTitle>
        
        <div style={{ 
          background: 'linear-gradient(135deg, var(--color-primary-50) 0%, #ffffff 50%, var(--color-primary-100) 100%)'
        }} className="relative p-6 rounded-lg">
          {/* Content */}
          <div className="text-center">
            {/* Spinner */}
            <div className="mb-4 flex items-center justify-center">
              {icon || (
                <Loader2 
                  className="animate-spin" 
                  style={{ 
                    width: '48px', 
                    height: '48px',
                    color: 'var(--color-primary-500)'
                  }} 
                />
              )}
            </div>

            {/* Message */}
            <div className="space-y-1.5">
              <h3 
                className="text-lg font-semibold tracking-tight"
                style={{ color: 'var(--color-neutral-900)' }}
              >
                {message}
              </h3>
              
              {submessage && (
                <p 
                  className="text-sm leading-relaxed"
                  style={{ color: 'var(--color-neutral-600)' }}
                >
                  {submessage}
                </p>
              )}
            </div>

            {/* Loading Dots */}
            <div className="flex items-center justify-center mt-4 space-x-1.5">
              <div 
                className="w-2 h-2 rounded-full animate-bounce" 
                style={{ 
                  backgroundColor: 'var(--color-primary-400)',
                  animationDelay: '0ms' 
                }} 
              />
              <div 
                className="w-2 h-2 rounded-full animate-bounce" 
                style={{ 
                  backgroundColor: 'var(--color-primary-500)',
                  animationDelay: '150ms' 
                }} 
              />
              <div 
                className="w-2 h-2 rounded-full animate-bounce" 
                style={{ 
                  backgroundColor: 'var(--color-primary-600)',
                  animationDelay: '300ms' 
                }} 
              />
            </div>
          </div>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function LoadingSpinner({ 
  message = 'Loading...', 
  submessage
}: Omit<LoadingDialogProps, 'open' | 'variant'>) {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        <div className="mb-3 flex items-center justify-center">
          <Loader2 
            className="animate-spin" 
            style={{ 
              width: '40px', 
              height: '40px',
              color: 'var(--color-primary-500)'
            }} 
          />
        </div>
        
        <p 
          className="font-semibold text-base"
          style={{ color: 'var(--color-neutral-900)' }}
        >
          {message}
        </p>
        {submessage && (
          <p 
            className="text-sm mt-1.5 max-w-xs mx-auto"
            style={{ color: 'var(--color-neutral-600)' }}
          >
            {submessage}
          </p>
        )}
      </div>
    </div>
  );
}

// Full Screen Loading (for page-level loading)
export function LoadingScreen({
  message = 'Loading...',
  submessage
}: Omit<LoadingDialogProps, 'open' | 'variant'>) {
  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{ 
        background: 'linear-gradient(135deg, var(--color-primary-50) 0%, #ffffff 50%, var(--color-primary-100) 100%)'
      }}
    >
      <div className="text-center max-w-md">
        <div className="mb-6 flex items-center justify-center">
          <Loader2 
            className="animate-spin" 
            style={{ 
              width: '64px', 
              height: '64px',
              color: 'var(--color-primary-500)'
            }} 
          />
        </div>

        <h2 
          className="text-2xl font-bold mb-2"
          style={{ color: 'var(--color-neutral-900)' }}
        >
          {message}
        </h2>
        {submessage && (
          <p 
            className="text-sm leading-relaxed"
            style={{ color: 'var(--color-neutral-600)' }}
          >
            {submessage}
          </p>
        )}

        {/* Animated dots */}
        <div className="flex items-center justify-center mt-6 space-x-2">
          <span 
            className="w-2.5 h-2.5 rounded-full animate-bounce" 
            style={{ 
              backgroundColor: 'var(--color-primary-400)',
              animationDelay: '0ms' 
            }} 
          />
          <span 
            className="w-2.5 h-2.5 rounded-full animate-bounce" 
            style={{ 
              backgroundColor: 'var(--color-primary-500)',
              animationDelay: '150ms' 
            }} 
          />
          <span 
            className="w-2.5 h-2.5 rounded-full animate-bounce" 
            style={{ 
              backgroundColor: 'var(--color-primary-600)',
              animationDelay: '300ms' 
            }} 
          />
        </div>
      </div>
    </div>
  );
}

