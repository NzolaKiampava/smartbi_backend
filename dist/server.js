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
const environment_1 = require("./config/environment");
const database_1 = require("./config/database");
const schema_1 = require("./schema");
const resolvers_1 = require("./resolvers");
const auth_middleware_1 = require("./middleware/auth.middleware");
const security_middleware_1 = require("./middleware/security.middleware");
async function startServer() {
    const dbConnected = await (0, database_1.testDatabaseConnection)();
    if (!dbConnected) {
        console.error('❌ Failed to connect to database. Exiting...');
        process.exit(1);
    }
    const app = (0, express_1.default)();
    const httpServer = http_1.default.createServer(app);
    app.use(security_middleware_1.helmetConfig);
    app.use(security_middleware_1.corsConfig);
    app.use(security_middleware_1.rateLimitConfig);
    app.use(express_1.default.json({ limit: '10mb' }));
    app.use(express_1.default.urlencoded({ extended: true }));
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