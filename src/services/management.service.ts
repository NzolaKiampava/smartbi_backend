import { supabase } from '../config/database';
import { User, Company, UserRole, SubscriptionTier } from '../types/auth';
import { PasswordService } from '../utils/password';

export interface UpdateUserInput {
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  isActive?: boolean;
  emailVerified?: boolean;
}

export interface UpdateCompanyInput {
  name?: string;
  domain?: string;
  subscriptionTier?: SubscriptionTier;
  maxUsers?: number;
  isActive?: boolean;
}

export interface UpdateUserSettingsInput {
  firstName?: string;
  lastName?: string;
  email?: string;
  currentPassword?: string;
  newPassword?: string;
}

export interface PaginationInput {
  limit?: number;
  offset?: number;
  search?: string;
}

export class ManagementService {
  // Company Management
  static async getCompanies(pagination: PaginationInput = {}) {
    const { limit = 10, offset = 0, search } = pagination;
    
    let query = supabase
      .from('companies')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (search) {
      query = query.or(`name.ilike.%${search}%,slug.ilike.%${search}%`);
    }

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Failed to fetch companies: ${error.message}`);
    }

    return {
      companies: (data || []).map(company => this.mapCompanyData(company)),
      total: count || 0,
      hasMore: (count || 0) > offset + limit,
    };
  }

  static async getCompanyById(id: string): Promise<Company> {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new Error('Company not found');
    }

    return this.mapCompanyData(data);
  }

  static async getCompanyBySlug(slug: string): Promise<Company> {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error || !data) {
      throw new Error('Company not found');
    }

    return this.mapCompanyData(data);
  }

  static async updateCompany(id: string, input: UpdateCompanyInput): Promise<Company> {
    const updateData: any = {};
    
    if (input.name) updateData.name = input.name;
    if (input.domain) updateData.domain = input.domain;
    if (input.subscriptionTier) updateData.subscription_tier = input.subscriptionTier;
    if (input.maxUsers !== undefined) updateData.max_users = input.maxUsers;
    if (input.isActive !== undefined) updateData.is_active = input.isActive;

    const { data, error } = await supabase
      .from('companies')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Failed to update company: ${error?.message || 'Unknown error'}`);
    }

    return this.mapCompanyData(data);
  }

  static async deleteCompany(id: string): Promise<Company> {
    // First get the company data
    const company = await this.getCompanyById(id);
    
    // Delete the company (users will be cascade deleted)
    const { error } = await supabase
      .from('companies')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete company: ${error.message}`);
    }

    return company;
  }

  // User Management
  static async getUsers(pagination: PaginationInput = {}) {
    const { limit = 10, offset = 0, search } = pagination;
    
    let query = supabase
      .from('users')
      .select(`
        *,
        companies (*)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (search) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Failed to fetch users: ${error.message}`);
    }

    return {
      users: (data || []).map(this.mapUserData),
      total: count || 0,
      hasMore: (count || 0) > offset + limit,
    };
  }

  static async getUserById(id: string): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .select(`
        *,
        companies (*)
      `)
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new Error('User not found');
    }

    return this.mapUserData(data);
  }

  static async getUsersByCompany(companyId: string, pagination: PaginationInput = {}) {
    const { limit = 10, offset = 0, search } = pagination;
    
    let query = supabase
      .from('users')
      .select(`
        *,
        companies (*)
      `, { count: 'exact' })
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (search) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Failed to fetch users: ${error.message}`);
    }

    return {
      users: (data || []).map(this.mapUserData),
      total: count || 0,
      hasMore: (count || 0) > offset + limit,
    };
  }

  static async updateUser(id: string, input: UpdateUserInput): Promise<User> {
    const updateData: any = {};
    
    if (input.firstName) updateData.first_name = input.firstName;
    if (input.lastName) updateData.last_name = input.lastName;
    if (input.role) updateData.role = input.role;
    if (input.isActive !== undefined) updateData.is_active = input.isActive;
    if (input.emailVerified !== undefined) updateData.email_verified = input.emailVerified;

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        companies (*)
      `)
      .single();

    if (error || !data) {
      throw new Error(`Failed to update user: ${error?.message || 'Unknown error'}`);
    }

    return this.mapUserData(data);
  }

  static async updateUserSettings(userId: string, input: UpdateUserSettingsInput): Promise<User> {
    const updateData: any = {};
    
    // Update basic fields
    if (input.firstName) updateData.first_name = input.firstName;
    if (input.lastName) updateData.last_name = input.lastName;
    if (input.email) updateData.email = input.email;

    // Handle password update
    if (input.newPassword && input.currentPassword) {
      // First verify current password
      const { data: userData } = await supabase
        .from('users')
        .select('password_hash')
        .eq('id', userId)
        .single();

      if (!userData) {
        throw new Error('User not found');
      }

      const isCurrentPasswordValid = await PasswordService.compare(
        input.currentPassword,
        userData.password_hash
      );

      if (!isCurrentPasswordValid) {
        throw new Error('Current password is incorrect');
      }

      // Hash new password
      updateData.password_hash = await PasswordService.hash(input.newPassword);
    }

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select(`
        *,
        companies (*)
      `)
      .single();

    if (error || !data) {
      throw new Error(`Failed to update user settings: ${error?.message || 'Unknown error'}`);
    }

    return this.mapUserData(data);
  }

  static async deleteUser(id: string): Promise<User> {
    // First get the user data
    const user = await this.getUserById(id);
    
    // Delete the user
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete user: ${error.message}`);
    }

    return user;
  }

  static async changeUserRole(userId: string, role: UserRole): Promise<User> {
    return this.updateUser(userId, { role });
  }

  static async deactivateUser(userId: string): Promise<User> {
    return this.updateUser(userId, { isActive: false });
  }

  static async activateUser(userId: string): Promise<User> {
    return this.updateUser(userId, { isActive: true });
  }

  // Helper methods
  private static mapUserData(data: any): User {
    return {
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
  }

  private static mapCompanyData(data: any): Company {
    return {
      id: data.id,
      name: data.name,
      slug: data.slug,
      domain: data.domain,
      isActive: data.is_active,
      subscriptionTier: data.subscription_tier,
      maxUsers: data.max_users,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }
}
