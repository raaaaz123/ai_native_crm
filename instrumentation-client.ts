import posthog from 'posthog-js'

if (typeof window !== 'undefined') {
  const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY
  const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST

  if (posthogKey && posthogHost) {
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
      loaded: (posthog) => {
        if (process.env.NODE_ENV === 'development') {
          console.log('PostHog initialized')
        }
      }
    })
  }
}

