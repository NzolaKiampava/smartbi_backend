import express from 'express';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { GraphQLError, GraphQLFormattedError } from 'graphql';
import http from 'http';
import { config } from './config/environment';
import { testDatabaseConnection } from './config/database';
import { typeDefs } from './schema';
import { resolvers } from './resolvers';
import { authMiddleware, createGraphQLContext } from './middleware/auth.middleware';
import { helmetConfig, corsConfig, rateLimitConfig } from './middleware/security.middleware';

async function startServer() {
  // Test database connection
  const dbConnected = await testDatabaseConnection();
  if (!dbConnected) {
    console.error('❌ Failed to connect to database. Exiting...');
    process.exit(1);
  }

  const app = express();
  const httpServer = http.createServer(app);

  // Security middleware
  app.use(helmetConfig);
  app.use(corsConfig);
  app.use(rateLimitConfig);

  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Authentication middleware
  app.use(authMiddleware);

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: config.env,
    });
  });

  // Create Apollo Server
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
    formatError: (formattedError: GraphQLFormattedError, error: unknown) => {
      console.error('GraphQL Error:', error);
      
      return {
        ...formattedError,
        ...(config.isDevelopment && error instanceof GraphQLError && { 
          extensions: {
            ...formattedError.extensions,
            stack: error.stack
          }
        }),
      };
    },
  });

  await server.start();

  // Apply GraphQL middleware
  app.use(
    '/graphql',
    expressMiddleware(server, {
      context: async ({ req, res }) => createGraphQLContext(req as any, res),
    })
  );

  // 404 handler
  app.use('*', (req, res) => {
    res.status(404).json({
      success: false,
      message: 'Route not found',
    });
  });

  // Global error handler
  app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Unhandled error:', error);
    
    res.status(500).json({
      success: false,
      message: config.isDevelopment ? error.message : 'Internal server error',
      ...(config.isDevelopment && { stack: error.stack }),
    });
  });

  // Start server
  await new Promise<void>((resolve) => {
    httpServer.listen(config.port, resolve);
  });

  console.log(`🚀 Server ready at http://localhost:${config.port}`);
  console.log(`📊 GraphQL endpoint: http://localhost:${config.port}/graphql`);
  console.log(`🏥 Health check: http://localhost:${config.port}/health`);
  console.log(`🌍 Environment: ${config.env}`);
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});