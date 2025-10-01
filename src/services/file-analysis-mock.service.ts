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
import { generateId } from '../utils/uuid';

/**
 * Mock implementation of FileAnalysisDatabaseService for testing without database
 */
export class FileAnalysisMockService {
  private mockData: {
    fileUploads: Map<string, FileUpload>;
    analysisReports: Map<string, AnalysisReport>;
  } = {
    fileUploads: new Map(),
    analysisReports: new Map()
  };

  /**
   * Save file upload record to memory
   */
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
  const id = generateId();
    const fileUpload: FileUpload = {
      id,
      filename,
      originalName,
      mimetype,
      encoding,
      size,
      path,
      fileType,
      uploadedAt: new Date(),
      metadata
    };

    this.mockData.fileUploads.set(id, fileUpload);
    console.log('✅ File upload saved to mock storage:', { id, originalName, fileType });
    return fileUpload;
  }

  /**
   * Save analysis report to memory
   */
  async saveAnalysisReport(
    fileUploadId: string,
    aiResponse: AIAnalysisResponse,
    executionTime?: number
  ): Promise<AnalysisReport> {
  const reportId = generateId();
    const fileUpload = this.mockData.fileUploads.get(fileUploadId);
    
    if (!fileUpload) {
      throw new Error(`File upload with ID ${fileUploadId} not found`);
    }

    const title = this.generateReportTitle(aiResponse);
    
    // Convert AI insights to database format
    const insights: Insight[] = aiResponse.insights.map(aiInsight => ({
  id: generateId(),
      reportId,
      type: aiInsight.type,
      title: aiInsight.title,
      description: aiInsight.description,
      value: aiInsight.value ? String(aiInsight.value) : undefined,
      confidence: aiInsight.confidence,
      importance: this.calculateImportance(aiInsight),
      metadata: {
        evidence: aiInsight.evidence || [],
        actionable: aiInsight.actionable,
        originalConfidence: aiInsight.confidence
      },
      createdAt: new Date()
    }));

    // Convert data quality assessment
    const dataQuality: DataQuality = aiResponse.dataQuality ? {
      score: aiResponse.dataQuality.overallScore,
      completeness: aiResponse.dataQuality.completeness,
      accuracy: aiResponse.dataQuality.accuracy,
      consistency: aiResponse.dataQuality.consistency,
      validity: aiResponse.dataQuality.validity,
      issues: (aiResponse.dataQuality.issues || []).map(issue => ({
        type: issue.type,
        severity: issue.severity,
        description: issue.description,
        count: 1, // Default count
        examples: [] // Default examples
      }))
    } : {
      score: 0.5,
      completeness: 0.5,
      accuracy: 0.5,
      consistency: 0.5,
      validity: 0.5,
      issues: []
    };

    const analysisReport: AnalysisReport = {
      id: reportId,
      fileUploadId,
      fileUpload,
      status: AnalysisStatus.COMPLETED,
      title,
      summary: aiResponse.summary,
      executionTime,
      recommendations: aiResponse.recommendations,
      insights,
      dataQuality,
      visualizations: [], // TODO: Implement visualization generation
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.mockData.analysisReports.set(reportId, analysisReport);
    console.log('✅ Analysis report saved to mock storage:', { reportId, title, insightCount: insights.length });
    return analysisReport;
  }

  /**
   * Get file upload by ID
   */
  async getFileUpload(id: string): Promise<FileUpload | null> {
    return this.mockData.fileUploads.get(id) || null;
  }

  /**
   * Get analysis report by ID
   */
  async getAnalysisReport(id: string): Promise<AnalysisReport | null> {
    return this.mockData.analysisReports.get(id) || null;
  }

  /**
   * Get all analysis reports for a file upload
   */
  async getAnalysisReportsByFileUpload(fileUploadId: string): Promise<AnalysisReport[]> {
    const reports: AnalysisReport[] = [];
    for (const report of this.mockData.analysisReports.values()) {
      if (report.fileUploadId === fileUploadId) {
        reports.push(report);
      }
    }
    return reports.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Get all file uploads
   */
  async getAllFileUploads(): Promise<FileUpload[]> {
    return Array.from(this.mockData.fileUploads.values())
      .sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime());
  }

  /**
   * Get all analysis reports
   */
  async getAllAnalysisReports(): Promise<AnalysisReport[]> {
    return Array.from(this.mockData.analysisReports.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Clear all mock data (for testing)
   */
  async clearAll(): Promise<void> {
    this.mockData.fileUploads.clear();
    this.mockData.analysisReports.clear();
    console.log('🧹 Mock data cleared');
  }

  /**
   * Get mock data statistics
   */
  async getStats(): Promise<{ fileUploads: number; analysisReports: number }> {
    return {
      fileUploads: this.mockData.fileUploads.size,
      analysisReports: this.mockData.analysisReports.size
    };
  }

  // Helper methods (same as in the real service)
  private generateReportTitle(aiResponse: AIAnalysisResponse): string {
    const insightCount = aiResponse.insights.length;
    const qualityScore = aiResponse.dataQuality ? 
      Math.round(aiResponse.dataQuality.overallScore * 100) : 50;
    
    return `Analysis Report - ${insightCount} insights (${qualityScore}% quality)`;
  }

  private calculateImportance(insight: AIInsight): number {
    let importance = insight.confidence * 10; // Base on confidence (0-10)
    
    // Increase importance for actionable insights
    if (insight.actionable) {
      importance += 2;
    }
    
    // Adjust based on insight type
    switch (insight.type) {
      case InsightType.BUSINESS_INSIGHT:
        importance += 3;
        break;
      case InsightType.ANOMALY_DETECTION:
        importance += 2;
        break;
      case InsightType.DATA_PATTERN:
        importance += 1;
        break;
      case InsightType.STATISTICAL:
        importance += 0.5;
        break;
    }
    
    // Cap at 10
    return Math.min(importance, 10);
  }
}