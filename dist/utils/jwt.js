"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JWTService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const environment_1 = require("../config/environment");
class JWTService {
    static generateTokens(user) {
        const payload = {
            userId: user.id,
            companyId: user.companyId,
            role: user.role,
            email: user.email,
        };
        const accessToken = jsonwebtoken_1.default.sign(payload, this.ACCESS_TOKEN_SECRET, {
            expiresIn: this.ACCESS_TOKEN_EXPIRES_IN,
        });
        const refreshToken = jsonwebtoken_1.default.sign(payload, this.REFRESH_TOKEN_SECRET, {
            expiresIn: this.REFRESH_TOKEN_EXPIRES_IN,
        });
        const expiresIn = this.parseExpirationTime(this.ACCESS_TOKEN_EXPIRES_IN);
        return {
            accessToken,
            refreshToken,
            expiresIn,
        };
    }
    static verifyAccessToken(token) {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, this.ACCESS_TOKEN_SECRET);
            return decoded;
        }
        catch (error) {
            if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
                throw new Error('Token has expired');
            }
            else if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
                throw new Error('Invalid token');
            }
            else {
                throw new Error('Token verification failed');
            }
        }
    }
    static verifyRefreshToken(token) {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, this.REFRESH_TOKEN_SECRET);
            return decoded;
        }
        catch (error) {
            if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
                throw new Error('Refresh token has expired');
            }
            else if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
                throw new Error('Invalid refresh token');
            }
            else {
                throw new Error('Refresh token verification failed');
            }
        }
    }
    static refreshAccessToken(refreshToken) {
        try {
            const decoded = this.verifyRefreshToken(refreshToken);
            const user = {
                id: decoded.userId,
                email: decoded.email,
                companyId: decoded.companyId,
                role: decoded.role,
                firstName: '',
                lastName: '',
                isActive: true,
                emailVerified: true,
                lastLoginAt: undefined,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            return this.generateTokens(user);
        }
        catch (error) {
            throw new Error('Failed to refresh token: ' + error.message);
        }
    }
    static parseExpirationTime(expirationString) {
        const match = expirationString.match(/^(\d+)([dhms])$/);
        if (!match) {
            throw new Error('Invalid expiration format');
        }
        const value = parseInt(match[1]);
        const unit = match[2];
        switch (unit) {
            case 's':
                return value;
            case 'm':
                return value * 60;
            case 'h':
                return value * 60 * 60;
            case 'd':
                return value * 24 * 60 * 60;
            default:
                throw new Error('Invalid time unit');
        }
    }
    static extractTokenFromHeader(authorization) {
        if (!authorization || !authorization.startsWith('Bearer ')) {
            return null;
        }
        return authorization.slice(7);
    }
}
exports.JWTService = JWTService;
JWTService.ACCESS_TOKEN_SECRET = environment_1.config.jwt.secret;
JWTService.REFRESH_TOKEN_SECRET = environment_1.config.jwt.secret + '_refresh';
JWTService.ACCESS_TOKEN_EXPIRES_IN = environment_1.config.jwt.expiresIn;
JWTService.REFRESH_TOKEN_EXPIRES_IN = environment_1.config.jwt.refreshExpiresIn;
//# sourceMappingURL=jwt.js.map