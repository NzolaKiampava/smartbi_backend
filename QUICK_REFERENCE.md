# 🚀 Quick Reference - File Management API

## REST API Endpoints

### List Files
```bash
GET /api/files?limit=50&offset=0&fileType=CSV
```

### Get File Metadata
```bash
GET /api/files/:id
```

### Download File
```bash
GET /api/files/:id/download
```

### Delete File
```bash
DELETE /api/files/:id
```

---

## Frontend Integration Examples

### React/TypeScript

```typescript
// List files
const listFiles = async (limit = 50, offset = 0, fileType?: string) => {
  const params = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString(),
    ...(fileType && { fileType })
  });
  
  const response = await fetch(`/api/files?${params}`);
  return await response.json();
  // Returns: { files: [], total: 100, limit: 50, offset: 0, hasMore: true }
};

// Download file
const downloadFile = async (fileId: string, originalName: string) => {
  const response = await fetch(`/api/files/${fileId}/download`);
  const blob = await response.blob();
  
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = originalName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
};

// Delete file
const deleteFile = async (fileId: string) => {
  const response = await fetch(`/api/files/${fileId}`, {
    method: 'DELETE'
  });
  return await response.json();
  // Returns: { success: true, message: "...", fileId: "..." }
};
```

---

## GraphQL Queries/Mutations

### List Files
```graphql
query ListFiles($limit: Int, $offset: Int, $fileType: FileType) {
  listFileUploads(limit: $limit, offset: $offset, fileType: $fileType) {
    files {
      id
      originalName
      fileType
      size
      uploadedAt
    }
    total
    hasMore
  }
}
```

### Get File
```graphql
query GetFile($id: ID!) {
  getFileUpload(id: $id) {
    id
    filename
    originalName
    mimetype
    size
    fileType
    path
    uploadedAt
    metadata
  }
}
```

### Update Metadata
```graphql
mutation UpdateMetadata($id: ID!, $metadata: JSON!) {
  updateFileMetadata(id: $id, metadata: $metadata) {
    id
    metadata
  }
}
```

### Delete File
```graphql
mutation DeleteFile($id: ID!) {
  deleteFileUpload(id: $id)
}
```

---

## File Types

```typescript
enum FileType {
  CSV = 'CSV',
  EXCEL = 'EXCEL',
  PDF = 'PDF',
  SQL = 'SQL',
  JSON = 'JSON',
  TXT = 'TXT',
  XML = 'XML',
  OTHER = 'OTHER'
}
```

---

## Response Structure

### File Object
```typescript
{
  id: string;
  filename: string;
  original_name: string;
  mimetype: string;
  size: number;
  file_type: FileType;
  path: string;
  uploaded_at: string;
  metadata: Record<string, any>;
}
```

### List Response
```typescript
{
  files: File[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}
```

---

## Testing

### Import Postman Collection
```
testing/SmartBI-FileManagement.postman_collection.json
```

### Variables
- `baseUrl`: `http://localhost:3000` or `https://smartbi-backend-psi.vercel.app`
- `fileId`: Auto-populated from first test

### Run All Tests
15 automated tests covering:
- ✅ List with pagination
- ✅ Filter by file type
- ✅ Get metadata
- ✅ Download file
- ✅ Delete file
- ✅ Error cases (404)
- ✅ GraphQL queries/mutations

---

## Common Use Cases

### Paginated File List with Filter
```typescript
const [files, setFiles] = useState<File[]>([]);
const [hasMore, setHasMore] = useState(false);
const [page, setPage] = useState(0);
const limit = 20;

const loadFiles = async (fileType?: string) => {
  const data = await listFiles(limit, page * limit, fileType);
  setFiles(data.files);
  setHasMore(data.hasMore);
};

// Load CSV files only
useEffect(() => {
  loadFiles('CSV');
}, [page]);
```

### File Download with Progress
```typescript
const downloadWithProgress = async (fileId: string, name: string) => {
  const response = await fetch(`/api/files/${fileId}/download`);
  const reader = response.body!.getReader();
  const contentLength = +response.headers.get('Content-Length')!;
  
  let receivedLength = 0;
  const chunks: Uint8Array[] = [];
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    chunks.push(value);
    receivedLength += value.length;
    
    const progress = (receivedLength / contentLength) * 100;
    console.log(`Download progress: ${progress.toFixed(2)}%`);
  }
  
  const blob = new Blob(chunks);
  // Save blob as file...
};
```

### Delete with Confirmation
```typescript
const deleteWithConfirmation = async (file: File) => {
  if (!confirm(`Delete ${file.original_name}?`)) return;
  
  try {
    const result = await deleteFile(file.id);
    if (result.success) {
      alert('File deleted successfully!');
      // Refresh file list
      loadFiles();
    }
  } catch (error) {
    alert('Failed to delete file');
  }
};
```

---

## CORS Configuration

### Allowed Origins
- `https://smartbi-rcs.vercel.app`
- `http://localhost:3000`
- `http://localhost:5173`
- `http://localhost:5174`

### Add New Origin
Edit `api/files.ts` line ~25:
```typescript
const allowedOrigins = [
  'https://smartbi-rcs.vercel.app',
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5174',
  'https://your-new-domain.com' // Add here
];
```

---

## Troubleshooting

### Error: "Missing SUPABASE_SERVICE_ROLE_KEY"
➜ Add environment variable in Vercel

### Error: "File not found"
➜ Check file exists in Supabase Storage UI
➜ Verify bucket name is `file-uploads`

### Error: "CORS policy"
➜ Add your frontend domain to `allowedOrigins`

### Download returns JSON instead of file
➜ Use `/api/files/:id/download` not `/api/files/:id`

---

## Performance Tips

- Use pagination with `limit=50` for best performance
- Cache file list in frontend state
- Use GraphQL for complex queries, REST for downloads
- Set up CDN for production file downloads

---

For full documentation, see:
- `testing/FILE_MANAGEMENT_TESTING_GUIDE.md`
- `IMPLEMENTATION_SUMMARY.md`
- `PRODUCTION_SETUP.md`
