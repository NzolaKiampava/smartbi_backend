import { GraphQLContext } from '../types/graphql';
import { 
  DataConnectionInput, 
  AIQueryInput, 
  DataConnection, 
  AIQueryResult, 
  ConnectionTestResult, 
  ConnectionTestInput,
  ConnectionStatus,
  SchemaInfo 
} from '../types/data-query';
import { DataQueryService } from '../services/data-query.service';
import { createDatabaseAdapter } from '../services/database-adapters.service';

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
    },

    // Get connections without authentication (development only)
    getDataConnectionsPublic: async (
      _: any, 
      __: any, 
      context: GraphQLContext
    ): Promise<DataConnection[]> => {
      // Only available in development mode
      if (process.env.NODE_ENV !== 'development') {
        throw new Error('This endpoint is only available in development mode');
      }

      try {
        // Get all connections from Demo Company
        const { data: companies, error: companyError } = await context.req.app.locals.supabase
          .from('companies')
          .select('id')
          .eq('slug', 'demo')
          .single();

        if (companyError || !companies) {
          throw new Error('Demo company not found');
        }

        const { data: connections, error: connectionsError } = await context.req.app.locals.supabase
          .from('data_connections')
          .select('*')
          .eq('company_id', companies.id)
          .order('created_at', { ascending: false });

        if (connectionsError) {
          throw new Error(`Failed to fetch connections: ${connectionsError.message}`);
        }

        // Convert database format to GraphQL format
        return (connections || []).map((conn: any) => ({
          id: conn.id,
          companyId: conn.company_id,
          name: conn.name,
          type: conn.type,
          status: conn.status,
          config: conn.config,
          isDefault: conn.is_default,
          createdAt: conn.created_at,
          updatedAt: conn.updated_at,
          lastTestedAt: conn.last_tested_at
        }));
      } catch (error) {
        throw new Error(`Failed to get connections: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },

    // Get AI query history without authentication (development only)
    getAIQueryHistoryPublic: async (
      _: any,
      { limit }: { limit?: number },
      context: GraphQLContext
    ): Promise<AIQueryResult[]> => {
      // Only available in development mode
      if (process.env.NODE_ENV !== 'development') {
        throw new Error('This endpoint is only available in development mode');
      }

      try {
        // Get Demo Company
        const { data: companies, error: companyError } = await context.req.app.locals.supabase
          .from('companies')
          .select('id')
          .eq('slug', 'demo')
          .single();

        if (companyError || !companies) {
          throw new Error('Demo company not found. Please run database migration first.');
        }

        let query = context.req.app.locals.supabase
          .from('ai_query_history')
          .select('*')
          .eq('company_id', companies.id)
          .order('created_at', { ascending: false });

        if (limit) {
          query = query.limit(limit);
        }

        const { data: history, error: historyError } = await query;

        if (historyError) {
          throw new Error(`Failed to fetch query history: ${historyError.message}`);
        }

        return (history || []).map((query: any) => ({
          id: query.id,
          companyId: query.company_id,
          connectionId: query.connection_id,
          naturalQuery: query.natural_query,
          generatedQuery: query.generated_query,
          results: (query.results || []).map((result: any) => ({ data: result })),
          executionTime: query.execution_time,
          status: query.status,
          error: query.error_message,
          createdAt: query.created_at
        }));
      } catch (error) {
        throw new Error(`Failed to get query history: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },

    // Get specific AI query without authentication (development only)
    getAIQueryPublic: async (
      _: any,
      { id }: { id: string },
      context: GraphQLContext
    ): Promise<AIQueryResult | null> => {
      // Only available in development mode
      if (process.env.NODE_ENV !== 'development') {
        throw new Error('This endpoint is only available in development mode');
      }

      try {
        const { data: query, error: queryError } = await context.req.app.locals.supabase
          .from('ai_query_history')
          .select('*')
          .eq('id', id)
          .single();

        if (queryError) {
          if (queryError.code === 'PGRST116') {
            return null; // Not found
          }
          throw new Error(`Failed to fetch query: ${queryError.message}`);
        }

        return {
          id: query.id,
          companyId: query.company_id,
          connectionId: query.connection_id,
          naturalQuery: query.natural_query,
          generatedQuery: query.generated_query,
          results: (query.results || []).map((result: any) => ({ data: result })),
          executionTime: query.execution_time,
          status: query.status,
          error: query.error_message,
          createdAt: query.created_at
        };
      } catch (error) {
        throw new Error(`Failed to get query: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
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

    // Temporary resolver for testing without authentication (development only)
    testConnectionPublic: async (
      _: any, 
      { input }: { input: ConnectionTestInput }
    ): Promise<ConnectionTestResult> => {
      // Only available in development mode
      if (process.env.NODE_ENV !== 'development') {
        throw new Error('This endpoint is only available in development mode');
      }

      try {
        const adapter = createDatabaseAdapter(input.type);
        
        // Convert ConnectionTestInput to DataConnectionConfig format
        const config = {
          host: input.host,
          port: input.port,
          database: input.database,
          username: input.username,
          password: input.password,
          apiUrl: input.apiUrl,
          apiKey: input.apiKey
        };
        
        const result = await adapter.testConnection(config);
        
        // Get schema preview if connection is successful
        let schemaPreview = null;
        if (result.success) {
          try {
            const schemaInfo = await adapter.getSchemaInfo(config);
            schemaPreview = {
              totalTables: schemaInfo.totalTables,
              tables: schemaInfo.tables.slice(0, 5) // Limit to 5 tables for preview
            };
          } catch (error) {
            console.warn('Could not get schema preview:', error);
          }
        }

        return {
          ...result,
          schemaPreview: schemaPreview || undefined
        };
      } catch (error) {
        return {
          success: false,
          message: `Connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          latency: undefined,
          schemaPreview: undefined
        };
      }
    },

    // Create connection without authentication (development only)
    createDataConnectionPublic: async (
      _: any,
      { input }: { input: DataConnectionInput },
      context: GraphQLContext
    ): Promise<DataConnection> => {
      // Only available in development mode
      if (process.env.NODE_ENV !== 'development') {
        throw new Error('This endpoint is only available in development mode');
      }

      try {
        // Get Demo Company ID from database
        const { data: companies, error: companyError } = await context.req.app.locals.supabase
          .from('companies')
          .select('id')
          .eq('slug', 'demo')
          .single();

        if (companyError || !companies) {
          throw new Error('Demo company not found. Please run database migration first.');
        }

        // Test connection before saving (skip for development testing)
        const adapter = createDatabaseAdapter(input.type);
        let testResult;
        
        try {
          testResult = await adapter.testConnection(input.config);
        } catch (error) {
          // In development, allow saving even if test fails
          console.warn('Connection test failed but allowing save in development:', error);
          testResult = { success: true, message: 'Development mode - test skipped' };
        }
        
        if (!testResult.success) {
          console.warn('Connection test failed but continuing in development mode:', testResult.message);
          // In development, proceed anyway
          testResult = { success: true, message: 'Development mode - proceeding despite test failure' };
        }

        // Save to database
        const connectionData = {
          company_id: companies.id,
          name: input.name,
          type: input.type,
          status: ConnectionStatus.ACTIVE,
          config: input.config,
          is_default: input.isDefault || false,
          last_tested_at: new Date().toISOString()
        };

        const { data: savedConnection, error: saveError } = await context.req.app.locals.supabase
          .from('data_connections')
          .insert(connectionData)
          .select()
          .single();

        if (saveError) {
          throw new Error(`Failed to save connection: ${saveError.message}`);
        }

        // Convert database format to GraphQL format
        return {
          id: savedConnection.id,
          companyId: savedConnection.company_id,
          name: savedConnection.name,
          type: savedConnection.type,
          status: savedConnection.status,
          config: savedConnection.config,
          isDefault: savedConnection.is_default,
          createdAt: savedConnection.created_at,
          updatedAt: savedConnection.updated_at,
          lastTestedAt: savedConnection.last_tested_at
        };
      } catch (error) {
        throw new Error(`Failed to create connection: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
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
    },

    // Execute AI query without authentication (development only)
    executeAIQueryPublic: async (
      _: any, 
      { input }: { input: AIQueryInput }, 
      context: GraphQLContext
    ): Promise<AIQueryResult> => {
      // Only available in development mode
      if (process.env.NODE_ENV !== 'development') {
        throw new Error('This endpoint is only available in development mode');
      }

      try {
        // Use the fixed Demo Company ID that you provided
        const demoCompanyId = 'f21b31ec-6487-413a-99f7-3a6a1a34b171';
        
        // Get a demo user from the company or use a fixed UUID for testing
        const { data: users, error: userError } = await context.req.app.locals.supabase
          .from('users')
          .select('id')
          .eq('company_id', demoCompanyId)
          .limit(1)
          .single();

        // Use the first user found, or a fixed demo UUID if no users exist
        const demoUserId = users?.id || 'f21b31ec-6487-413a-99f7-3a6a1a34b172'; // Fixed demo user UUID

        const service = new DataQueryService(context.req.app.locals.supabase, getGeminiConfig());
        return await service.executeAIQuery(demoCompanyId, demoUserId, input);
      } catch (error) {
        throw new Error(`Failed to execute AI query: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
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