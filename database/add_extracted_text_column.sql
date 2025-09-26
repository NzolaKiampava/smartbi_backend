-- Add extracted_text column to analysis_reports table
ALTER TABLE analysis_reports 
ADD COLUMN extracted_text TEXT;

-- Add comment to describe the column
COMMENT ON COLUMN analysis_reports.extracted_text IS 'OCR extracted text content from uploaded files';