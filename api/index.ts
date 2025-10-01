import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.status(200).json({
    success: true,
    service: 'SmartBI Backend',
    message: 'Welcome to SmartBI Backend API',
    graphqlEndpoint: '/api/graphql',
    health: '/api/health',
    docs: 'POST /api/graphql with { query, variables } JSON body. Include Authorization: Bearer <token> when required.'
  });
}
