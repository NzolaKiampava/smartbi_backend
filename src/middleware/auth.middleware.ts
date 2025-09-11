import { Request, Response, NextFunction } from 'express';
import { JWTService } from '../utils/jwt';
import { AuthService } from '../services/auth.service';
import { GraphQLContext } from '../types/graphql';

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
  return {
    user: req.user,
    company: req.company,
    isAuthenticated: !!req.user,
    req,
    res,
  };
};