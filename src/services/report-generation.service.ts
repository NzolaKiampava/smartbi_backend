import { generateId } from '../utils/uuid';
import {
  AnalysisReport,
  AnalysisStatus,
  FileUpload,
  ProcessedFileData,
  AIAnalysisResponse,
  Insight,
  InsightType,
  Visualization,
  DataQuality,
  AnalysisOptionsInput,
  ReportFormat,
  ReportExport,
} from '../types/file-analysis';
import { AIAnalysisService } from './ai-analysis.service';
import { FileUploadService } from './file-upload.service';

export class ReportGenerationService {
  private aiAnalysisService: AIAnalysisService;
  private fileUploadService: FileUploadService;

  constructor() {
    this.aiAnalysisService = new AIAnalysisService();
    this.fileUploadService = new FileUploadService();
  }

  async generateAnalysisReport(
    fileUpload: FileUpload,
    options: AnalysisOptionsInput = {}
  ): Promise<AnalysisReport> {
  const reportId = generateId();
    const startTime = Date.now();

    // Create initial report with PENDING status
    let report: AnalysisReport = {
      id: reportId,
      fileUploadId: fileUpload.id,
      fileUpload,
      status: AnalysisStatus.PENDING,
      title: `Analysis of ${fileUpload.originalName}`,
      summary: 'Analysis is being processed...',
      insights: [],
      recommendations: [],
      visualizations: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    try {
      // Update status to PROCESSING
      report.status = AnalysisStatus.PROCESSING;
      report.updatedAt = new Date();

      // Process the file
      const fileData = await this.fileUploadService.processFile(fileUpload);

      // Perform AI analysis
      const aiResponse = await this.aiAnalysisService.analyzeFile(
        fileUpload,
        options
      );

      // Build comprehensive report
      report = await this.buildComprehensiveReport(
        report,
        fileData,
        aiResponse,
        options
      );

      // Calculate execution time
      report.executionTime = Date.now() - startTime;
      report.status = AnalysisStatus.COMPLETED;
      report.updatedAt = new Date();

      return report;
    } catch (error) {
      // Handle analysis failure
      report.status = AnalysisStatus.FAILED;
      report.error = error instanceof Error ? error.message : 'Unknown error occurred';
      report.updatedAt = new Date();
      report.executionTime = Date.now() - startTime;

      // Add basic error insight
      report.insights = [{
        id: generateId(),
        reportId: report.id,
        type: InsightType.SUMMARY,
        title: 'Analysis Failed',
        description: `File analysis could not be completed: ${report.error}`,
        confidence: 1.0,
        importance: 10,
        createdAt: new Date(),
      }];

      return report;
    }
  }

  private async buildComprehensiveReport(
    baseReport: AnalysisReport,
    fileData: ProcessedFileData,
    aiResponse: AIAnalysisResponse,
    options: AnalysisOptionsInput
  ): Promise<AnalysisReport> {
    // Generate comprehensive summary
    const summary = this.generateReportSummary(fileData, aiResponse, baseReport.fileUpload);

    // Convert AI insights to report insights
    const insights = await this.generateReportInsights(baseReport.id, aiResponse, fileData);

    // Generate visualizations
    const visualizations = await this.generateVisualizations(aiResponse, fileData);

    // Extract recommendations
    const recommendations = this.extractRecommendations(aiResponse, fileData, options);

    // Build data quality assessment
    const dataQuality = this.buildDataQuality(aiResponse.dataQuality);

    return {
      ...baseReport,
      title: this.generateReportTitle(baseReport.fileUpload, aiResponse),
      summary,
      insights,
      recommendations,
      dataQuality,
      visualizations,
      rawAnalysis: {
        aiResponse,
        fileMetadata: fileData.metadata,
        analysisOptions: options,
      },
    };
  }

  private generateReportTitle(fileUpload: FileUpload, aiResponse: AIAnalysisResponse): string {
    const fileName = fileUpload.originalName.replace(/\.[^/.]+$/, ''); // Remove extension
    const fileType = fileUpload.fileType;
    
    // Try to determine report type from insights
    const hasRevenue = aiResponse.insights.some(i => i.type === InsightType.REVENUE_TREND);
    const hasTable = aiResponse.insights.some(i => i.type === InsightType.TABLE_STRUCTURE);
    const hasData = aiResponse.insights.some(i => i.type === InsightType.DATA_PATTERN);

    if (hasRevenue) {
      return `Revenue Analysis: ${fileName}`;
    } else if (hasTable) {
      return `Database Analysis: ${fileName}`;
    } else if (hasData) {
      return `Data Analysis: ${fileName}`;
    } else {
      return `${fileType} Analysis: ${fileName}`;
    }
  }

  private generateReportSummary(
    fileData: ProcessedFileData,
    aiResponse: AIAnalysisResponse,
    fileUpload: FileUpload
  ): string {
    const fileSize = this.formatFileSize(fileUpload.size);
    const tableCount = fileData.tables?.length || 0;
    const insightCount = aiResponse.insights.length;
    
    let summary = `Analysis of ${fileUpload.originalName} (${fileSize}).\n\n`;
    
    // File structure summary
    if (tableCount > 0) {
      summary += `📊 Data Structure:\n`;
      summary += `- ${tableCount} table${tableCount > 1 ? 's' : ''} identified\n`;
      
      fileData.tables?.forEach((table, index) => {
        summary += `- Table ${index + 1}${table.name ? ` (${table.name})` : ''}: ${table.rowCount} rows, ${table.columnCount} columns\n`;
      });
      summary += '\n';
    }

    // Key insights summary
    if (insightCount > 0) {
      summary += `🔍 Key Findings:\n`;
      const topInsights = aiResponse.insights
        .sort((a, b) => b.importance - a.importance)
        .slice(0, 3);
      
      topInsights.forEach((insight, index) => {
        summary += `${index + 1}. ${insight.title}: ${insight.description}\n`;
      });
      summary += '\n';
    }

    // Data quality summary
    if (aiResponse.dataQuality) {
      const score = Math.round(aiResponse.dataQuality.overallScore * 100);
      summary += `📈 Data Quality Score: ${score}%\n`;
      
      if (aiResponse.dataQuality.issues.length > 0) {
        const criticalIssues = aiResponse.dataQuality.issues.filter(i => i.severity === 'CRITICAL').length;
        const highIssues = aiResponse.dataQuality.issues.filter(i => i.severity === 'HIGH').length;
        
        if (criticalIssues > 0 || highIssues > 0) {
          summary += `⚠️ ${criticalIssues + highIssues} high-priority issue${criticalIssues + highIssues > 1 ? 's' : ''} identified\n`;
        }
      }
      summary += '\n';
    }

    // Add AI summary if available
    if (aiResponse.summary && aiResponse.summary.trim()) {
      summary += `🤖 AI Analysis Summary:\n${aiResponse.summary}\n\n`;
    }

    // Recommendations preview
    if (aiResponse.recommendations.length > 0) {
      summary += `💡 Top Recommendations:\n`;
      aiResponse.recommendations.slice(0, 2).forEach((rec, index) => {
        summary += `${index + 1}. ${rec}\n`;
      });
      
      if (aiResponse.recommendations.length > 2) {
        summary += `... and ${aiResponse.recommendations.length - 2} more\n`;
      }
    }

    return summary.trim();
  }

  private async generateReportInsights(
    reportId: string,
    aiResponse: AIAnalysisResponse,
    fileData: ProcessedFileData
  ): Promise<Insight[]> {
    const insights: Insight[] = [];

    // Convert AI insights
    aiResponse.insights.forEach(aiInsight => {
      insights.push({
  id: generateId(),
        reportId,
        type: aiInsight.type,
        title: aiInsight.title,
        description: aiInsight.description,
        value: aiInsight.value?.toString(),
        confidence: aiInsight.confidence,
        importance: aiInsight.importance,
        metadata: {
          evidence: aiInsight.evidence,
          source: 'ai_analysis',
        },
        createdAt: new Date(),
      });
    });

    // Add file metadata insights
    insights.push({
      id: generateId(),
      reportId,
      type: InsightType.SUMMARY,
      title: 'File Overview',
      description: `Analyzed ${fileData.metadata.type} file with ${fileData.metadata.estimatedRows || 'unknown'} rows of data`,
      value: JSON.stringify({
        fileType: fileData.metadata.type,
        size: fileData.metadata.size,
        estimatedRows: fileData.metadata.estimatedRows,
      }),
      confidence: 1.0,
      importance: 3,
      metadata: {
        source: 'file_metadata',
        ...fileData.metadata,
      },
      createdAt: new Date(),
    });

    // Add table structure insights
    if (fileData.tables && fileData.tables.length > 0) {
      fileData.tables.forEach((table, index) => {
        insights.push({
    id: generateId(),
          reportId,
          type: InsightType.TABLE_STRUCTURE,
          title: `Table Structure${table.name ? `: ${table.name}` : ` ${index + 1}`}`,
          description: `Table contains ${table.rowCount} rows and ${table.columnCount} columns. Columns: ${table.headers.join(', ')}`,
          value: JSON.stringify({
            rowCount: table.rowCount,
            columnCount: table.columnCount,
            headers: table.headers,
          }),
          confidence: 1.0,
          importance: 6,
          metadata: {
            source: 'table_analysis',
            tableName: table.name,
            sampleData: table.rows.slice(0, 2),
          },
          createdAt: new Date(),
        });
      });
    }

    return insights.sort((a, b) => b.importance - a.importance);
  }

  private async generateVisualizations(
    aiResponse: AIAnalysisResponse,
    fileData: ProcessedFileData
  ): Promise<Visualization[]> {
    const visualizations: Visualization[] = [];

    // Convert AI visualization suggestions
    if (aiResponse.visualizations) {
      aiResponse.visualizations.forEach((viz, index) => {
        visualizations.push({
          id: generateId(),
          type: viz.type,
          title: viz.title,
          description: viz.description,
          data: viz.data,
          config: {
            xAxis: viz.xAxis,
            yAxis: viz.yAxis,
            priority: viz.priority,
          },
        });
      });
    }

    // Generate basic visualizations from table data
    if (fileData.tables && fileData.tables.length > 0) {
      fileData.tables.forEach((table, tableIndex) => {
        // Create column distribution visualization
        if (table.headers.length > 0) {
          const columnStats = this.calculateColumnStats(table);
          
          visualizations.push({
            id: generateId(),
            type: 'BAR',
            title: `Column Data Distribution${table.name ? ` - ${table.name}` : ` - Table ${tableIndex + 1}`}`,
            description: 'Distribution of data types across columns',
            data: {
              labels: Object.keys(columnStats),
              datasets: [{
                label: 'Column Count',
                data: Object.values(columnStats),
                backgroundColor: 'rgba(54, 162, 235, 0.6)',
              }],
            },
            config: {
              priority: 5,
            },
          });
        }

        // Create row count visualization if multiple tables
        if (fileData.tables && fileData.tables.length > 1) {
          const tableData = fileData.tables.map((t, i) => ({
            name: t.name || `Table ${i + 1}`,
            rows: t.rowCount,
          }));

          visualizations.push({
            id: generateId(),
            type: 'PIE',
            title: 'Data Distribution Across Tables',
            description: 'Relative size of each table by row count',
            data: {
              labels: tableData.map(t => t.name),
              datasets: [{
                data: tableData.map(t => t.rows),
                backgroundColor: [
                  'rgba(255, 99, 132, 0.6)',
                  'rgba(54, 162, 235, 0.6)',
                  'rgba(255, 205, 86, 0.6)',
                  'rgba(75, 192, 192, 0.6)',
                  'rgba(153, 102, 255, 0.6)',
                ],
              }],
            },
            config: {
              priority: 4,
            },
          });
        }
      });
    }

    return visualizations.sort((a, b) => (b.config?.priority || 0) - (a.config?.priority || 0));
  }

  private extractRecommendations(
    aiResponse: AIAnalysisResponse,
    fileData: ProcessedFileData,
    options: AnalysisOptionsInput
  ): string[] {
    const recommendations: string[] = [...(aiResponse.recommendations || [])];

    // Add file-specific recommendations
    if (fileData.metadata.type === 'CSV' && fileData.metadata.hasHeaders === false) {
      recommendations.push('Consider adding column headers to improve data readability');
    }

    if (fileData.metadata.size && fileData.metadata.size > 10000000) { // 10MB
      recommendations.push('Large file detected - consider data pagination or chunking for better performance');
    }

    // Add data quality recommendations
    if (aiResponse.dataQuality && aiResponse.dataQuality.overallScore < 0.7) {
      recommendations.push('Data quality score is below 70% - consider implementing data validation and cleaning processes');
    }

    // Add analysis-specific recommendations
    if (options.analyzeRevenue && !aiResponse.revenue) {
      recommendations.push('No revenue data detected - ensure revenue columns are properly formatted and named');
    }

    if (options.generateVisualizations && (!aiResponse.visualizations || aiResponse.visualizations.length === 0)) {
      recommendations.push('Consider restructuring data to enable more meaningful visualizations');
    }

    return [...new Set(recommendations)]; // Remove duplicates
  }

  private buildDataQuality(aiDataQuality?: any): DataQuality | undefined {
    if (!aiDataQuality) return undefined;

    return {
      score: aiDataQuality.overallScore || 0.5,
      completeness: aiDataQuality.completeness || 0.5,
      accuracy: aiDataQuality.accuracy || 0.5,
      consistency: aiDataQuality.consistency || 0.5,
      validity: aiDataQuality.validity || 0.5,
      issues: (aiDataQuality.issues || []).map((issue: any) => ({
        type: issue.type || 'unknown',
        description: issue.description || 'No description available',
        severity: issue.severity || 'MEDIUM',
        count: issue.count || 0,
        examples: issue.sampleValues || issue.examples || [],
      })),
    };
  }

  private calculateColumnStats(table: any): Record<string, number> {
    const stats: Record<string, number> = {};
    
    table.headers.forEach((header: string) => {
      // Simple data type detection based on sample values
      const columnIndex = table.headers.indexOf(header);
      const sampleValues = table.rows.slice(0, 10).map((row: any[]) => row[columnIndex]);
      
      const dataType = this.detectDataType(sampleValues);
      stats[dataType] = (stats[dataType] || 0) + 1;
    });

    return stats;
  }

  private detectDataType(values: any[]): string {
    const nonEmptyValues = values.filter(v => v !== null && v !== undefined && v !== '');
    
    if (nonEmptyValues.length === 0) return 'Empty';
    
    const numericCount = nonEmptyValues.filter(v => !isNaN(Number(v))).length;
    const dateCount = nonEmptyValues.filter(v => !isNaN(Date.parse(v))).length;
    
    const numericRatio = numericCount / nonEmptyValues.length;
    const dateRatio = dateCount / nonEmptyValues.length;
    
    if (numericRatio > 0.8) return 'Numeric';
    if (dateRatio > 0.8) return 'Date';
    
    return 'Text';
  }

  private formatFileSize(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  async regenerateReport(reportId: string, options?: AnalysisOptionsInput): Promise<AnalysisReport> {
    // This would typically fetch the existing report from database
    // For now, we'll throw an error as this requires database integration
    throw new Error('Report regeneration requires database integration');
  }

  async addCustomInsight(reportId: string, insightText: string): Promise<Insight> {
    const insight: Insight = {
      id: generateId(),
      reportId,
      type: InsightType.BUSINESS_INSIGHT,
      title: 'Custom Insight',
      description: insightText,
      confidence: 1.0,
      importance: 5,
      metadata: {
        source: 'user_input',
        addedAt: new Date(),
      },
      createdAt: new Date(),
    };

    return insight;
  }

  async exportReport(report: AnalysisReport, format: ReportFormat): Promise<ReportExport> {
    // This would generate the actual export file
    // For now, return a mock export object
    const filename = `${report.title.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.${format.toLowerCase()}`;
    
    return {
      url: `/exports/${filename}`,
      filename,
      format,
      size: 1024, // Mock size
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    };
  }

  getReportMetrics(report: AnalysisReport): Record<string, any> {
    return {
      insightCount: report.insights.length,
      recommendationCount: report.recommendations.length,
      visualizationCount: report.visualizations.length,
      dataQualityScore: report.dataQuality?.score,
      executionTime: report.executionTime,
      fileSize: report.fileUpload.size,
      status: report.status,
      createdAt: report.createdAt,
      updatedAt: report.updatedAt,
    };
  }
}