export declare const resolvers: {
    Query: {
        companies: (_: any, { pagination }: {
            pagination?: import("../services/management.service").PaginationInput;
        }, context: import("../types/graphql").GraphQLContext) => Promise<{
            success: boolean;
            data: {
                companies: any[];
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
        }, context: import("../types/graphql").GraphQLContext) => Promise<{
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
        }, context: import("../types/graphql").GraphQLContext) => Promise<{
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
            pagination?: import("../services/management.service").PaginationInput;
        }, context: import("../types/graphql").GraphQLContext) => Promise<{
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
        }, context: import("../types/graphql").GraphQLContext) => Promise<{
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
            pagination?: import("../services/management.service").PaginationInput;
        }, context: import("../types/graphql").GraphQLContext) => Promise<{
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
        me: (_: any, __: any, context: import("../types/graphql").GraphQLContext) => Promise<{
            user: import("../types/auth").User | undefined;
            company: import("../types/auth").Company | undefined;
        }>;
    };
    Mutation: {
        updateUser: (_: any, { id, input }: {
            id: string;
            input: import("../services/management.service").UpdateUserInput;
        }, context: import("../types/graphql").GraphQLContext) => Promise<{
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
            input: import("../services/management.service").UpdateUserSettingsInput;
        }, context: import("../types/graphql").GraphQLContext) => Promise<{
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
        }, context: import("../types/graphql").GraphQLContext) => Promise<{
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
            input: import("../services/management.service").UpdateCompanyInput;
        }, context: import("../types/graphql").GraphQLContext) => Promise<{
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
        }, context: import("../types/graphql").GraphQLContext) => Promise<{
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
            role: import("../types/auth").UserRole;
        }, context: import("../types/graphql").GraphQLContext) => Promise<{
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
        }, context: import("../types/graphql").GraphQLContext) => Promise<{
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
        }, context: import("../types/graphql").GraphQLContext) => Promise<{
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
        login: (_: any, { input }: {
            input: import("../types/auth").LoginInput;
        }) => Promise<{
            success: boolean;
            data: {
                user: import("../types/auth").User;
                company: import("../types/auth").Company;
                tokens: import("../types/auth").AuthTokens;
            };
            message: string;
            errors?: undefined;
        } | {
            success: boolean;
            message: string;
            errors: string[];
            data?: undefined;
        }>;
        register: (_: any, { input }: {
            input: import("../types/auth").RegisterInput;
        }) => Promise<{
            success: boolean;
            data: {
                user: import("../types/auth").User;
                company: import("../types/auth").Company;
                tokens: import("../types/auth").AuthTokens;
            };
            message: string;
            errors?: undefined;
        } | {
            success: boolean;
            message: string;
            errors: string[];
            data?: undefined;
        }>;
        refreshToken: (_: any, { input }: {
            input: {
                refreshToken: string;
            };
        }) => Promise<{
            success: boolean;
            data: {
                tokens: import("../types/auth").AuthTokens;
            };
            message: string;
            errors?: undefined;
        } | {
            success: boolean;
            message: string;
            errors: string[];
            data?: undefined;
        }>;
        logout: (_: any, __: any, context: import("../types/graphql").GraphQLContext) => Promise<{
            success: boolean;
            message: string;
        }>;
    };
};
//# sourceMappingURL=index.d.ts.map