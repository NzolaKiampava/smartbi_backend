import jwt from 'jsonwebtoken';
import { config } from '../config/environment';
import { JWTPayload, User, AuthTokens } from '../types/auth';

export class JWTService {
  private static readonly ACCESS_TOKEN_SECRET = config.jwt.secret;
  private static readonly REFRESH_TOKEN_SECRET = config.jwt.secret + '_refresh';

  static generateTokens(user: User): AuthTokens {
    const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
      userId: user.id,
      companyId: user.companyId,
      role: user.role,
      email: user.email,
    };

    const accessToken = jwt.sign(payload, this.ACCESS_TOKEN_SECRET, {
      expiresIn: config.jwt.expiresIn,
    });

    const refreshToken = jwt.sign(payload, this.REFRESH_TOKEN_SECRET, {
      expiresIn: config.jwt.refreshExpiresIn,
    });

    // Calculate expiration time in seconds
    const decoded = jwt.decode(accessToken) as JWTPayload;
    const expiresIn = decoded.exp - decoded.iat;

    return {
      accessToken,
      refreshToken,
      expiresIn,
    };
  }

  static verifyAccessToken(token: string): JWTPayload | null {
    try {
      return jwt.verify(token, this.ACCESS_TOKEN_SECRET) as JWTPayload;
    } catch (error) {
      return null;
    }
  }

  static verifyRefreshToken(token: string): JWTPayload | null {
    try {
      return jwt.verify(token, this.REFRESH_TOKEN_SECRET) as JWTPayload;
    } catch (error) {
      return null;
    }
  }

  static extractTokenFromHeader(authHeader?: string): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7);
  }
}