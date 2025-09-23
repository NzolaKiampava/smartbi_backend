-- File Analysis System Database Migration
-- Creates tables for file uploads, analysis reports, and insights

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enums for file analysis system
CREATE TYPE "FileType" AS ENUM (
  'CSV',
  'EXCEL', 
  'PDF',
  'SQL',
  'JSON',
  'TXT',
  'XML',
  'OTHER'
);

CREATE TYPE "AnalysisStatus" AS ENUM (
  'PENDING',
  'PROCESSING',
  'COMPLETED',
  'FAILED'
);

CREATE TYPE "InsightType" AS ENUM (
  'DATA_PATTERN',
  'REVENUE_TREND',
  'TABLE_STRUCTURE',
  'PERFORMANCE_METRIC',
  'ANOMALY_DETECTION',
  'RECOMMENDATION',
  'SUMMARY',
  'CORRELATION',
  'STATISTICAL',
  'BUSINESS_INSIGHT'
);

CREATE TYPE "ReportFormat" AS ENUM (
  'PDF',
  'EXCEL',
  'JSON',
  'HTML'
);

-- File uploads table
CREATE TABLE file_uploads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  filename VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  mimetype VARCHAR(100) NOT NULL,
  encoding VARCHAR(50) NOT NULL,
  size INTEGER NOT NULL CHECK (size > 0),
  path TEXT NOT NULL,
  file_type "FileType" NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB DEFAULT '{}',
  
  -- Indexes
  CONSTRAINT file_uploads_filename_unique UNIQUE (filename)
);

-- Analysis reports table
CREATE TABLE analysis_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  file_upload_id UUID NOT NULL REFERENCES file_uploads(id) ON DELETE CASCADE,
  status "AnalysisStatus" NOT NULL DEFAULT 'PENDING',
  title VARCHAR(255) NOT NULL,
  summary TEXT NOT NULL,
  execution_time INTEGER, -- in milliseconds
  recommendations JSONB DEFAULT '[]', -- Array of recommendation strings
  raw_analysis JSONB DEFAULT '{}', -- Full AI response and metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  error TEXT, -- Error message if status is FAILED
  
  -- Constraints
  CONSTRAINT analysis_reports_execution_time_positive CHECK (execution_time IS NULL OR execution_time >= 0),
  CONSTRAINT analysis_reports_title_not_empty CHECK (LENGTH(TRIM(title)) > 0),
  CONSTRAINT analysis_reports_summary_not_empty CHECK (LENGTH(TRIM(summary)) > 0)
);

-- Insights table
CREATE TABLE insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID NOT NULL REFERENCES analysis_reports(id) ON DELETE CASCADE,
  type "InsightType" NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  value TEXT, -- Specific value or metric
  confidence DECIMAL(3,2) CHECK (confidence >= 0 AND confidence <= 1), -- 0.00 to 1.00
  importance INTEGER NOT NULL CHECK (importance >= 1 AND importance <= 10),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  CONSTRAINT insights_title_not_empty CHECK (LENGTH(TRIM(title)) > 0),
  CONSTRAINT insights_description_not_empty CHECK (LENGTH(TRIM(description)) > 0)
);

-- Data quality assessments table
CREATE TABLE data_quality_assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID NOT NULL REFERENCES analysis_reports(id) ON DELETE CASCADE,
  overall_score DECIMAL(3,2) NOT NULL CHECK (overall_score >= 0 AND overall_score <= 1),
  completeness DECIMAL(3,2) NOT NULL CHECK (completeness >= 0 AND completeness <= 1),
  accuracy DECIMAL(3,2) NOT NULL CHECK (accuracy >= 0 AND accuracy <= 1),
  consistency DECIMAL(3,2) NOT NULL CHECK (consistency >= 0 AND consistency <= 1),
  validity DECIMAL(3,2) NOT NULL CHECK (validity >= 0 AND validity <= 1),
  issues JSONB DEFAULT '[]', -- Array of data quality issues
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Only one assessment per report
  CONSTRAINT data_quality_assessments_report_unique UNIQUE (report_id)
);

-- Visualizations table
CREATE TABLE visualizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID NOT NULL REFERENCES analysis_reports(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- BAR, LINE, PIE, etc.
  title VARCHAR(255) NOT NULL,
  description TEXT,
  data JSONB NOT NULL DEFAULT '{}', -- Chart data
  config JSONB DEFAULT '{}', -- Chart configuration
  priority INTEGER DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  CONSTRAINT visualizations_title_not_empty CHECK (LENGTH(TRIM(title)) > 0),
  CONSTRAINT visualizations_type_not_empty CHECK (LENGTH(TRIM(type)) > 0)
);

-- Report exports table (tracks generated export files)
CREATE TABLE report_exports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID NOT NULL REFERENCES analysis_reports(id) ON DELETE CASCADE,
  format "ReportFormat" NOT NULL,
  filename VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL CHECK (file_size > 0),
  download_url TEXT,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  downloaded_at TIMESTAMP WITH TIME ZONE,
  download_count INTEGER DEFAULT 0 CHECK (download_count >= 0),
  
  -- Constraints
  CONSTRAINT report_exports_filename_not_empty CHECK (LENGTH(TRIM(filename)) > 0),
  CONSTRAINT report_exports_expires_future CHECK (expires_at > created_at)
);

-- Analysis sessions table (for tracking analysis progress)
CREATE TABLE analysis_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID NOT NULL REFERENCES analysis_reports(id) ON DELETE CASCADE,
  session_data JSONB DEFAULT '{}', -- Progress tracking, intermediate results
  started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  
  -- Only one active session per report
  CONSTRAINT analysis_sessions_report_unique UNIQUE (report_id)
);

-- Create indexes for better performance

-- File uploads indexes
CREATE INDEX idx_file_uploads_file_type ON file_uploads(file_type);
CREATE INDEX idx_file_uploads_uploaded_at ON file_uploads(uploaded_at DESC);
CREATE INDEX idx_file_uploads_size ON file_uploads(size);

-- Analysis reports indexes
CREATE INDEX idx_analysis_reports_file_upload_id ON analysis_reports(file_upload_id);
CREATE INDEX idx_analysis_reports_status ON analysis_reports(status);
CREATE INDEX idx_analysis_reports_created_at ON analysis_reports(created_at DESC);
CREATE INDEX idx_analysis_reports_updated_at ON analysis_reports(updated_at DESC);
CREATE INDEX idx_analysis_reports_title ON analysis_reports USING gin(to_tsvector('english', title));
CREATE INDEX idx_analysis_reports_summary ON analysis_reports USING gin(to_tsvector('english', summary));

-- Insights indexes
CREATE INDEX idx_insights_report_id ON insights(report_id);
CREATE INDEX idx_insights_type ON insights(type);
CREATE INDEX idx_insights_importance ON insights(importance DESC);
CREATE INDEX idx_insights_confidence ON insights(confidence DESC);
CREATE INDEX idx_insights_created_at ON insights(created_at DESC);
CREATE INDEX idx_insights_title ON insights USING gin(to_tsvector('english', title));

-- Visualizations indexes
CREATE INDEX idx_visualizations_report_id ON visualizations(report_id);
CREATE INDEX idx_visualizations_type ON visualizations(type);
CREATE INDEX idx_visualizations_priority ON visualizations(priority DESC);

-- Report exports indexes
CREATE INDEX idx_report_exports_report_id ON report_exports(report_id);
CREATE INDEX idx_report_exports_format ON report_exports(format);
CREATE INDEX idx_report_exports_expires_at ON report_exports(expires_at);
CREATE INDEX idx_report_exports_created_at ON report_exports(created_at DESC);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for analysis_reports updated_at
CREATE TRIGGER update_analysis_reports_updated_at 
  BEFORE UPDATE ON analysis_reports 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Create views for common queries

-- View for complete report information
CREATE VIEW analysis_reports_with_files AS
SELECT 
  ar.*,
  fu.original_name as file_original_name,
  fu.file_type,
  fu.size as file_size,
  fu.uploaded_at as file_uploaded_at,
  (SELECT COUNT(*) FROM insights WHERE report_id = ar.id) as insight_count,
  (SELECT COUNT(*) FROM visualizations WHERE report_id = ar.id) as visualization_count,
  dqa.overall_score as data_quality_score
FROM analysis_reports ar
JOIN file_uploads fu ON ar.file_upload_id = fu.id
LEFT JOIN data_quality_assessments dqa ON ar.id = dqa.report_id;

-- View for insight summary by type
CREATE VIEW insight_summary_by_type AS
SELECT 
  type,
  COUNT(*) as total_insights,
  AVG(confidence) as avg_confidence,
  AVG(importance) as avg_importance,
  COUNT(DISTINCT report_id) as reports_with_insights
FROM insights
GROUP BY type
ORDER BY total_insights DESC;

-- View for file analysis statistics
CREATE VIEW file_analysis_stats AS
SELECT 
  fu.file_type,
  COUNT(*) as total_files,
  AVG(fu.size) as avg_file_size,
  COUNT(ar.id) as analyzed_files,
  COUNT(CASE WHEN ar.status = 'COMPLETED' THEN 1 END) as successful_analyses,
  COUNT(CASE WHEN ar.status = 'FAILED' THEN 1 END) as failed_analyses,
  AVG(ar.execution_time) as avg_execution_time
FROM file_uploads fu
LEFT JOIN analysis_reports ar ON fu.id = ar.file_upload_id
GROUP BY fu.file_type
ORDER BY total_files DESC;

-- Add comments for documentation
COMMENT ON TABLE file_uploads IS 'Stores information about uploaded files awaiting or completed analysis';
COMMENT ON TABLE analysis_reports IS 'Contains AI-generated analysis results and insights for uploaded files';
COMMENT ON TABLE insights IS 'Individual insights extracted from file analysis';
COMMENT ON TABLE data_quality_assessments IS 'Data quality metrics and issues identified during analysis';
COMMENT ON TABLE visualizations IS 'Chart and visualization configurations generated from analysis';
COMMENT ON TABLE report_exports IS 'Tracks exported report files and download statistics';
COMMENT ON TABLE analysis_sessions IS 'Manages analysis process state and progress tracking';

COMMENT ON COLUMN file_uploads.metadata IS 'Additional file information like tags, description, processing hints';
COMMENT ON COLUMN analysis_reports.raw_analysis IS 'Complete AI response, file metadata, and analysis configuration';
COMMENT ON COLUMN insights.metadata IS 'Evidence, source information, and additional insight context';
COMMENT ON COLUMN visualizations.data IS 'Chart.js compatible data structure for rendering';
COMMENT ON COLUMN visualizations.config IS 'Chart configuration, axes, styling, and display options';

-- Grant permissions (adjust based on your user roles)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO smartbi_app;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO smartbi_app;