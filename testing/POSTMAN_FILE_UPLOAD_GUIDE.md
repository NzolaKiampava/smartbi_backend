# Postman File Upload Testing Guide

## Error Explanation
The error "POST body missing, invalid Content-Type, or JSON object has no keys" occurs because GraphQL file uploads require **multipart/form-data** format, not regular JSON.

## Postman Setup for File Upload

### Method 1: Using Form-Data (Recommended)

1. **Set Request Method**: POST
2. **Set URL**: `http://localhost:4000/graphql`
3. **Headers**: 
   - Remove any `Content-Type` header (Postman will set it automatically)
   - Optionally add: `x-apollo-operation-name: UploadAndAnalyzeFile`

4. **Body Configuration**:
   - Select **form-data** (NOT raw JSON)
   - Add these 3 fields:

#### Field 1: operations
- **Key**: `operations`
- **Type**: Text
- **Value**:
```json
{
  "query": "mutation UploadAndAnalyzeFile($input: FileUploadInput!) { uploadAndAnalyzeFile(input: $input) { id title summary status createdAt insights { type title description confidence } fileInfo { originalName size mimeType } } }",
  "variables": {
    "input": {
      "file": null,
      "description": "Test upload from Postman",
      "analysisType": "COMPREHENSIVE"
    }
  }
}
```

#### Field 2: map
- **Key**: `map`
- **Type**: Text
- **Value**:
```json
{
  "0": ["variables.input.file"]
}
```

#### Field 3: File Upload
- **Key**: `0`
- **Type**: File
- **Value**: Select your CSV/Excel/PDF file

### Method 2: Using GraphQL Body (For Non-File Mutations)

If you want to test non-file mutations, use:

1. **Body Type**: GraphQL
2. **Query**:
```graphql
query {
  __typename
}
```

## Sample Files for Testing

Create these sample files in your `testing` folder:

### sample-revenue.csv
```csv
Date,Product,Revenue,Quantity,Region
2024-01-15,Product A,1500.50,25,North
2024-01-16,Product B,2300.75,40,South
2024-01-17,Product C,1800.25,30,East
2024-01-18,Product A,2100.00,35,West
2024-01-19,Product B,1950.50,32,North
```

### sample-sales.json
```json
{
  "sales_data": [
    {"date": "2024-01-15", "product": "Widget A", "amount": 1250.75, "quantity": 15},
    {"date": "2024-01-16", "product": "Widget B", "amount": 2100.50, "quantity": 25},
    {"date": "2024-01-17", "product": "Widget C", "amount": 1875.25, "quantity": 20}
  ],
  "summary": {
    "total_revenue": 5226.50,
    "total_quantity": 60,
    "period": "2024-01-15 to 2024-01-17"
  }
}
```

## Step-by-Step Postman Process

### Step 1: Basic Connectivity Test
```
Method: POST
URL: http://localhost:4000/graphql
Body: GraphQL
Query: { __typename }
```

### Step 2: File Upload Test
```
Method: POST
URL: http://localhost:4000/graphql
Body: form-data
Fields:
  - operations: [JSON from above]
  - map: [JSON from above]  
  - 0: [Your file]
```

### Step 3: Verify Response
Expected response structure:
```json
{
  "data": {
    "uploadAndAnalyzeFile": {
      "id": "report_123",
      "title": "Analysis Report for sample-revenue.csv",
      "summary": "AI-generated summary...",
      "status": "COMPLETED",
      "insights": [
        {
          "type": "REVENUE_ANALYSIS",
          "title": "Revenue Trends",
          "description": "...",
          "confidence": 85
        }
      ],
      "fileInfo": {
        "originalName": "sample-revenue.csv",
        "size": 245,
        "mimeType": "text/csv"
      }
    }
  }
}
```

## Common Issues & Solutions

### Issue 1: "Content-Type" Error
- **Problem**: Using JSON body instead of form-data
- **Solution**: Switch to form-data in Postman body section

### Issue 2: "Variable not found" Error
- **Problem**: Incorrect JSON formatting in operations field
- **Solution**: Validate JSON syntax, ensure proper escaping

### Issue 3: "File not received" Error
- **Problem**: Incorrect map configuration
- **Solution**: Ensure map field maps "0" to "variables.input.file"

### Issue 4: Server Not Responding
- **Problem**: Server not running or wrong port
- **Solution**: Verify server is running on localhost:4000

## Alternative Testing Methods

If Postman continues to have issues, try:

1. **Use the PowerShell scripts**: `.\test-upload.ps1`
2. **Use Thunder Client** (VS Code extension)
3. **Use curl**: `.\curl-test.ps1`

## Debugging Tips

1. Check server logs for detailed error messages
2. Verify file exists and is readable
3. Test with small files first (< 1MB)
4. Use browser GraphQL playground at `http://localhost:4000/graphql` for non-file queries

## Query Variables for Reference

For copy-paste in Postman variables section:
```json
{
  "input": {
    "file": null,
    "description": "Revenue analysis test",
    "analysisType": "COMPREHENSIVE"
  }
}
```