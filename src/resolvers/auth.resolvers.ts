import { GraphQLContext } from '../types/graphql';
import { AuthService } from '../services/auth.service';
import { LoginInput, RegisterInput } from '../types/auth';
import { loginSchema, registerSchema, refreshTokenSchema } from '../utils/validation';

export const authResolvers = {
  Query: {
    me: async (_: any, __: any, context: GraphQLContext) => {
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
    login: async (_: any, { input }: { input: LoginInput }) => {
      try {
        // Validate input
        const validatedInput = loginSchema.parse(input);
        
        const result = await AuthService.login(validatedInput);
        
        return {
          success: true,
          data: result,
          message: 'Login successful',
        };
      } catch (error) {
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Login failed',
          errors: [error instanceof Error ? error.message : 'Unknown error'],
        };
      }
    },

    register: async (_: any, { input }: { input: RegisterInput }) => {
      try {
        // Validate input
        const validatedInput = registerSchema.parse(input);
        
        const result = await AuthService.register(validatedInput);
        
        return {
          success: true,
          data: result,
          message: 'Registration successful',
        };
      } catch (error) {
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Registration failed',
          errors: [error instanceof Error ? error.message : 'Unknown error'],
        };
      }
    },

    refreshToken: async (_: any, { input }: { input: { refreshToken: string } }) => {
      try {
        // Validate input
        const validatedInput = refreshTokenSchema.parse(input);
        
        const tokens = await AuthService.refreshToken(validatedInput.refreshToken);
        
        return {
          success: true,
          data: { tokens },
          message: 'Token refreshed successfully',
        };
      } catch (error) {
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Token refresh failed',
          errors: [error instanceof Error ? error.message : 'Unknown error'],
        };
      }
    },

    logout: async (_: any, __: any, context: GraphQLContext) => {
      // In a stateless JWT system, logout is handled client-side
      // Here you could implement token blacklisting if needed
      return {
        success: true,
        message: 'Logout successful',
      };
    },
  },
};