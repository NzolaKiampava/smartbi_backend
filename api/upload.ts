import { createClient } from '@supabase/supabase-js';

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

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Configure CORS headers
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:5174',
    'https://smartbi-frontend.vercel.app',
    process.env.FRONTEND_URL
  ].filter(Boolean);

  const origin = req.headers.origin as string;
  if (allowedOrigins.includes(origin) || origin?.includes('localhost')) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      success: false, 
      message: 'Method not allowed. Use POST for file uploads.' 
    }));
    return;
  }

  try {
    const { fileContent, fileName, mimeType, analysisOptions } = req.body;

    if (!fileContent || !fileName) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        success: false, 
        message: 'Missing required fields: fileContent, fileName' 
      }));
      return;
    }

    // Decode base64 file content
    const buffer = Buffer.from(fileContent, 'base64');

    // Initialize Supabase client
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!
    );

    // Check if bucket exists, create if not
    const BUCKET_NAME = 'file-uploads';
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(bucket => bucket.name === BUCKET_NAME);
    
    if (!bucketExists) {
      console.log(`Bucket '${BUCKET_NAME}' not found. Creating...`);
      const { error: createError } = await supabase.storage.createBucket(BUCKET_NAME, {
        public: true,
        fileSizeLimit: 52428800, // 50MB
        allowedMimeTypes: [
          'text/csv',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/pdf',
          'application/json',
          'text/plain',
          'application/xml',
          'text/xml',
          'application/sql'
        ]
      });
      
      if (createError) {
        console.error('Failed to create bucket:', createError);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          success: false, 
          message: 'Storage bucket setup failed. Please create "file-uploads" bucket manually in Supabase Dashboard.',
          error: createError.message 
        }));
        return;
      }
      console.log(`Bucket '${BUCKET_NAME}' created successfully`);
    }

    // Generate unique filename - sanitize to remove special characters
    const timestamp = Date.now();
    const fileExt = fileName.split('.').pop()?.toLowerCase() || 'unknown';
    
    // Sanitize filename: remove accents, spaces, and special characters
    const sanitizedName = fileName
      .normalize('NFD') // Decompose accented characters
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
      .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace special chars with underscore
      .replace(/_{2,}/g, '_'); // Replace multiple underscores with single
    
    const uniqueFileName = `${timestamp}-${sanitizedName}`;
    
    // Map file extension to FileType enum values
    const fileTypeMap: Record<string, string> = {
      'csv': 'CSV',
      'xlsx': 'EXCEL',
      'xls': 'EXCEL',
      'pdf': 'PDF',
      'sql': 'SQL',
      'json': 'JSON',
      'txt': 'TXT',
      'xml': 'XML'
    };
    
    const fileType = fileTypeMap[fileExt] || 'OTHER';
    
    console.log(`📋 File processing:`, {
      fileName,
      fileExt,
      fileType,
      uniqueFileName
    });
    
    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(uniqueFileName, buffer, {
        contentType: mimeType || 'application/octet-stream',
        upsert: false
      });

    if (uploadError) {
      console.error('Supabase upload error:', uploadError);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        success: false, 
        message: 'File upload to storage failed',
        error: uploadError.message 
      }));
      return;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(uniqueFileName);

    // Save file metadata to database
    // Note: Table name is 'file_uploads' (with underscore)
    const { data: fileRecord, error: dbError } = await supabase
      .from('file_uploads')  // Use underscore, not hyphen
      .insert({
        original_name: fileName,
        mimetype: mimeType || 'application/octet-stream',
        encoding: 'base64',
        size: buffer.length,
        path: urlData.publicUrl,
        file_type: fileType, // Use mapped enum value (CSV, EXCEL, PDF, etc.)
        metadata: {
          sanitized_filename: uniqueFileName,
          upload_timestamp: timestamp
        }
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database insert error:', dbError);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        success: false, 
        message: 'Failed to save file metadata',
        error: dbError.message 
      }));
      return;
    }

    // Return success response
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      fileId: fileRecord.id,
      fileName: uniqueFileName,
      originalName: fileName,
      size: buffer.length,
      url: urlData.publicUrl,
      message: 'File uploaded successfully. Use fileId with GraphQL analyzeUploadedFile mutation.'
    }));

  } catch (error: any) {
    console.error('Upload handler error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      success: false, 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error?.message : undefined 
    }));
  }
}
