"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createGraphQLContext = exports.requireRole = exports.requireAuth = exports.authMiddleware = void 0;
const jwt_1 = require("../utils/jwt");
const auth_service_1 = require("../services/auth.service");
const supabase_js_1 = require("@supabase/supabase-js");
const authMiddleware = async (req, res, next) => {
    try {
        const token = jwt_1.JWTService.extractTokenFromHeader(req.headers.authorization);
        if (!token) {
            return next();
        }
        const payload = jwt_1.JWTService.verifyAccessToken(token);
        if (!payload) {
            return next();
        }
        const result = await auth_service_1.AuthService.getUserById(payload.userId);
        if (result) {
            req.user = result.user;
            req.company = result.company;
        }
        next();
    }
    catch (error) {
        next();
    }
};
exports.authMiddleware = authMiddleware;
const requireAuth = (req, res, next) => {
    if (!req.user) {
        res.status(401).json({
            success: false,
            message: 'Authentication required',
        });
        return;
    }
    next();
};
exports.requireAuth = requireAuth;
const requireRole = (roles) => {
    return (req, res, next) => {
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
exports.requireRole = requireRole;
const createGraphQLContext = (req, res) => {
    let supabaseClient = undefined;
    try {
        if (req && req.app && req.app.locals && req.app.locals.supabase) {
            supabaseClient = req.app.locals.supabase;
        }
        else if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
            supabaseClient = (0, supabase_js_1.createClient)(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
            try {
                req.app = req.app || {};
                req.app.locals = req.app.locals || {};
                req.app.locals.supabase = supabaseClient;
            }
            catch (e) { }
        }
    }
    catch (e) {
        console.warn('Could not create supabase client in serverless context:', e);
    }
    return {
        user: req.user,
        company: req.company,
        isAuthenticated: !!req.user,
        req,
        res,
    };
};
exports.createGraphQLContext = createGraphQLContext;
//# sourceMappingURL=auth.middleware.js.map