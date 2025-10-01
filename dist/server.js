"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const server_1 = require("@apollo/server");
const express4_1 = require("@apollo/server/express4");
const drainHttpServer_1 = require("@apollo/server/plugin/drainHttpServer");
const graphql_1 = require("graphql");
const http_1 = __importDefault(require("http"));
const multer_1 = __importDefault(require("multer"));
const supabase_js_1 = require("@supabase/supabase-js");
const environment_1 = require("./config/environment");
const database_1 = require("./config/database");
const schema_1 = require("./schema");
const resolvers_1 = require("./resolvers");
const auth_middleware_1 = require("./middleware/auth.middleware");
const security_middleware_1 = require("./middleware/security.middleware");
async function startServer() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseServiceKey) {
        console.error('❌ Supabase configuration missing. Please check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
        process.exit(1);
    }
    const supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseServiceKey);
    console.log('✅ Supabase client initialized');
    const dbConnected = await (0, database_1.testDatabaseConnection)();
    if (!dbConnected) {
        console.error('❌ Failed to connect to database. Exiting...');
        process.exit(1);
    }
    const app = (0, express_1.default)();
    app.set('trust proxy', 1);
    const httpServer = http_1.default.createServer(app);
    app.locals.supabase = supabase;
    app.use(security_middleware_1.helmetConfig);
    app.use(security_middleware_1.corsConfig);
    app.use(security_middleware_1.rateLimitConfig);
    const upload = (0, multer_1.default)({
        storage: multer_1.default.memoryStorage(),
        limits: {
            fileSize: 10 * 1024 * 1024,
            files: 1,
        },
        fileFilter: (req, file, cb) => {
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
            }
            else {
                const error = new Error(`File type ${file.mimetype} not supported`);
                cb(error, false);
            }
        }
    });
    app.use('/graphql', (req, res, next) => {
        const contentType = req.get('Content-Type') || '';
        if (contentType.includes('multipart/form-data')) {
            return upload.any()(req, res, (err) => {
                if (err) {
                    console.error('Multer error:', err);
                    return res.status(400).json({
                        errors: [{ message: `File upload error: ${err.message}` }]
                    });
                }
                try {
                    const operations = req.body.operations;
                    const map = req.body.map;
                    if (!operations) {
                        return res.status(400).json({
                            errors: [{ message: 'Missing operations field in multipart data' }]
                        });
                    }
                    let parsedOperations;
                    try {
                        parsedOperations = typeof operations === 'string' ? JSON.parse(operations) : operations;
                    }
                    catch (parseError) {
                        return res.status(400).json({
                            errors: [{ message: 'Invalid JSON in operations field' }]
                        });
                    }
                    let parsedMap = {};
                    if (map) {
                        try {
                            parsedMap = typeof map === 'string' ? JSON.parse(map) : map;
                        }
                        catch (parseError) {
                            return res.status(400).json({
                                errors: [{ message: 'Invalid JSON in map field' }]
                            });
                        }
                    }
                    if (req.files && Array.isArray(req.files)) {
                        req.files.forEach((file, index) => {
                            const fileKey = index.toString();
                            const paths = parsedMap[fileKey];
                            if (paths && Array.isArray(paths)) {
                                paths.forEach((path) => {
                                    const pathParts = path.split('.');
                                    let current = parsedOperations;
                                    for (let i = 0; i < pathParts.length - 1; i++) {
                                        if (!current[pathParts[i]]) {
                                            current[pathParts[i]] = {};
                                        }
                                        current = current[pathParts[i]];
                                    }
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
                    req.body = parsedOperations;
                    req.headers['content-type'] = 'application/json';
                }
                catch (error) {
                    console.error('Error processing multipart data:', error);
                    return res.status(400).json({
                        errors: [{ message: 'Error processing upload data' }]
                    });
                }
                return next();
            });
        }
        else {
            next();
        }
    });
    app.use('/graphql', (req, res, next) => {
        if (req.file || req.files) {
            return next();
        }
        express_1.default.json({ limit: '10mb' })(req, res, next);
    });
    app.use('/graphql', (req, res, next) => {
        if (req.file || req.files) {
            return next();
        }
        express_1.default.urlencoded({ extended: true })(req, res, next);
    });
    app.use(auth_middleware_1.authMiddleware);
    app.get('/health', (req, res) => {
        res.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            environment: environment_1.config.env,
        });
    });
    const server = new server_1.ApolloServer({
        typeDefs: schema_1.typeDefs,
        resolvers: resolvers_1.resolvers,
        plugins: [(0, drainHttpServer_1.ApolloServerPluginDrainHttpServer)({ httpServer })],
        csrfPrevention: false,
        formatError: (formattedError, error) => {
            console.error('GraphQL Error:', error);
            return {
                ...formattedError,
                ...(environment_1.config.isDevelopment && error instanceof graphql_1.GraphQLError && {
                    extensions: {
                        ...formattedError.extensions,
                        stack: error.stack
                    }
                }),
            };
        },
    });
    await server.start();
    app.use('/graphql', (0, express4_1.expressMiddleware)(server, {
        context: async ({ req, res }) => (0, auth_middleware_1.createGraphQLContext)(req, res),
    }));
    app.use('*', (req, res) => {
        res.status(404).json({
            success: false,
            message: 'Route not found',
        });
    });
    app.use((error, req, res, next) => {
        console.error('Unhandled error:', error);
        res.status(500).json({
            success: false,
            message: environment_1.config.isDevelopment ? error.message : 'Internal server error',
            ...(environment_1.config.isDevelopment && { stack: error.stack }),
        });
    });
    await new Promise((resolve) => {
        httpServer.listen(environment_1.config.port, resolve);
    });
    console.log(`🚀 Server ready at http://localhost:${environment_1.config.port}`);
    console.log(`📊 GraphQL endpoint: http://localhost:${environment_1.config.port}/graphql`);
    console.log(`🏥 Health check: http://localhost:${environment_1.config.port}/health`);
    console.log(`🌍 Environment: ${environment_1.config.env}`);
}
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    process.exit(0);
});
process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    process.exit(0);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});
startServer().catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
});
//# sourceMappingURL=server.js.map