import { supabase } from '../config/database';
import { 
  FileUpload, 
  AnalysisReport, 
  Insight, 
  Visualization,
  AnalysisStatus,
  FileType,
  InsightType,
  AIInsight,
  AIAnalysisResponse,
  AIDataQuality,
  DataQuality
} from '../types/file-analysis';
import { FileParserService } from './file-parser.service';

export class FileAnalysisDatabaseService {
  constructor() {
    // Using Supabase client from config
  }

  async saveFileUpload(
    filename: string,
    originalName: string,
    mimetype: string,
    encoding: string,
    size: number,
    path: string,
    fileType: FileType,
    metadata: Record<string, any> = {}
  ): Promise<FileUpload> {
    try {
      const { data, error } = await supabase
        .from('file_uploads')
        .insert([{
          filename,
          original_name: originalName,
          mimetype,
          encoding,
          size,
          path,
          file_type: fileType,
          metadata
        }])
        .select()
        .single();

      if (error) {
        console.error('Error saving file upload:', error);
        throw new Error(`Failed to save file upload: ${error.message}`);
      }

      return {
        id: data.id,
        filename: data.filename,
        originalName: data.original_name,
        mimetype: data.mimetype,
        encoding: data.encoding,
        size: data.size,
        path: data.path,
        fileType: data.file_type,
        uploadedAt: data.created_at,
        metadata: data.metadata || {}
      };
    } catch (error) {
      console.error('Error in saveFileUpload:', error);
      throw error;
    }
  }

  /**
   * Save analysis report to database
   */
  async saveAnalysisReport(
    fileUploadId: string,
    aiResponse: AIAnalysisResponse,
    executionTime?: number
  ): Promise<AnalysisReport> {
    try {
      // Save main analysis report
      const title = this.generateReportTitle(aiResponse);
      
      const { data: reportData, error: reportError } = await supabase
        .from('analysis_reports')
        .insert([{
          file_upload_id: fileUploadId,
          status: AnalysisStatus.COMPLETED,
          title,
          summary: aiResponse.summary,
          execution_time: executionTime,
          recommendations: aiResponse.recommendations,
          extracted_text: aiResponse.extractedText, // Store OCR text
          raw_analysis: aiResponse
        }])
        .select()
        .single();

      if (reportError) {
        console.error('Error saving analysis report:', reportError);
        throw new Error(`Failed to save analysis report: ${reportError.message}`);
      }

      const reportId = reportData.id;

      // Save insights
      const insights = await this.saveInsights(reportId, aiResponse.insights);

      // Save data quality assessment
      const dataQuality = await this.saveDataQualityAssessment(reportId, aiResponse.dataQuality);

      // TODO: Save visualizations when implemented
      const visualizations: Visualization[] = [];

      // Get the complete file upload info
      const fileUpload = await this.getFileUpload(reportData.file_upload_id);
      if (!fileUpload) {
        throw new Error(`File upload with ID ${reportData.file_upload_id} not found`);
      }

      return {
        id: reportData.id,
        fileUploadId: reportData.file_upload_id,
        fileUpload,
        status: reportData.status,
        title: reportData.title,
        summary: reportData.summary,
        executionTime: reportData.execution_time,
        recommendations: reportData.recommendations,
        extractedText: reportData.extracted_text, // Include OCR text
        insights,
        dataQuality,
        visualizations,
        createdAt: reportData.created_at,
        updatedAt: reportData.updated_at
      };
    } catch (error) {
      console.error('Error in saveAnalysisReport:', error);
      throw error;
    }
  }

  /**
   * Save insights to database
   */
  async saveInsights(
    reportId: string, 
    aiInsights: AIInsight[]
  ): Promise<Insight[]> {
    const insights: Insight[] = [];
    
    for (const aiInsight of aiInsights) {
      const importance = this.calculateImportance(aiInsight);
      const metadata = {
        evidence: aiInsight.evidence || [],
        actionable: aiInsight.actionable,
        originalConfidence: aiInsight.confidence
      };
      
      const { data, error } = await supabase
        .from('insights')
        .insert([{
          report_id: reportId,
          type: aiInsight.type,
          title: aiInsight.title,
          description: aiInsight.description,
          value: aiInsight.value,
          confidence: aiInsight.confidence,
          importance,
          metadata
        }])
        .select()
        .single();

      if (error) {
        console.error('Error saving insight:', error);
        throw new Error(`Failed to save insight: ${error.message}`);
      }
      
      insights.push({
        id: data.id,
        reportId: data.report_id,
        type: data.type,
        title: data.title,
        description: data.description,
        value: data.value,
        confidence: data.confidence,
        importance: data.importance,
        metadata: data.metadata,
        createdAt: data.created_at
      });
    }
    
    return insights;
  }

  /**
   * Save data quality assessment
   */
  private async saveDataQualityAssessment(
    reportId: string,
    dataQuality: any
  ): Promise<DataQuality> {
    const { data, error } = await supabase
      .from('data_quality_assessments')
      .insert([{
        report_id: reportId,
        overall_score: dataQuality.overallScore,
        completeness: dataQuality.completeness,
        accuracy: dataQuality.accuracy,
        consistency: dataQuality.consistency,
        validity: dataQuality.validity,
        issues: dataQuality.issues || []
      }])
      .select()
      .single();

    if (error) {
      console.error('Error saving data quality assessment:', error);
      throw new Error(`Failed to save data quality assessment: ${error.message}`);
    }
    
    return {
      score: data.overall_score,
      completeness: data.completeness,
      accuracy: data.accuracy,
      consistency: data.consistency,
      validity: data.validity,
      issues: data.issues || []
    };
  }

  /**
   * Get file upload by ID
   */
  async getFileUpload(id: string): Promise<FileUpload | null> {
    try {
      const { data, error } = await supabase
        .from('file_uploads')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') { // Not found
          return null;
        }
        console.error('Error getting file upload:', error);
        throw new Error(`Failed to get file upload: ${error.message}`);
      }
      
      return {
        id: data.id,
        filename: data.filename,
        originalName: data.original_name,
        mimetype: data.mimetype,
        encoding: data.encoding,
        size: data.size,
        path: data.path,
        fileType: data.file_type,
        uploadedAt: data.created_at || data.uploaded_at,
        metadata: data.metadata || {}
      };
    } catch (error) {
      console.error('Error in getFileUpload:', error);
      throw error;
    }
  }

  /**
   * Get analysis report by ID using Supabase
   */
  async getAnalysisReport(id: string): Promise<AnalysisReport | null> {
    try {
      // Get main report with file upload
      const { data: reportData, error: reportError } = await supabase
        .from('analysis_reports')
        .select(`
          *,
          file_uploads!inner(*)
        `)
        .eq('id', id)
        .single();

      if (reportError || !reportData) {
        console.error('Error getting analysis report:', reportError);
        return null;
      }

      // Get insights
      const { data: insightsData, error: insightsError } = await supabase
        .from('insights')
        .select('*')
        .eq('report_id', id)
        .order('importance', { ascending: false });

      if (insightsError) {
        console.error('Error getting insights:', insightsError);
        return null;
      }

      const insights = (insightsData || []).map((row: any) => ({
        id: row.id,
        reportId: row.report_id,
        type: row.type,
        title: row.title,
        description: row.description,
        value: row.value,
        confidence: row.confidence,
        importance: row.importance,
        metadata: row.metadata || {},
        createdAt: row.created_at
      }));

      const fileUpload = reportData.file_uploads ? {
        id: reportData.file_uploads.id,
        filename: reportData.file_uploads.filename,
        originalName: reportData.file_uploads.original_name,
        mimetype: reportData.file_uploads.mimetype,
        encoding: reportData.file_uploads.encoding,
        size: reportData.file_uploads.size,
        path: reportData.file_uploads.path,
        fileType: reportData.file_uploads.file_type,
        metadata: reportData.file_uploads.metadata || {},
        createdAt: reportData.file_uploads.created_at,
        updatedAt: reportData.file_uploads.updated_at,
        uploadedAt: reportData.file_uploads.created_at // Map to uploadedAt
      } : null;

      if (!fileUpload) {
        return null;
      }

      return {
        id: reportData.id,
        fileUploadId: reportData.file_upload_id,
        status: reportData.status,
        title: reportData.title,
        summary: reportData.summary,
        extractedText: reportData.extracted_text, // Include OCR text
        insights,
        recommendations: [], // Empty for now
        visualizations: [], // Empty for now
        dataQuality: undefined, // Can be implemented if needed
        executionTime: reportData.execution_time,
        createdAt: reportData.created_at,
        updatedAt: reportData.updated_at,
        fileUpload
      };

    } catch (error) {
      console.error('Error in getAnalysisReport:', error);
      throw error;
    }
  }

  // Helper methods
  
  private generateReportTitle(aiResponse: AIAnalysisResponse): string {
    const businessInsight = aiResponse.insights?.find(i => i.type === InsightType.BUSINESS_INSIGHT);
    if (businessInsight) {
      return `${businessInsight.value} Data Analysis Report`;
    }
    
    const structureInsight = aiResponse.insights?.find(i => i.type === InsightType.TABLE_STRUCTURE);
    if (structureInsight) {
      return `${structureInsight.value} Analysis Report`;
    }
    
    return 'File Analysis Report';
  }

  private calculateImportance(aiInsight: AIInsight): number {
    // Convert confidence and actionability to importance score (1-10)
    let importance = Math.round(aiInsight.confidence * 10);
    
    if (aiInsight.actionable) {
      importance = Math.min(importance + 2, 10);
    }
    
    if (aiInsight.type === InsightType.ANOMALY_DETECTION) {
      importance = Math.min(importance + 1, 10);
    }
    
    return Math.max(importance, 1);
  }

  private extractVisualizationType(suggestion: string): string {
    const suggestion_lower = suggestion.toLowerCase();
    
    if (suggestion_lower.includes('bar')) return 'BAR';
    if (suggestion_lower.includes('line')) return 'LINE';
    if (suggestion_lower.includes('pie')) return 'PIE';
    if (suggestion_lower.includes('scatter')) return 'SCATTER';
    if (suggestion_lower.includes('box')) return 'BOX';
    if (suggestion_lower.includes('histogram')) return 'HISTOGRAM';
    if (suggestion_lower.includes('area')) return 'AREA';
    
    return 'CUSTOM';
  }

  /**
   * Get all file uploads
   */
  async getAllFileUploads(): Promise<FileUpload[]> {
    try {
      const { data, error } = await supabase
        .from('file_uploads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error getting all file uploads:', error);
        throw new Error(`Failed to get file uploads: ${error.message}`);
      }

      return data.map(row => ({
        id: row.id,
        filename: row.filename,
        originalName: row.original_name,
        mimetype: row.mimetype,
        encoding: row.encoding,
        size: row.size,
        path: row.path,
        fileType: row.file_type,
        uploadedAt: row.created_at,
        metadata: row.metadata || {}
      }));
    } catch (error) {
      console.error('Error in getAllFileUploads:', error);
      throw error;
    }
  }

  /**
   * Get all analysis reports
   */
  async getAllAnalysisReports(): Promise<AnalysisReport[]> {
    try {
      const { data, error } = await supabase
        .from('analysis_reports')
        .select(`
          *,
          file_uploads!inner(*)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error getting all analysis reports:', error);
        throw new Error(`Failed to get analysis reports: ${error.message}`);
      }

      const reports: AnalysisReport[] = [];
      
      for (const row of data) {
        // Get insights
        const { data: insightsData, error: insightsError } = await supabase
          .from('insights')
          .select('*')
          .eq('report_id', row.id)
          .order('importance', { ascending: false });

        if (insightsError) {
          console.error('Error getting insights:', insightsError);
          continue;
        }

        const insights = (insightsData || []).map((insightRow: any) => ({
          id: insightRow.id,
          reportId: insightRow.report_id,
          type: insightRow.type,
          title: insightRow.title,
          description: insightRow.description,
          value: insightRow.value,
          confidence: insightRow.confidence,
          importance: insightRow.importance,
          metadata: insightRow.metadata || {},
          createdAt: insightRow.created_at
        }));

        const fileUpload = row.file_uploads ? {
          id: row.file_uploads.id,
          filename: row.file_uploads.filename,
          originalName: row.file_uploads.original_name,
          mimetype: row.file_uploads.mimetype,
          encoding: row.file_uploads.encoding,
          size: row.file_uploads.size,
          path: row.file_uploads.path,
          fileType: row.file_uploads.file_type,
          uploadedAt: row.file_uploads.created_at,
          metadata: row.file_uploads.metadata || {}
        } : null;

        if (fileUpload) {
          reports.push({
            id: row.id,
            fileUploadId: row.file_upload_id,
            status: row.status,
            title: row.title,
            summary: row.summary,
            insights,
            recommendations: [], // Empty for now
            visualizations: [], // Empty for now
            dataQuality: undefined, // You can add data quality logic here if needed
            executionTime: row.execution_time,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            fileUpload
          });
        }
      }

      return reports;
    } catch (error) {
      console.error('Error in getAllAnalysisReports:', error);
      throw error;
    }
  }

  /**
   * Get analysis reports by file upload ID
   */
  async getAnalysisReportsByFileUpload(fileUploadId: string): Promise<AnalysisReport[]> {
    try {
      const { data, error } = await supabase
        .from('analysis_reports')
        .select(`
          *,
          file_uploads!inner(*)
        `)
        .eq('file_upload_id', fileUploadId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error getting analysis reports by file upload:', error);
        throw new Error(`Failed to get analysis reports: ${error.message}`);
      }

      const reports: AnalysisReport[] = [];
      
      for (const row of data) {
        // Get insights
        const { data: insightsData, error: insightsError } = await supabase
          .from('insights')
          .select('*')
          .eq('report_id', row.id)
          .order('importance', { ascending: false });

        if (insightsError) {
          console.error('Error getting insights:', insightsError);
          continue;
        }

        const insights = (insightsData || []).map((insightRow: any) => ({
          id: insightRow.id,
          reportId: insightRow.report_id,
          type: insightRow.type,
          title: insightRow.title,
          description: insightRow.description,
          value: insightRow.value,
          confidence: insightRow.confidence,
          importance: insightRow.importance,
          metadata: insightRow.metadata || {},
          createdAt: insightRow.created_at
        }));

        const fileUpload = row.file_uploads ? {
          id: row.file_uploads.id,
          filename: row.file_uploads.filename,
          originalName: row.file_uploads.original_name,
          mimetype: row.file_uploads.mimetype,
          encoding: row.file_uploads.encoding,
          size: row.file_uploads.size,
          path: row.file_uploads.path,
          fileType: row.file_uploads.file_type,
          uploadedAt: row.file_uploads.created_at,
          metadata: row.file_uploads.metadata || {}
        } : null;

        if (fileUpload) {
          reports.push({
            id: row.id,
            fileUploadId: row.file_upload_id,
            status: row.status,
            title: row.title,
            summary: row.summary,
            insights,
            recommendations: [], // Empty for now
            visualizations: [], // Empty for now
            dataQuality: undefined, // You can add data quality logic here if needed
            executionTime: row.execution_time,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            fileUpload
          });
        }
      }

      return reports;
    } catch (error) {
      console.error('Error in getAnalysisReportsByFileUpload:', error);
      throw error;
    }
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    // Supabase handles connection pooling automatically
    // No need to manually close connections
  }
}