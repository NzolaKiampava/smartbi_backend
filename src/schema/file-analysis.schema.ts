import gql from 'graphql-tag';

export const fileAnalysisTypeDefs = gql`
  scalar Upload
  scalar JSON
  scalar DateTime

  enum FileType {
    CSV
    EXCEL
    JSON
    PDF
    SQL
    TXT
    XML
    OTHER
  }

  enum AnalysisStatus {
    PENDING
    PROCESSING
    COMPLETED
    FAILED
  }

  enum InsightType {
    DATA_PATTERN
    REVENUE_TREND
    TABLE_STRUCTURE
    PERFORMANCE_METRIC
    ANOMALY_DETECTION
    RECOMMENDATION
    SUMMARY
    CORRELATION
    STATISTICAL
    BUSINESS_INSIGHT
  }

  enum ReportFormat {
    PDF
    EXCEL
    JSON
    HTML
  }

  type FileUpload {
    id: ID!
    filename: String!
    originalName: String!
    mimetype: String!
    encoding: String!
    size: Int!
    path: String!
    fileType: FileType!
    uploadedAt: DateTime!
    metadata: JSON
    analysisReport: AnalysisReport
  }

  type AnalysisReport {
    id: ID!
    fileUploadId: ID!
    fileUpload: FileUpload!
    status: AnalysisStatus!
    title: String!
    summary: String!
    executionTime: Int
    insights: [Insight!]!
    recommendations: [String!]!
    dataQuality: DataQuality
    visualizations: [Visualization!]!
    extractedText: String
    rawAnalysis: JSON
    createdAt: DateTime!
    updatedAt: DateTime!
    error: String
  }

  type Insight {
    id: ID!
    reportId: ID!
    type: InsightType!
    title: String!
    description: String!
    value: String
    confidence: Float
    importance: Int
    metadata: JSON
    createdAt: DateTime!
  }

  type DataQuality {
    score: Float!
    completeness: Float!
    accuracy: Float!
    consistency: Float!
    validity: Float!
    issues: [DataQualityIssue!]!
  }

  type DataQualityIssue {
    type: String!
    description: String!
    severity: String!
    count: Int!
    examples: [String!]!
  }

  type Visualization {
    id: ID!
    type: String!
    title: String!
    description: String
    data: JSON!
    config: JSON
  }

  type TableAnalysis {
    tableName: String!
    rowCount: Int!
    columnCount: Int!
    columns: [ColumnAnalysis!]!
    primaryKeys: [String!]!
    foreignKeys: [String!]!
    indexes: [String!]!
    dataTypes: JSON!
  }

  type ColumnAnalysis {
    name: String!
    dataType: String!
    nullable: Boolean!
    unique: Boolean!
    distinctValues: Int
    nullCount: Int
    minValue: String
    maxValue: String
    avgValue: String
    pattern: String
  }

  type RevenueAnalysis {
    totalRevenue: Float
    averageRevenue: Float
    revenueGrowth: Float
    periods: [RevenuePeriod!]!
    trends: [RevenueTrend!]!
    forecasts: [RevenueForecast!]!
  }

  type RevenuePeriod {
    period: String!
    revenue: Float!
    transactions: Int
    averageTransaction: Float
  }

  type RevenueTrend {
    metric: String!
    direction: String!
    percentage: Float!
    description: String!
  }

  type RevenueForecast {
    period: String!
    predictedRevenue: Float!
    confidence: Float!
    factors: [String!]!
  }

  input FileUploadInput {
    file: Upload!
    description: String
    tags: [String!]
    analysisOptions: AnalysisOptionsInput
  }

  input AnalysisOptionsInput {
    analyzeRevenue: Boolean = true
    analyzeTables: Boolean = true
    generateInsights: Boolean = true
    checkDataQuality: Boolean = true
    generateVisualizations: Boolean = true
    customPrompts: [String!]
  }

  input ReportExportInput {
    reportId: ID!
    format: ReportFormat!
    includeRawData: Boolean = false
    includeVisualizations: Boolean = true
    customizations: JSON
  }

  type ReportExport {
    url: String!
    filename: String!
    format: ReportFormat!
    size: Int!
    expiresAt: DateTime!
  }

  type Query {
    # File Uploads
    getFileUpload(id: ID!): FileUpload
    listFileUploads(limit: Int = 20, offset: Int = 0): [FileUpload!]!
    
    # Analysis Reports
    getAnalysisReport(id: ID!): AnalysisReport
    getAnalysisReportByFileId(fileId: ID!): AnalysisReport
    listAnalysisReports(limit: Int = 20, offset: Int = 0): [AnalysisReport!]!
    
    # Insights
    getInsight(id: ID!): Insight
    getInsightsByReport(reportId: ID!): [Insight!]!
    getInsightsByType(type: InsightType!, limit: Int = 10): [Insight!]!
    
    # Search and Filters
    searchReports(query: String!, limit: Int = 10): [AnalysisReport!]!
    getReportsByDateRange(startDate: DateTime!, endDate: DateTime!): [AnalysisReport!]!
    getReportsByFileType(fileType: FileType!): [AnalysisReport!]!
  }

  type Mutation {
    # File Upload and Analysis
    uploadAndAnalyzeFile(input: FileUploadInput!): AnalysisReport!
    analyzeUploadedFile(fileId: ID!, options: AnalysisOptionsInput): AnalysisReport!
    
    # Manual Analysis Triggers
    reanalyzeFile(fileId: ID!, options: AnalysisOptionsInput): AnalysisReport!
    generateCustomAnalysis(fileId: ID!, prompts: [String!]!): AnalysisReport!
    
    # Report Management
    updateReportTitle(reportId: ID!, title: String!): AnalysisReport!
    addCustomInsight(reportId: ID!, insight: String!): Insight!
    deleteReport(reportId: ID!): Boolean!
    
    # Export
    exportReport(input: ReportExportInput!): ReportExport!
    
    # File Management
    deleteFileUpload(id: ID!): Boolean!
    updateFileMetadata(id: ID!, metadata: JSON!): FileUpload!
  }

  type Subscription {
    # Real-time analysis updates
    analysisProgress(reportId: ID!): AnalysisReport!
    
    # New insights
    newInsights(reportId: ID!): Insight!
  }
`;