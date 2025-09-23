# 📊 SmartBI File Analysis System

## Overview

The SmartBI File Analysis System provides comprehensive AI-powered analysis of uploaded files. It can process various file formats (CSV, Excel, PDF, SQL, JSON, etc.) and generate detailed insights, recommendations, and visualizations.

## Features

### 🔍 File Processing
- **Multiple Formats**: CSV, Excel, PDF, SQL, JSON, TXT, XML
- **Automatic Detection**: File type and structure detection
- **Metadata Extraction**: Size, encoding, headers, row counts
- **Data Validation**: File size limits, format validation

### 🤖 AI Analysis
- **Content Analysis**: Natural language processing of file content
- **Pattern Recognition**: Data patterns, trends, correlations
- **Revenue Analysis**: Revenue trends, forecasting, segmentation
- **Data Quality**: Completeness, accuracy, consistency assessment
- **Table Structure**: Database schema analysis, relationships

### 📈 Insights Generation
- **Multiple Types**: Data patterns, revenue trends, performance metrics
- **Confidence Scoring**: AI confidence levels for each insight
- **Importance Ranking**: Priority scoring for insights
- **Evidence Tracking**: Supporting evidence for insights

### 📊 Visualizations
- **Chart Suggestions**: Bar, line, pie, scatter plot recommendations
- **Data-Driven**: Automatic chart data generation
- **Priority Scoring**: Visualization importance ranking

### 📋 Reports
- **Comprehensive Analysis**: Executive summary, insights, recommendations
- **Data Quality Metrics**: Quality scores and issue identification
- **Multiple Formats**: PDF, Excel, JSON, HTML export options
- **Customizable**: Include/exclude sections, custom branding

## API Reference

### GraphQL Schema

#### File Upload
```graphql
mutation UploadAndAnalyzeFile($input: FileUploadInput!) {
  uploadAndAnalyzeFile(input: $input) {
    id
    title
    status
    summary
    insights {
      id
      type
      title
      description
      confidence
      importance
    }
    recommendations
    dataQuality {
      score
      completeness
      accuracy
      consistency
      validity
    }
    visualizations {
      type
      title
      data
    }
    executionTime
  }
}
```

#### Query Reports
```graphql
query GetAnalysisReport($id: ID!) {
  getAnalysisReport(id: $id) {
    id
    title
    summary
    status
    fileUpload {
      originalName
      fileType
      size
    }
    insights {
      type
      title
      description
      value
      confidence
      importance
    }
    recommendations
    visualizations {
      type
      title
      description
      data
    }
  }
}
```

#### Export Report
```graphql
mutation ExportReport($input: ReportExportInput!) {
  exportReport(input: $input) {
    url
    filename
    format
    size
    expiresAt
  }
}
```

### Input Types

#### FileUploadInput
```typescript
interface FileUploadInput {
  file: Upload!
  description?: string
  tags?: string[]
  analysisOptions?: AnalysisOptionsInput
}
```

#### AnalysisOptionsInput
```typescript
interface AnalysisOptionsInput {
  analyzeRevenue?: boolean        // Default: true
  analyzeTables?: boolean         // Default: true
  generateInsights?: boolean      // Default: true
  checkDataQuality?: boolean      // Default: true
  generateVisualizations?: boolean // Default: true
  customPrompts?: string[]        // Custom analysis requests
}
```

## Usage Examples

### 1. Basic File Upload and Analysis

```javascript
// Using GraphQL with file upload
const uploadMutation = `
  mutation UploadFile($file: Upload!, $description: String) {
    uploadAndAnalyzeFile(input: {
      file: $file
      description: $description
      analysisOptions: {
        analyzeRevenue: true
        analyzeTables: true
        generateInsights: true
      }
    }) {
      id
      title
      status
      summary
      insights {
        type
        title
        description
        confidence
        importance
      }
    }
  }
`;

// JavaScript/Node.js example
const FormData = require('form-data');
const fs = require('fs');

const form = new FormData();
form.append('operations', JSON.stringify({
  query: uploadMutation,
  variables: { 
    file: null,
    description: "Sales data analysis"
  }
}));
form.append('map', JSON.stringify({ "0": ["variables.file"] }));
form.append('0', fs.createReadStream('./sales_data.csv'));

fetch('http://localhost:4000/graphql', {
  method: 'POST',
  body: form
});
```

### 2. Revenue Analysis Example

```javascript
const revenueAnalysis = {
  query: `
    mutation AnalyzeRevenue($file: Upload!) {
      uploadAndAnalyzeFile(input: {
        file: $file
        analysisOptions: {
          analyzeRevenue: true
          generateVisualizations: true
          customPrompts: [
            "Identify revenue trends by month",
            "Analyze revenue by product category",
            "Forecast next quarter revenue"
          ]
        }
      }) {
        insights {
          type
          title
          description
          value
        }
        visualizations {
          type
          title
          data
        }
      }
    }
  `,
  variables: { file: null }
};
```

### 3. Data Quality Assessment

```javascript
const dataQualityCheck = {
  query: `
    mutation CheckDataQuality($file: Upload!) {
      uploadAndAnalyzeFile(input: {
        file: $file
        analysisOptions: {
          checkDataQuality: true
          generateInsights: false
          generateVisualizations: false
        }
      }) {
        dataQuality {
          score
          completeness
          accuracy
          consistency
          validity
          issues {
            type
            description
            severity
            count
            examples
          }
        }
        recommendations
      }
    }
  `
};
```

### 4. Export Report

```javascript
const exportReport = {
  query: `
    mutation ExportReport($reportId: ID!, $format: ReportFormat!) {
      exportReport(input: {
        reportId: $reportId
        format: $format
        includeRawData: false
        includeVisualizations: true
      }) {
        url
        filename
        format
        size
        expiresAt
      }
    }
  `,
  variables: {
    reportId: "report-uuid",
    format: "PDF"
  }
};
```

## File Format Support

### CSV Files
- **Auto-detection**: Delimiter, headers, data types
- **Analysis**: Column statistics, data distribution, patterns
- **Insights**: Missing values, outliers, correlations
- **Visualizations**: Histograms, scatter plots, trend charts

### Excel Files
- **Multi-sheet**: Analysis across all worksheets
- **Metadata**: Sheet names, cell ranges, formulas
- **Analysis**: Cross-sheet relationships, data validation
- **Insights**: Sheet comparisons, data consistency

### PDF Documents
- **Text Extraction**: Full text content analysis
- **Table Detection**: Automatic table identification
- **Analysis**: Document structure, key metrics extraction
- **Insights**: Business metrics, KPIs, action items

### SQL Files
- **Query Analysis**: Performance optimization suggestions
- **Schema Analysis**: Table relationships, constraints
- **Security**: SQL injection vulnerability detection
- **Insights**: Database design recommendations

### JSON Files
- **Structure Analysis**: Schema validation, data types
- **Nested Data**: Deep object analysis
- **API Analysis**: REST/GraphQL schema insights
- **Insights**: Data modeling recommendations

## Configuration

### Environment Variables

```bash
# File Upload Configuration
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=50000000  # 50MB
ALLOWED_FILE_TYPES=CSV,EXCEL,PDF,SQL,JSON,TXT,XML

# AI Analysis Configuration
GEMINI_API_KEY=your-gemini-api-key
AI_MODEL=gemini-1.5-pro
ANALYSIS_TIMEOUT=300000  # 5 minutes

# Export Configuration
EXPORTS_DIR=./exports
EXPORT_EXPIRY_HOURS=24
```

### Analysis Options

```typescript
const analysisConfig = {
  maxFileSize: 50 * 1024 * 1024,  // 50MB
  allowedTypes: ['CSV', 'EXCEL', 'PDF', 'SQL', 'JSON'],
  aiModel: 'gemini-1.5-pro',
  timeout: 300000,  // 5 minutes
  enableCache: true,
  cacheExpiry: 24,  // hours
  outputFormat: 'detailed'
};
```

## Error Handling

### Common Errors

```typescript
// File too large
{
  "error": "File size exceeds maximum allowed size of 50MB"
}

// Unsupported format
{
  "error": "File type 'DOCX' is not supported"
}

// Analysis timeout
{
  "error": "Analysis timeout after 5 minutes"
}

// AI API error
{
  "error": "AI analysis failed: API quota exceeded"
}
```

### Error Response Format

```typescript
interface ErrorResponse {
  error: string;
  code: string;
  details?: any;
  suggestions?: string[];
}
```

## Performance Considerations

### File Size Limits
- **Default**: 50MB maximum
- **Recommendation**: Files > 10MB may take longer to process
- **Optimization**: Use CSV instead of Excel for large datasets

### Processing Time
- **CSV (1MB)**: ~5-10 seconds
- **Excel (5MB)**: ~15-30 seconds  
- **PDF (10MB)**: ~30-60 seconds
- **SQL (1MB)**: ~10-20 seconds

### Memory Usage
- **CSV**: ~2x file size in memory
- **Excel**: ~3x file size in memory
- **PDF**: ~4x file size in memory

## Security

### File Validation
- **Type checking**: MIME type and extension validation
- **Size limits**: Configurable maximum file size
- **Content scanning**: Malicious content detection
- **Sanitization**: File name and path sanitization

### Data Privacy
- **Temporary storage**: Files deleted after analysis
- **No persistence**: Analysis data not stored by default
- **Encryption**: In-transit encryption for uploads
- **Access control**: Role-based access to reports

## Database Schema

### Tables Overview
- **file_uploads**: Store file metadata and paths
- **analysis_reports**: Analysis results and status
- **insights**: Individual insights from analysis
- **data_quality_assessments**: Data quality metrics
- **visualizations**: Chart configurations
- **report_exports**: Export tracking and downloads

### Relationships
```sql
file_uploads (1) → (1) analysis_reports
analysis_reports (1) → (N) insights
analysis_reports (1) → (1) data_quality_assessments  
analysis_reports (1) → (N) visualizations
analysis_reports (1) → (N) report_exports
```

## Testing

### Unit Tests
```bash
npm test src/services/file-upload.service.test.ts
npm test src/services/ai-analysis.service.test.ts
npm test src/services/report-generation.service.test.ts
```

### Integration Tests
```bash
npm test src/resolvers/file-analysis.resolvers.test.ts
```

### End-to-End Tests
```bash
# Upload and analyze sample files
npm run test:e2e -- --grep "file analysis"
```

## Monitoring

### Metrics
- **Upload success rate**: % of successful uploads
- **Analysis completion rate**: % of completed analyses
- **Average processing time**: By file type and size
- **Error rates**: By error type and frequency

### Logging
```typescript
// Upload event
logger.info('File uploaded', {
  fileId: 'uuid',
  fileName: 'data.csv',
  fileSize: 1024,
  fileType: 'CSV'
});

// Analysis started
logger.info('Analysis started', {
  reportId: 'uuid',
  fileId: 'uuid',
  options: analysisOptions
});

// Analysis completed
logger.info('Analysis completed', {
  reportId: 'uuid',
  executionTime: 5000,
  insightCount: 15,
  status: 'COMPLETED'
});
```

## Troubleshooting

### Common Issues

1. **Files not uploading**
   - Check file size limits
   - Verify supported file types
   - Check network connectivity

2. **Analysis taking too long**
   - Large files require more processing time
   - Check AI API quota and limits
   - Verify server resources

3. **Poor analysis quality**
   - Ensure files have clear structure
   - Add descriptive file names/descriptions
   - Use custom prompts for specific analysis

4. **Export failures**
   - Check export directory permissions
   - Verify disk space availability
   - Check export format support

### Debug Mode

```bash
# Enable detailed logging
DEBUG=smartbi:file-analysis npm run dev

# Test with sample files
npm run test:upload -- --file ./test-data/sample.csv
```

## Roadmap

### Upcoming Features
- **Real-time analysis**: WebSocket progress updates
- **Batch processing**: Multiple file analysis
- **Custom AI models**: Industry-specific analysis
- **Advanced visualizations**: Interactive charts and dashboards
- **Collaboration**: Shared reports and comments
- **API integrations**: Direct database connections
- **Mobile support**: Mobile app file uploads
- **Advanced security**: End-to-end encryption

### Version History
- **v1.0.0**: Initial release with basic file analysis
- **v1.1.0**: Added revenue analysis and forecasting
- **v1.2.0**: Enhanced data quality assessment
- **v1.3.0**: Multiple export formats
- **v2.0.0**: Real-time analysis and advanced AI models (planned)