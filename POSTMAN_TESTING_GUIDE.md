# Testing SmartBI File Analysis with Postman

## Prerequisites

1. **Start the SmartBI server**:
   ```bash
   npm run dev
   ```
   Server should be running on `http://localhost:4000`

2. **Import Postman Collection**:
   - Open Postman
   - Click "Import" → "Upload Files"
   - Select `testing/SmartBI-File-Analysis.postman_collection.json`

## Step-by-Step Testing Guide

### Step 1: Authentication
First, you need to get an authentication token.

**Request**: `POST /graphql` - Get Auth Token
```graphql
mutation Login($email: String!, $password: String!) {
  login(email: $email, password: $password) {
    token
    user {
      id
      email
      name
    }
  }
}
```

**Variables**:
```json
{
  "email": "your_email@example.com",
  "password": "your_password"
}
```

**Expected Response**:
```json
{
  "data": {
    "login": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "user": {
        "id": "user-uuid",
        "email": "your_email@example.com",
        "name": "Your Name"
      }
    }
  }
}
```

⚠️ **Important**: Copy the `token` value and add it to the Authorization header for all subsequent requests:
- Header: `Authorization`
- Value: `Bearer your_token_here`

### Step 2: Test File Upload with CSV Data

**Request**: `POST /graphql` - Upload CSV File
```
Content-Type: multipart/form-data
```

**Form Data**:
- `operations`: 
```json
{
  "query": "mutation UploadAndAnalyzeFile($file: Upload!, $analysisType: AnalysisType) { uploadAndAnalyzeFile(file: $file, analysisType: $analysisType) { id fileName fileType fileSize status analysisReport { id summary insights { type content confidence } } } }",
  "variables": {
    "file": null,
    "analysisType": "REVENUE_ANALYSIS"
  }
}
```
- `map`: 
```json
{"0": ["variables.file"]}
```
- `0`: [Select file] → Choose `testing/sample_revenue_data.csv`

**Expected Response**:
```json
{
  "data": {
    "uploadAndAnalyzeFile": {
      "id": "file-uuid",
      "fileName": "sample_revenue_data.csv",
      "fileType": "CSV",
      "fileSize": 2048,
      "status": "COMPLETED",
      "analysisReport": {
        "id": "report-uuid",
        "summary": "Revenue analysis shows strong performance across all product categories...",
        "insights": [
          {
            "type": "REVENUE_TREND",
            "content": "Product A shows 15% growth trend over the analyzed period",
            "confidence": 0.92
          }
        ]
      }
    }
  }
}
```

### Step 3: Test SQL File Analysis

**Request**: `POST /graphql` - Upload SQL File
- Use the same format as Step 2
- Change `analysisType` to `"SQL_OPTIMIZATION"`
- Upload file: `testing/sample_sql_analysis.sql`

**Expected Response**:
```json
{
  "data": {
    "uploadAndAnalyzeFile": {
      "id": "sql-file-uuid",
      "fileName": "sample_sql_analysis.sql",
      "fileType": "SQL",
      "status": "COMPLETED",
      "analysisReport": {
        "summary": "SQL analysis reveals multiple optimization opportunities...",
        "insights": [
          {
            "type": "TABLE_STRUCTURE",
            "content": "Consider adding indexes on frequently queried columns",
            "confidence": 0.88
          }
        ]
      }
    }
  }
}
```

### Step 4: Test JSON Financial Data

**Request**: `POST /graphql` - Upload JSON File
- Use the same format as Step 2
- Change `analysisType` to `"FINANCIAL_ANALYSIS"`
- Upload file: `testing/sample_financial_data.json`

### Step 5: Get Detailed Analysis Report

Once you have a report ID from any upload, you can get detailed analysis:

**Request**: `POST /graphql` - Get Analysis Report
```graphql
query GetAnalysisReport($reportId: ID!) {
  getAnalysisReport(reportId: $reportId) {
    id
    title
    summary
    status
    insights {
      id
      type
      title
      description
      confidence
      importance
      metadata
    }
    visualizations {
      id
      type
      title
      description
      data
      config
    }
    recommendations
    createdAt
  }
}
```

**Variables**:
```json
{
  "reportId": "your-report-id-from-step-2"
}
```

### Step 6: Export Report

**Request**: `POST /graphql` - Export Report
```graphql
mutation ExportReport($reportId: ID!, $format: ReportFormat!) {
  exportReport(reportId: $reportId, format: $format) {
    id
    downloadUrl
    fileName
    format
    fileSize
    expiresAt
  }
}
```

**Variables**:
```json
{
  "reportId": "your-report-id",
  "format": "PDF"
}
```

**Available formats**: `PDF`, `EXCEL`, `JSON`, `HTML`

### Step 7: List All File Uploads

**Request**: `POST /graphql` - List File Uploads
```graphql
query ListFileUploads($limit: Int, $offset: Int) {
  listFileUploads(limit: $limit, offset: $offset) {
    id
    fileName
    fileType
    fileSize
    uploadedAt
    status
  }
}
```

**Variables**:
```json
{
  "limit": 10,
  "offset": 0
}
```

## Testing Different File Types

### CSV Files - Revenue Analysis
- **File**: `sample_revenue_data.csv`
- **Analysis Type**: `REVENUE_ANALYSIS`
- **Expected Insights**: Revenue trends, product performance, regional analysis

### SQL Files - Query Optimization
- **File**: `sample_sql_analysis.sql`
- **Analysis Type**: `SQL_OPTIMIZATION`
- **Expected Insights**: Query optimization, index suggestions, performance improvements

### JSON Files - Financial Analysis
- **File**: `sample_financial_data.json`
- **Analysis Type**: `FINANCIAL_ANALYSIS`
- **Expected Insights**: Financial ratios, KPIs, cash flow analysis

## Troubleshooting

### Common Issues:

1. **Authentication Error (401)**
   ```json
   {
     "errors": [
       {
         "message": "Authentication required",
         "extensions": { "code": "UNAUTHENTICATED" }
       }
     ]
   }
   ```
   **Solution**: Ensure you have the `Authorization: Bearer <token>` header set

2. **File Upload Error**
   ```json
   {
     "errors": [
       {
         "message": "File upload failed",
         "extensions": { "code": "BAD_USER_INPUT" }
       }
     ]
   }
   ```
   **Solution**: Check file format and ensure proper multipart/form-data setup

3. **AI Analysis Disabled**
   ```json
   {
     "data": {
       "uploadAndAnalyzeFile": {
         "status": "COMPLETED",
         "analysisReport": {
           "summary": "File uploaded successfully. AI analysis disabled - GEMINI_API_KEY not configured."
         }
       }
     }
   }
   ```
   **Solution**: Add `GEMINI_API_KEY` to your `.env` file for AI-powered analysis

### GraphQL Endpoint Testing

**Base URL**: `http://localhost:4000/graphql`

**Headers for all requests**:
```
Content-Type: application/json  (for GraphQL queries)
Content-Type: multipart/form-data  (for file uploads)
Authorization: Bearer <your-jwt-token>
```

## Advanced Testing

### Test with Large Files
1. Create a large CSV file (>5MB)
2. Test upload performance and chunking
3. Verify memory usage during processing

### Test Multiple File Formats
1. Upload Excel files (.xlsx)
2. Upload PDF documents
3. Upload XML configuration files
4. Test unsupported formats (should return appropriate errors)

### Test Analysis Types
- `GENERAL_ANALYSIS` - General file analysis
- `REVENUE_ANALYSIS` - Focus on financial metrics
- `SQL_OPTIMIZATION` - Database query optimization
- `FINANCIAL_ANALYSIS` - Comprehensive financial analysis
- `DATA_QUALITY` - Data quality assessment

## Expected Performance
- **Small files (<1MB)**: Analysis should complete in 2-5 seconds
- **Medium files (1-10MB)**: Analysis should complete in 10-30 seconds
- **Large files (>10MB)**: May take 1-3 minutes depending on complexity

## Success Criteria
✅ File uploads without errors  
✅ Analysis reports generated  
✅ Insights extracted with confidence scores  
✅ Visualizations suggested  
✅ Reports can be exported in multiple formats  
✅ All file types supported  

---

**Note**: If AI analysis is not working, the system will still process files and provide basic metadata analysis. For full AI-powered insights, ensure your `GEMINI_API_KEY` is configured in the environment.