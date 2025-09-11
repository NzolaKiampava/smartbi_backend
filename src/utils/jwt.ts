import jwt from 'jsonwebtoken';
import { config } from '../config/environment';
import { JWTPayload, User, AuthTokens, UserRole } from '../types/auth';

export class JWTService {
  private static readonly ACCESS_TOKEN_SECRET = config.jwt.secret;
  private static readonly REFRESH_TOKEN_SECRET = config.jwt.secret + '_refresh';
  private static readonly ACCESS_TOKEN_EXPIRES_IN = config.jwt.expiresIn;
  private static readonly REFRESH_TOKEN_EXPIRES_IN = config.jwt.refreshExpiresIn;

  static generateTokens(user: User): AuthTokens {
    const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
      userId: user.id,
      companyId: user.companyId,
      role: user.role,
      email: user.email,
    };

    const accessToken = jwt.sign(payload, this.ACCESS_TOKEN_SECRET, {
      expiresIn: this.ACCESS_TOKEN_EXPIRES_IN,
    } as jwt.SignOptions);

    const refreshToken = jwt.sign(payload, this.REFRESH_TOKEN_SECRET, {
      expiresIn: this.REFRESH_TOKEN_EXPIRES_IN,
    } as jwt.SignOptions);

    // Calculate expiration time in seconds
    const expiresIn = this.parseExpirationTime(this.ACCESS_TOKEN_EXPIRES_IN);

    return {
      accessToken,
      refreshToken,
      expiresIn,
    };
  }

  static verifyAccessToken(token: string): JWTPayload {
    try {
      const decoded = jwt.verify(token, this.ACCESS_TOKEN_SECRET) as JWTPayload;
      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Token has expired');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid token');
      } else {
        throw new Error('Token verification failed');
      }
    }
  }

  static verifyRefreshToken(token: string): JWTPayload {
    try {
      const decoded = jwt.verify(token, this.REFRESH_TOKEN_SECRET) as JWTPayload;
      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Refresh token has expired');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid refresh token');
      } else {
        throw new Error('Refresh token verification failed');
      }
    }
  }

  static refreshAccessToken(refreshToken: string): AuthTokens {
    try {
      const decoded = this.verifyRefreshToken(refreshToken);
      
      // Create a new user object for token generation
      const user: User = {
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
    } catch (error) {
      throw new Error('Failed to refresh token: ' + (error as Error).message);
    }
  }

  private static parseExpirationTime(expirationString: string): number {
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

  static extractTokenFromHeader(authorization?: string): string | null {
    if (!authorization || !authorization.startsWith('Bearer ')) {
      return null;
    }
    return authorization.slice(7);
  }
}