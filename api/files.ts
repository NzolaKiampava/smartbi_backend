import { createClient } from '@supabase/supabase-js';

// Simple types for Vercel runtime
interface VercelRequest {
  method?: string;
  url?: string;
  headers: Record<string, string | string[] | undefined>;
  query?: Record<string, string | string[]>;
  body?: any;
}

interface VercelResponse {
  writeHead(statusCode: number, headers?: Record<string, string>): void;
  end(data?: string | Buffer): void;
  setHeader(name: string, value: string): void;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Configure CORS headers
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:5174',
    'https://smartbi-frontend.vercel.app',
    'https://smartbi-rcs.vercel.app',
    process.env.FRONTEND_URL
  ].filter(Boolean);

  const origin = req.headers.origin as string;
  if (allowedOrigins.includes(origin) || origin?.includes('localhost')) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Initialize Supabase client
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: false,
      message: 'Supabase configuration missing'
    }));
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const pathParts = url.pathname.split('/').filter(Boolean);
    
    // GET /api/files - List all uploaded files
    if (req.method === 'GET' && pathParts.length === 2 && pathParts[0] === 'api' && pathParts[1] === 'files') {
      const limit = parseInt(url.searchParams.get('limit') || '50');
      const offset = parseInt(url.searchParams.get('offset') || '0');
      const fileType = url.searchParams.get('fileType');

      let query = supabase
        .from('file_uploads')
        .select('*', { count: 'exact' })
        .order('uploaded_at', { ascending: false })
        .range(offset, offset + limit - 1);

      // Filter by file type if provided
      if (fileType && fileType !== 'ALL') {
        query = query.eq('file_type', fileType);
      }

      const { data: files, error, count } = await query;

      if (error) {
        console.error('Database query error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          message: 'Failed to fetch files',
          error: error.message
        }));
        return;
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        data: {
          files: files || [],
          total: count || 0,
          limit,
          offset,
          hasMore: (count || 0) > offset + limit
        }
      }));
      return;
    }

    // GET /api/files/:id/download - Download a specific file
    if (req.method === 'GET' && pathParts.length === 4 && pathParts[0] === 'api' && pathParts[1] === 'files' && pathParts[3] === 'download') {
      const fileId = pathParts[2];

      // Get file metadata from database
      const { data: fileRecord, error: dbError } = await supabase
        .from('file_uploads')
        .select('*')
        .eq('id', fileId)
        .single();

      if (dbError || !fileRecord) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          message: 'File not found'
        }));
        return;
      }

      // Download file from Supabase Storage
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('file-uploads')
        .download(fileRecord.filename);

      if (downloadError || !fileData) {
        console.error('Storage download error:', downloadError);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          message: 'Failed to download file from storage',
          error: downloadError?.message
        }));
        return;
      }

      // Convert Blob to Buffer
      const arrayBuffer = await fileData.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Set appropriate headers for file download
      res.setHeader('Content-Type', fileRecord.mimetype || 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${fileRecord.original_name}"`);
      res.setHeader('Content-Length', buffer.length.toString());
      
      res.writeHead(200);
      res.end(buffer);
      return;
    }

    // GET /api/files/:id - Get file metadata
    if (req.method === 'GET' && pathParts.length === 3 && pathParts[0] === 'api' && pathParts[1] === 'files') {
      const fileId = pathParts[2];

      const { data: fileRecord, error } = await supabase
        .from('file_uploads')
        .select('*')
        .eq('id', fileId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            message: 'File not found'
          }));
          return;
        }

        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          message: 'Failed to fetch file',
          error: error.message
        }));
        return;
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        data: fileRecord
      }));
      return;
    }

    // DELETE /api/files/:id - Delete a file
    if (req.method === 'DELETE' && pathParts.length === 3 && pathParts[0] === 'api' && pathParts[1] === 'files') {
      const fileId = pathParts[2];

      // Get file metadata
      const { data: fileRecord, error: fetchError } = await supabase
        .from('file_uploads')
        .select('*')
        .eq('id', fileId)
        .single();

      if (fetchError || !fileRecord) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          message: 'File not found'
        }));
        return;
      }

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('file-uploads')
        .remove([fileRecord.filename]);

      if (storageError) {
        console.error('Storage delete error:', storageError);
        // Continue anyway, we'll delete the database record
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('file_uploads')
        .delete()
        .eq('id', fileId);

      if (dbError) {
        console.error('Database delete error:', dbError);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          message: 'Failed to delete file record',
          error: dbError.message
        }));
        return;
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        message: 'File deleted successfully',
        data: { id: fileId }
      }));
      return;
    }

    // Route not found
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: false,
      message: 'Route not found. Available routes: GET /api/files, GET /api/files/:id, GET /api/files/:id/download, DELETE /api/files/:id'
    }));

  } catch (error: any) {
    console.error('Files handler error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error?.message : undefined
    }));
  }
}
