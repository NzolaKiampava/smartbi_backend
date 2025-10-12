"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.managementResolvers = void 0;
const management_service_1 = require("../services/management.service");
const auth_1 = require("../types/auth");
exports.managementResolvers = {
    Query: {
        companies: async (_, { pagination }, context) => {
            try {
                if (!context.isAuthenticated) {
                    throw new Error('Authentication required');
                }
                if (context.user?.role !== auth_1.UserRole.SUPER_ADMIN) {
                    throw new Error('Insufficient permissions');
                }
                const result = await management_service_1.ManagementService.getCompanies(pagination);
                return {
                    success: true,
                    data: result,
                };
            }
            catch (error) {
                return {
                    success: false,
                    message: error instanceof Error ? error.message : 'Failed to fetch companies',
                    errors: [error instanceof Error ? error.message : 'Unknown error'],
                };
            }
        },
        company: async (_, { id }, context) => {
            try {
                if (!context.isAuthenticated) {
                    throw new Error('Authentication required');
                }
                if (context.user?.role !== auth_1.UserRole.SUPER_ADMIN && context.company?.id !== id) {
                    throw new Error('Insufficient permissions');
                }
                const company = await management_service_1.ManagementService.getCompanyById(id);
                return {
                    success: true,
                    data: company,
                };
            }
            catch (error) {
                return {
                    success: false,
                    message: error instanceof Error ? error.message : 'Failed to fetch company',
                    errors: [error instanceof Error ? error.message : 'Unknown error'],
                };
            }
        },
        companyBySlug: async (_, { slug }, context) => {
            try {
                if (!context.isAuthenticated) {
                    throw new Error('Authentication required');
                }
                const company = await management_service_1.ManagementService.getCompanyBySlug(slug);
                if (context.user?.role !== auth_1.UserRole.SUPER_ADMIN && context.company?.id !== company.id) {
                    throw new Error('Insufficient permissions');
                }
                return {
                    success: true,
                    data: company,
                };
            }
            catch (error) {
                return {
                    success: false,
                    message: error instanceof Error ? error.message : 'Failed to fetch company',
                    errors: [error instanceof Error ? error.message : 'Unknown error'],
                };
            }
        },
        users: async (_, { pagination }, context) => {
            try {
                if (!context.isAuthenticated) {
                    throw new Error('Authentication required');
                }
                if (context.user?.role !== auth_1.UserRole.SUPER_ADMIN) {
                    throw new Error('Insufficient permissions');
                }
                const result = await management_service_1.ManagementService.getUsers(pagination);
                return {
                    success: true,
                    data: result,
                };
            }
            catch (error) {
                return {
                    success: false,
                    message: error instanceof Error ? error.message : 'Failed to fetch users',
                    errors: [error instanceof Error ? error.message : 'Unknown error'],
                };
            }
        },
        user: async (_, { id }, context) => {
            try {
                if (!context.isAuthenticated) {
                    throw new Error('Authentication required');
                }
                const user = await management_service_1.ManagementService.getUserById(id);
                const canView = context.user?.id === id ||
                    (context.user?.role === auth_1.UserRole.COMPANY_ADMIN && context.company?.id === user.companyId) ||
                    context.user?.role === auth_1.UserRole.SUPER_ADMIN;
                if (!canView) {
                    throw new Error('Insufficient permissions');
                }
                return {
                    success: true,
                    data: user,
                };
            }
            catch (error) {
                return {
                    success: false,
                    message: error instanceof Error ? error.message : 'Failed to fetch user',
                    errors: [error instanceof Error ? error.message : 'Unknown error'],
                };
            }
        },
        usersByCompany: async (_, { companyId, pagination }, context) => {
            try {
                if (!context.isAuthenticated) {
                    throw new Error('Authentication required');
                }
                const canView = context.user?.role === auth_1.UserRole.SUPER_ADMIN ||
                    (context.company?.id === companyId &&
                        [auth_1.UserRole.COMPANY_ADMIN, auth_1.UserRole.MANAGER].includes(context.user?.role));
                if (!canView) {
                    throw new Error('Insufficient permissions');
                }
                const result = await management_service_1.ManagementService.getUsersByCompany(companyId, pagination);
                return {
                    success: true,
                    data: result,
                };
            }
            catch (error) {
                return {
                    success: false,
                    message: error instanceof Error ? error.message : 'Failed to fetch users',
                    errors: [error instanceof Error ? error.message : 'Unknown error'],
                };
            }
        },
    },
    Mutation: {
        createUser: async (_, { input }, context) => {
            try {
                if (!context.isAuthenticated) {
                    throw new Error('Authentication required');
                }
                const canCreate = context.user?.role === auth_1.UserRole.SUPER_ADMIN ||
                    context.user?.role === auth_1.UserRole.COMPANY_ADMIN;
                if (!canCreate) {
                    throw new Error('Insufficient permissions');
                }
                const companyId = context.company?.id;
                if (!companyId) {
                    throw new Error('Company context not found');
                }
                const user = await management_service_1.ManagementService.createUser({
                    ...input,
                    companyId,
                });
                return {
                    success: true,
                    data: user,
                    message: 'User created successfully',
                };
            }
            catch (error) {
                return {
                    success: false,
                    message: error instanceof Error ? error.message : 'Failed to create user',
                    errors: [error instanceof Error ? error.message : 'Unknown error'],
                };
            }
        },
        updateUser: async (_, { id, input }, context) => {
            try {
                if (!context.isAuthenticated) {
                    throw new Error('Authentication required');
                }
                const targetUser = await management_service_1.ManagementService.getUserById(id);
                const canUpdate = context.user?.role === auth_1.UserRole.SUPER_ADMIN ||
                    (context.user?.role === auth_1.UserRole.COMPANY_ADMIN && context.company?.id === targetUser.companyId);
                if (!canUpdate) {
                    throw new Error('Insufficient permissions');
                }
                const user = await management_service_1.ManagementService.updateUser(id, input);
                return {
                    success: true,
                    data: user,
                    message: 'User updated successfully',
                };
            }
            catch (error) {
                return {
                    success: false,
                    message: error instanceof Error ? error.message : 'Failed to update user',
                    errors: [error instanceof Error ? error.message : 'Unknown error'],
                };
            }
        },
        updateUserSettings: async (_, { input }, context) => {
            try {
                if (!context.isAuthenticated || !context.user) {
                    throw new Error('Authentication required');
                }
                const user = await management_service_1.ManagementService.updateUserSettings(context.user.id, input);
                return {
                    success: true,
                    data: user,
                    message: 'User settings updated successfully',
                };
            }
            catch (error) {
                return {
                    success: false,
                    message: error instanceof Error ? error.message : 'Failed to update user settings',
                    errors: [error instanceof Error ? error.message : 'Unknown error'],
                };
            }
        },
        deleteUser: async (_, { id }, context) => {
            try {
                if (!context.isAuthenticated) {
                    throw new Error('Authentication required');
                }
                const targetUser = await management_service_1.ManagementService.getUserById(id);
                const canDelete = context.user?.role === auth_1.UserRole.SUPER_ADMIN ||
                    (context.user?.role === auth_1.UserRole.COMPANY_ADMIN && context.company?.id === targetUser.companyId);
                if (!canDelete) {
                    throw new Error('Insufficient permissions');
                }
                if (context.user?.id === id) {
                    throw new Error('Cannot delete your own account');
                }
                const user = await management_service_1.ManagementService.deleteUser(id);
                return {
                    success: true,
                    data: user,
                    message: 'User deleted successfully',
                };
            }
            catch (error) {
                return {
                    success: false,
                    message: error instanceof Error ? error.message : 'Failed to delete user',
                    errors: [error instanceof Error ? error.message : 'Unknown error'],
                };
            }
        },
        updateCompany: async (_, { id, input }, context) => {
            try {
                if (!context.isAuthenticated) {
                    throw new Error('Authentication required');
                }
                const canUpdate = context.user?.role === auth_1.UserRole.SUPER_ADMIN ||
                    (context.user?.role === auth_1.UserRole.COMPANY_ADMIN && context.company?.id === id);
                if (!canUpdate) {
                    throw new Error('Insufficient permissions');
                }
                const company = await management_service_1.ManagementService.updateCompany(id, input);
                return {
                    success: true,
                    data: company,
                    message: 'Company updated successfully',
                };
            }
            catch (error) {
                return {
                    success: false,
                    message: error instanceof Error ? error.message : 'Failed to update company',
                    errors: [error instanceof Error ? error.message : 'Unknown error'],
                };
            }
        },
        deleteCompany: async (_, { id }, context) => {
            try {
                if (!context.isAuthenticated) {
                    throw new Error('Authentication required');
                }
                if (context.user?.role !== auth_1.UserRole.SUPER_ADMIN) {
                    throw new Error('Insufficient permissions');
                }
                const company = await management_service_1.ManagementService.deleteCompany(id);
                return {
                    success: true,
                    data: company,
                    message: 'Company deleted successfully',
                };
            }
            catch (error) {
                return {
                    success: false,
                    message: error instanceof Error ? error.message : 'Failed to delete company',
                    errors: [error instanceof Error ? error.message : 'Unknown error'],
                };
            }
        },
        changeUserRole: async (_, { userId, role }, context) => {
            try {
                if (!context.isAuthenticated) {
                    throw new Error('Authentication required');
                }
                const targetUser = await management_service_1.ManagementService.getUserById(userId);
                const canChangeRole = context.user?.role === auth_1.UserRole.SUPER_ADMIN ||
                    (context.user?.role === auth_1.UserRole.COMPANY_ADMIN && context.company?.id === targetUser.companyId);
                if (!canChangeRole) {
                    throw new Error('Insufficient permissions');
                }
                const user = await management_service_1.ManagementService.changeUserRole(userId, role);
                return {
                    success: true,
                    data: user,
                    message: 'User role updated successfully',
                };
            }
            catch (error) {
                return {
                    success: false,
                    message: error instanceof Error ? error.message : 'Failed to change user role',
                    errors: [error instanceof Error ? error.message : 'Unknown error'],
                };
            }
        },
        deactivateUser: async (_, { userId }, context) => {
            try {
                if (!context.isAuthenticated) {
                    throw new Error('Authentication required');
                }
                if (context.user?.id === userId) {
                    throw new Error('Cannot deactivate your own account');
                }
                const targetUser = await management_service_1.ManagementService.getUserById(userId);
                const canDeactivate = context.user?.role === auth_1.UserRole.SUPER_ADMIN ||
                    (context.user?.role === auth_1.UserRole.COMPANY_ADMIN && context.company?.id === targetUser.companyId);
                if (!canDeactivate) {
                    throw new Error('Insufficient permissions');
                }
                const user = await management_service_1.ManagementService.deactivateUser(userId);
                return {
                    success: true,
                    data: user,
                    message: 'User deactivated successfully',
                };
            }
            catch (error) {
                return {
                    success: false,
                    message: error instanceof Error ? error.message : 'Failed to deactivate user',
                    errors: [error instanceof Error ? error.message : 'Unknown error'],
                };
            }
        },
        activateUser: async (_, { userId }, context) => {
            try {
                if (!context.isAuthenticated) {
                    throw new Error('Authentication required');
                }
                const targetUser = await management_service_1.ManagementService.getUserById(userId);
                const canActivate = context.user?.role === auth_1.UserRole.SUPER_ADMIN ||
                    (context.user?.role === auth_1.UserRole.COMPANY_ADMIN && context.company?.id === targetUser.companyId);
                if (!canActivate) {
                    throw new Error('Insufficient permissions');
                }
                const user = await management_service_1.ManagementService.activateUser(userId);
                return {
                    success: true,
                    data: user,
                    message: 'User activated successfully',
                };
            }
            catch (error) {
                return {
                    success: false,
                    message: error instanceof Error ? error.message : 'Failed to activate user',
                    errors: [error instanceof Error ? error.message : 'Unknown error'],
                };
            }
        },
    },
};
//# sourceMappingURL=management.resolvers.js.map