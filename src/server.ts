import express, { Request, Response, NextFunction } from 'express';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { GraphQLError, GraphQLFormattedError } from 'graphql';
import http from 'http';
import multer, { FileFilterCallback } from 'multer';
import { createClient } from '@supabase/supabase-js';
import { config } from './config/environment';
import { testDatabaseConnection } from './config/database';
import { typeDefs } from './schema';
import { resolvers } from './resolvers';
import { authMiddleware, createGraphQLContext } from './middleware/auth.middleware';
import { helmetConfig, corsConfig, rateLimitConfig } from './middleware/security.middleware';

// Extend Express Request interface to include multer file properties
declare global {
  namespace Express {
    interface Request {
      file?: Express.Multer.File;
      files?: Express.Multer.File[] | { [fieldname: string]: Express.Multer.File[] };
    }
  }
}

async function startServer() {
  // Initialize Supabase client
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Supabase configuration missing. Please check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  console.log('✅ Supabase client initialized');

  // Test database connection
  const dbConnected = await testDatabaseConnection();
  if (!dbConnected) {
    console.error('❌ Failed to connect to database. Exiting...');
    process.exit(1);
  }

  const app = express();
  // In a proxy environment (Vercel), trust the first proxy hop (safer than `true`)
  app.set('trust proxy', 1);
  const httpServer = http.createServer(app);

  // Store Supabase client in app locals for access in resolvers
  app.locals.supabase = supabase;

  // Security middleware
  app.use(helmetConfig);
  app.use(corsConfig);
  app.use(rateLimitConfig);

  // Configure multer for file uploads
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB limit
      files: 1,
    },
    fileFilter: (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
      // Allow common file types for analysis
      const allowedTypes = [
        'text/csv',
        'application/json',
        'application/pdf',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain',
        'application/xml',
        'text/xml'
      ];
      
      if (allowedTypes.includes(file.mimetype) || file.mimetype.startsWith('text/')) {
        cb(null, true);
      } else {
        const error = new Error(`File type ${file.mimetype} not supported`) as any;
        cb(error, false);
      }
    }
  });

  // GraphQL Upload Middleware - Handle multipart/form-data for GraphQL
  app.use('/graphql', (req, res, next) => {
    const contentType = req.get('Content-Type') || '';
    
    if (contentType.includes('multipart/form-data')) {
      // Parse multipart data
      return upload.any()(req, res, (err: any) => {
        if (err) {
          console.error('Multer error:', err);
          return res.status(400).json({
            errors: [{ message: `File upload error: ${err.message}` }]
          });
        }

        try {
          // Parse GraphQL operations from form data
          const operations = req.body.operations;
          const map = req.body.map;
          
          if (!operations) {
            return res.status(400).json({
              errors: [{ message: 'Missing operations field in multipart data' }]
            });
          }

          // Parse operations JSON
          let parsedOperations;
          try {
            parsedOperations = typeof operations === 'string' ? JSON.parse(operations) : operations;
          } catch (parseError) {
            return res.status(400).json({
              errors: [{ message: 'Invalid JSON in operations field' }]
            });
          }

          // Parse map JSON if provided
          let parsedMap = {};
          if (map) {
            try {
              parsedMap = typeof map === 'string' ? JSON.parse(map) : map;
            } catch (parseError) {
              return res.status(400).json({
                errors: [{ message: 'Invalid JSON in map field' }]
              });
            }
          }

          // Map files to variables based on the map
          if (req.files && Array.isArray(req.files)) {
            req.files.forEach((file: Express.Multer.File, index: number) => {
              const fileKey = index.toString();
              const paths = (parsedMap as any)[fileKey];
              
              if (paths && Array.isArray(paths)) {
                paths.forEach((path: string) => {
                  const pathParts = path.split('.');
                  let current: any = parsedOperations;
                  
                  // Navigate to the correct nested location
                  for (let i = 0; i < pathParts.length - 1; i++) {
                    if (!current[pathParts[i]]) {
                      current[pathParts[i]] = {};
                    }
                    current = current[pathParts[i]];
                  }
                  
                  // Set the file at the final location
                  const finalKey = pathParts[pathParts.length - 1];
                  current[finalKey] = {
                    filename: file.originalname,
                    mimetype: file.mimetype,
                    buffer: file.buffer,
                    size: file.size
                  };
                });
              }
            });
          }

          // Set the parsed data as JSON for GraphQL processing
          req.body = parsedOperations;
          req.headers['content-type'] = 'application/json';
          
        } catch (error) {
          console.error('Error processing multipart data:', error);
          return res.status(400).json({
            errors: [{ message: 'Error processing upload data' }]
          });
        }

        return next();
      });
    } else {
      // Regular JSON request
      next();
    }
  });

  // Body parsing middleware (skip for multipart uploads already processed by multer)
  app.use('/graphql', (req, res, next) => {
    // Skip body parsing if multer already processed the request
    if (req.file || req.files) {
      return next();
    }
    express.json({ limit: '10mb' })(req, res, next);
  });
  
  app.use('/graphql', (req, res, next) => {
    // Skip body parsing if multer already processed the request
    if (req.file || req.files) {
      return next();
    }
    express.urlencoded({ extended: true })(req, res, next);
  });

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
    csrfPrevention: false,
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

  // Apply GraphQL middleware at /graphql
  app.use('/graphql', expressMiddleware(server, {
    context: async ({ req, res }) => createGraphQLContext(req as any, res),
  }));

  // Alias /api/graphql (some clients may default to this path in dev vs serverless)
  app.use('/api/graphql', expressMiddleware(server, {
    context: async ({ req, res }) => createGraphQLContext(req as any, res),
  }));

  // Forward root POST to /graphql for convenience
  app.all('/', (req, _res, next) => {
    if (req.method === 'POST') {
      req.url = '/graphql';
    }
    next();
  });

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