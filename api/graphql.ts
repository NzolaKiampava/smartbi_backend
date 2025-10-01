import express from 'express';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { json } from 'body-parser';
import { typeDefs } from '../src/schema';
import { resolvers } from '../src/resolvers';

// Create Apollo server instance
const server = new ApolloServer({
  typeDefs,
  resolvers,
  csrfPrevention: false
});

// Initialize Express app and apply Apollo middleware
const app = express();
app.use(json());

// Lazy initialize Apollo and attach middleware
async function init() {
  await server.start();
  app.use('/', await expressMiddleware(server, {
    context: async ({ req, res }: any) => {
      try {
        const { createGraphQLContext } = await import('../src/middleware/auth.middleware');
        return createGraphQLContext(req, res);
      } catch (err) {
        console.warn('Could not create GraphQL context for serverless handler:', err);
        return { req, res };
      }
    }
  }));
}

init().catch(err => {
  console.error('Failed to start Apollo server in serverless handler:', err);
});

export default app;
