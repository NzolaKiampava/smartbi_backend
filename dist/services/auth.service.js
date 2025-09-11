"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const database_1 = require("../config/database");
const auth_1 = require("../types/auth");
const jwt_1 = require("../utils/jwt");
const password_1 = require("../utils/password");
const uuid_1 = require("uuid");
class AuthService {
    static async login(input) {
        const { email, password, companySlug } = input;
        let query = database_1.supabase
            .from('users')
            .select(`
        *,
        companies (*)
      `)
            .eq('email', email.toLowerCase())
            .eq('is_active', true);
        if (companySlug) {
            query = query.eq('companies.slug', companySlug);
        }
        const { data: userData, error: userError } = await query.single();
        if (userError || !userData) {
            throw new Error('Invalid credentials');
        }
        const isPasswordValid = await password_1.PasswordService.compare(password, userData.password_hash);
        if (!isPasswordValid) {
            throw new Error('Invalid credentials');
        }
        if (!userData.companies.is_active) {
            throw new Error('Company account is inactive');
        }
        await database_1.supabase
            .from('users')
            .update({ last_login_at: new Date().toISOString() })
            .eq('id', userData.id);
        const user = {
            id: userData.id,
            email: userData.email,
            firstName: userData.first_name,
            lastName: userData.last_name,
            role: userData.role,
            companyId: userData.company_id,
            isActive: userData.is_active,
            emailVerified: userData.email_verified,
            lastLoginAt: userData.last_login_at ? new Date(userData.last_login_at) : undefined,
            createdAt: new Date(userData.created_at),
            updatedAt: new Date(userData.updated_at),
        };
        const company = {
            id: userData.companies.id,
            name: userData.companies.name,
            slug: userData.companies.slug,
            domain: userData.companies.domain,
            isActive: userData.companies.is_active,
            subscriptionTier: userData.companies.subscription_tier,
            maxUsers: userData.companies.max_users,
            createdAt: new Date(userData.companies.created_at),
            updatedAt: new Date(userData.companies.updated_at),
        };
        const tokens = jwt_1.JWTService.generateTokens(user);
        return { user, company, tokens };
    }
    static async register(input) {
        const { email, password, firstName, lastName, companyName, companySlug } = input;
        const passwordValidation = password_1.PasswordService.validatePasswordStrength(password);
        if (!passwordValidation.isValid) {
            throw new Error(`Password validation failed: ${passwordValidation.errors.join(', ')}`);
        }
        const { data: existingUser } = await database_1.supabase
            .from('users')
            .select('id')
            .eq('email', email.toLowerCase())
            .single();
        if (existingUser) {
            throw new Error('Email already registered');
        }
        const { data: existingCompany } = await database_1.supabase
            .from('companies')
            .select('id')
            .eq('slug', companySlug.toLowerCase())
            .single();
        if (existingCompany) {
            throw new Error('Company slug already taken');
        }
        const passwordHash = await password_1.PasswordService.hash(password);
        const companyId = (0, uuid_1.v4)();
        const { data: companyData, error: companyError } = await database_1.supabase
            .from('companies')
            .insert({
            id: companyId,
            name: companyName,
            slug: companySlug.toLowerCase(),
            subscription_tier: auth_1.SubscriptionTier.FREE,
            max_users: 5,
            is_active: true,
        })
            .select()
            .single();
        if (companyError || !companyData) {
            throw new Error('Failed to create company');
        }
        const userId = (0, uuid_1.v4)();
        const { data: userData, error: userError } = await database_1.supabase
            .from('users')
            .insert({
            id: userId,
            email: email.toLowerCase(),
            password_hash: passwordHash,
            first_name: firstName,
            last_name: lastName,
            role: auth_1.UserRole.COMPANY_ADMIN,
            company_id: companyId,
            is_active: true,
            email_verified: false,
        })
            .select()
            .single();
        if (userError || !userData) {
            await database_1.supabase.from('companies').delete().eq('id', companyId);
            throw new Error('Failed to create user');
        }
        const user = {
            id: userData.id,
            email: userData.email,
            firstName: userData.first_name,
            lastName: userData.last_name,
            role: userData.role,
            companyId: userData.company_id,
            isActive: userData.is_active,
            emailVerified: userData.email_verified,
            createdAt: new Date(userData.created_at),
            updatedAt: new Date(userData.updated_at),
        };
        const company = {
            id: companyData.id,
            name: companyData.name,
            slug: companyData.slug,
            domain: companyData.domain,
            isActive: companyData.is_active,
            subscriptionTier: companyData.subscription_tier,
            maxUsers: companyData.max_users,
            createdAt: new Date(companyData.created_at),
            updatedAt: new Date(companyData.updated_at),
        };
        const tokens = jwt_1.JWTService.generateTokens(user);
        return { user, company, tokens };
    }
    static async refreshToken(refreshToken) {
        const payload = jwt_1.JWTService.verifyRefreshToken(refreshToken);
        if (!payload) {
            throw new Error('Invalid refresh token');
        }
        const { data: userData, error } = await database_1.supabase
            .from('users')
            .select('*')
            .eq('id', payload.userId)
            .eq('is_active', true)
            .single();
        if (error || !userData) {
            throw new Error('User not found or inactive');
        }
        const user = {
            id: userData.id,
            email: userData.email,
            firstName: userData.first_name,
            lastName: userData.last_name,
            role: userData.role,
            companyId: userData.company_id,
            isActive: userData.is_active,
            emailVerified: userData.email_verified,
            lastLoginAt: userData.last_login_at ? new Date(userData.last_login_at) : undefined,
            createdAt: new Date(userData.created_at),
            updatedAt: new Date(userData.updated_at),
        };
        return jwt_1.JWTService.generateTokens(user);
    }
    static async getUserById(userId) {
        const { data, error } = await database_1.supabase
            .from('users')
            .select(`
        *,
        companies (*)
      `)
            .eq('id', userId)
            .eq('is_active', true)
            .single();
        if (error || !data) {
            return null;
        }
        const user = {
            id: data.id,
            email: data.email,
            firstName: data.first_name,
            lastName: data.last_name,
            role: data.role,
            companyId: data.company_id,
            isActive: data.is_active,
            emailVerified: data.email_verified,
            lastLoginAt: data.last_login_at ? new Date(data.last_login_at) : undefined,
            createdAt: new Date(data.created_at),
            updatedAt: new Date(data.updated_at),
        };
        const company = {
            id: data.companies.id,
            name: data.companies.name,
            slug: data.companies.slug,
            domain: data.companies.domain,
            isActive: data.companies.is_active,
            subscriptionTier: data.companies.subscription_tier,
            maxUsers: data.companies.max_users,
            createdAt: new Date(data.companies.created_at),
            updatedAt: new Date(data.companies.updated_at),
        };
        return { user, company };
    }
}
exports.AuthService = AuthService;
//# sourceMappingURL=auth.service.js.map