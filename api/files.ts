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

// Helper function to add CORS headers to any response
function addCorsHeaders(headers: Record<string, string>, corsHeaders: Record<string, string>): Record<string, string> {
  return { ...corsHeaders, ...headers };
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
  
  console.log('🌐 Request method:', req.method);
  console.log('🌐 Origin:', origin);
  console.log('🌐 Allowed origins:', allowedOrigins);
  
  // Prepare CORS headers
  const corsHeaders: Record<string, string> = {
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept, Origin, Content-Disposition',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400'
  };
  
  // Set Access-Control-Allow-Origin
  if (origin && (allowedOrigins.includes(origin) || origin.includes('localhost'))) {
    corsHeaders['Access-Control-Allow-Origin'] = origin;
    console.log('✅ Origin allowed:', origin);
  } else {
    // For production, using wildcard for compatibility
    corsHeaders['Access-Control-Allow-Origin'] = '*';
    console.log('⚠️ Using wildcard for origin:', origin);
  }

  // Handle preflight OPTIONS request for all routes
  if (req.method === 'OPTIONS') {
    console.log('🔍 OPTIONS preflight request');
    console.log('📤 Sending CORS headers:', corsHeaders);
    
    // Return 200 status for preflight (not 204)
    res.writeHead(200, corsHeaders);
    res.end();
    return;
  }

  // Initialize Supabase client
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    res.writeHead(500, addCorsHeaders({ 'Content-Type': 'application/json' }, corsHeaders));
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
        res.writeHead(500, addCorsHeaders({ 'Content-Type': 'application/json' }, corsHeaders));
        res.end(JSON.stringify({
          success: false,
          message: 'Failed to fetch files',
          error: error.message
        }));
        return;
      }

      res.writeHead(200, addCorsHeaders({ 'Content-Type': 'application/json' }, corsHeaders));
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
      
      console.log('📥 Download request for file ID:', fileId);

      // Get file metadata from database
      const { data: fileRecord, error: dbError } = await supabase
        .from('file_uploads')
        .select('*')
        .eq('id', fileId)
        .single();

      if (dbError || !fileRecord) {
        console.log('❌ File not found in database:', fileId);
        res.writeHead(404, addCorsHeaders({ 'Content-Type': 'application/json' }, corsHeaders));
        res.end(JSON.stringify({
          success: false,
          message: 'File not found'
        }));
        return;
      }

      console.log('✅ File found:', fileRecord.filename);

      // Download file from Supabase Storage
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('file-uploads')
        .download(fileRecord.filename);

      if (downloadError || !fileData) {
        console.error('❌ Storage download error:', downloadError);
        res.writeHead(500, addCorsHeaders({ 'Content-Type': 'application/json' }, corsHeaders));
        res.end(JSON.stringify({
          success: false,
          message: 'Failed to download file from storage',
          error: downloadError?.message
        }));
        return;
      }

      console.log('✅ File downloaded from storage, size:', fileData.size);

      // Convert Blob to Buffer
      const arrayBuffer = await fileData.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Set all headers including CORS before writeHead
      const headers: Record<string, string> = {
        'Content-Type': fileRecord.mimetype || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${fileRecord.original_name}"`,
        'Content-Length': buffer.length.toString()
      };

      // Add CORS headers for download
      if (allowedOrigins.includes(origin) || origin?.includes('localhost')) {
        headers['Access-Control-Allow-Origin'] = origin;
      } else {
        headers['Access-Control-Allow-Origin'] = '*';
      }
      headers['Access-Control-Allow-Credentials'] = 'true';
      
      res.writeHead(200, headers);
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
          res.writeHead(404, addCorsHeaders({ 'Content-Type': 'application/json' }, corsHeaders));
          res.end(JSON.stringify({
            success: false,
            message: 'File not found'
          }));
          return;
        }

        res.writeHead(500, addCorsHeaders({ 'Content-Type': 'application/json' }, corsHeaders));
        res.end(JSON.stringify({
          success: false,
          message: 'Failed to fetch file',
          error: error.message
        }));
        return;
      }

      res.writeHead(200, addCorsHeaders({ 'Content-Type': 'application/json' }, corsHeaders));
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
        res.writeHead(404, addCorsHeaders({ 'Content-Type': 'application/json' }, corsHeaders));
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
        res.writeHead(500, addCorsHeaders({ 'Content-Type': 'application/json' }, corsHeaders));
        res.end(JSON.stringify({
          success: false,
          message: 'Failed to delete file record',
          error: dbError.message
        }));
        return;
      }

      res.writeHead(200, addCorsHeaders({ 'Content-Type': 'application/json' }, corsHeaders));
      res.end(JSON.stringify({
        success: true,
        message: 'File deleted successfully',
        data: { id: fileId }
      }));
      return;
    }

    // Route not found
    res.writeHead(404, addCorsHeaders({ 'Content-Type': 'application/json' }, corsHeaders));
    res.end(JSON.stringify({
      success: false,
      message: 'Route not found. Available routes: GET /api/files, GET /api/files/:id, GET /api/files/:id/download, DELETE /api/files/:id'
    }));

  } catch (error: any) {
    console.error('Files handler error:', error);
    res.writeHead(500, addCorsHeaders({ 'Content-Type': 'application/json' }, corsHeaders));
    res.end(JSON.stringify({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error?.message : undefined
    }));
  }
}
