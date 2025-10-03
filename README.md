# smartbi_backend
This is SmartBi backend code

## 🚀 Quick Start

### Prerequisites
- Node.js 20.x or higher
- Supabase account with Storage enabled
- Environment variables configured (see `.env.example`)

### Installation
```bash
npm install
npm run dev  # Start local development server on port 4000
```

### Supabase Storage Setup
⚠️ **IMPORTANT**: Before uploading files, you need to configure Supabase Storage.

See [SUPABASE_STORAGE_SETUP.md](./SUPABASE_STORAGE_SETUP.md) for detailed instructions.

Quick setup:
1. Create bucket `file-uploads` in Supabase Dashboard (Storage → Buckets)
2. Make it **PUBLIC**
3. Run the migration: [database/file-uploads-migration.sql](./database/file-uploads-migration.sql)

## 📁 File Upload Feature

The backend supports file uploads for AI analysis using a 2-step process:

1. **Upload file** → `POST /api/upload` → Returns `fileId`
2. **Analyze file** → GraphQL mutation `analyzeUploadedFile(fileId)` → Returns analysis

### Endpoints

#### REST: `/api/upload`
Upload a file and get a `fileId`:

```bash
curl -X POST http://localhost:4000/api/upload \
  -H "Content-Type: application/json" \
  -d '{
    "fileName": "data.csv",
    "fileContent": "<base64-encoded-content>",
    "mimeType": "text/csv"
  }'
```

Response:
```json
{
  "success": true,
  "fileId": "uuid-here",
  "fileName": "1234567890-data.csv",
  "url": "https://supabase.co/storage/v1/..."
}
```

#### GraphQL: `analyzeUploadedFile`
Analyze an uploaded file:

```graphql
mutation {
  analyzeUploadedFile(fileId: "uuid-here") {
    success
    fileId
    fileName
    summary
    insights
  }
}
```

## Document AI OCR (optional)
- Set `GCP_PROJECT_ID`, `DOCUMENT_AI_LOCATION`, `DOCUMENT_AI_PROCESSOR_ID` in `.env`.
- Provide credentials via `GOOGLE_APPLICATION_CREDENTIALS` (service account JSON path).
- Install deps: npm install (includes `@google-cloud/documentai`).
- If not configured, system falls back to built-in PDF text extraction.

