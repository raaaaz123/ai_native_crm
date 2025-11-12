'use client';

import { Suspense, useEffect } from 'react';
import { usePageView } from '@/app/lib/posthog';

function PostHogPageViewTracker() {
  usePageView();
  return null;
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  // Initialize PostHog on client side
  useEffect(() => {
    // Import and initialize PostHog client-side
    if (typeof window !== 'undefined') {
      import('posthog-js').then(({ default: posthog }) => {
        const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
        const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST;

        if (posthogKey && posthogHost && !posthog.__loaded) {
          posthog.init(posthogKey, {
            api_host: posthogHost,
            person_profiles: 'identified_only',
            capture_pageview: false, // We'll capture pageviews manually
            capture_pageleave: true,
            session_recording: {
              maskAllInputs: false,
              maskTextSelector: '[data-ph-mask]',
              blockSelector: '[data-ph-block]',
              ignoreClass: 'ph-ignore',
              recordCrossOriginIframes: false,
            },
            loaded: () => {
              if (process.env.NODE_ENV === 'development') {
                console.log('PostHog initialized');
              }
            }
          });
        }
      });
    }
  }, []);

  return (
    <>
      <Suspense fallback={null}>
        <PostHogPageViewTracker />
      </Suspense>
      {children}
    </>
  );
}

