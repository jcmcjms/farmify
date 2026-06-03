import * as Sentry from '@sentry/react'

/**
 * Initialize Sentry error tracking for the frontend.
 * Only initializes if VITE_SENTRY_DSN is configured.
 */
export function initSentry(): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN
  if (!dsn) {
    // Not configured — silently skip. Set VITE_SENTRY_DSN in .env to enable.
    return
  }

  Sentry.init({
    dsn,
    environment: import.meta.env.VITE_APP_ENV || 'development',
    integrations: [Sentry.browserTracingIntegration()],
    tracesSampleRate: import.meta.env.VITE_APP_ENV === 'production' ? 0.2 : 0.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  })

  console.info('[Sentry] Frontend error tracking initialized')
}
