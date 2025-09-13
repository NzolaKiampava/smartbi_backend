import { GraphQLContext } from '../types/graphql';
import { 
  DataConnectionInput, 
  AIQueryInput, 
  DataConnection, 
  AIQueryResult, 
  ConnectionTestResult, 
  SchemaInfo 
} from '../types/data-query';
import { DataQueryService } from '../services/data-query.service';

interface AuthenticatedContext extends GraphQLContext {
  user: NonNullable<GraphQLContext['user']>;
}

const ensureAuthenticated = (context: GraphQLContext): AuthenticatedContext => {
  if (!context.user) {
    throw new Error('Authentication required');
  }
  return context as AuthenticatedContext;
};

const getGeminiConfig = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is required');
  }
  
  return {
    apiKey,
    model: 'gemini-1.5-flash',
    maxTokens: 2048,
    temperature: 0.1
  };
};

export const dataQueryResolvers = {
  Query: {
    getDataConnections: async (_: any, __: any, context: GraphQLContext): Promise<DataConnection[]> => {
      const { user } = ensureAuthenticated(context);
      const service = new DataQueryService(context.req.app.locals.supabase, getGeminiConfig());
      
      return await service.getDataConnections(user.companyId);
    },

    getDataConnection: async (_: any, { id }: { id: string }, context: GraphQLContext): Promise<DataConnection | null> => {
      const { user } = ensureAuthenticated(context);
      const service = new DataQueryService(context.req.app.locals.supabase, getGeminiConfig());
      
      return await service.getDataConnection(user.companyId, id);
    },

    testDataConnection: async (_: any, { id }: { id: string }, context: GraphQLContext): Promise<ConnectionTestResult> => {
      const { user } = ensureAuthenticated(context);
      const service = new DataQueryService(context.req.app.locals.supabase, getGeminiConfig());
      
      return await service.testExistingConnection(user.companyId, id);
    },

    getSchemaInfo: async (_: any, { connectionId }: { connectionId: string }, context: GraphQLContext): Promise<SchemaInfo> => {
      const { user } = ensureAuthenticated(context);
      const service = new DataQueryService(context.req.app.locals.supabase, getGeminiConfig());
      
      return await service.getSchemaInfo(user.companyId, connectionId);
    },

    getAIQueryHistory: async (_: any, { limit }: { limit?: number }, context: GraphQLContext): Promise<AIQueryResult[]> => {
      const { user } = ensureAuthenticated(context);
      const service = new DataQueryService(context.req.app.locals.supabase, getGeminiConfig());
      
      return await service.getAIQueryHistory(user.companyId, limit || 50);
    },

    getAIQuery: async (_: any, { id }: { id: string }, context: GraphQLContext): Promise<AIQueryResult | null> => {
      const { user } = ensureAuthenticated(context);
      const service = new DataQueryService(context.req.app.locals.supabase, getGeminiConfig());
      
      return await service.getAIQuery(user.companyId, id);
    }
  },

  Mutation: {
    createDataConnection: async (
      _: any, 
      { input }: { input: DataConnectionInput }, 
      context: GraphQLContext
    ): Promise<DataConnection> => {
      const { user } = ensureAuthenticated(context);
      
      // Check if user has permission to create connections
      if (!['COMPANY_ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
        throw new Error('Insufficient permissions to create data connections');
      }

      const service = new DataQueryService(context.req.app.locals.supabase, getGeminiConfig());
      return await service.createDataConnection(user.companyId, input);
    },

    updateDataConnection: async (
      _: any, 
      { id, input }: { id: string; input: DataConnectionInput }, 
      context: GraphQLContext
    ): Promise<DataConnection> => {
      const { user } = ensureAuthenticated(context);
      
      // Check if user has permission to update connections
      if (!['COMPANY_ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
        throw new Error('Insufficient permissions to update data connections');
      }

      const service = new DataQueryService(context.req.app.locals.supabase, getGeminiConfig());
      return await service.updateDataConnection(user.companyId, id, input);
    },

    deleteDataConnection: async (
      _: any, 
      { id }: { id: string }, 
      context: GraphQLContext
    ): Promise<boolean> => {
      const { user } = ensureAuthenticated(context);
      
      // Check if user has permission to delete connections
      if (!['COMPANY_ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
        throw new Error('Insufficient permissions to delete data connections');
      }

      const service = new DataQueryService(context.req.app.locals.supabase, getGeminiConfig());
      return await service.deleteDataConnection(user.companyId, id);
    },

    testConnection: async (
      _: any, 
      { input }: { input: DataConnectionInput }, 
      context: GraphQLContext
    ): Promise<ConnectionTestResult> => {
      const { user } = ensureAuthenticated(context);
      
      // Check if user has permission to test connections
      if (!['COMPANY_ADMIN', 'SUPER_ADMIN', 'MANAGER'].includes(user.role)) {
        throw new Error('Insufficient permissions to test data connections');
      }

      const service = new DataQueryService(context.req.app.locals.supabase, getGeminiConfig());
      return await service.testConnection(input);
    },

    executeAIQuery: async (
      _: any, 
      { input }: { input: AIQueryInput }, 
      context: GraphQLContext
    ): Promise<AIQueryResult> => {
      const { user } = ensureAuthenticated(context);
      
      // All authenticated users can execute AI queries
      const service = new DataQueryService(context.req.app.locals.supabase, getGeminiConfig());
      return await service.executeAIQuery(user.companyId, user.id, input);
    }
  },

  // Field resolvers
  DataConnection: {
    config: (parent: DataConnection) => {
      // Remove sensitive data from responses
      const { password, apiKey, ...safeConfig } = parent.config;
      return {
        ...safeConfig,
        // Indicate if sensitive fields exist without showing their values
        hasPassword: !!password,
        hasApiKey: !!apiKey
      };
    }
  },

  // Custom scalar resolver for JSON
  JSON: {
    serialize: (value: any) => value,
    parseValue: (value: any) => value,
    parseLiteral: (ast: any) => {
      switch (ast.kind) {
        case 'StringValue':
          return JSON.parse(ast.value);
        case 'ObjectValue':
          return ast.fields.reduce((acc: any, field: any) => {
            acc[field.name.value] = field.value.value;
            return acc;
          }, {});
        default:
          return null;
      }
    }
  }
};