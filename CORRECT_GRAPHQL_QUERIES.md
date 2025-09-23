# Correct GraphQL Query for File Upload

## For Postman Form-Data Upload:

### Operations field:
```json
{
  "query": "mutation UploadAndAnalyzeFile($input: FileUploadInput!) { uploadAndAnalyzeFile(input: $input) { id title summary status executionTime insights { id type title description confidence importance } visualizations { id type title description data config } recommendations createdAt } }",
  "variables": {
    "input": {
      "file": null,
      "description": "Revenue data analysis test",
      "tags": ["revenue", "analysis", "test"],
      "analysisOptions": {
        "analyzeRevenue": true,
        "analyzeTables": true,
        "generateInsights": true,
        "checkDataQuality": true,
        "generateVisualizations": true
      }
    }
  }
}
```

### Map field:
```json
{"0": ["variables.input.file"]}
```

### File field:
Key: `0`
Value: [Select your file] `testing/sample_revenue_data.csv`

## Alternative Simple Query:

### Operations field:
```json
{
  "query": "mutation UploadAndAnalyzeFile($input: FileUploadInput!) { uploadAndAnalyzeFile(input: $input) { id title summary status insights { type title description confidence } } }",
  "variables": {
    "input": {
      "file": null,
      "description": "Test upload"
    }
  }
}
```

### Map field:
```json
{"0": ["variables.input.file"]}
```

## If you want to query file information separately:

After getting the report ID from the upload, use this query to get file details:

```graphql
query GetFileUpload($id: ID!) {
  getFileUpload(id: $id) {
    id
    filename
    originalName
    mimetype
    size
    fileType
    uploadedAt
    metadata
  }
}
```

## Available Analysis Options:

```graphql
input AnalysisOptionsInput {
  analyzeRevenue: Boolean = true
  analyzeTables: Boolean = true
  generateInsights: Boolean = true
  checkDataQuality: Boolean = true
  generateVisualizations: Boolean = true
  customPrompts: [String!]
}
```

## Expected Response Structure:

```json
{
  "data": {
    "uploadAndAnalyzeFile": {
      "id": "report-uuid",
      "title": "Analysis Report for sample_revenue_data.csv",
      "summary": "This revenue analysis reveals...",
      "status": "COMPLETED",
      "executionTime": 2500,
      "insights": [
        {
          "id": "insight-uuid",
          "type": "REVENUE_TREND",
          "title": "Strong Q1 Performance",
          "description": "Revenue shows 15% growth...",
          "confidence": 0.92,
          "importance": 8
        }
      ],
      "visualizations": [
        {
          "id": "viz-uuid",
          "type": "BAR_CHART",
          "title": "Revenue by Product",
          "description": "Product performance comparison",
          "data": {...},
          "config": {...}
        }
      ],
      "recommendations": [
        "Focus on Product A for continued growth",
        "Investigate Product C performance decline"
      ],
      "createdAt": "2025-09-21T10:30:00Z"
    }
  }
}
```