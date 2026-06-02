import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthenticatedRequest, JwtPayload } from '../types/index.js';

const rawSecret = process.env.JWT_SECRET;
if (!rawSecret) {
  throw new Error('JWT_SECRET environment variable is required');
}
const JWT_SECRET: string = rawSecret;

/**
 * Authenticate middleware — verifies JWT from Authorization header (Bearer token).
 * Attaches decoded user payload to req.user on success.
 * Returns 401 on missing/invalid/expired token.
 */
export function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({
      success: false,
      error: 'Access denied. No token provided.',
    });
    return;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    res.status(401).json({
      success: false,
      error: 'Access denied. Invalid token format. Use: Bearer <token>',
    });
    return;
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as unknown as JwtPayload;
    req.user = {
      id: decoded.id,
      name: decoded.name,
      email: decoded.email,
      role: decoded.role,
    };
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        error: 'Token has expired.',
      });
      return;
    }
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        error: 'Invalid token.',
      });
      return;
    }
    res.status(401).json({
      success: false,
      error: 'Authentication failed.',
    });
  }
}

/**
 * Optional authentication — same as authenticate but never fails.
 * If a valid token is present, user info is attached; otherwise req.user remains undefined.
 */
export function optionalAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    next();
    return;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    next();
    return;
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as unknown as JwtPayload;
    req.user = {
      id: decoded.id,
      name: decoded.name,
      email: decoded.email,
      role: decoded.role,
    };
  } catch {
    // Silently ignore — optional auth never blocks
  }

  next();
}

/**
 * Role-based authorization middleware factory.
 * Returns middleware that checks if the authenticated user has one of the specified roles.
 * Must be used AFTER the authenticate middleware.
 */
export function requireRole(...roles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required.',
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: `Access denied. Required role(s): ${roles.join(', ')}. Your role: ${req.user.role}.`,
      });
      return;
    }

    next();
  };
}
