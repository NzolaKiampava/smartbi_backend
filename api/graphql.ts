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
// Trust the first proxy hop (Vercel) to avoid permissive trust proxy error
app.set('trust proxy', 1);

// Minimal root route and favicon to reduce 404 noise
app.get('/', (_req, res) => {
  res.json({ success: true, message: 'GraphQL serverless function', graphql: '/graphql' });
});

app.get('/favicon.ico', (_req, res) => res.status(204).end());

// Lazy initialize Apollo and attach middleware
async function init() {
  await server.start();
  app.use('/', await expressMiddleware(server as any, {
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
