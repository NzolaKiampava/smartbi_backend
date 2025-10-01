"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ManagementService = void 0;
const database_1 = require("../config/database");
const password_1 = require("../utils/password");
class ManagementService {
    static async getCompanies(pagination = {}) {
        const { limit = 10, offset = 0, search } = pagination;
        let query = database_1.supabase
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
    static async getCompanyById(id) {
        const { data, error } = await database_1.supabase
            .from('companies')
            .select('*')
            .eq('id', id)
            .single();
        if (error || !data) {
            throw new Error('Company not found');
        }
        return this.mapCompanyData(data);
    }
    static async getCompanyBySlug(slug) {
        const { data, error } = await database_1.supabase
            .from('companies')
            .select('*')
            .eq('slug', slug)
            .single();
        if (error || !data) {
            throw new Error('Company not found');
        }
        return this.mapCompanyData(data);
    }
    static async updateCompany(id, input) {
        const updateData = {};
        if (input.name)
            updateData.name = input.name;
        if (input.domain)
            updateData.domain = input.domain;
        if (input.subscriptionTier)
            updateData.subscription_tier = input.subscriptionTier;
        if (input.maxUsers !== undefined)
            updateData.max_users = input.maxUsers;
        if (input.isActive !== undefined)
            updateData.is_active = input.isActive;
        const { data, error } = await database_1.supabase
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
    static async deleteCompany(id) {
        const company = await this.getCompanyById(id);
        const { error } = await database_1.supabase
            .from('companies')
            .delete()
            .eq('id', id);
        if (error) {
            throw new Error(`Failed to delete company: ${error.message}`);
        }
        return company;
    }
    static async getUsers(pagination = {}) {
        const { limit = 10, offset = 0, search } = pagination;
        let query = database_1.supabase
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
    static async getUserById(id) {
        const { data, error } = await database_1.supabase
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
    static async getUsersByCompany(companyId, pagination = {}) {
        const { limit = 10, offset = 0, search } = pagination;
        let query = database_1.supabase
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
    static async updateUser(id, input) {
        const updateData = {};
        if (input.firstName)
            updateData.first_name = input.firstName;
        if (input.lastName)
            updateData.last_name = input.lastName;
        if (input.role)
            updateData.role = input.role;
        if (input.isActive !== undefined)
            updateData.is_active = input.isActive;
        if (input.emailVerified !== undefined)
            updateData.email_verified = input.emailVerified;
        const { data, error } = await database_1.supabase
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
    static async updateUserSettings(userId, input) {
        const updateData = {};
        if (input.firstName)
            updateData.first_name = input.firstName;
        if (input.lastName)
            updateData.last_name = input.lastName;
        if (input.email)
            updateData.email = input.email;
        if (input.newPassword && input.currentPassword) {
            const { data: userData } = await database_1.supabase
                .from('users')
                .select('password_hash')
                .eq('id', userId)
                .single();
            if (!userData) {
                throw new Error('User not found');
            }
            const isCurrentPasswordValid = await password_1.PasswordService.compare(input.currentPassword, userData.password_hash);
            if (!isCurrentPasswordValid) {
                throw new Error('Current password is incorrect');
            }
            updateData.password_hash = await password_1.PasswordService.hash(input.newPassword);
        }
        const { data, error } = await database_1.supabase
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
    static async deleteUser(id) {
        const user = await this.getUserById(id);
        const { error } = await database_1.supabase
            .from('users')
            .delete()
            .eq('id', id);
        if (error) {
            throw new Error(`Failed to delete user: ${error.message}`);
        }
        return user;
    }
    static async changeUserRole(userId, role) {
        return this.updateUser(userId, { role });
    }
    static async deactivateUser(userId) {
        return this.updateUser(userId, { isActive: false });
    }
    static async activateUser(userId) {
        return this.updateUser(userId, { isActive: true });
    }
    static mapUserData(data) {
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
    static mapCompanyData(data) {
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
exports.ManagementService = ManagementService;
//# sourceMappingURL=management.service.js.map