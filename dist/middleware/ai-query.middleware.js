"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectionManagementMiddlewares = exports.aiQueryMiddlewares = exports.aiQuerySecurityHeaders = exports.checkAIQueryPermissions = exports.logAIQuery = exports.sanitizeConnectionConfig = exports.validateConnectionConfig = exports.validateAIQueryInput = exports.connectionManagementRateLimit = exports.aiQueryRateLimit = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
exports.aiQueryRateLimit = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000,
    max: 10,
    message: {
        error: 'Too many AI queries from this IP, please try again after a minute.',
        retryAfter: 60
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        return req.user?.id || req.ip || 'unknown';
    }
});
exports.connectionManagementRateLimit = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000,
    max: 20,
    message: {
        error: 'Too many connection management requests from this IP, please try again after a minute.',
        retryAfter: 60
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        return req.user?.id || req.ip || 'unknown';
    }
});
const validateAIQueryInput = (req, res, next) => {
    try {
        const { naturalQuery } = req.body.variables?.input || {};
        if (!naturalQuery || typeof naturalQuery !== 'string') {
            return res.status(400).json({
                error: 'Natural query is required and must be a string'
            });
        }
        if (naturalQuery.length > 1000) {
            return res.status(400).json({
                error: 'Natural query is too long. Maximum 1000 characters allowed.'
            });
        }
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
    }
    catch (error) {
        return res.status(400).json({
            error: 'Invalid request format'
        });
    }
};
exports.validateAIQueryInput = validateAIQueryInput;
const validateConnectionConfig = (req, res, next) => {
    try {
        const { input } = req.body.variables || {};
        if (!input || !input.config) {
            return res.status(400).json({
                error: 'Connection configuration is required'
            });
        }
        const { type, config } = input;
        switch (type) {
            case 'MYSQL':
            case 'POSTGRESQL':
                if (!config.host || !config.username || !config.database) {
                    return res.status(400).json({
                        error: 'Host, username, and database are required for database connections'
                    });
                }
                if (!/^[a-zA-Z0-9.-]+$/.test(config.host)) {
                    return res.status(400).json({
                        error: 'Invalid host format'
                    });
                }
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
                try {
                    new URL(config.apiUrl);
                }
                catch {
                    return res.status(400).json({
                        error: 'Invalid API URL format'
                    });
                }
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
    }
    catch (error) {
        return res.status(400).json({
            error: 'Invalid request format'
        });
    }
};
exports.validateConnectionConfig = validateConnectionConfig;
const sanitizeConnectionConfig = (req, res, next) => {
    try {
        const { input } = req.body.variables || {};
        if (input?.config) {
            const dangerousFields = ['eval', 'exec', 'require', 'import', '__proto__', 'constructor'];
            for (const field of dangerousFields) {
                delete input.config[field];
            }
            if (input.config.headers && Array.isArray(input.config.headers)) {
                input.config.headers = input.config.headers.filter((header) => {
                    return header &&
                        typeof header.key === 'string' &&
                        typeof header.value === 'string' &&
                        header.key.length <= 100 &&
                        header.value.length <= 500;
                });
            }
            if (input.config.timeout) {
                input.config.timeout = Math.min(Math.max(input.config.timeout, 1000), 60000);
            }
        }
        next();
    }
    catch (error) {
        return res.status(400).json({
            error: 'Invalid request format'
        });
    }
};
exports.sanitizeConnectionConfig = sanitizeConnectionConfig;
const logAIQuery = (req, res, next) => {
    const originalSend = res.send;
    res.send = function (data) {
        try {
            const userId = req.user?.id || 'anonymous';
            const companyId = req.user?.companyId || 'unknown';
            const query = req.body.variables?.input?.naturalQuery || 'unknown';
            console.log(`[AI_QUERY] User: ${userId}, Company: ${companyId}, Query: ${query.substring(0, 100)}...`);
        }
        catch (error) {
            console.error('Error logging AI query:', error);
        }
        return originalSend.call(this, data);
    };
    next();
};
exports.logAIQuery = logAIQuery;
const checkAIQueryPermissions = (req, res, next) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({
                error: 'Authentication required'
            });
        }
        if (!user.isActive) {
            return res.status(403).json({
                error: 'Account is inactive'
            });
        }
        if (!user.emailVerified) {
            return res.status(403).json({
                error: 'Email verification required'
            });
        }
        if (user.company && !user.company.isActive) {
            return res.status(403).json({
                error: 'Company account is inactive'
            });
        }
        if (user.company?.subscriptionTier === 'FREE') {
            const dailyLimit = 50;
        }
        next();
    }
    catch (error) {
        return res.status(500).json({
            error: 'Permission check failed'
        });
    }
};
exports.checkAIQueryPermissions = checkAIQueryPermissions;
const aiQuerySecurityHeaders = (req, res, next) => {
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
exports.aiQuerySecurityHeaders = aiQuerySecurityHeaders;
exports.aiQueryMiddlewares = [
    exports.aiQuerySecurityHeaders,
    exports.aiQueryRateLimit,
    exports.checkAIQueryPermissions,
    exports.validateAIQueryInput,
    exports.logAIQuery
];
exports.connectionManagementMiddlewares = [
    exports.connectionManagementRateLimit,
    exports.checkAIQueryPermissions,
    exports.validateConnectionConfig,
    exports.sanitizeConnectionConfig
];
//# sourceMappingURL=ai-query.middleware.js.map