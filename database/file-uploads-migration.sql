-- File Uploads Table and Storage Setup
-- Run this in Supabase SQL Editor
-- NOTE: If you already have 'file-uploads' table, skip the CREATE TABLE part

-- Create file-uploads table for metadata (ONLY IF NOT EXISTS)
CREATE TABLE IF NOT EXISTS "file-uploads" (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  original_name VARCHAR NOT NULL,
  mimetype VARCHAR NOT NULL,
  encoding VARCHAR DEFAULT 'base64',
  size INT4 NOT NULL,
  path TEXT NOT NULL,
  file_type VARCHAR NOT NULL,
  uploaded_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_file_uploads_uploaded_at ON "file-uploads"(uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_file_uploads_original_name ON "file-uploads"(original_name);
CREATE INDEX IF NOT EXISTS idx_file_uploads_file_type ON "file-uploads"(file_type);

-- Enable Row Level Security
ALTER TABLE "file-uploads" ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Allow anyone to insert file metadata (since upload is public)
CREATE POLICY "Allow public inserts on file-uploads"
ON "file-uploads" FOR INSERT
WITH CHECK (true);

-- Allow anyone to read file metadata
CREATE POLICY "Allow public reads on file-uploads"
ON "file-uploads" FOR SELECT
USING (true);

-- Only authenticated users can delete
CREATE POLICY "Allow authenticated deletes on file-uploads"
ON "file-uploads" FOR DELETE
USING (auth.role() = 'authenticated');

-- Storage bucket policies (Note: These need to be created in Storage UI or via API)
-- The bucket 'file-uploads' should be created as PUBLIC with 50MB limit
-- 
-- You can create the bucket policies in SQL Editor:

-- Policy: Allow public uploads to file-uploads bucket
INSERT INTO storage.policies (bucket_id, name, definition)
VALUES (
  'file-uploads',
  'Allow public uploads',
  'bucket_id = ''file-uploads'''
)
ON CONFLICT DO NOTHING;

-- Policy: Allow public downloads from file-uploads bucket
INSERT INTO storage.policies (bucket_id, name, definition)
VALUES (
  'file-uploads',
  'Allow public downloads',
  'bucket_id = ''file-uploads'''
)
ON CONFLICT DO NOTHING;

-- Policy: Allow authenticated users to delete files
INSERT INTO storage.policies (bucket_id, name, definition)
VALUES (
  'file-uploads',
  'Allow authenticated deletes',
  'bucket_id = ''file-uploads'' AND auth.role() = ''authenticated'''
)
ON CONFLICT DO NOTHING;

-- Verify tables and policies
SELECT 
  'file-uploads table' as object_type,
  COUNT(*) as count 
FROM information_schema.tables 
WHERE table_name = 'file-uploads';

SELECT 
  'file-uploads policies' as object_type,
  COUNT(*) as count 
FROM pg_policies 
WHERE tablename = 'file-uploads';
