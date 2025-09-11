import { JWTPayload, User, AuthTokens } from '../types/auth';
export declare class JWTService {
    private static readonly ACCESS_TOKEN_SECRET;
    private static readonly REFRESH_TOKEN_SECRET;
    private static readonly ACCESS_TOKEN_EXPIRES_IN;
    private static readonly REFRESH_TOKEN_EXPIRES_IN;
    static generateTokens(user: User): AuthTokens;
    static verifyAccessToken(token: string): JWTPayload;
    static verifyRefreshToken(token: string): JWTPayload;
    static refreshAccessToken(refreshToken: string): AuthTokens;
    private static parseExpirationTime;
    static extractTokenFromHeader(authorization?: string): string | null;
}
//# sourceMappingURL=jwt.d.ts.map