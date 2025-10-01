import { ApolloServer } from '@apollo/server';
import { typeDefs } from '../src/schema';
import { resolvers } from '../src/resolvers';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Singleton Apollo instance (lazy)
let apollo: ApolloServer | undefined;
async function getApollo() {
  if (!apollo) {
    apollo = new ApolloServer({
      typeDefs,
      resolvers,
      csrfPrevention: false
    });
    await apollo.start();
  }
  return apollo;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Health / info shortcuts
  if (req.method === 'GET' && (!req.url || req.url === '/' || req.url.startsWith('/?'))) {
    res.status(200).json({
      success: true,
      message: 'SmartBI GraphQL endpoint',
      usage: 'POST this same URL with { query, variables }',
      exampleQuery: '{ __typename }'
    });
    return;
  }

  if (req.method === 'GET' && req.url === '/favicon.ico') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, GET');
    res.status(405).json({ success: false, message: 'Method not allowed' });
    return;
  }

  try {
    const server = await getApollo();

    // Parse JSON body (Vercel already buffers)
    let body: any = req.body;
    if (!body) {
      try { body = JSON.parse((req as any).rawBody?.toString() || '{}'); } catch { body = {}; }
    }

    const { query, variables, operationName } = body || {};
    if (!query) {
      res.status(400).json({ success: false, message: 'Missing GraphQL "query" field' });
      return;
    }

    // Dynamic context
    let contextValue: any = { req, res };
    try {
      const { createGraphQLContext } = await import('../src/middleware/auth.middleware');
      contextValue = await createGraphQLContext(req as any, res as any);
    } catch (err) {
      console.warn('Context creation failed, continuing with basic context:', err);
    }

    const httpGraphQLResponse = await server.executeHTTPGraphQLRequest({
      context: async () => contextValue,
      httpGraphQLRequest: {
        method: req.method || 'POST',
        headers: new Map(Object.entries(req.headers).map(([k, v]) => [k, Array.isArray(v) ? v.join(',') : (v || '')])),
        body: { kind: 'single', query, variables, operationName }
      }
    });

    // Set response headers
    for (const [key, value] of httpGraphQLResponse.headers) {
      res.setHeader(key, value as string);
    }

    res.status(httpGraphQLResponse.status || 200).send(httpGraphQLResponse.body.string);
  } catch (error: any) {
    console.error('GraphQL handler error:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: process.env.NODE_ENV === 'development' ? error?.message : undefined });
  }
}
