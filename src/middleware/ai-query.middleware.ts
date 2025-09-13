import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { User, Company } from '../types/auth';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: User & { company?: Company };
    }
  }
}

// Rate limiting for AI queries - more restrictive than regular API calls
export const aiQueryRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // Limit each IP to 10 AI queries per minute
  message: {
    error: 'Too many AI queries from this IP, please try again after a minute.',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Custom key generator based on user ID if available
  keyGenerator: (req: Request) => {
    return req.user?.id || req.ip || 'unknown';
  }
});

// Rate limiting for connection management operations
export const connectionManagementRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute  
  max: 20, // Limit each IP to 20 connection operations per minute
  message: {
    error: 'Too many connection management requests from this IP, please try again after a minute.',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    return req.user?.id || req.ip || 'unknown';
  }
});

// Validate AI query input
export const validateAIQueryInput = (req: Request, res: Response, next: NextFunction): Response | void => {
  try {
    const { naturalQuery } = req.body.variables?.input || {};
    
    if (!naturalQuery || typeof naturalQuery !== 'string') {
      return res.status(400).json({
        error: 'Natural query is required and must be a string'
      });
    }

    // Check query length
    if (naturalQuery.length > 1000) {
      return res.status(400).json({
        error: 'Natural query is too long. Maximum 1000 characters allowed.'
      });
    }

    // Check for potentially malicious content
    const suspiciousPatterns = [
      /system\s*\(/i,
      /exec\s*\(/i,
      /eval\s*\(/i,
      /script\s*>/i,
      /javascript\s*:/i,
      /vbscript\s*:/i,
      /file\s*:/i,
      /data\s*:/i
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(naturalQuery)) {
        return res.status(400).json({
          error: 'Query contains potentially unsafe content'
        });
      }
    }

    next();
  } catch (error) {
    return res.status(400).json({
      error: 'Invalid request format'
    });
  }
};

// Validate connection configuration
export const validateConnectionConfig = (req: Request, res: Response, next: NextFunction): Response | void => {
  try {
    const { input } = req.body.variables || {};
    
    if (!input || !input.config) {
      return res.status(400).json({
        error: 'Connection configuration is required'
      });
    }

    const { type, config } = input;

    // Validate based on connection type
    switch (type) {
      case 'MYSQL':
      case 'POSTGRESQL':
        if (!config.host || !config.username || !config.database) {
          return res.status(400).json({
            error: 'Host, username, and database are required for database connections'
          });
        }
        
        // Validate host format
        if (!/^[a-zA-Z0-9.-]+$/.test(config.host)) {
          return res.status(400).json({
            error: 'Invalid host format'
          });
        }

        // Validate port if provided
        if (config.port && (config.port < 1 || config.port > 65535)) {
          return res.status(400).json({
            error: 'Port must be between 1 and 65535'
          });
        }
        break;

      case 'API_REST':
      case 'API_GRAPHQL':
        if (!config.apiUrl) {
          return res.status(400).json({
            error: 'API URL is required for API connections'
          });
        }

        // Validate URL format
        try {
          new URL(config.apiUrl);
        } catch {
          return res.status(400).json({
            error: 'Invalid API URL format'
          });
        }

        // Only allow HTTPS URLs in production
        if (process.env.NODE_ENV === 'production' && !config.apiUrl.startsWith('https://')) {
          return res.status(400).json({
            error: 'Only HTTPS URLs are allowed in production'
          });
        }
        break;

      default:
        return res.status(400).json({
          error: 'Invalid connection type'
        });
    }

    next();
  } catch (error) {
    return res.status(400).json({
      error: 'Invalid request format'
    });
  }
};

// Sanitize connection configuration before storage
export const sanitizeConnectionConfig = (req: Request, res: Response, next: NextFunction): Response | void => {
  try {
    const { input } = req.body.variables || {};
    
    if (input?.config) {
      // Remove any potentially dangerous fields
      const dangerousFields = ['eval', 'exec', 'require', 'import', '__proto__', 'constructor'];
      
      for (const field of dangerousFields) {
        delete input.config[field];
      }

      // Validate and sanitize headers for API connections
      if (input.config.headers && Array.isArray(input.config.headers)) {
        input.config.headers = input.config.headers.filter((header: any) => {
          return header && 
                 typeof header.key === 'string' && 
                 typeof header.value === 'string' &&
                 header.key.length <= 100 &&
                 header.value.length <= 500;
        });
      }

      // Ensure timeout is within reasonable bounds
      if (input.config.timeout) {
        input.config.timeout = Math.min(Math.max(input.config.timeout, 1000), 60000); // 1s to 60s
      }
    }

    next();
  } catch (error) {
    return res.status(400).json({
      error: 'Invalid request format'
    });
  }
};

// Log AI queries for monitoring
export const logAIQuery = (req: Request, res: Response, next: NextFunction): void => {
  const originalSend = res.send;
  
  res.send = function(data) {
    try {
      const userId = req.user?.id || 'anonymous';
      const companyId = req.user?.companyId || 'unknown';
      const query = req.body.variables?.input?.naturalQuery || 'unknown';
      
      console.log(`[AI_QUERY] User: ${userId}, Company: ${companyId}, Query: ${query.substring(0, 100)}...`);
      
      // In a production environment, you might want to send this to a logging service
      // like CloudWatch, Datadog, or store in a separate analytics database
    } catch (error) {
      console.error('Error logging AI query:', error);
    }
    
    return originalSend.call(this, data);
  };

  next();
};

// Check user permissions for AI queries
export const checkAIQueryPermissions = (req: Request, res: Response, next: NextFunction): Response | void => {
  try {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({
        error: 'Authentication required'
      });
    }

    // Check if user's account is active
    if (!user.isActive) {
      return res.status(403).json({
        error: 'Account is inactive'
      });
    }

    // Check if user has verified their email
    if (!user.emailVerified) {
      return res.status(403).json({
        error: 'Email verification required'
      });
    }

    // Check if user's company is active
    if (user.company && !user.company.isActive) {
      return res.status(403).json({
        error: 'Company account is inactive'
      });
    }

    // Check subscription limits (if applicable)
    if (user.company?.subscriptionTier === 'FREE') {
      // For free tier, you might want to add additional restrictions
      // This is just an example - adjust based on your business logic
      const dailyLimit = 50;
      
      // In a real implementation, you'd check against a Redis cache or database
      // to track daily usage per user/company
    }

    next();
  } catch (error) {
    return res.status(500).json({
      error: 'Permission check failed'
    });
  }
};

// Security headers specifically for AI query endpoints
export const aiQuerySecurityHeaders = (req: Request, res: Response, next: NextFunction): void => {
  // Prevent caching of AI query responses
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block'
  });

  next();
};

// Combine all AI query middlewares
export const aiQueryMiddlewares = [
  aiQuerySecurityHeaders,
  aiQueryRateLimit,
  checkAIQueryPermissions,
  validateAIQueryInput,
  logAIQuery
];

// Combine all connection management middlewares
export const connectionManagementMiddlewares = [
  connectionManagementRateLimit,
  checkAIQueryPermissions, // Same permission check
  validateConnectionConfig,
  sanitizeConnectionConfig
];