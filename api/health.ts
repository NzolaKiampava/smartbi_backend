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
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    status: 'healthy',
    timestamp: new Date().toISOString(),
  }));
}
