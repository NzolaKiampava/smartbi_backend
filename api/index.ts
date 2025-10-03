// Simple types for Vercel runtime
interface VercelRequest {
  method?: string;
  url?: string;
}

interface VercelResponse {
  writeHead(statusCode: number, headers?: Record<string, string>): void;
  end(data?: string): void;
}

export default function handler(_req: VercelRequest, res: VercelResponse) {
  // Configure CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (_req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    success: true,
    service: 'SmartBI Backend',
    message: 'Welcome to SmartBI Backend API',
    graphqlEndpoint: '/api/graphql',
    health: '/api/health',
    docs: 'POST /api/graphql with { query, variables } JSON body. Include Authorization: Bearer <token> when required.'
  }));
}
