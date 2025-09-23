export enum FileType {
  CSV = 'CSV',
  EXCEL = 'EXCEL',
  JSON = 'JSON',
  PDF = 'PDF',
  SQL = 'SQL',
  TXT = 'TXT',
  XML = 'XML',
  OTHER = 'OTHER'
}

export enum AnalysisStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export enum InsightType {
  DATA_PATTERN = 'DATA_PATTERN',
  REVENUE_TREND = 'REVENUE_TREND',
  TABLE_STRUCTURE = 'TABLE_STRUCTURE',
  PERFORMANCE_METRIC = 'PERFORMANCE_METRIC',
  ANOMALY_DETECTION = 'ANOMALY_DETECTION',
  RECOMMENDATION = 'RECOMMENDATION',
  SUMMARY = 'SUMMARY',
  CORRELATION = 'CORRELATION',
  STATISTICAL = 'STATISTICAL',
  BUSINESS_INSIGHT = 'BUSINESS_INSIGHT',
}

export enum ReportFormat {
  PDF = 'PDF',
  EXCEL = 'EXCEL',
  JSON = 'JSON',
  HTML = 'HTML',
}

export interface FileUpload {
  id: string;
  filename: string;
  originalName: string;
  mimetype: string;
  encoding: string;
  size: number;
  path: string;
  fileType: FileType;
  uploadedAt: Date;
  metadata?: Record<string, any>;
  analysisReport?: AnalysisReport;
}

export interface AnalysisReport {
  id: string;
  fileUploadId: string;
  fileUpload: FileUpload;
  status: AnalysisStatus;
  title: string;
  summary: string;
  executionTime?: number;
  insights: Insight[];
  recommendations: string[];
  dataQuality?: DataQuality;
  visualizations: Visualization[];
  rawAnalysis?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  error?: string;
}

export interface Insight {
  id: string;
  reportId: string;
  type: InsightType;
  title: string;
  description: string;
  value?: string;
  confidence?: number;
  importance: number;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface DataQuality {
  score: number;
  completeness: number;
  accuracy: number;
  consistency: number;
  validity: number;
  issues: DataQualityIssue[];
}

export interface DataQualityIssue {
  type: string;
  description: string;
  severity: string;
  count: number;
  examples: string[];
}

export interface Visualization {
  id: string;
  type: string;
  title: string;
  description?: string;
  data: Record<string, any>;
  config?: Record<string, any>;
}

export interface TableAnalysis {
  tableName: string;
  rowCount: number;
  columnCount: number;
  columns: ColumnAnalysis[];
  primaryKeys: string[];
  foreignKeys: string[];
  indexes: string[];
  dataTypes: Record<string, any>;
}

export interface ColumnAnalysis {
  name: string;
  dataType: string;
  nullable: boolean;
  unique: boolean;
  distinctValues?: number;
  nullCount?: number;
  minValue?: string;
  maxValue?: string;
  avgValue?: string;
  pattern?: string;
}

export interface RevenueAnalysis {
  totalRevenue?: number;
  averageRevenue?: number;
  revenueGrowth?: number;
  periods: RevenuePeriod[];
  trends: RevenueTrend[];
  forecasts: RevenueForecast[];
}

export interface RevenuePeriod {
  period: string;
  revenue: number;
  transactions?: number;
  averageTransaction?: number;
}

export interface RevenueTrend {
  metric: string;
  direction: string;
  percentage: number;
  description: string;
}

export interface RevenueForecast {
  period: string;
  predictedRevenue: number;
  confidence: number;
  factors: string[];
}

export interface FileUploadInput {
  file: any; // Upload scalar
  description?: string;
  tags?: string[];
  analysisOptions?: AnalysisOptionsInput;
}

export interface AnalysisOptionsInput {
  analyzeRevenue?: boolean;
  analyzeTables?: boolean;
  generateInsights?: boolean;
  checkDataQuality?: boolean;
  generateVisualizations?: boolean;
  customPrompts?: string[];
}

export interface ReportExportInput {
  reportId: string;
  format: ReportFormat;
  includeRawData?: boolean;
  includeVisualizations?: boolean;
  customizations?: Record<string, any>;
}

export interface ReportExport {
  url: string;
  filename: string;
  format: ReportFormat;
  size: number;
  expiresAt: Date;
}

// AI Analysis Response Structure
export interface AIAnalysisResponse {
  insights: AIInsight[];
  summary: string;
  dataQuality?: AIDataQuality;
  recommendations: string[];
  tables?: AITableAnalysis[];
  revenue?: AIRevenueAnalysis;
  visualizations?: AIVisualizationSuggestion[];
  metadata: Record<string, any>;
}

export interface AIInsight {
  type: InsightType;
  title: string;
  description: string;
  value?: string | number;
  confidence: number;
  importance: number;
  evidence?: string[];
  actionable?: boolean;
}

export interface AIDataQuality {
  overallScore: number;
  completeness: number;
  accuracy: number;
  consistency: number;
  validity: number;
  issues: AIDataIssue[];
}

export interface AIDataIssue {
  type: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  affectedColumns?: string[];
  sampleValues?: string[];
  suggestions?: string[];
}

export interface AITableAnalysis {
  name: string;
  description: string;
  rowCount?: number;
  columns: AIColumnAnalysis[];
  relationships?: AITableRelationship[];
  businessPurpose?: string;
}

export interface AIColumnAnalysis {
  name: string;
  dataType: string;
  description: string;
  nullable: boolean;
  unique: boolean;
  patterns?: string[];
  businessMeaning?: string;
  qualityIssues?: string[];
}

export interface AITableRelationship {
  type: 'FOREIGN_KEY' | 'REFERENCE' | 'LOOKUP';
  targetTable: string;
  columns: string[];
  description: string;
}

export interface AIRevenueAnalysis {
  totalRevenue?: number;
  timeframe?: string;
  trends: AIRevenueTrend[];
  segments?: AIRevenueSegment[];
  forecasts?: AIRevenueForecast[];
  keyMetrics: Record<string, number>;
}

export interface AIRevenueTrend {
  period: string;
  value: number;
  change: number;
  changePercent: number;
  factors?: string[];
}

export interface AIRevenueSegment {
  name: string;
  revenue: number;
  percentage: number;
  growth?: number;
}

export interface AIRevenueForecast {
  period: string;
  predicted: number;
  confidence: number;
  scenario: 'CONSERVATIVE' | 'OPTIMISTIC' | 'REALISTIC';
  assumptions: string[];
}

export interface AIVisualizationSuggestion {
  type: 'BAR' | 'LINE' | 'PIE' | 'SCATTER' | 'HEATMAP' | 'TABLE';
  title: string;
  description: string;
  xAxis?: string;
  yAxis?: string;
  data: Record<string, any>;
  priority: number;
}

// File Processing Types
export interface ProcessedFileData {
  content: string;
  structured?: Record<string, any>;
  tables?: ParsedTable[];
  metadata: FileMetadata;
}

export interface ParsedTable {
  name?: string;
  headers: string[];
  rows: any[][];
  rowCount: number;
  columnCount: number;
}

export interface FileMetadata {
  size: number;
  type: FileType;
  encoding?: string;
  charset?: string;
  pages?: number; // For PDFs
  sheets?: string[]; // For Excel
  delimiter?: string; // For CSVs
  hasHeaders?: boolean;
  estimatedRows?: number;
}

// Analysis Configuration
export interface AnalysisConfig {
  maxFileSize: number; // in bytes
  allowedTypes: FileType[];
  aiModel: string;
  timeout: number; // in milliseconds
  enableCache: boolean;
  cacheExpiry: number; // in hours
  outputFormat: 'detailed' | 'summary' | 'insights_only';
}

// Database Entity Types (for ORM)
export interface FileUploadEntity {
  id: string;
  filename: string;
  original_name: string;
  mimetype: string;
  encoding: string;
  size: number;
  path: string;
  file_type: FileType;
  uploaded_at: Date;
  metadata?: string; // JSON string
}

export interface AnalysisReportEntity {
  id: string;
  file_upload_id: string;
  status: AnalysisStatus;
  title: string;
  summary: string;
  execution_time?: number;
  recommendations?: string; // JSON array
  raw_analysis?: string; // JSON string
  created_at: Date;
  updated_at: Date;
  error?: string;
}

export interface InsightEntity {
  id: string;
  report_id: string;
  type: InsightType;
  title: string;
  description: string;
  value?: string;
  confidence?: number;
  importance: number;
  metadata?: string; // JSON string
  created_at: Date;
}