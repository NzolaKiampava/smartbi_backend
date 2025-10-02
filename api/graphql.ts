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
  if (req.method === 'GET') {
    if (req.url === '/favicon.ico') {
      res.writeHead(204);
      res.end();
      return;
    }
    
    // GET returns GraphQL endpoint info
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      message: 'SmartBI GraphQL endpoint',
      usage: 'POST this same URL with { query, variables }',
      exampleQuery: '{ __typename }',
      playground: 'Use Postman or GraphQL client',
      introspection: 'Send POST with query: "{ __schema { queryType { name } } }"'
    }));
    return;
  }

  if (req.method !== 'POST') {
    res.writeHead(405, { 'Allow': 'POST, GET', 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, message: 'Method not allowed. Use POST for GraphQL queries.' }));
    return;
  }

  try {
    const server = await getApollo();

    // Parse body - Vercel already parses it
    const parsedBody = req.body || {};
    const { query, variables, operationName } = parsedBody;
    if (!query) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, message: 'Missing GraphQL "query" field' }));
      return;
    }

    // Create proper context with Supabase client
    let contextValue: any = { req, res };
    try {
      // Try to create GraphQL context with Supabase
      const { createGraphQLContext } = await import('../src/middleware/auth.middleware');
      contextValue = await createGraphQLContext(req as any, res as any);
    } catch (err) {
      console.warn('Could not create full GraphQL context, using basic context:', err);
      
      // Fallback: create Supabase client directly
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(
          process.env.SUPABASE_URL!,
          process.env.SUPABASE_ANON_KEY!
        );
        
        // Mock req.app.locals structure for compatibility
        contextValue = {
          req: {
            ...req,
            app: {
              locals: {
                supabase
              }
            }
          },
          res
        };
      } catch (supabaseErr) {
        console.error('Failed to create Supabase client:', supabaseErr);
      }
    }

    // Build request body - only include operationName if it's a non-empty string
    const requestBody: any = { 
      kind: 'single', 
      query, 
      variables: variables || {} 
    };
    
    if (operationName && typeof operationName === 'string' && operationName.trim()) {
      requestBody.operationName = operationName;
    }

    const httpGraphQLResponse = await server.executeHTTPGraphQLRequest({
      context: async () => contextValue,
      httpGraphQLRequest: {
        method: req.method || 'POST',
        headers: new Map(Object.entries(req.headers).map(([k, v]) => [k, Array.isArray(v) ? v.join(',') : String(v || '')])) as any,
        search: req.url?.includes('?') ? req.url.substring(req.url.indexOf('?')) : '',
        body: requestBody
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
