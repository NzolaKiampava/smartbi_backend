import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config/environment';
import { 
  FileUpload, 
  AnalysisOptionsInput, 
  AIAnalysisResponse, 
  AIInsight, 
  InsightType,
  AIDataQuality
} from '../types/file-analysis';
import { ParsedData } from './file-parser.service';

export class GeminiAIService {
  private genAI: GoogleGenerativeAI | null = null;
  private model: any = null;

  constructor() {
    if (config.ai.geminiApiKey) {
      this.genAI = new GoogleGenerativeAI(config.ai.geminiApiKey);
      this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      console.log('✅ Google Gemini AI initialized with gemini-1.5-flash model');
    } else {
      console.log('⚠️  Google Gemini API key not provided, using fallback analysis');
    }
  }

  /**
   * Analyze file with real AI using Google Gemini
   */
  async analyzeFile(
    fileUpload: FileUpload, 
    options?: AnalysisOptionsInput
  ): Promise<AIAnalysisResponse> {
    try {
      // Parse the file to extract structured data
      const parsedData = await this.parseFileContent(fileUpload);

      // Generate AI insights using Gemini
      const insights = await this.generateInsights(parsedData, fileUpload, options);
      
      // Generate summary and recommendations
      const summary = await this.generateSummary(parsedData, insights, fileUpload);
      const recommendations = await this.generateRecommendations(insights, parsedData);
      
      // Assess data quality
      const dataQuality = await this.assessDataQuality(parsedData);

      return {
        insights,
        summary,
        recommendations,
        dataQuality,
        metadata: {
          fileType: fileUpload.fileType,
          processingTime: new Date().toISOString(),
          model: 'gemini-1.5-flash',
          confidence: this.calculateOverallConfidence(insights)
        }
      };
    } catch (error) {
      console.error('Error in Gemini AI analysis:', error);
      // Fallback to simple analysis
      return this.fallbackAnalysis(fileUpload, options);
    }
  }

  /**
   * Parse file content for AI analysis
   */
  private async parseFileContent(fileUpload: FileUpload): Promise<ParsedData> {
    const { FileParserService } = await import('./file-parser.service');
    const parser = new FileParserService();
    return parser.parseFile(fileUpload.path, fileUpload.fileType, fileUpload.originalName);
  }

  /**
   * Generate insights using Gemini AI
   */
  private async generateInsights(
    parsedData: ParsedData, 
    fileUpload: FileUpload, 
    options?: AnalysisOptionsInput
  ): Promise<AIInsight[]> {
    if (!this.model) {
      return this.generateFallbackInsights(parsedData, fileUpload);
    }

    const maxRetries = 3;
    const baseDelay = 1000; // 1 second

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const prompt = this.buildAnalysisPrompt(parsedData, fileUpload, options);
        console.log(`🤖 Sending analysis request to Gemini... (Attempt ${attempt}/${maxRetries})`);
        
        const result = await this.model.generateContent(prompt);
        const response = await result.response;
        const analysisText = response.text();
        
        console.log('✅ Received Gemini analysis response');
        return this.parseInsightsFromText(analysisText);
      } catch (error: any) {
        console.error(`❌ Error generating Gemini insights (Attempt ${attempt}/${maxRetries}):`, error);
        
        if (attempt === maxRetries) {
          // Last attempt failed, return fallback insights
          console.log('🔄 Max retries reached, returning fallback insights');
          return this.generateFallbackInsights(parsedData, fileUpload);
        }
        
        if (error.status === 503 || error.status === 429) {
          // Service unavailable or rate limited - wait before retry
          const delay = baseDelay * Math.pow(2, attempt - 1); // Exponential backoff
          console.log(`⏳ Waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          // Other errors - don't retry
          console.log('🔄 Non-retryable error, returning fallback insights');
          return this.generateFallbackInsights(parsedData, fileUpload);
        }
      }
    }
    
    // This should never be reached, but just in case
    return this.generateFallbackInsights(parsedData, fileUpload);
  }

  /**
   * Build comprehensive analysis prompt for Gemini
   */
  private buildAnalysisPrompt(
    parsedData: ParsedData, 
    fileUpload: FileUpload, 
    options?: AnalysisOptionsInput
  ): string {
    const dataPreview = this.getDataPreview(parsedData);
    
    return `
Analyze the following ${fileUpload.fileType} file data and provide comprehensive business insights.

FILE INFORMATION:
- Name: ${fileUpload.originalName}
- Type: ${fileUpload.fileType}
- Size: ${fileUpload.size} bytes
- Structure: ${parsedData.metadata.structure}
- Rows: ${parsedData.metadata.rowCount}
- Columns: ${parsedData.metadata.columnCount}

DATA PREVIEW:
${dataPreview}

ANALYSIS OPTIONS:
- Revenue Analysis: ${options?.analyzeRevenue ? 'Yes' : 'No'}
- Table Analysis: ${options?.analyzeTables ? 'Yes' : 'No'}
- Generate Insights: ${options?.generateInsights ? 'Yes' : 'No'}
- Check Data Quality: ${options?.checkDataQuality ? 'Yes' : 'No'}

Please provide insights in the following JSON format:
{
  "insights": [
    {
      "type": "BUSINESS_INSIGHT" | "DATA_PATTERN" | "REVENUE_TREND" | "ANOMALY_DETECTION" | "STATISTICAL",
      "title": "Clear, actionable insight title",
      "description": "Detailed explanation of the insight",
      "value": "Key metric or finding",
      "confidence": 0.0-1.0,
      "actionable": true/false,
      "evidence": ["supporting data points"]
    }
  ],
  "summary": "Executive summary of key findings",
  "recommendations": ["actionable recommendations"],
  "dataQuality": {
    "overallScore": 0.0-1.0,
    "completeness": 0.0-1.0,
    "accuracy": 0.0-1.0,
    "consistency": 0.0-1.0,
    "validity": 0.0-1.0,
    "issues": [{"type": "issue type", "severity": "high/medium/low", "description": "issue description"}]
  }
}

Focus on:
1. Business-relevant insights and patterns
2. Data quality assessment
3. Actionable recommendations
4. Statistical findings when relevant
5. Anomalies or unusual patterns
`;
  }

  /**
   * Parse insights from Gemini response text
   */
  private parseInsightsFromText(text: string): AIInsight[] {
    try {
      // Extract JSON from the response (Gemini might include additional text)
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const analysisData = JSON.parse(jsonMatch[0]);
      
      if (analysisData.insights && Array.isArray(analysisData.insights)) {
        return analysisData.insights.map((insight: any) => ({
          type: this.mapInsightType(insight.type),
          title: insight.title || 'Generated Insight',
          description: insight.description || 'AI-generated insight',
          value: insight.value,
          confidence: Math.min(Math.max(insight.confidence || 0.8, 0), 1),
          actionable: insight.actionable !== false,
          evidence: insight.evidence || []
        }));
      }
    } catch (error) {
      console.error('Error parsing Gemini insights:', error);
    }

    // Fallback insights if parsing fails
    return this.generateFallbackInsights({} as ParsedData, {} as FileUpload);
  }

  /**
   * Map insight type from Gemini response to our enum
   */
  private mapInsightType(type: string): InsightType {
    const typeMap: Record<string, InsightType> = {
      'BUSINESS_INSIGHT': InsightType.BUSINESS_INSIGHT,
      'DATA_PATTERN': InsightType.DATA_PATTERN,
      'REVENUE_TREND': InsightType.REVENUE_TREND,
      'ANOMALY_DETECTION': InsightType.ANOMALY_DETECTION,
      'STATISTICAL': InsightType.STATISTICAL,
      'SUMMARY': InsightType.SUMMARY,
      'RECOMMENDATION': InsightType.RECOMMENDATION
    };
    
    return typeMap[type] || InsightType.BUSINESS_INSIGHT;
  }

  /**
   * Generate summary using Gemini
   */
  private async generateSummary(
    parsedData: ParsedData, 
    insights: AIInsight[], 
    fileUpload: FileUpload
  ): Promise<string> {
    if (!this.model || insights.length === 0) {
      return `Analysis of ${fileUpload.originalName}: ${insights.length} insights discovered from ${parsedData.metadata.rowCount} records.`;
    }

    try {
      const prompt = `
Based on the following insights about ${fileUpload.originalName}, provide a concise executive summary:

INSIGHTS:
${insights.map(i => `- ${i.title}: ${i.description}`).join('\n')}

Provide a 2-3 sentence executive summary highlighting the most important findings.
`;

      // Retry logic for summary generation
      const maxRetries = 2;
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const result = await this.model.generateContent(prompt);
          const response = await result.response;
          return response.text().trim();
        } catch (error: any) {
          if (attempt === maxRetries || (error.status !== 503 && error.status !== 429)) {
            throw error;
          }
          console.log(`⏳ Summary generation retry ${attempt + 1}/${maxRetries}...`);
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }
      
      // Fallback if all retries failed
      return `Analysis of ${fileUpload.originalName}: ${insights.length} insights discovered from ${parsedData.metadata.rowCount} records.`;
    } catch (error) {
      console.error('Error generating summary:', error);
      return `Analysis of ${fileUpload.originalName}: ${insights.length} insights discovered from ${parsedData.metadata.rowCount} records.`;
    }
  }

  /**
   * Generate recommendations using Gemini
   */
  private async generateRecommendations(insights: AIInsight[], parsedData: ParsedData): Promise<string[]> {
    if (!this.model || insights.length === 0) {
      return ['Continue monitoring data quality', 'Review insights for actionable items'];
    }

    try {
      const prompt = `
Based on these insights, provide 3-5 specific, actionable business recommendations:

INSIGHTS:
${insights.map(i => `- ${i.title}: ${i.description}`).join('\n')}

Return only a JSON array of recommendations: ["recommendation 1", "recommendation 2", ...]
`;

      // Retry logic for recommendations generation
      const maxRetries = 2;
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const result = await this.model.generateContent(prompt);
          const response = await result.response;
          const text = response.text().trim();
          
          const jsonMatch = text.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
          }
          break; // Exit retry loop if successful but no JSON found
        } catch (error: any) {
          console.error(`❌ Error generating recommendations (Attempt ${attempt}/${maxRetries}):`, error);
          if (attempt === maxRetries || (error.status !== 503 && error.status !== 429)) {
            break; // Exit retry loop
          }
          console.log(`⏳ Recommendations generation retry ${attempt + 1}/${maxRetries}...`);
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }
    } catch (error) {
      console.error('Error generating recommendations:', error);
    }

    return ['Continue monitoring data quality', 'Review insights for actionable items'];
  }

  /**
   * Assess data quality
   */
  private async assessDataQuality(parsedData: ParsedData): Promise<AIDataQuality> {
    const completeness = this.calculateCompleteness(parsedData);
    const consistency = this.calculateConsistency(parsedData);
    const validity = this.calculateValidity(parsedData);
    
    return {
      overallScore: (completeness + consistency + validity) / 3,
      completeness,
      accuracy: 0.9, // Placeholder - would need specific accuracy checks
      consistency,
      validity,
      issues: []
    };
  }

  /**
   * Generate fallback analysis when Gemini is not available
   */
  private fallbackAnalysis(fileUpload: FileUpload, options?: AnalysisOptionsInput): AIAnalysisResponse {
    const insights: AIInsight[] = [
      {
        type: InsightType.SUMMARY,
        title: 'File Processing Complete',
        description: `Successfully processed ${fileUpload.originalName} (${fileUpload.fileType} format)`,
        value: fileUpload.size.toString(),
        confidence: 0.9,
        importance: 5,
        actionable: false,
        evidence: ['File successfully parsed and analyzed']
      }
    ];

    return {
      insights,
      summary: `Basic analysis completed for ${fileUpload.originalName}. File contains ${fileUpload.size} bytes of data.`,
      recommendations: ['Consider upgrading to AI-powered analysis for deeper insights'],
      dataQuality: {
        overallScore: 0.7,
        completeness: 0.8,
        accuracy: 0.7,
        consistency: 0.7,
        validity: 0.7,
        issues: []
      },
      metadata: {
        fileType: fileUpload.fileType,
        processingTime: new Date().toISOString(),
        model: 'fallback',
        confidence: 0.7
      }
    };
  }

  /**
   * Generate fallback insights
   */
  private generateFallbackInsights(parsedData: ParsedData, fileUpload: FileUpload): AIInsight[] {
    return [
      {
        type: InsightType.SUMMARY,
        title: 'Data Structure Analysis',
        description: `File contains ${parsedData.metadata?.rowCount || 0} rows and ${parsedData.metadata?.columnCount || 0} columns`,
        value: `${parsedData.metadata?.rowCount || 0} records`,
        confidence: 0.9,
        importance: 6,
        actionable: false,
        evidence: ['Structural analysis of file content']
      },
      {
        type: InsightType.DATA_PATTERN,
        title: 'File Format Compatibility',
        description: `${fileUpload.fileType} format successfully processed`,
        value: fileUpload.fileType,
        confidence: 0.95,
        importance: 4,
        actionable: false,
        evidence: ['Successful file parsing']
      }
    ];
  }

  // Helper methods
  private getDataPreview(parsedData: ParsedData): string {
    if (!parsedData.rows || parsedData.rows.length === 0) {
      return parsedData.content?.substring(0, 500) || 'No data preview available';
    }

    const headers = parsedData.headers?.join('\t') || '';
    const sampleRows = parsedData.rows.slice(0, 3)
      .map(row => row.join('\t'))
      .join('\n');
    
    return `${headers}\n${sampleRows}`;
  }

  private calculateCompleteness(parsedData: ParsedData): number {
    if (!parsedData.rows) return 0.5;
    
    const totalCells = parsedData.rows.length * (parsedData.headers?.length || 1);
    const emptyCells = parsedData.rows.flat().filter(cell => !cell || cell.toString().trim() === '').length;
    
    return Math.max(0, 1 - (emptyCells / totalCells));
  }

  private calculateConsistency(parsedData: ParsedData): number {
    // Placeholder - would implement actual consistency checks
    return 0.8;
  }

  private calculateValidity(parsedData: ParsedData): number {
    // Placeholder - would implement actual validity checks
    return 0.85;
  }

  private calculateOverallConfidence(insights: AIInsight[]): number {
    if (insights.length === 0) return 0.5;
    const avgConfidence = insights.reduce((sum, insight) => sum + insight.confidence, 0) / insights.length;
    return Math.round(avgConfidence * 100) / 100;
  }
}