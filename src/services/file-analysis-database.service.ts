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
        uploadedAt: data.uploaded_at,
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
  private async saveInsights(
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
   * Save visualization suggestions as visualization records
   */
  private async saveVisualizationSuggestions(
    client: PoolClient,
    reportId: string,
    suggestions: string[]
  ): Promise<Visualization[]> {
    const visualizations: Visualization[] = [];
    
    for (let i = 0; i < suggestions.length; i++) {
      const suggestion = suggestions[i];
      const type = this.extractVisualizationType(suggestion);
      
      const query = `
        INSERT INTO visualizations (
          report_id, type, title, description, data, config, priority
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;
      
      const values = [
        reportId,
        type,
        `Suggested ${type}`,
        suggestion,
        JSON.stringify({}), // Empty data - suggestions only
        JSON.stringify({ suggested: true }),
        10 - i // Higher priority for earlier suggestions
      ];
      
      const result = await client.query(query, values);
      const row = result.rows[0];
      
      visualizations.push({
        id: row.id,
        type: row.type,
        title: row.title,
        description: row.description,
        data: row.data,
        config: row.config
      });
    }
    
    return visualizations;
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
        uploadedAt: data.uploaded_at,
        metadata: data.metadata || {}
      };
    } catch (error) {
      console.error('Error in getFileUpload:', error);
      throw error;
    }
  }

  /**
   * Get analysis report by ID
   */
  async getAnalysisReport(id: string): Promise<AnalysisReport | null> {
    const client = await this.pool.connect();
    
    try {
      // Get main report
      const reportQuery = 'SELECT * FROM analysis_reports WHERE id = $1';
      const reportResult = await client.query(reportQuery, [id]);
      
      if (reportResult.rows.length === 0) {
        return null;
      }
      
      const reportRow = reportResult.rows[0];
      
      // Get insights
      const insightsQuery = 'SELECT * FROM insights WHERE report_id = $1 ORDER BY importance DESC';
      const insightsResult = await client.query(insightsQuery, [id]);
      const insights = insightsResult.rows.map(row => ({
        id: row.id,
        reportId: row.report_id,
        type: row.type,
        title: row.title,
        description: row.description,
        value: row.value,
        confidence: row.confidence,
        importance: row.importance,
        metadata: row.metadata,
        createdAt: row.created_at
      }));
      
      // Get data quality
      const qualityQuery = 'SELECT * FROM data_quality_assessments WHERE report_id = $1';
      const qualityResult = await client.query(qualityQuery, [id]);
      const dataQuality = qualityResult.rows[0] ? {
        score: qualityResult.rows[0].overall_score,
        completeness: qualityResult.rows[0].completeness,
        accuracy: qualityResult.rows[0].accuracy,
        consistency: qualityResult.rows[0].consistency,
        validity: qualityResult.rows[0].validity,
        issues: qualityResult.rows[0].issues || []
      } : undefined;
      
      // Get visualizations
      const vizQuery = 'SELECT * FROM visualizations WHERE report_id = $1 ORDER BY priority DESC';
      const vizResult = await client.query(vizQuery, [id]);
      const visualizations = vizResult.rows.map(row => ({
        id: row.id,
        type: row.type,
        title: row.title,
        description: row.description,
        data: row.data,
        config: row.config
      }));
      
      // Get the complete file upload info
      const fileUpload = await this.getFileUpload(reportRow.file_upload_id);
      if (!fileUpload) {
        throw new Error(`File upload with ID ${reportRow.file_upload_id} not found`);
      }
      
      return {
        id: reportRow.id,
        fileUploadId: reportRow.file_upload_id,
        fileUpload,
        status: reportRow.status,
        title: reportRow.title,
        summary: reportRow.summary,
        executionTime: reportRow.execution_time,
        recommendations: reportRow.recommendations,
        insights,
        dataQuality,
        visualizations,
        createdAt: reportRow.created_at,
        updatedAt: reportRow.updated_at
      };
    } finally {
      client.release();
    }
  }

  /**
   * List analysis reports with pagination
   */
  async listAnalysisReports(limit: number = 20, offset: number = 0): Promise<AnalysisReport[]> {
    const client = await this.pool.connect();
    
    try {
      const query = `
        SELECT ar.*, fu.original_name as file_original_name
        FROM analysis_reports ar
        JOIN file_uploads fu ON ar.file_upload_id = fu.id
        ORDER BY ar.created_at DESC
        LIMIT $1 OFFSET $2
      `;
      
      const result = await client.query(query, [limit, offset]);
      
      const reports: AnalysisReport[] = [];
      for (const row of result.rows) {
        const report = await this.getAnalysisReport(row.id);
        if (report) {
          reports.push(report);
        }
      }
      
      return reports;
    } finally {
      client.release();
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
   * Close database connection
   */
  async close(): Promise<void> {
    await this.pool.end();
  }
}