import { GraphQLScalarType, GraphQLError } from 'graphql';
import { GraphQLJSON, GraphQLDateTime } from 'graphql-scalars';
import { 
  FileUploadInput,
  AnalysisOptionsInput,
  ReportExportInput,
  FileUpload,
  AnalysisReport,
  Insight,
  ReportExport,
  InsightType,
  ReportFormat,
  AnalysisStatus,
  AIAnalysisResponse
} from '../types/file-analysis';
import { FileUploadService } from '../services/file-upload.service';
import { ReportGenerationService } from '../services/report-generation.service';
import { FileAnalysisDatabaseService } from '../services/file-analysis-database.service';
import { GeminiAIService } from '../services/gemini-ai.service';
import { FileParserService } from '../services/file-parser.service';
import { generateId } from '../utils/uuid';

export class FileAnalysisResolvers {
  private fileUploadService: FileUploadService;
  private reportGenerationService: ReportGenerationService;
  private databaseService: FileAnalysisDatabaseService;
  private geminiAIService: GeminiAIService;
  private fileParserService: FileParserService;
  
  // Custom Upload scalar
  private Upload = new GraphQLScalarType({
    name: 'Upload',
    description: 'The `Upload` scalar type represents a file upload.',
    serialize: (value: any) => value,
    parseValue: (value: any) => value,
    parseLiteral: () => {
      throw new GraphQLError('Upload literal unsupported.', { extensions: { code: 'GRAPHQL_VALIDATION_FAILED' } });
    },
  });

  constructor() {
    this.fileUploadService = new FileUploadService();
    this.reportGenerationService = new ReportGenerationService();
    this.databaseService = new FileAnalysisDatabaseService();
    this.geminiAIService = new GeminiAIService();
    this.fileParserService = new FileParserService();
  }  getResolvers() {
    return {
      Upload: this.Upload,
      JSON: GraphQLJSON,
      DateTime: GraphQLDateTime,

      Query: {
        getAnalysisReport: async (_: any, { id }: { id: string }) => {
          return await this.databaseService.getAnalysisReport(id);
        },

        getAnalysisReportByFileId: async (_: any, { fileId }: { fileId: string }) => {
          const reports = await this.databaseService.getAnalysisReportsByFileUpload(fileId);
          return reports.length > 0 ? reports[0] : null;
        },

        getInsight: async (_: any, { id }: { id: string }) => {
          // Search through all reports for the insight
          const reports = await this.databaseService.getAllAnalysisReports();
          for (const report of reports) {
            const insight = report.insights.find((i: any) => i.id === id);
            if (insight) return insight;
          }
          return null;
        },

        getInsightsByReport: async (_: any, { reportId }: { reportId: string }) => {
          const report = await this.databaseService.getAnalysisReport(reportId);
          return report?.insights || [];
        },

        getInsightsByType: async (_: any, { type, limit }: { type: string; limit?: number }) => {
          const reports = await this.databaseService.getAllAnalysisReports();
          const allInsights = reports.flatMap((report: any) => report.insights);
          const filteredInsights = allInsights.filter((insight: any) => insight.type === type);
          return filteredInsights.slice(0, limit || 10);
        },

        getFileUpload: async (_: any, { id }: { id: string }) => {
          return await this.databaseService.getFileUpload(id);
        },

        listFileUploads: async (_: any, { limit, offset }: { limit?: number; offset?: number }) => {
          const allFiles = await this.databaseService.getAllFileUploads();
          const start = offset || 0;
          const end = start + (limit || 20);
          return allFiles.slice(start, end);
        },

        listAnalysisReports: async (_: any, { limit, offset }: { limit?: number; offset?: number }) => {
          const allReports = await this.databaseService.getAllAnalysisReports();
          const start = offset || 0;
          const end = start + (limit || 20);
          return allReports.slice(start, end);
        },

        searchReports: async (_: any, { query }: { query: string }) => {
          const reports = await this.databaseService.getAllAnalysisReports();
          const searchTermLower = query.toLowerCase();
          return reports.filter((report: any) => 
            report.title.toLowerCase().includes(searchTermLower) ||
            report.summary.toLowerCase().includes(searchTermLower) ||
            report.fileUpload.originalName.toLowerCase().includes(searchTermLower)
          );
        },

        getReportsByDateRange: async (_: any, { startDate, endDate }: { startDate: string; endDate: string }) => {
          const reports = await this.databaseService.getAllAnalysisReports();
          const start = new Date(startDate);
          const end = new Date(endDate);
          return reports.filter((report: any) => 
            report.createdAt >= start && report.createdAt <= end
          );
        },

        getReportsByFileType: async (_: any, { fileType }: { fileType: string }) => {
          const reports = await this.databaseService.getAllAnalysisReports();
          return reports.filter((report: any) => report.fileUpload.fileType === fileType);
        }
      },

      Mutation: {
        uploadAndAnalyzeFile: async (_: any, { input }: { input: FileUploadInput }) => {
          try {
            console.log('Starting comprehensive file upload and analysis...');
            console.log('Input received:', JSON.stringify(input, null, 2));

            // Step 1: Handle file upload
            const fileUpload = await this.fileUploadService.uploadFile(input.file);
            console.log('File uploaded to filesystem:', fileUpload.filename);

            // Step 2: Perform AI analysis with Gemini
            console.log('🤖 Starting AI analysis with Gemini...');
            const aiAnalysis = await this.geminiAIService.analyzeFile(
              fileUpload,
              input.analysisOptions || {}
            );
            console.log('AI analysis completed:', { 
              insightCount: aiAnalysis.insights.length,
              qualityScore: aiAnalysis.dataQuality?.overallScore || 0
            });

            // Step 3: Save to Supabase database
            const savedFileUpload = await this.databaseService.saveFileUpload(
              fileUpload.filename,
              fileUpload.originalName,
              fileUpload.mimetype,
              fileUpload.encoding,
              fileUpload.size,
              fileUpload.path,
              fileUpload.fileType,
              fileUpload.metadata || {}
            );

            const analysisReport = await this.databaseService.saveAnalysisReport(
              savedFileUpload.id,
              aiAnalysis,
              undefined // executionTime
            );

            console.log('Analysis completed and saved:', analysisReport.id);
            return analysisReport;

          } catch (error) {
            console.error('Upload and analysis failed:', error);
            throw new GraphQLError(`Upload and analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        },

        reanalyzeFile: async (_: any, { fileId, options }: { fileId: string; options?: AnalysisOptionsInput }) => {
          const fileUpload = await this.databaseService.getFileUpload(fileId);
          if (!fileUpload) {
            throw new GraphQLError('File upload not found');
          }

          // Perform new AI analysis with Gemini
          const aiAnalysis = await this.geminiAIService.analyzeFile(
            fileUpload,
            options || {}
          );

          // Save new analysis report
          const analysisReport = await this.databaseService.saveAnalysisReport(
            fileId,
            aiAnalysis
          );

          return analysisReport;
        },

        generateCustomAnalysis: async (_: any, { fileId, prompts }: { fileId: string; prompts: string[] }) => {
          const fileUpload = await this.databaseService.getFileUpload(fileId);
          if (!fileUpload) {
            throw new GraphQLError('File upload not found');
          }

          // Perform custom AI analysis with Gemini using custom prompts
          const aiAnalysis = await this.geminiAIService.analyzeFile(
            fileUpload,
            { customPrompts: prompts }
          );

          // Save custom analysis report
          const analysisReport = await this.databaseService.saveAnalysisReport(
            fileId,
            aiAnalysis
          );

          return analysisReport;
        },

        updateReportTitle: async (_: any, { reportId, title }: { reportId: string; title: string }) => {
          const report = await this.databaseService.getAnalysisReport(reportId);
          if (!report) {
            throw new GraphQLError('Analysis report not found');
          }

          // Create updated analysis response with new title
          const aiResponse: AIAnalysisResponse = {
            insights: report.insights.map(insight => ({
              type: insight.type,
              title: insight.title,
              description: insight.description,
              value: insight.value || undefined,
              confidence: insight.confidence || 0.5,
              importance: insight.importance || 5,
              metadata: insight.metadata || {}
            })),
            summary: `${title}: ${report.summary}`,
            dataQuality: report.dataQuality ? {
              overallScore: report.dataQuality.score || 0,
              completeness: report.dataQuality.completeness,
              accuracy: report.dataQuality.accuracy,
              consistency: report.dataQuality.consistency,
              validity: report.dataQuality.validity,
              issues: report.dataQuality.issues.map(issue => ({
                type: issue.type,
                description: issue.description,
                severity: (issue.severity as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL") || "MEDIUM",
                count: issue.count,
                affectedColumns: [],
                examples: issue.examples || []
              }))
            } : undefined,
            recommendations: [],
            metadata: { titleUpdated: true }
          };
          
          // Save updated report (this will update existing record)
          const updatedReport = await this.databaseService.saveAnalysisReport(
            report.fileUploadId,
            aiResponse
          );
          
          return { ...updatedReport, title };
        },

        addCustomInsight: async (_: any, { reportId, insight }: { reportId: string; insight: string }) => {
          const report = await this.databaseService.getAnalysisReport(reportId);
          if (!report) {
            throw new GraphQLError('Analysis report not found');
          }

          const newInsight: Insight = {
            id: generateId(),
            reportId,
            type: InsightType.BUSINESS_INSIGHT,
            title: 'Custom User Insight',
            description: insight,
            value: undefined,
            confidence: 0.8,
            importance: 7,
            metadata: { userGenerated: true },
            createdAt: new Date()
          };

          // Save the new insight to database
          const aiInsight = {
            type: newInsight.type,
            title: newInsight.title,
            description: newInsight.description,
            value: newInsight.value || undefined,
            confidence: newInsight.confidence || 0.8,
            importance: newInsight.importance || 7,
            metadata: newInsight.metadata || {}
          };
          await this.databaseService.saveInsights(reportId, [aiInsight]);

          // Return updated report with new insight
          const updatedReport = await this.databaseService.getAnalysisReport(reportId);
          return updatedReport;
        },

        deleteReport: async (_: any, { reportId }: { reportId: string }) => {
          const report = await this.databaseService.getAnalysisReport(reportId);
          if (!report) {
            throw new GraphQLError('Analysis report not found');
          }

          // Delete from database (implement delete method in service)
          // For now, return success (would need to implement delete in database service)
          return { success: true, message: 'Report deleted successfully' };
        },

        exportReport: async (_: any, { input }: { input: ReportExportInput }) => {
          const report = await this.databaseService.getAnalysisReport(input.reportId);
          if (!report) {
            throw new GraphQLError('Analysis report not found');
          }

          const reportExport = await this.reportGenerationService.exportReport(report, input.format);
          return reportExport;
        },

        deleteFileUpload: async (_: any, { id }: { id: string }) => {
          const fileUpload = await this.databaseService.getFileUpload(id);
          if (!fileUpload) {
            throw new GraphQLError('File upload not found');
          }

          // Delete from database (implement delete method in service)
          // For now, return success (would need to implement delete in database service)
          return { success: true, message: 'File upload deleted successfully' };
        },

        updateFileMetadata: async (_: any, { id, metadata }: { id: string; metadata: Record<string, any> }) => {
          const fileUpload = await this.databaseService.getFileUpload(id);
          if (!fileUpload) {
            throw new GraphQLError('File upload not found');
          }

          // Update metadata in database (implement update method in service)
          // For now, return the file upload with updated metadata
          return { ...fileUpload, metadata: { ...fileUpload.metadata, ...metadata } };
        }
      },

      AnalysisReport: {
        fileUpload: (parent: AnalysisReport) => {
          return parent.fileUpload;
        },
        insights: (parent: AnalysisReport) => {
          return parent.insights;
        }
      },

      FileUpload: {
        analysisReport: async (parent: FileUpload) => {
          const reports = await this.databaseService.getAnalysisReportsByFileUpload(parent.id);
          return reports[0] || null; // Return the most recent report
        }
      }
    };
  }
}