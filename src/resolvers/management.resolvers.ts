import { GraphQLContext } from '../types/graphql';
import { ManagementService, UpdateUserInput, UpdateCompanyInput, UpdateUserSettingsInput, PaginationInput } from '../services/management.service';
import { UserRole } from '../types/auth';

export const managementResolvers = {
  Query: {
    // Company Queries
    companies: async (_: any, { pagination }: { pagination?: PaginationInput }, context: GraphQLContext) => {
      try {
        if (!context.isAuthenticated) {
          throw new Error('Authentication required');
        }

        // Only SUPER_ADMIN can list all companies
        if (context.user?.role !== UserRole.SUPER_ADMIN) {
          throw new Error('Insufficient permissions');
        }

        const result = await ManagementService.getCompanies(pagination);
        
        return {
          success: true,
          data: result,
        };
      } catch (error) {
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Failed to fetch companies',
          errors: [error instanceof Error ? error.message : 'Unknown error'],
        };
      }
    },

    company: async (_: any, { id }: { id: string }, context: GraphQLContext) => {
      try {
        if (!context.isAuthenticated) {
          throw new Error('Authentication required');
        }

        // Users can only see their own company or super admin can see any
        if (context.user?.role !== UserRole.SUPER_ADMIN && context.company?.id !== id) {
          throw new Error('Insufficient permissions');
        }

        const company = await ManagementService.getCompanyById(id);
        
        return {
          success: true,
          data: company,
        };
      } catch (error) {
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Failed to fetch company',
          errors: [error instanceof Error ? error.message : 'Unknown error'],
        };
      }
    },

    companyBySlug: async (_: any, { slug }: { slug: string }, context: GraphQLContext) => {
      try {
        if (!context.isAuthenticated) {
          throw new Error('Authentication required');
        }

        const company = await ManagementService.getCompanyBySlug(slug);

        // Users can only see their own company or super admin can see any
        if (context.user?.role !== UserRole.SUPER_ADMIN && context.company?.id !== company.id) {
          throw new Error('Insufficient permissions');
        }
        
        return {
          success: true,
          data: company,
        };
      } catch (error) {
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Failed to fetch company',
          errors: [error instanceof Error ? error.message : 'Unknown error'],
        };
      }
    },

    // User Queries
    users: async (_: any, { pagination }: { pagination?: PaginationInput }, context: GraphQLContext) => {
      try {
        if (!context.isAuthenticated) {
          throw new Error('Authentication required');
        }

        // Only SUPER_ADMIN can list all users across companies
        if (context.user?.role !== UserRole.SUPER_ADMIN) {
          throw new Error('Insufficient permissions');
        }

        const result = await ManagementService.getUsers(pagination);
        
        return {
          success: true,
          data: result,
        };
      } catch (error) {
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Failed to fetch users',
          errors: [error instanceof Error ? error.message : 'Unknown error'],
        };
      }
    },

    user: async (_: any, { id }: { id: string }, context: GraphQLContext) => {
      try {
        if (!context.isAuthenticated) {
          throw new Error('Authentication required');
        }

        const user = await ManagementService.getUserById(id);

        // Users can see themselves, company admins can see users in their company, super admin can see anyone
        const canView = 
          context.user?.id === id ||
          (context.user?.role === UserRole.COMPANY_ADMIN && context.company?.id === user.companyId) ||
          context.user?.role === UserRole.SUPER_ADMIN;

        if (!canView) {
          throw new Error('Insufficient permissions');
        }
        
        return {
          success: true,
          data: user,
        };
      } catch (error) {
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Failed to fetch user',
          errors: [error instanceof Error ? error.message : 'Unknown error'],
        };
      }
    },

    usersByCompany: async (_: any, { companyId, pagination }: { companyId: string; pagination?: PaginationInput }, context: GraphQLContext) => {
      try {
        if (!context.isAuthenticated) {
          throw new Error('Authentication required');
        }

        // Users can only see users from their own company (unless super admin)
        const canView = 
          context.user?.role === UserRole.SUPER_ADMIN ||
          (context.company?.id === companyId && 
           [UserRole.COMPANY_ADMIN, UserRole.MANAGER].includes(context.user?.role as UserRole));

        if (!canView) {
          throw new Error('Insufficient permissions');
        }

        const result = await ManagementService.getUsersByCompany(companyId, pagination);
        
        return {
          success: true,
          data: result,
        };
      } catch (error) {
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Failed to fetch users',
          errors: [error instanceof Error ? error.message : 'Unknown error'],
        };
      }
    },
  },

  Mutation: {
    // User Management
    createUser: async (_: any, { input }: { input: { email: string; firstName: string; lastName: string; role: UserRole; password: string } }, context: GraphQLContext) => {
      try {
        if (!context.isAuthenticated) {
          throw new Error('Authentication required');
        }

        // Only company admins (for their company) or super admins can create users
        const canCreate = 
          context.user?.role === UserRole.SUPER_ADMIN ||
          context.user?.role === UserRole.COMPANY_ADMIN;

        if (!canCreate) {
          throw new Error('Insufficient permissions');
        }

        // Use company from context (authenticated user's company)
        const companyId = context.company?.id;
        if (!companyId) {
          throw new Error('Company context not found');
        }

        const user = await ManagementService.createUser({
          ...input,
          companyId,
        });
        
        return {
          success: true,
          data: user,
          message: 'User created successfully',
        };
      } catch (error) {
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Failed to create user',
          errors: [error instanceof Error ? error.message : 'Unknown error'],
        };
      }
    },

    updateUser: async (_: any, { id, input }: { id: string; input: UpdateUserInput }, context: GraphQLContext) => {
      try {
        if (!context.isAuthenticated) {
          throw new Error('Authentication required');
        }

        // Only company admins (for their company) or super admins can update users
        const targetUser = await ManagementService.getUserById(id);
        const canUpdate = 
          context.user?.role === UserRole.SUPER_ADMIN ||
          (context.user?.role === UserRole.COMPANY_ADMIN && context.company?.id === targetUser.companyId);

        if (!canUpdate) {
          throw new Error('Insufficient permissions');
        }

        const user = await ManagementService.updateUser(id, input);
        
        return {
          success: true,
          data: user,
          message: 'User updated successfully',
        };
      } catch (error) {
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Failed to update user',
          errors: [error instanceof Error ? error.message : 'Unknown error'],
        };
      }
    },

    updateUserSettings: async (_: any, { input }: { input: UpdateUserSettingsInput }, context: GraphQLContext) => {
      try {
        if (!context.isAuthenticated || !context.user) {
          throw new Error('Authentication required');
        }

        // Users can only update their own settings
        const user = await ManagementService.updateUserSettings(context.user.id, input);
        
        return {
          success: true,
          data: user,
          message: 'User settings updated successfully',
        };
      } catch (error) {
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Failed to update user settings',
          errors: [error instanceof Error ? error.message : 'Unknown error'],
        };
      }
    },

    deleteUser: async (_: any, { id }: { id: string }, context: GraphQLContext) => {
      try {
        if (!context.isAuthenticated) {
          throw new Error('Authentication required');
        }

        // Only company admins (for their company) or super admins can delete users
        const targetUser = await ManagementService.getUserById(id);
        const canDelete = 
          context.user?.role === UserRole.SUPER_ADMIN ||
          (context.user?.role === UserRole.COMPANY_ADMIN && context.company?.id === targetUser.companyId);

        if (!canDelete) {
          throw new Error('Insufficient permissions');
        }

        // Prevent self-deletion
        if (context.user?.id === id) {
          throw new Error('Cannot delete your own account');
        }

        const user = await ManagementService.deleteUser(id);
        
        return {
          success: true,
          data: user,
          message: 'User deleted successfully',
        };
      } catch (error) {
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Failed to delete user',
          errors: [error instanceof Error ? error.message : 'Unknown error'],
        };
      }
    },

    // Company Management
    updateCompany: async (_: any, { id, input }: { id: string; input: UpdateCompanyInput }, context: GraphQLContext) => {
      try {
        if (!context.isAuthenticated) {
          throw new Error('Authentication required');
        }

        // Only company admins (for their own company) or super admins can update companies
        const canUpdate = 
          context.user?.role === UserRole.SUPER_ADMIN ||
          (context.user?.role === UserRole.COMPANY_ADMIN && context.company?.id === id);

        if (!canUpdate) {
          throw new Error('Insufficient permissions');
        }

        const company = await ManagementService.updateCompany(id, input);
        
        return {
          success: true,
          data: company,
          message: 'Company updated successfully',
        };
      } catch (error) {
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Failed to update company',
          errors: [error instanceof Error ? error.message : 'Unknown error'],
        };
      }
    },

    deleteCompany: async (_: any, { id }: { id: string }, context: GraphQLContext) => {
      try {
        if (!context.isAuthenticated) {
          throw new Error('Authentication required');
        }

        // Only super admins can delete companies
        if (context.user?.role !== UserRole.SUPER_ADMIN) {
          throw new Error('Insufficient permissions');
        }

        const company = await ManagementService.deleteCompany(id);
        
        return {
          success: true,
          data: company,
          message: 'Company deleted successfully',
        };
      } catch (error) {
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Failed to delete company',
          errors: [error instanceof Error ? error.message : 'Unknown error'],
        };
      }
    },

    // Role Management
    changeUserRole: async (_: any, { userId, role }: { userId: string; role: UserRole }, context: GraphQLContext) => {
      try {
        if (!context.isAuthenticated) {
          throw new Error('Authentication required');
        }

        // Only company admins (for their company) or super admins can change roles
        const targetUser = await ManagementService.getUserById(userId);
        const canChangeRole = 
          context.user?.role === UserRole.SUPER_ADMIN ||
          (context.user?.role === UserRole.COMPANY_ADMIN && context.company?.id === targetUser.companyId);

        if (!canChangeRole) {
          throw new Error('Insufficient permissions');
        }

        const user = await ManagementService.changeUserRole(userId, role);
        
        return {
          success: true,
          data: user,
          message: 'User role updated successfully',
        };
      } catch (error) {
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Failed to change user role',
          errors: [error instanceof Error ? error.message : 'Unknown error'],
        };
      }
    },

    deactivateUser: async (_: any, { userId }: { userId: string }, context: GraphQLContext) => {
      try {
        if (!context.isAuthenticated) {
          throw new Error('Authentication required');
        }

        // Prevent self-deactivation
        if (context.user?.id === userId) {
          throw new Error('Cannot deactivate your own account');
        }

        const targetUser = await ManagementService.getUserById(userId);
        const canDeactivate = 
          context.user?.role === UserRole.SUPER_ADMIN ||
          (context.user?.role === UserRole.COMPANY_ADMIN && context.company?.id === targetUser.companyId);

        if (!canDeactivate) {
          throw new Error('Insufficient permissions');
        }

        const user = await ManagementService.deactivateUser(userId);
        
        return {
          success: true,
          data: user,
          message: 'User deactivated successfully',
        };
      } catch (error) {
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Failed to deactivate user',
          errors: [error instanceof Error ? error.message : 'Unknown error'],
        };
      }
    },

    activateUser: async (_: any, { userId }: { userId: string }, context: GraphQLContext) => {
      try {
        if (!context.isAuthenticated) {
          throw new Error('Authentication required');
        }

        const targetUser = await ManagementService.getUserById(userId);
        const canActivate = 
          context.user?.role === UserRole.SUPER_ADMIN ||
          (context.user?.role === UserRole.COMPANY_ADMIN && context.company?.id === targetUser.companyId);

        if (!canActivate) {
          throw new Error('Insufficient permissions');
        }

        const user = await ManagementService.activateUser(userId);
        
        return {
          success: true,
          data: user,
          message: 'User activated successfully',
        };
      } catch (error) {
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Failed to activate user',
          errors: [error instanceof Error ? error.message : 'Unknown error'],
        };
      }
    },
  },
};
