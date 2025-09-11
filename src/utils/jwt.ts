// const jwt = require('jsonwebtoken');
import { config } from '../config/environment';
import { JWTPayload, User, AuthTokens, UserRole } from '../types/auth';

export class JWTService {
  private static readonly ACCESS_TOKEN_SECRET = config.jwt.secret;
  private static readonly REFRESH_TOKEN_SECRET = config.jwt.secret + '_refresh';

  static generateTokens(user: User): AuthTokens {
    // Temporary stub - replace with working JWT later
    return {
      accessToken: 'temp_access_token',
      refreshToken: 'temp_refresh_token',
      expiresIn: 3600,
    };
  }

  static verifyAccessToken(token: string): JWTPayload {
    // Temporary stub
    return {
      userId: 'temp_user_id',
      companyId: 'temp_company_id',
      role: UserRole.COMPANY_ADMIN,
      email: 'temp@example.com',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
    };
  }

  static verifyRefreshToken(token: string): JWTPayload {
    // Temporary stub
    return {
      userId: 'temp_user_id',
      companyId: 'temp_company_id',
      role: UserRole.COMPANY_ADMIN,
      email: 'temp@example.com',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
    };
  }

  static extractTokenFromHeader(authorization?: string): string | null {
    if (!authorization || !authorization.startsWith('Bearer ')) {
      return null;
    }
    return authorization.slice(7);
  }
}