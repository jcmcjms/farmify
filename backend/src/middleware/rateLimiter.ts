import rateLimit from 'express-rate-limit';

/**
 * Global rate limiter — applies to all API routes.
 * Window: 15 minutes, Max: 100 requests per IP.
 */
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false,  // Disable the `X-RateLimit-*` headers
  message: {
    success: false,
    error: 'Too many requests. Please try again after 15 minutes.',
  },
});

/**
 * Strict rate limiter for auth routes (login, register).
 * Window: 15 minutes, Max: 10 requests per IP.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many authentication attempts. Please try again after 15 minutes.',
  },
});