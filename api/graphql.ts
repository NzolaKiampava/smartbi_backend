import { VercelRequest, VercelResponse } from '@vercel/node';
import { ApolloServer } from '@apollo/server';
import { startServerAndCreateVercelHandler } from '@as-integrations/vercel';
import { typeDefs } from '../src/schema';
import { resolvers } from '../src/resolvers';

// Create Apollo server instance
const server = new ApolloServer({
  typeDefs,
  resolvers,
  csrfPrevention: false
});

export default startServerAndCreateVercelHandler(server, {
  context: async ({ req, res }: { req: VercelRequest; res: VercelResponse }) => {
    // Reuse the same context creation used by the Express server
    // Note: createGraphQLContext expects (req,res) from Express; adjust if necessary
    try {
      // Lazy import to avoid circular deps
      const { createGraphQLContext } = await import('../src/middleware/auth.middleware');
      return createGraphQLContext(req as any, res as any);
    } catch (err) {
      console.warn('Could not create GraphQL context for Vercel handler:', err);
      return { req, res } as any;
    }
});
