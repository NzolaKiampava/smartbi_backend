import { Request, Response, NextFunction } from 'express';
import { User, Company } from '../types/auth';
declare global {
    namespace Express {
        interface Request {
            user?: User & {
                company?: Company;
            };
        }
    }
}
export declare const aiQueryRateLimit: import("express-rate-limit").RateLimitRequestHandler;
export declare const connectionManagementRateLimit: import("express-rate-limit").RateLimitRequestHandler;
export declare const validateAIQueryInput: (req: Request, res: Response, next: NextFunction) => Response | void;
export declare const validateConnectionConfig: (req: Request, res: Response, next: NextFunction) => Response | void;
export declare const sanitizeConnectionConfig: (req: Request, res: Response, next: NextFunction) => Response | void;
export declare const logAIQuery: (req: Request, res: Response, next: NextFunction) => void;
export declare const checkAIQueryPermissions: (req: Request, res: Response, next: NextFunction) => Response | void;
export declare const aiQuerySecurityHeaders: (req: Request, res: Response, next: NextFunction) => void;
export declare const aiQueryMiddlewares: ((req: Request, res: Response, next: NextFunction) => Response | void)[];
export declare const connectionManagementMiddlewares: ((req: Request, res: Response, next: NextFunction) => Response | void)[];
//# sourceMappingURL=ai-query.middleware.d.ts.map