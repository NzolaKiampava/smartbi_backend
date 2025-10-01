import { supabase } from '../config/database';
import { User, Company, LoginInput, RegisterInput, AuthTokens, UserRole, SubscriptionTier } from '../types/auth';
import { JWTService } from '../utils/jwt';
import { PasswordService } from '../utils/password';
import { generateId } from '../utils/uuid';

export class AuthService {
  static async login(input: LoginInput): Promise<{ user: User; company: Company; tokens: AuthTokens }> {
    const { email, password, companySlug } = input;

    // Find user by email
    let query = supabase
      .from('users')
      .select(`
        *,
        companies (*)
      `)
      .eq('email', email.toLowerCase())
      .eq('is_active', true);

    // If company slug is provided, filter by it
    if (companySlug) {
      query = query.eq('companies.slug', companySlug);
    }

    const { data: userData, error: userError } = await query.single();

    if (userError || !userData) {
      throw new Error('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await PasswordService.compare(password, userData.password_hash);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    // Check if company is active
    if (!userData.companies.is_active) {
      throw new Error('Company account is inactive');
    }

    // Update last login
    await supabase
      .from('users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', userData.id);

    const user: User = {
      id: userData.id,
      email: userData.email,
      firstName: userData.first_name,
      lastName: userData.last_name,
      role: userData.role as UserRole,
      companyId: userData.company_id,
      isActive: userData.is_active,
      emailVerified: userData.email_verified,
      lastLoginAt: userData.last_login_at ? new Date(userData.last_login_at) : undefined,
      createdAt: new Date(userData.created_at),
      updatedAt: new Date(userData.updated_at),
    };

    const company: Company = {
      id: userData.companies.id,
      name: userData.companies.name,
      slug: userData.companies.slug,
      domain: userData.companies.domain,
      isActive: userData.companies.is_active,
      subscriptionTier: userData.companies.subscription_tier as SubscriptionTier,
      maxUsers: userData.companies.max_users,
      createdAt: new Date(userData.companies.created_at),
      updatedAt: new Date(userData.companies.updated_at),
    };

    const tokens = JWTService.generateTokens(user);

    return { user, company, tokens };
  }

  static async register(input: RegisterInput): Promise<{ user: User; company: Company; tokens: AuthTokens }> {
    const { email, password, firstName, lastName, companyName, companySlug } = input;

    // Validate password strength
    const passwordValidation = PasswordService.validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      throw new Error(`Password validation failed: ${passwordValidation.errors.join(', ')}`);
    }

    // Check if email already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (existingUser) {
      throw new Error('Email already registered');
    }

    // Check if company slug already exists
    const { data: existingCompany } = await supabase
      .from('companies')
      .select('id')
      .eq('slug', companySlug.toLowerCase())
      .single();

    if (existingCompany) {
      throw new Error('Company slug already taken');
    }

    // Hash password
    const passwordHash = await PasswordService.hash(password);

    // Create company first
  const companyId = generateId();
    const { data: companyData, error: companyError } = await supabase
      .from('companies')
      .insert({
        id: companyId,
        name: companyName,
        slug: companySlug.toLowerCase(),
        subscription_tier: SubscriptionTier.FREE,
        max_users: 5, // Free tier limit
        is_active: true,
      })
      .select()
      .single();

    if (companyError || !companyData) {
      throw new Error('Failed to create company');
    }

    // Create user as company admin
  const userId = generateId();
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert({
        id: userId,
        email: email.toLowerCase(),
        password_hash: passwordHash,
        first_name: firstName,
        last_name: lastName,
        role: UserRole.COMPANY_ADMIN,
        company_id: companyId,
        is_active: true,
        email_verified: false,
      })
      .select()
      .single();

    if (userError || !userData) {
      // Rollback company creation
      await supabase.from('companies').delete().eq('id', companyId);
      throw new Error('Failed to create user');
    }

    const user: User = {
      id: userData.id,
      email: userData.email,
      firstName: userData.first_name,
      lastName: userData.last_name,
      role: userData.role as UserRole,
      companyId: userData.company_id,
      isActive: userData.is_active,
      emailVerified: userData.email_verified,
      createdAt: new Date(userData.created_at),
      updatedAt: new Date(userData.updated_at),
    };

    const company: Company = {
      id: companyData.id,
      name: companyData.name,
      slug: companyData.slug,
      domain: companyData.domain,
      isActive: companyData.is_active,
      subscriptionTier: companyData.subscription_tier as SubscriptionTier,
      maxUsers: companyData.max_users,
      createdAt: new Date(companyData.created_at),
      updatedAt: new Date(companyData.updated_at),
    };

    const tokens = JWTService.generateTokens(user);

    return { user, company, tokens };
  }

  static async refreshToken(refreshToken: string): Promise<AuthTokens> {
    const payload = JWTService.verifyRefreshToken(refreshToken);
    if (!payload) {
      throw new Error('Invalid refresh token');
    }

    // Verify user still exists and is active
    const { data: userData, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', payload.userId)
      .eq('is_active', true)
      .single();

    if (error || !userData) {
      throw new Error('User not found or inactive');
    }

    const user: User = {
      id: userData.id,
      email: userData.email,
      firstName: userData.first_name,
      lastName: userData.last_name,
      role: userData.role as UserRole,
      companyId: userData.company_id,
      isActive: userData.is_active,
      emailVerified: userData.email_verified,
      lastLoginAt: userData.last_login_at ? new Date(userData.last_login_at) : undefined,
      createdAt: new Date(userData.created_at),
      updatedAt: new Date(userData.updated_at),
    };

    return JWTService.generateTokens(user);
  }

  static async getUserById(userId: string): Promise<{ user: User; company: Company } | null> {
    const { data, error } = await supabase
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

    const user: User = {
      id: data.id,
      email: data.email,
      firstName: data.first_name,
      lastName: data.last_name,
      role: data.role as UserRole,
      companyId: data.company_id,
      isActive: data.is_active,
      emailVerified: data.email_verified,
      lastLoginAt: data.last_login_at ? new Date(data.last_login_at) : undefined,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };

    const company: Company = {
      id: data.companies.id,
      name: data.companies.name,
      slug: data.companies.slug,
      domain: data.companies.domain,
      isActive: data.companies.is_active,
      subscriptionTier: data.companies.subscription_tier as SubscriptionTier,
      maxUsers: data.companies.max_users,
      createdAt: new Date(data.companies.created_at),
      updatedAt: new Date(data.companies.updated_at),
    };

    return { user, company };
  }
}