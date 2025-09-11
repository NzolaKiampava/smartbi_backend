import { Request, Response, NextFunction } from 'express';
import { GraphQLContext } from '../types/graphql';
export interface AuthenticatedRequest extends Request {
    user?: import('../types/auth').User;
    company?: import('../types/auth').Company;
}
export declare const authMiddleware: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const requireAuth: (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
export declare const requireRole: (roles: string[]) => (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
export declare const createGraphQLContext: (req: AuthenticatedRequest, res: Response) => GraphQLContext;
//# sourceMappingURL=auth.middleware.d.ts.map