"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authResolvers = void 0;
const auth_service_1 = require("../services/auth.service");
const validation_1 = require("../utils/validation");
exports.authResolvers = {
    Query: {
        me: async (_, __, context) => {
            if (!context.isAuthenticated) {
                throw new Error('Authentication required');
            }
            return {
                user: context.user,
                company: context.company,
            };
        },
    },
    Mutation: {
        login: async (_, { input }) => {
            try {
                const validatedInput = validation_1.loginSchema.parse(input);
                const result = await auth_service_1.AuthService.login(validatedInput);
                return {
                    success: true,
                    data: result,
                    message: 'Login successful',
                };
            }
            catch (error) {
                return {
                    success: false,
                    message: error instanceof Error ? error.message : 'Login failed',
                    errors: [error instanceof Error ? error.message : 'Unknown error'],
                };
            }
        },
        register: async (_, { input }) => {
            try {
                const validatedInput = validation_1.registerSchema.parse(input);
                const result = await auth_service_1.AuthService.register(validatedInput);
                return {
                    success: true,
                    data: result,
                    message: 'Registration successful',
                };
            }
            catch (error) {
                return {
                    success: false,
                    message: error instanceof Error ? error.message : 'Registration failed',
                    errors: [error instanceof Error ? error.message : 'Unknown error'],
                };
            }
        },
        refreshToken: async (_, { input }) => {
            try {
                const validatedInput = validation_1.refreshTokenSchema.parse(input);
                const tokens = await auth_service_1.AuthService.refreshToken(validatedInput.refreshToken);
                return {
                    success: true,
                    data: { tokens },
                    message: 'Token refreshed successfully',
                };
            }
            catch (error) {
                return {
                    success: false,
                    message: error instanceof Error ? error.message : 'Token refresh failed',
                    errors: [error instanceof Error ? error.message : 'Unknown error'],
                };
            }
        },
        logout: async (_, __, context) => {
            return {
                success: true,
                message: 'Logout successful',
            };
        },
    },
};
//# sourceMappingURL=auth.resolvers.js.map