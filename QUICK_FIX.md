# Quick Fix for Your Query

## Use this corrected query in Postman:

### Content-Type: `multipart/form-data`

### Form Fields:

**operations:**
```json
{
  "query": "mutation UploadAndAnalyzeFile($input: FileUploadInput!) { uploadAndAnalyzeFile(input: $input) { id title summary status executionTime insights { id type title description confidence importance } visualizations { id type title description } recommendations createdAt } }",
  "variables": {
    "input": {
      "file": null,
      "description": "Revenue data analysis test",
      "tags": ["revenue", "test"],
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

**map:**
```json
{"0": ["variables.input.file"]}
```

**0:** [Select file] → `testing/sample_revenue_data.csv`

## Or use this simpler version:

**operations:**
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

**map:**
```json
{"0": ["variables.input.file"]}
```

**0:** [Select your file]

---

The key changes from your original query:
1. ✅ Use `$input: FileUploadInput!` instead of `$file: Upload!`
2. ✅ Wrap parameters in `input: { file: $file, ... }`
3. ✅ Remove `analysisType` (doesn't exist)
4. ✅ Query the correct fields on `AnalysisReport`
5. ✅ Use proper file mapping with `variables.input.file`