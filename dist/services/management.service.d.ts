import { User, Company, UserRole, SubscriptionTier } from '../types/auth';
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
export declare class ManagementService {
    static getCompanies(pagination?: PaginationInput): Promise<{
        companies: Company[];
        total: number;
        hasMore: boolean;
    }>;
    static getCompanyById(id: string): Promise<Company>;
    static getCompanyBySlug(slug: string): Promise<Company>;
    static updateCompany(id: string, input: UpdateCompanyInput): Promise<Company>;
    static deleteCompany(id: string): Promise<Company>;
    static getUsers(pagination?: PaginationInput): Promise<{
        users: User[];
        total: number;
        hasMore: boolean;
    }>;
    static getUserById(id: string): Promise<User>;
    static getUsersByCompany(companyId: string, pagination?: PaginationInput): Promise<{
        users: User[];
        total: number;
        hasMore: boolean;
    }>;
    static updateUser(id: string, input: UpdateUserInput): Promise<User>;
    static updateUserSettings(userId: string, input: UpdateUserSettingsInput): Promise<User>;
    static deleteUser(id: string): Promise<User>;
    static changeUserRole(userId: string, role: UserRole): Promise<User>;
    static deactivateUser(userId: string): Promise<User>;
    static activateUser(userId: string): Promise<User>;
    private static mapUserData;
    private static mapCompanyData;
}
//# sourceMappingURL=management.service.d.ts.map