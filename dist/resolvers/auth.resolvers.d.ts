import { GraphQLContext } from '../types/graphql';
import { LoginInput, RegisterInput } from '../types/auth';
export declare const authResolvers: {
    Query: {
        me: (_: any, __: any, context: GraphQLContext) => Promise<{
            user: import("../types/auth").User | undefined;
            company: import("../types/auth").Company | undefined;
        }>;
    };
    Mutation: {
        login: (_: any, { input }: {
            input: LoginInput;
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
            input: RegisterInput;
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
        logout: (_: any, __: any, context: GraphQLContext) => Promise<{
            success: boolean;
            message: string;
        }>;
    };
};
//# sourceMappingURL=auth.resolvers.d.ts.map