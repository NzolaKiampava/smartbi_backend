export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    companyId: string;
    isActive: boolean;
    emailVerified: boolean;
    lastLoginAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export interface Company {
    id: string;
    name: string;
    slug: string;
    domain?: string;
    isActive: boolean;
    subscriptionTier: SubscriptionTier;
    maxUsers: number;
    createdAt: Date;
    updatedAt: Date;
}
export declare enum UserRole {
    SUPER_ADMIN = "SUPER_ADMIN",
    COMPANY_ADMIN = "COMPANY_ADMIN",
    MANAGER = "MANAGER",
    ANALYST = "ANALYST",
    VIEWER = "VIEWER"
}
export declare enum SubscriptionTier {
    FREE = "FREE",
    BASIC = "BASIC",
    PROFESSIONAL = "PROFESSIONAL",
    ENTERPRISE = "ENTERPRISE"
}
export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}
export interface LoginInput {
    email: string;
    password: string;
    companySlug?: string;
}
export interface RegisterInput {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    companyName: string;
    companySlug: string;
}
export interface AuthContext {
    user?: User;
    company?: Company;
    isAuthenticated: boolean;
}
export interface JWTPayload {
    userId: string;
    companyId: string;
    role: UserRole;
    email: string;
    iat: number;
    exp: number;
}
//# sourceMappingURL=auth.d.ts.map