import * as Sentry from '@sentry/node';

/**
 * Initialize Sentry error tracking for the backend.
 * Only initializes if SENTRY_DSN environment variable is configured.
 */
export function initSentry(): void {
  if (!process.env.SENTRY_DSN) {
    // Not configured — silently skip. Set SENTRY_DSN in .env to enable.
    return;
  }

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 0.0,
    integrations: [
      Sentry.expressIntegration(),
      Sentry.httpIntegration(),
    ],
  });

  console.info('[Sentry] Backend error tracking initialized');
}

export { Sentry };
