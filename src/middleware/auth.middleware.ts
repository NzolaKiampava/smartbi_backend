import { Request, Response, NextFunction } from 'express';
import { JWTService } from '../utils/jwt';
import { AuthService } from '../services/auth.service';
import { GraphQLContext } from '../types/graphql';
import { createClient } from '@supabase/supabase-js';
import { config } from '../config/environment';

export interface AuthenticatedRequest extends Request {
  user?: import('../types/auth').User;
  company?: import('../types/auth').Company;
}

export const authMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = JWTService.extractTokenFromHeader(req.headers.authorization);
    
    if (!token) {
      return next();
    }

    const payload = JWTService.verifyAccessToken(token);
    if (!payload) {
      return next();
    }

    const result = await AuthService.getUserById(payload.userId);
    if (result) {
      req.user = result.user;
      req.company = result.company;
    }

    next();
  } catch (error) {
    next();
  }
};

export const requireAuth = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
    return;
  }
  next();
};

export const requireRole = (roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
      });
      return;
    }

    next();
  };
};

export const createGraphQLContext = (req: AuthenticatedRequest, res: Response): GraphQLContext => {
  // Ensure a Supabase client exists on the request (Express sets app.locals.supabase normally)
  // In serverless environments (Vercel) req.app may be undefined, so create a client from env
  let supabaseClient: any = undefined;
  try {
    if (req && (req as any).app && (req as any).app.locals && (req as any).app.locals.supabase) {
      supabaseClient = (req as any).app.locals.supabase;
    } else if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      supabaseClient = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
      // Attach to req for potential reuse in this invocation
      try { (req as any).app = (req as any).app || {}; (req as any).app.locals = (req as any).app.locals || {}; (req as any).app.locals.supabase = supabaseClient; } catch(e) {}
    }
  } catch (e) {
    console.warn('Could not create supabase client in serverless context:', e);
  }

  return {
    user: req.user,
    company: req.company,
    isAuthenticated: !!req.user,
    req,
    res,
    // NOTE: We don't add supabase to GraphQLContext type; services import from config/database by default.
  };
};