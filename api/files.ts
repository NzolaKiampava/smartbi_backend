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
  const allowedOrigins = [
    'https://smartbi-rcs.vercel.app',
    'https://smartbi-frontend.vercel.app',
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:5174',
    process.env.FRONTEND_URL,
  ].filter(Boolean) as string[];

  const originHeader = req.headers.origin;
  const origin = Array.isArray(originHeader) ? originHeader[0] : originHeader;

  const acrHeaders = req.headers['access-control-request-headers'];
  const requestedHeaders = Array.isArray(acrHeaders) ? acrHeaders.join(', ') : acrHeaders;

  const defaultAllowedHeaders = 'Content-Type, Authorization, X-Requested-With, Accept, Origin, Content-Disposition, Range, If-Modified-Since, If-None-Match';

  const corsHeaders: Record<string, string> = {
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': requestedHeaders || defaultAllowedHeaders,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Expose-Headers': 'Content-Disposition, Content-Length',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };

  const isAllowedOrigin = origin && (allowedOrigins.includes(origin) || origin.includes('localhost'));
  corsHeaders['Access-Control-Allow-Origin'] = isAllowedOrigin ? origin! : 'https://smartbi-rcs.vercel.app';

  console.log('🌐 Request method:', req.method);
  console.log('🌐 Origin:', origin);
  console.log('🌐 Allowed origins:', allowedOrigins);
  console.log('🌐 Access-Control-Request-Headers:', requestedHeaders);
  console.log('🌐 Using Access-Control-Allow-Origin:', corsHeaders['Access-Control-Allow-Origin']);
  console.log('🌐 Using Access-Control-Allow-Headers:', corsHeaders['Access-Control-Allow-Headers']);

  const sendJson = (status: number, payload: Record<string, unknown>) => {
    res.writeHead(status, {
      ...corsHeaders,
      'Content-Type': 'application/json',
    });
    res.end(JSON.stringify(payload));
  };

  // Handle OPTIONS request first
  if (req.method === 'OPTIONS') {
    res.writeHead(200, corsHeaders);
    res.end();
    return;
  }

  // Set CORS headers for all responses
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  // Initialize Supabase client
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    sendJson(500, {
      success: false,
      message: 'Supabase configuration missing',
    });
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
  const hostHeader = req.headers.host;
  const host = Array.isArray(hostHeader) ? hostHeader[0] : hostHeader || 'localhost';
  const url = new URL(req.url || '/', `http://${host}`);
    const pathParts = url.pathname.split('/').filter(Boolean);
    
    console.log('🔍 Request path:', pathParts);
    console.log('🔍 Request method:', req.method);

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

      if (fileType && fileType !== 'ALL') {
        query = query.eq('file_type', fileType);
      }

      const { data: files, error, count } = await query;

      if (error) {
        console.error('Database query error:', error);
        sendJson(500, {
          success: false,
          message: 'Failed to fetch files',
          error: error.message,
        });
        return;
      }

      sendJson(200, {
        success: true,
        data: {
          files: files || [],
          total: count || 0,
          limit,
          offset,
          hasMore: (count || 0) > offset + limit,
        },
      });
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
        sendJson(404, {
          success: false,
          message: 'File not found',
        });
        return;
      }

      console.log('✅ File found:', fileRecord.filename);

      // Download file from Supabase Storage
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('file-uploads')
        .download(fileRecord.filename);

      if (downloadError || !fileData) {
        console.error('❌ Storage download error:', downloadError);
        sendJson(500, {
          success: false,
          message: 'Failed to download file from storage',
          error: downloadError?.message,
        });
        return;
      }

      console.log('✅ File downloaded from storage, size:', fileData.size);

      // Convert Blob to Buffer
      const arrayBuffer = await fileData.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Set download headers
      const downloadHeaders = {
        'Content-Type': fileRecord.mimetype || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${fileRecord.original_name}"`,
        'Content-Length': buffer.length.toString(),
        ...corsHeaders
      };

      res.writeHead(200, downloadHeaders);
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
          sendJson(404, {
            success: false,
            message: 'File not found',
          });
          return;
        }

        sendJson(500, {
          success: false,
          message: 'Failed to fetch file',
          error: error.message,
        });
        return;
      }

      sendJson(200, {
        success: true,
        data: fileRecord,
      });
      return;
    }

    // DELETE /api/files/:id - Delete a file
    if (req.method === 'DELETE' && pathParts.length === 3 && pathParts[0] === 'api' && pathParts[1] === 'files') {
      const fileId = pathParts[2];

      const { data: fileRecord, error: fetchError } = await supabase
        .from('file_uploads')
        .select('*')
        .eq('id', fileId)
        .single();

      if (fetchError || !fileRecord) {
        sendJson(404, {
          success: false,
          message: 'File not found',
        });
        return;
      }

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('file-uploads')
        .remove([fileRecord.filename]);

      if (storageError) {
        console.error('Storage delete error:', storageError);
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('file_uploads')
        .delete()
        .eq('id', fileId);

      if (dbError) {
        console.error('Database delete error:', dbError);
        sendJson(500, {
          success: false,
          message: 'Failed to delete file record',
          error: dbError.message,
        });
        return;
      }

      sendJson(200, {
        success: true,
        message: 'File deleted successfully',
        data: { id: fileId },
      });
      return;
    }

    // Route not found
    sendJson(404, {
      success: false,
      message: 'Route not found',
    });

  } catch (error: any) {
    console.error('Files handler error:', error);
    sendJson(500, {
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error?.message : undefined,
    });
  }
}