import { GraphQLContext } from '../types/graphql';
import { UpdateUserInput, UpdateCompanyInput, UpdateUserSettingsInput, PaginationInput } from '../services/management.service';
import { UserRole } from '../types/auth';
export declare const managementResolvers: {
    Query: {
        companies: (_: any, { pagination }: {
            pagination?: PaginationInput;
        }, context: GraphQLContext) => Promise<{
            success: boolean;
            data: {
                companies: import("../types/auth").Company[];
                total: number;
                hasMore: boolean;
            };
            message?: undefined;
            errors?: undefined;
        } | {
            success: boolean;
            message: string;
            errors: string[];
            data?: undefined;
        }>;
        company: (_: any, { id }: {
            id: string;
        }, context: GraphQLContext) => Promise<{
            success: boolean;
            data: import("../types/auth").Company;
            message?: undefined;
            errors?: undefined;
        } | {
            success: boolean;
            message: string;
            errors: string[];
            data?: undefined;
        }>;
        companyBySlug: (_: any, { slug }: {
            slug: string;
        }, context: GraphQLContext) => Promise<{
            success: boolean;
            data: import("../types/auth").Company;
            message?: undefined;
            errors?: undefined;
        } | {
            success: boolean;
            message: string;
            errors: string[];
            data?: undefined;
        }>;
        users: (_: any, { pagination }: {
            pagination?: PaginationInput;
        }, context: GraphQLContext) => Promise<{
            success: boolean;
            data: {
                users: import("../types/auth").User[];
                total: number;
                hasMore: boolean;
            };
            message?: undefined;
            errors?: undefined;
        } | {
            success: boolean;
            message: string;
            errors: string[];
            data?: undefined;
        }>;
        user: (_: any, { id }: {
            id: string;
        }, context: GraphQLContext) => Promise<{
            success: boolean;
            data: import("../types/auth").User;
            message?: undefined;
            errors?: undefined;
        } | {
            success: boolean;
            message: string;
            errors: string[];
            data?: undefined;
        }>;
        usersByCompany: (_: any, { companyId, pagination }: {
            companyId: string;
            pagination?: PaginationInput;
        }, context: GraphQLContext) => Promise<{
            success: boolean;
            data: {
                users: import("../types/auth").User[];
                total: number;
                hasMore: boolean;
            };
            message?: undefined;
            errors?: undefined;
        } | {
            success: boolean;
            message: string;
            errors: string[];
            data?: undefined;
        }>;
    };
    Mutation: {
        createUser: (_: any, { input }: {
            input: {
                email: string;
                firstName: string;
                lastName: string;
                role: UserRole;
                password: string;
            };
        }, context: GraphQLContext) => Promise<{
            success: boolean;
            data: import("../types/auth").User;
            message: string;
            errors?: undefined;
        } | {
            success: boolean;
            message: string;
            errors: string[];
            data?: undefined;
        }>;
        updateUser: (_: any, { id, input }: {
            id: string;
            input: UpdateUserInput;
        }, context: GraphQLContext) => Promise<{
            success: boolean;
            data: import("../types/auth").User;
            message: string;
            errors?: undefined;
        } | {
            success: boolean;
            message: string;
            errors: string[];
            data?: undefined;
        }>;
        updateUserSettings: (_: any, { input }: {
            input: UpdateUserSettingsInput;
        }, context: GraphQLContext) => Promise<{
            success: boolean;
            data: import("../types/auth").User;
            message: string;
            errors?: undefined;
        } | {
            success: boolean;
            message: string;
            errors: string[];
            data?: undefined;
        }>;
        deleteUser: (_: any, { id }: {
            id: string;
        }, context: GraphQLContext) => Promise<{
            success: boolean;
            data: import("../types/auth").User;
            message: string;
            errors?: undefined;
        } | {
            success: boolean;
            message: string;
            errors: string[];
            data?: undefined;
        }>;
        updateCompany: (_: any, { id, input }: {
            id: string;
            input: UpdateCompanyInput;
        }, context: GraphQLContext) => Promise<{
            success: boolean;
            data: import("../types/auth").Company;
            message: string;
            errors?: undefined;
        } | {
            success: boolean;
            message: string;
            errors: string[];
            data?: undefined;
        }>;
        deleteCompany: (_: any, { id }: {
            id: string;
        }, context: GraphQLContext) => Promise<{
            success: boolean;
            data: import("../types/auth").Company;
            message: string;
            errors?: undefined;
        } | {
            success: boolean;
            message: string;
            errors: string[];
            data?: undefined;
        }>;
        changeUserRole: (_: any, { userId, role }: {
            userId: string;
            role: UserRole;
        }, context: GraphQLContext) => Promise<{
            success: boolean;
            data: import("../types/auth").User;
            message: string;
            errors?: undefined;
        } | {
            success: boolean;
            message: string;
            errors: string[];
            data?: undefined;
        }>;
        deactivateUser: (_: any, { userId }: {
            userId: string;
        }, context: GraphQLContext) => Promise<{
            success: boolean;
            data: import("../types/auth").User;
            message: string;
            errors?: undefined;
        } | {
            success: boolean;
            message: string;
            errors: string[];
            data?: undefined;
        }>;
        activateUser: (_: any, { userId }: {
            userId: string;
        }, context: GraphQLContext) => Promise<{
            success: boolean;
            data: import("../types/auth").User;
            message: string;
            errors?: undefined;
        } | {
            success: boolean;
            message: string;
            errors: string[];
            data?: undefined;
        }>;
    };
};
//# sourceMappingURL=management.resolvers.d.ts.map