# SmartBI File Analysis System - Setup & Testing Guide

## Quick Setup

### 1. Install Missing Dependencies
```bash
npm install @google/generative-ai
```

### 2. Environment Configuration
Add to your `.env` file:
```env
# AI Integration (Optional - for AI analysis features)
GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. Database Migration
Run the file analysis migration to create required tables:
```bash
# Option 1: Using the migration script (if environment is configured)
npx ts-node src/scripts/run-migration.ts

# Option 2: Manual SQL execution (if you have psql access)
psql -h your_host -U your_user -d your_db -f database/file-analysis-migration.sql
```

### 4. Start the Server
```bash
npm run dev
```

## Testing the File Analysis System

### GraphQL Endpoints

#### 1. File Upload and Analysis
```graphql
mutation UploadAndAnalyzeFile($file: Upload!, $analysisType: AnalysisType) {
  uploadAndAnalyzeFile(file: $file, analysisType: $analysisType) {
    id
    fileName
    fileType
    fileSize
    status
    analysisReport {
      id
      summary
      insights {
        type
        content
        confidence
      }
      visualizations {
        type
        config
        data
      }
    }
  }
}
```

#### 2. Get Analysis Report
```graphql
query GetAnalysisReport($reportId: ID!) {
  getAnalysisReport(reportId: $reportId) {
    id
    summary
    insights {
      type
      content
      confidence
      category
    }
    visualizations {
      type
      title
      config
      data
    }
    metadata
    createdAt
  }
}
```

#### 3. Export Report
```graphql
mutation ExportReport($reportId: ID!, $format: ExportFormat!) {
  exportReport(reportId: $reportId, format: $format) {
    downloadUrl
    fileName
    format
    fileSize
  }
}
```

### Sample Test Files

Use these sample files from the `testing/` directory:

1. **CSV Revenue Data**: `sample_revenue_data.csv`
   - Contains sales data with products, revenue, regions
   - Test revenue analysis and trend insights

2. **SQL Analysis**: `sample_sql_analysis.sql`
   - Contains complex SQL queries for business analysis
   - Test SQL interpretation and optimization suggestions

3. **Financial JSON**: `sample_financial_data.json`
   - Contains comprehensive financial metrics
   - Test financial analysis and KPI extraction

### Using Postman

Import the collection: `testing/SmartBI-File-Analysis.postman_collection.json`

**Test Sequence:**
1. **Setup** → Run "Get Auth Token" to authenticate
2. **Upload** → Run "Upload CSV File" with sample_revenue_data.csv
3. **Analysis** → Run "Get Analysis Report" with returned report ID
4. **Export** → Run "Export Report as PDF" to download results

### Curl Examples

#### Upload a file for analysis:
```bash
curl -X POST http://localhost:4000/graphql \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F 'operations={"query":"mutation UploadAndAnalyzeFile($file: Upload!) { uploadAndAnalyzeFile(file: $file) { id fileName status analysisReport { summary } } }","variables":{"file":null}}' \
  -F 'map={"0":["variables.file"]}' \
  -F '0=@testing/sample_revenue_data.csv'
```

#### Get report:
```bash
curl -X POST http://localhost:4000/graphql \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query":"query GetAnalysisReport($reportId: ID!) { getAnalysisReport(reportId: $reportId) { id summary insights { type content confidence } } }","variables":{"reportId":"REPORT_ID_HERE"}}'
```

## Expected AI Analysis Features

### File Type Support
- ✅ CSV files (sales, financial, operational data)
- ✅ Excel files (.xlsx, .xls) with multiple sheets
- ✅ PDF documents (financial reports, contracts)
- ✅ SQL files (queries, schemas, procedures)
- ✅ JSON data (APIs, configurations, reports)
- ✅ Plain text files (logs, documentation)
- ✅ XML files (data exchange, configurations)

### Analysis Capabilities
- 📊 **Revenue Analysis**: Trends, patterns, forecasting
- 📈 **Performance Metrics**: KPIs, benchmarks, growth rates
- 💰 **Financial Insights**: P&L analysis, ratios, profitability
- 🎯 **Data Quality**: Completeness, accuracy, anomalies
- 📋 **Table Interpretation**: Schema analysis, relationships
- 🔍 **Pattern Recognition**: Seasonal trends, correlations
- 💡 **Business Recommendations**: Actionable insights

### Report Generation
- 📄 **PDF Reports**: Professional formatted reports
- 📊 **Excel Reports**: Interactive spreadsheets with charts
- 🌐 **HTML Reports**: Web-friendly dashboards
- 📱 **JSON Export**: Machine-readable data format

## Troubleshooting

### Common Issues

1. **GraphQL Upload Error**
   ```
   Error: Must provide multipart/form-data
   ```
   **Solution**: Ensure graphql-upload middleware is properly configured

2. **AI Analysis Fails**
   ```
   Error: GEMINI_API_KEY not configured
   ```
   **Solution**: Add valid Gemini API key to .env file

3. **Database Migration Fails**
   ```
   Error: relation "file_uploads" does not exist
   ```
   **Solution**: Run the database migration script

4. **File Upload Size Limit**
   ```
   Error: File too large
   ```
   **Solution**: Adjust maxFileSize in graphqlUploadExpress middleware

### Performance Optimization

- **Large Files**: Process in chunks for files > 10MB
- **AI Rate Limits**: Implement request queuing for high volumes
- **Database**: Add indexes on frequently queried columns
- **Caching**: Cache analysis results for identical files

### Security Considerations

- **File Validation**: All uploads are validated for type and size
- **Authentication**: All endpoints require valid JWT tokens
- **Sanitization**: File content is sanitized before AI analysis
- **Storage**: Uploaded files are stored securely with unique IDs

## Next Steps

1. **Production Setup**:
   - Configure production database
   - Set up file storage (AWS S3, Google Cloud Storage)
   - Implement proper error monitoring
   - Add request logging and analytics

2. **Advanced Features**:
   - Batch file processing
   - Scheduled analysis jobs
   - Custom analysis templates
   - Integration with external BI tools

3. **Monitoring**:
   - Set up health checks
   - Monitor AI API usage and costs
   - Track file processing performance
   - Monitor storage usage

---

**System Status**: ✅ Ready for testing
**Last Updated**: $(date)
**Version**: 1.0.0