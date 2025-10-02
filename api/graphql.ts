import { ApolloServer } from '@apollo/server';
import { typeDefs } from '../src/schema';
import { resolvers } from '../src/resolvers';

// Simple types for Vercel runtime
interface VercelRequest {
  method?: string;
  url?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: any;
}

interface VercelResponse {
  writeHead(statusCode: number, headers?: Record<string, string>): void;
  end(data?: string): void;
  setHeader(name: string, value: string): void;
}

// Singleton Apollo instance (lazy)
let apollo: any;
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
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      message: 'SmartBI GraphQL endpoint',
      usage: 'POST this same URL with { query, variables }',
      exampleQuery: '{ __typename }'
    }));
    return;
  }

  if (req.method === 'GET' && req.url === '/favicon.ico') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    res.writeHead(405, { 'Allow': 'POST, GET', 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, message: 'Method not allowed' }));
    return;
  }

  try {
    const server = await getApollo();

    // Parse body - Vercel provides it parsed
    const { query, variables, operationName } = req.body || {};
    if (!query) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, message: 'Missing GraphQL "query" field' }));
      return;
    }

    // Basic context (avoid complex middleware for now)
    const contextValue = { req, res };

    const httpGraphQLResponse = await server.executeHTTPGraphQLRequest({
      context: async () => contextValue,
      httpGraphQLRequest: {
        method: req.method || 'POST',
        headers: new Map(Object.entries(req.headers).map(([k, v]) => [k, Array.isArray(v) ? v.join(',') : String(v || '')])) as any,
        search: req.url?.includes('?') ? req.url.substring(req.url.indexOf('?')) : '',
        body: { kind: 'single', query, variables, operationName }
      }
    });

    // Set response headers
    for (const [key, value] of httpGraphQLResponse.headers) {
      res.setHeader(key, String(value));
    }

    // Handle response body
    let responseString = '';
    if (httpGraphQLResponse.body.kind === 'complete') {
      responseString = (httpGraphQLResponse.body as any).string;
    } else {
      // chunked response - collect all chunks
      for await (const chunk of httpGraphQLResponse.body.asyncIterator) {
        responseString += chunk;
      }
    }

    res.writeHead(httpGraphQLResponse.status || 200);
    res.end(responseString);
  } catch (error: any) {
    console.error('GraphQL handler error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      success: false, 
      message: 'Internal server error', 
      error: process.env.NODE_ENV === 'development' ? error?.message : undefined 
    }));
  }
}
