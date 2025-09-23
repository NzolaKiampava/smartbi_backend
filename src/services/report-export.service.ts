import * as XLSX from 'xlsx';
import * as fs from 'fs/promises';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import {
  AnalysisReport,
  ReportFormat,
  ReportExport,
  ReportExportInput,
  Insight,
  Visualization,
} from '../types/file-analysis';

interface PDFKitDocument {
  fontSize(size: number): PDFKitDocument;
  text(text: string, x?: number, y?: number, options?: any): PDFKitDocument;
  moveDown(lines?: number): PDFKitDocument;
  addPage(): PDFKitDocument;
  end(): void;
  pipe(stream: any): void;
}

export class ReportExportService {
  private exportsDir: string;

  constructor() {
    this.exportsDir = process.env.EXPORTS_DIR || './exports';
    this.ensureExportsDirectory();
  }

  private async ensureExportsDirectory(): Promise<void> {
    try {
      await fs.access(this.exportsDir);
    } catch {
      await fs.mkdir(this.exportsDir, { recursive: true });
    }
  }

  async exportReport(input: ReportExportInput, report: AnalysisReport): Promise<ReportExport> {
    const exportId = uuidv4();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const baseFilename = `${report.title.replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp}`;
    
    let filename: string;
    let filePath: string;
    let fileSize: number;

    switch (input.format) {
      case ReportFormat.PDF:
        filename = `${baseFilename}.pdf`;
        filePath = path.join(this.exportsDir, filename);
        await this.generatePDFReport(report, filePath, input);
        break;

      case ReportFormat.EXCEL:
        filename = `${baseFilename}.xlsx`;
        filePath = path.join(this.exportsDir, filename);
        await this.generateExcelReport(report, filePath, input);
        break;

      case ReportFormat.JSON:
        filename = `${baseFilename}.json`;
        filePath = path.join(this.exportsDir, filename);
        await this.generateJSONReport(report, filePath, input);
        break;

      case ReportFormat.HTML:
        filename = `${baseFilename}.html`;
        filePath = path.join(this.exportsDir, filename);
        await this.generateHTMLReport(report, filePath, input);
        break;

      default:
        throw new Error(`Unsupported export format: ${input.format}`);
    }

    // Get file size
    const stats = await fs.stat(filePath);
    fileSize = stats.size;

    // Generate download URL (in production, this would be a proper URL)
    const downloadUrl = `/api/exports/download/${filename}`;

    // Set expiration (24 hours by default)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    return {
      url: downloadUrl,
      filename,
      format: input.format,
      size: fileSize,
      expiresAt,
    };
  }

  private async generateJSONReport(
    report: AnalysisReport,
    filePath: string,
    input: ReportExportInput
  ): Promise<void> {
    const exportData: any = {
      metadata: {
        exportedAt: new Date().toISOString(),
        reportId: report.id,
        format: 'JSON',
        version: '1.0',
      },
      report: {
        id: report.id,
        title: report.title,
        summary: report.summary,
        status: report.status,
        executionTime: report.executionTime,
        createdAt: report.createdAt,
        updatedAt: report.updatedAt,
      },
      fileInfo: {
        originalName: report.fileUpload.originalName,
        fileType: report.fileUpload.fileType,
        size: report.fileUpload.size,
        uploadedAt: report.fileUpload.uploadedAt,
      },
      insights: this.formatInsightsForExport(report.insights),
      recommendations: report.recommendations,
      dataQuality: report.dataQuality,
    };

    if (input.includeVisualizations) {
      exportData.visualizations = report.visualizations;
    }

    if (input.includeRawData && report.rawAnalysis) {
      exportData.rawAnalysis = report.rawAnalysis;
    }

    if (input.customizations) {
      exportData.customizations = input.customizations;
    }

    await fs.writeFile(filePath, JSON.stringify(exportData, null, 2), 'utf-8');
  }

  private async generateExcelReport(
    report: AnalysisReport,
    filePath: string,
    input: ReportExportInput
  ): Promise<void> {
    const workbook = XLSX.utils.book_new();

    // Summary Sheet
    const summaryData = [
      ['Report Summary'],
      [''],
      ['Title', report.title],
      ['Status', report.status],
      ['File Name', report.fileUpload.originalName],
      ['File Type', report.fileUpload.fileType],
      ['File Size', this.formatFileSize(report.fileUpload.size)],
      ['Execution Time', `${report.executionTime || 0}ms`],
      ['Created At', report.createdAt.toISOString()],
      ['Updated At', report.updatedAt.toISOString()],
      [''],
      ['Summary'],
      [report.summary],
    ];

    if (report.dataQuality) {
      summaryData.push(
        [''],
        ['Data Quality'],
        ['Overall Score', `${Math.round(report.dataQuality.score * 100)}%`],
        ['Completeness', `${Math.round(report.dataQuality.completeness * 100)}%`],
        ['Accuracy', `${Math.round(report.dataQuality.accuracy * 100)}%`],
        ['Consistency', `${Math.round(report.dataQuality.consistency * 100)}%`],
        ['Validity', `${Math.round(report.dataQuality.validity * 100)}%`],
      );
    }

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

    // Insights Sheet
    const insightsData = [
      ['Type', 'Title', 'Description', 'Value', 'Confidence', 'Importance', 'Created At'],
      ...report.insights.map(insight => [
        insight.type,
        insight.title,
        insight.description,
        insight.value || '',
        insight.confidence || '',
        insight.importance,
        insight.createdAt.toISOString(),
      ]),
    ];

    const insightsSheet = XLSX.utils.aoa_to_sheet(insightsData);
    XLSX.utils.book_append_sheet(workbook, insightsSheet, 'Insights');

    // Recommendations Sheet
    const recommendationsData = [
      ['Recommendation'],
      ...report.recommendations.map(rec => [rec]),
    ];

    const recommendationsSheet = XLSX.utils.aoa_to_sheet(recommendationsData);
    XLSX.utils.book_append_sheet(workbook, recommendationsSheet, 'Recommendations');

    // Data Quality Issues Sheet
    if (report.dataQuality && report.dataQuality.issues.length > 0) {
      const issuesData = [
        ['Type', 'Description', 'Severity', 'Count', 'Examples'],
        ...report.dataQuality.issues.map(issue => [
          issue.type,
          issue.description,
          issue.severity,
          issue.count,
          issue.examples.join(', '),
        ]),
      ];

      const issuesSheet = XLSX.utils.aoa_to_sheet(issuesData);
      XLSX.utils.book_append_sheet(workbook, issuesSheet, 'Data Quality Issues');
    }

    // Visualizations Sheet
    if (input.includeVisualizations && report.visualizations.length > 0) {
      const vizData = [
        ['Type', 'Title', 'Description', 'Data'],
        ...report.visualizations.map(viz => [
          viz.type,
          viz.title,
          viz.description || '',
          JSON.stringify(viz.data),
        ]),
      ];

      const vizSheet = XLSX.utils.aoa_to_sheet(vizData);
      XLSX.utils.book_append_sheet(workbook, vizSheet, 'Visualizations');
    }

    // Raw Data Sheet
    if (input.includeRawData && report.rawAnalysis) {
      const rawDataSheet = XLSX.utils.json_to_sheet([report.rawAnalysis]);
      XLSX.utils.book_append_sheet(workbook, rawDataSheet, 'Raw Analysis');
    }

    // Write file
    XLSX.writeFile(workbook, filePath);
  }

  private async generateHTMLReport(
    report: AnalysisReport,
    filePath: string,
    input: ReportExportInput
  ): Promise<void> {
    const html = this.buildHTMLReport(report, input);
    await fs.writeFile(filePath, html, 'utf-8');
  }

  private buildHTMLReport(report: AnalysisReport, input: ReportExportInput): string {
    const css = `
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .header { background: #f4f4f4; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
        .section { margin-bottom: 30px; }
        .insight { background: #f9f9f9; padding: 15px; margin: 10px 0; border-left: 4px solid #007cba; }
        .insight-title { font-weight: bold; color: #333; }
        .insight-meta { font-size: 0.9em; color: #666; margin-top: 5px; }
        .recommendation { background: #e8f5e8; padding: 10px; margin: 5px 0; border-radius: 3px; }
        .data-quality { background: #fff3cd; padding: 15px; border-radius: 5px; }
        .score { font-size: 1.2em; font-weight: bold; }
        .issue { background: #f8d7da; padding: 10px; margin: 5px 0; border-radius: 3px; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .meta-info { font-size: 0.9em; color: #666; }
      </style>
    `;

    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${report.title}</title>
        <meta charset="UTF-8">
        ${css}
      </head>
      <body>
        <div class="header">
          <h1>${report.title}</h1>
          <div class="meta-info">
            <strong>File:</strong> ${report.fileUpload.originalName} (${report.fileUpload.fileType})<br>
            <strong>Size:</strong> ${this.formatFileSize(report.fileUpload.size)}<br>
            <strong>Status:</strong> ${report.status}<br>
            <strong>Execution Time:</strong> ${report.executionTime || 0}ms<br>
            <strong>Generated:</strong> ${new Date().toLocaleString()}
          </div>
        </div>

        <div class="section">
          <h2>Executive Summary</h2>
          <p>${report.summary.replace(/\n/g, '<br>')}</p>
        </div>
    `;

    // Data Quality Section
    if (report.dataQuality) {
      html += `
        <div class="section">
          <h2>Data Quality Assessment</h2>
          <div class="data-quality">
            <div class="score">Overall Score: ${Math.round(report.dataQuality.score * 100)}%</div>
            <table>
              <tr><th>Metric</th><th>Score</th></tr>
              <tr><td>Completeness</td><td>${Math.round(report.dataQuality.completeness * 100)}%</td></tr>
              <tr><td>Accuracy</td><td>${Math.round(report.dataQuality.accuracy * 100)}%</td></tr>
              <tr><td>Consistency</td><td>${Math.round(report.dataQuality.consistency * 100)}%</td></tr>
              <tr><td>Validity</td><td>${Math.round(report.dataQuality.validity * 100)}%</td></tr>
            </table>
      `;

      if (report.dataQuality.issues.length > 0) {
        html += `
          <h3>Data Quality Issues</h3>
        `;
        report.dataQuality.issues.forEach(issue => {
          html += `
            <div class="issue">
              <strong>${issue.type}</strong> (${issue.severity})<br>
              ${issue.description}<br>
              <small>Count: ${issue.count} | Examples: ${issue.examples.join(', ')}</small>
            </div>
          `;
        });
      }

      html += `</div></div>`;
    }

    // Insights Section
    if (report.insights.length > 0) {
      html += `
        <div class="section">
          <h2>Key Insights</h2>
      `;

      const insightsByType = this.groupInsightsByType(report.insights);
      Object.entries(insightsByType).forEach(([type, insights]) => {
        html += `<h3>${type.replace(/_/g, ' ')}</h3>`;
        insights.forEach(insight => {
          html += `
            <div class="insight">
              <div class="insight-title">${insight.title}</div>
              <div>${insight.description}</div>
              ${insight.value ? `<div><strong>Value:</strong> ${insight.value}</div>` : ''}
              <div class="insight-meta">
                Confidence: ${Math.round((insight.confidence || 0) * 100)}% | 
                Importance: ${insight.importance}/10
              </div>
            </div>
          `;
        });
      });

      html += `</div>`;
    }

    // Recommendations Section
    if (report.recommendations.length > 0) {
      html += `
        <div class="section">
          <h2>Recommendations</h2>
      `;
      report.recommendations.forEach((rec, index) => {
        html += `<div class="recommendation">${index + 1}. ${rec}</div>`;
      });
      html += `</div>`;
    }

    // Visualizations Section
    if (input.includeVisualizations && report.visualizations.length > 0) {
      html += `
        <div class="section">
          <h2>Visualizations</h2>
          <table>
            <tr><th>Type</th><th>Title</th><th>Description</th></tr>
      `;
      report.visualizations.forEach(viz => {
        html += `
          <tr>
            <td>${viz.type}</td>
            <td>${viz.title}</td>
            <td>${viz.description || 'N/A'}</td>
          </tr>
        `;
      });
      html += `</table></div>`;
    }

    html += `
        <div class="section">
          <hr>
          <p class="meta-info">
            Report generated by SmartBI Analysis System<br>
            Export ID: ${uuidv4()}<br>
            Generated at: ${new Date().toISOString()}
          </p>
        </div>
      </body>
      </html>
    `;

    return html;
  }

  private async generatePDFReport(
    report: AnalysisReport,
    filePath: string,
    input: ReportExportInput
  ): Promise<void> {
    // For PDF generation, we'd typically use a library like PDFKit or Puppeteer
    // For now, we'll create a simple text-based PDF using a mock implementation
    
    // This is a simplified implementation - in production, use proper PDF libraries
    const pdfContent = this.buildPDFContent(report, input);
    await fs.writeFile(filePath, pdfContent, 'utf-8');
  }

  private buildPDFContent(report: AnalysisReport, input: ReportExportInput): string {
    // This is a text representation - in production, use proper PDF generation
    let content = `
SMARTBI ANALYSIS REPORT
${'='.repeat(50)}

Title: ${report.title}
File: ${report.fileUpload.originalName} (${report.fileUpload.fileType})
Size: ${this.formatFileSize(report.fileUpload.size)}
Status: ${report.status}
Execution Time: ${report.executionTime || 0}ms
Generated: ${new Date().toLocaleString()}

EXECUTIVE SUMMARY
${'-'.repeat(20)}
${report.summary}

`;

    if (report.dataQuality) {
      content += `
DATA QUALITY ASSESSMENT
${'-'.repeat(25)}
Overall Score: ${Math.round(report.dataQuality.score * 100)}%
Completeness: ${Math.round(report.dataQuality.completeness * 100)}%
Accuracy: ${Math.round(report.dataQuality.accuracy * 100)}%
Consistency: ${Math.round(report.dataQuality.consistency * 100)}%
Validity: ${Math.round(report.dataQuality.validity * 100)}%

`;

      if (report.dataQuality.issues.length > 0) {
        content += `Data Quality Issues:\n`;
        report.dataQuality.issues.forEach((issue, index) => {
          content += `${index + 1}. ${issue.type} (${issue.severity}): ${issue.description}\n`;
        });
        content += '\n';
      }
    }

    if (report.insights.length > 0) {
      content += `
KEY INSIGHTS
${'-'.repeat(15)}
`;
      const insightsByType = this.groupInsightsByType(report.insights);
      Object.entries(insightsByType).forEach(([type, insights]) => {
        content += `\n${type.replace(/_/g, ' ')}:\n`;
        insights.forEach((insight, index) => {
          content += `  ${index + 1}. ${insight.title}\n     ${insight.description}\n`;
          if (insight.value) {
            content += `     Value: ${insight.value}\n`;
          }
          content += `     Confidence: ${Math.round((insight.confidence || 0) * 100)}% | Importance: ${insight.importance}/10\n\n`;
        });
      });
    }

    if (report.recommendations.length > 0) {
      content += `
RECOMMENDATIONS
${'-'.repeat(18)}
`;
      report.recommendations.forEach((rec, index) => {
        content += `${index + 1}. ${rec}\n`;
      });
      content += '\n';
    }

    content += `
${'='.repeat(50)}
Report generated by SmartBI Analysis System
Generated at: ${new Date().toISOString()}
`;

    return content;
  }

  private formatInsightsForExport(insights: Insight[]): any[] {
    return insights.map(insight => ({
      id: insight.id,
      type: insight.type,
      title: insight.title,
      description: insight.description,
      value: insight.value,
      confidence: insight.confidence,
      importance: insight.importance,
      metadata: insight.metadata,
      createdAt: insight.createdAt,
    }));
  }

  private groupInsightsByType(insights: Insight[]): Record<string, Insight[]> {
    return insights.reduce((groups, insight) => {
      const type = insight.type;
      if (!groups[type]) {
        groups[type] = [];
      }
      groups[type].push(insight);
      return groups;
    }, {} as Record<string, Insight[]>);
  }

  private formatFileSize(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  async cleanupExpiredExports(): Promise<number> {
    try {
      const files = await fs.readdir(this.exportsDir);
      let deletedCount = 0;

      for (const file of files) {
        const filePath = path.join(this.exportsDir, file);
        const stats = await fs.stat(filePath);
        
        // Delete files older than 24 hours
        const ageHours = (Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60);
        if (ageHours > 24) {
          await fs.unlink(filePath);
          deletedCount++;
        }
      }

      return deletedCount;
    } catch (error) {
      console.error('Error cleaning up exports:', error);
      return 0;
    }
  }

  async getExportStats(): Promise<Record<string, any>> {
    try {
      const files = await fs.readdir(this.exportsDir);
      let totalSize = 0;
      const formatCounts: Record<string, number> = {};

      for (const file of files) {
        const filePath = path.join(this.exportsDir, file);
        const stats = await fs.stat(filePath);
        totalSize += stats.size;

        const ext = path.extname(file).toLowerCase();
        formatCounts[ext] = (formatCounts[ext] || 0) + 1;
      }

      return {
        totalFiles: files.length,
        totalSize,
        formatBreakdown: formatCounts,
        averageSize: files.length > 0 ? totalSize / files.length : 0,
      };
    } catch (error) {
      console.error('Error getting export stats:', error);
      return {
        totalFiles: 0,
        totalSize: 0,
        formatBreakdown: {},
        averageSize: 0,
      };
    }
  }
}