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
  AnalysisStatus
} from '../types/file-analysis';
import { FileUploadService } from '../services/file-upload.service';
import { ReportGenerationService } from '../services/report-generation.service';
import { FileAnalysisMockService } from '../services/file-analysis-mock.service';
import { AIAnalysisService } from '../services/ai-analysis.service';
import { FileParserService } from '../services/file-parser.service';
import { v4 as uuidv4 } from 'uuid';

export class FileAnalysisResolvers {
  private fileUploadService: FileUploadService;
  private reportGenerationService: ReportGenerationService;
  private mockService: FileAnalysisMockService;
  private aiAnalysisService: AIAnalysisService;
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
    this.mockService = new FileAnalysisMockService();
    this.aiAnalysisService = new AIAnalysisService();
    this.fileParserService = new FileParserService();
  }

  getResolvers() {
    return {
      Upload: this.Upload,
      JSON: GraphQLJSON,
      DateTime: GraphQLDateTime,

      Query: {
        getAnalysisReport: async (_: any, { id }: { id: string }) => {
          return await this.mockService.getAnalysisReport(id);
        },

        getAnalysisReportByFileId: async (_: any, { fileId }: { fileId: string }) => {
          const reports = await this.mockService.getAnalysisReportsByFileUpload(fileId);
          return reports.length > 0 ? reports[0] : null;
        },

        getInsight: async (_: any, { id }: { id: string }) => {
          // For mock implementation, we'll search through all reports
          const reports = await this.mockService.getAllAnalysisReports();
          for (const report of reports) {
            const insight = report.insights.find(i => i.id === id);
            if (insight) return insight;
          }
          return null;
        },

        getInsightsByReport: async (_: any, { reportId }: { reportId: string }) => {
          const report = await this.mockService.getAnalysisReport(reportId);
          return report?.insights || [];
        },

        getInsightsByType: async (_: any, { type, limit }: { type: string; limit?: number }) => {
          const reports = await this.mockService.getAllAnalysisReports();
          const allInsights = reports.flatMap(report => report.insights);
          const filteredInsights = allInsights.filter(insight => insight.type === type);
          return filteredInsights.slice(0, limit || 10);
        },

        getFileUpload: async (_: any, { id }: { id: string }) => {
          return await this.mockService.getFileUpload(id);
        },

        listFileUploads: async (_: any, { limit, offset }: { limit?: number; offset?: number }) => {
          const allFiles = await this.mockService.getAllFileUploads();
          const start = offset || 0;
          const end = start + (limit || 20);
          return allFiles.slice(start, end);
        },

        listAnalysisReports: async (_: any, { limit, offset }: { limit?: number; offset?: number }) => {
          const allReports = await this.mockService.getAllAnalysisReports();
          const start = offset || 0;
          const end = start + (limit || 20);
          return allReports.slice(start, end);
        },

        searchReports: async (_: any, { query }: { query: string }) => {
          const reports = await this.mockService.getAllAnalysisReports();
          const searchTermLower = query.toLowerCase();
          return reports.filter(report => 
            report.title.toLowerCase().includes(searchTermLower) ||
            report.summary.toLowerCase().includes(searchTermLower) ||
            report.fileUpload.originalName.toLowerCase().includes(searchTermLower)
          );
        },

        getReportsByDateRange: async (_: any, { startDate, endDate }: { startDate: string; endDate: string }) => {
          const reports = await this.mockService.getAllAnalysisReports();
          const start = new Date(startDate);
          const end = new Date(endDate);
          return reports.filter(report => 
            report.createdAt >= start && report.createdAt <= end
          );
        },

        getReportsByFileType: async (_: any, { fileType }: { fileType: string }) => {
          const reports = await this.mockService.getAllAnalysisReports();
          return reports.filter(report => report.fileUpload.fileType === fileType);
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

            // Step 2: Parse file content
            const parsedData = await this.fileParserService.parseFile(
              fileUpload.path,
              fileUpload.fileType,
              fileUpload.originalName
            );
            console.log('File parsed successfully:', { 
              rowCount: parsedData.metadata.rowCount, 
              columnCount: parsedData.metadata.columnCount 
            });

            // Step 3: Perform AI analysis
            const aiAnalysis = await this.aiAnalysisService.analyzeFile(
              fileUpload,
              input.analysisOptions || {}
            );
            console.log('AI analysis completed:', { 
              insightCount: aiAnalysis.insights.length,
              qualityScore: aiAnalysis.dataQuality?.overallScore || 0
            });

            // Step 4: Save to mock database
            const savedFileUpload = await this.mockService.saveFileUpload(
              fileUpload.filename,
              fileUpload.originalName,
              fileUpload.mimetype,
              fileUpload.encoding,
              fileUpload.size,
              fileUpload.path,
              fileUpload.fileType,
              fileUpload.metadata || {}
            );

            const analysisReport = await this.mockService.saveAnalysisReport(
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
          const fileUpload = await this.mockService.getFileUpload(fileId);
          if (!fileUpload) {
            throw new GraphQLError('File upload not found');
          }

          // Parse file again
          const parsedData = await this.fileParserService.parseFile(
            fileUpload.path,
            fileUpload.fileType,
            fileUpload.originalName
          );

          // Perform new AI analysis
          const aiAnalysis = await this.aiAnalysisService.analyzeFile(
            fileUpload,
            options || {}
          );

          // Save new analysis report
          const analysisReport = await this.mockService.saveAnalysisReport(
            fileId,
            aiAnalysis
          );

          return analysisReport;
        },

        generateCustomAnalysis: async (_: any, { fileId, prompts }: { fileId: string; prompts: string[] }) => {
          const fileUpload = await this.mockService.getFileUpload(fileId);
          if (!fileUpload) {
            throw new GraphQLError('File upload not found');
          }

          // Parse file again
          const parsedData = await this.fileParserService.parseFile(
            fileUpload.path,
            fileUpload.fileType,
            fileUpload.originalName
          );

          // Perform custom AI analysis
          const aiAnalysis = await this.aiAnalysisService.performCustomAnalysis(
            parsedData,
            fileUpload.fileType,
            prompts
          );

          // Save custom analysis report
          const analysisReport = await this.mockService.saveAnalysisReport(
            fileId,
            aiAnalysis
          );

          return analysisReport;
        },

        updateReportTitle: async (_: any, { reportId, title }: { reportId: string; title: string }) => {
          const report = await this.mockService.getAnalysisReport(reportId);
          if (!report) {
            throw new GraphQLError('Analysis report not found');
          }

          report.title = title;
          report.updatedAt = new Date();
          
          // In a real implementation, you would update the database here
          // For mock, we'll just return the updated report
          return report;
        },

        addCustomInsight: async (_: any, { reportId, insight }: { reportId: string; insight: string }) => {
          const report = await this.mockService.getAnalysisReport(reportId);
          if (!report) {
            throw new GraphQLError('Analysis report not found');
          }

          const newInsight: Insight = {
            id: uuidv4(),
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

          report.insights.push(newInsight);
          report.updatedAt = new Date();

          return report;
        },

        deleteReport: async (_: any, { reportId }: { reportId: string }) => {
          const report = await this.mockService.getAnalysisReport(reportId);
          if (!report) {
            throw new GraphQLError('Analysis report not found');
          }

          // In a real implementation, you would delete from database here
          // For mock, we'll just return success
          return { success: true, message: 'Report deleted successfully' };
        },

        exportReport: async (_: any, { input }: { input: ReportExportInput }) => {
          const report = await this.mockService.getAnalysisReport(input.reportId);
          if (!report) {
            throw new GraphQLError('Analysis report not found');
          }

          const reportExport = await this.reportGenerationService.exportReport(report, input.format);
          return reportExport;
        },

        deleteFileUpload: async (_: any, { id }: { id: string }) => {
          const fileUpload = await this.mockService.getFileUpload(id);
          if (!fileUpload) {
            throw new GraphQLError('File upload not found');
          }

          // In a real implementation, you would:
          // 1. Delete associated analysis reports
          // 2. Delete the file from filesystem
          // 3. Delete from database
          
          return { success: true, message: 'File upload deleted successfully' };
        },

        updateFileMetadata: async (_: any, { id, metadata }: { id: string; metadata: Record<string, any> }) => {
          const fileUpload = await this.mockService.getFileUpload(id);
          if (!fileUpload) {
            throw new GraphQLError('File upload not found');
          }

          fileUpload.metadata = { ...fileUpload.metadata, ...metadata };
          
          // In a real implementation, you would update the database here
          return fileUpload;
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
          const reports = await this.mockService.getAnalysisReportsByFileUpload(parent.id);
          return reports[0] || null; // Return the most recent report
        }
      }
    };
  }
}