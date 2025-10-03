# File Upload and Analysis - Serverless Architecture

## Overview

Due to limitations with GraphQL multipart uploads in Vercel's serverless environment, we've implemented a two-step process for file uploads and analysis.

## Architecture

### Step 1: Upload File (REST API)
**Endpoint:** `POST /api/upload`

**Request:**
```json
{
  "fileContent": "base64_encoded_file_content",
  "fileName": "example.csv",
  "mimeType": "text/csv",
  "analysisOptions": {
    "analyzeRevenue": true,
    "analyzeTrends": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "fileId": "uuid-here",
  "fileName": "timestamp-example.csv",
  "originalName": "example.csv",
  "size": 12345,
  "url": "https://supabase-storage-url/...",
  "message": "File uploaded successfully. Use fileId with GraphQL analyzeUploadedFile mutation."
}
```

### Step 2: Analyze File (GraphQL API)
**Endpoint:** `POST /api/graphql`

**Mutation:**
```graphql
mutation AnalyzeFile($fileId: ID!, $options: AnalysisOptionsInput) {
  analyzeUploadedFile(fileId: $fileId, options: $options) {
    id
    title
    summary
    fileUpload {
      id
      originalName
      fileType
    }
    insights {
      category
      message
      severity
    }
    dataQuality {
      overallScore
      completenessScore
    }
  }
}
```

**Variables:**
```json
{
  "fileId": "uuid-from-step-1",
  "options": {
    "analyzeRevenue": true,
    "analyzeTrends": true,
    "analyzeComparisons": true
  }
}
```

## Frontend Implementation Example

```typescript
async function uploadAndAnalyzeFile(file: File) {
  // Step 1: Convert file to base64 and upload
  const base64Content = await fileToBase64(file);
  
  const uploadResponse = await fetch('https://your-backend.vercel.app/api/upload', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${yourAuthToken}`
    },
    body: JSON.stringify({
      fileContent: base64Content,
      fileName: file.name,
      mimeType: file.type
    })
  });
  
  const uploadData = await uploadResponse.json();
  
  if (!uploadData.success) {
    throw new Error(uploadData.message);
  }
  
  // Step 2: Trigger analysis via GraphQL
  const analysisResponse = await fetch('https://your-backend.vercel.app/api/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${yourAuthToken}`
    },
    body: JSON.stringify({
      query: `
        mutation AnalyzeFile($fileId: ID!, $options: AnalysisOptionsInput) {
          analyzeUploadedFile(fileId: $fileId, options: $options) {
            id
            title
            summary
            insights {
              category
              message
              severity
            }
          }
        }
      `,
      variables: {
        fileId: uploadData.fileId,
        options: {
          analyzeRevenue: true,
          analyzeTrends: true
        }
      }
    })
  });
  
  const analysisData = await analysisResponse.json();
  return analysisData.data.analyzeUploadedFile;
}

// Helper function
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
  });
}
```

## Database Requirements

### Supabase Storage Bucket
Create a bucket named `file-uploads`:
```sql
-- Create storage bucket (run in Supabase SQL Editor)
insert into storage.buckets (id, name, public)
values ('file-uploads', 'file-uploads', true);
```

### Storage Policies
```sql
-- Allow authenticated users to upload
create policy "Authenticated users can upload files"
on storage.objects for insert
to authenticated
with check (bucket_id = 'file-uploads');

-- Allow public read access
create policy "Public read access"
on storage.objects for select
to public
using (bucket_id = 'file-uploads');
```

## Error Handling

### Upload Errors (400)
- Missing `fileContent` or `fileName`
- Invalid base64 encoding
- File too large (>50MB)

### Upload Errors (500)
- Supabase storage upload failed
- Database insert failed

### Analysis Errors (400)
- Invalid `fileId`
- File not found in database

### Analysis Errors (500)
- Gemini AI service unavailable
- File processing failed
- Database save failed

## Notes

- Maximum file size: 50MB
- Supported formats: CSV, Excel, JSON, XML, PDF, TXT
- Files are stored in Supabase Storage
- Metadata is stored in `file_uploads` table
- Analysis results are stored in `analysis_reports` table
- Old `uploadAndAnalyzeFile` mutation still works for local development
