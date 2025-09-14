import { ConnectionType, QueryStatus } from '../types/data-query';

export interface GeminiConfig {
  apiKey: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface AIQueryOptions {
  connectionType: ConnectionType;
  database?: string;
  schemaInfo?: SchemaInfo[]; // Make optional
  naturalQuery: string;
  apiEndpoints?: ApiEndpoint[];
}

export interface SchemaInfo {
  tableName: string;
  columnName: string;
  dataType: string;
}

export interface ApiEndpoint {
  path: string;
  method: string;
  description: string;
  parameters?: Parameter[];
}

export interface Parameter {
  name: string;
  type: string;
  required: boolean;
  description?: string;
}

export interface AIQueryResult {
  generatedQuery: string;
  queryType: 'SQL' | 'API_CALL' | 'ERROR';
  confidence: number;
  explanation?: string;
}

export class AIQueryService {
  private geminiConfig: GeminiConfig;
  private readonly GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

  constructor(geminiConfig: GeminiConfig) {
    this.geminiConfig = {
      model: 'gemini-1.5-flash',
      maxTokens: 2048,
      temperature: 0.1,
      ...geminiConfig
    };
  }

  async translateToSQL(options: AIQueryOptions): Promise<AIQueryResult> {
    try {
      const prompt = this.buildSQLPrompt(options);
      const response = await this.callGeminiAPI(prompt);
      
      return this.parseSQLResponse(response, options.connectionType);
    } catch (error) {
      console.error('Error translating to SQL:', error);
      return {
        generatedQuery: "SELECT 'Translation error' AS error;",
        queryType: 'ERROR',
        confidence: 0,
        explanation: `Failed to translate query: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

async translateToAPICall(options: Omit<AIQueryOptions, 'schemaInfo'>): Promise<AIQueryResult> {
  try {
    const prompt = this.buildAPIPrompt(options as AIQueryOptions);
    const response = await this.callGeminiAPI(prompt);
    
    return this.parseAPIResponse(response);
  } catch (error) {
    console.error('Error translating to API call:', error);
    return {
      generatedQuery: JSON.stringify({ error: 'Translation failed' }),
      queryType: 'ERROR',
      confidence: 0,
      explanation: `Failed to translate to API call: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

  private buildSQLPrompt(options: AIQueryOptions): string {
    const { connectionType, database, schemaInfo, naturalQuery } = options;
    
    const sqlDialect = this.getSQLDialect(connectionType);
    const schemaDescription = this.formatSchemaInfo(schemaInfo || []);

    return `
You are a SQL translator for a ${sqlDialect} database.
Convert this natural language query to valid ${sqlDialect} SQL.

DATABASE: "${database || 'Unknown'}"
USER QUERY: "${naturalQuery}"

AVAILABLE SCHEMA:
${schemaDescription}

IMPORTANT RULES:
1. Generate ONLY the SQL query without markdown formatting or explanations
2. Use proper ${sqlDialect} syntax
3. Include appropriate WHERE clauses for data filtering
4. Use JOINs when multiple tables are needed
5. Add LIMIT clauses for potentially large result sets
6. If the query is impossible or unclear, return: SELECT 'Unsupported or unclear query' AS error;
7. Ensure the query is safe and doesn't include DROP, DELETE, UPDATE, or other destructive operations
8. Use proper date/time functions for temporal queries

Respond with ONLY the SQL query:
    `.trim();
  }

private buildAPIPrompt(options: AIQueryOptions): string {
const { apiEndpoints, naturalQuery } = options;

const endpointsDescription = apiEndpoints?.map(endpoint => 
    `${endpoint.method} ${endpoint.path} - ${endpoint.description}`
).join('\n') || 'No endpoints available';

return `
You are an API query translator for REST APIs.
Convert this natural language query to a REST API call configuration.

USER QUERY: "${naturalQuery}"

AVAILABLE API ENDPOINTS:
${endpointsDescription}

IMPORTANT RULES:
1. Generate ONLY a JSON object without markdown formatting or explanations
2. Choose the most appropriate endpoint from the available list
3. Use GET method for data retrieval queries
4. For queries like "show albums", use the albums endpoint
5. For queries like "show posts", use the posts endpoint
6. For queries like "show users", use the users endpoint
7. If no exact match, choose the closest endpoint
8. Always use the exact path from the available endpoints

Generate a JSON object with this exact structure:
{
  "method": "GET",
  "path": "/exact/endpoint/path",
  "description": "What this API call does"
}

If the query cannot be matched to any available endpoint, return:
{
  "error": "No matching endpoint found",
  "reason": "Explanation of why no endpoint matches"
}

Respond with ONLY the JSON object:
`.trim();
}

  private async callGeminiAPI(prompt: string): Promise<string> {
    const url = `${this.GEMINI_URL}/${this.geminiConfig.model}:generateContent?key=${this.geminiConfig.apiKey}`;
    
    const payload = {
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        maxOutputTokens: this.geminiConfig.maxTokens,
        temperature: this.geminiConfig.temperature,
        topP: 0.8,
        topK: 40
      },
      safetySettings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        }
      ]
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Gemini API request failed: ${response.status} ${response.statusText}`);
    }

    const data: any = await response.json();

    if (!data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error('Invalid response from Gemini API');
    }

    return data.candidates[0].content.parts[0].text;
  }

  private parseSQLResponse(response: string, connectionType: ConnectionType): AIQueryResult {
    // Clean the response from markdown and extra formatting
    let cleanedQuery = this.cleanSQLResponse(response);
    
    // Basic validation
    const confidence = this.calculateSQLConfidence(cleanedQuery);
    
    return {
      generatedQuery: cleanedQuery,
      queryType: 'SQL',
      confidence,
      explanation: confidence < 0.7 ? 'Low confidence in generated SQL. Please review before execution.' : undefined
    };
  }

  private parseAPIResponse(response: string): AIQueryResult {
    try {
      console.log('Raw Gemini API response:', response);
      
      const cleanedResponse = this.cleanAPIResponse(response);
      console.log('Cleaned response:', cleanedResponse);
      
      const apiCall = JSON.parse(cleanedResponse);
      
      if (apiCall.error) {
        return {
          generatedQuery: JSON.stringify(apiCall),
          queryType: 'ERROR',
          confidence: 0,
          explanation: apiCall.reason || 'API translation failed'
        };
      }

      const confidence = this.calculateAPIConfidence(apiCall);
      
      return {
        generatedQuery: JSON.stringify(apiCall, null, 2),
        queryType: 'API_CALL',
        confidence,
        explanation: confidence < 0.7 ? 'Low confidence in generated API call. Please review before execution.' : undefined
      };
    } catch (error) {
      console.error('Failed to parse API response:', error);
      console.error('Response that failed to parse:', response);
      
      return {
        generatedQuery: JSON.stringify({ error: 'Invalid JSON response' }),
        queryType: 'ERROR',
        confidence: 0,
        explanation: 'Failed to parse API response'
      };
    }
  }

  private cleanSQLResponse(response: string): string {
    // Remove markdown code blocks
    let cleaned = response.replace(/```sql\n?/gi, '').replace(/```\n?/g, '');
    
    // Remove extra whitespace
    cleaned = cleaned.trim();
    
    // Remove trailing semicolon if present
    cleaned = cleaned.replace(/;$/, '');
    
    return cleaned;
  }

  private cleanAPIResponse(response: string): string {
    // Remove markdown code blocks
    let cleaned = response.replace(/```json\n?/gi, '').replace(/```\n?/g, '');
    
    // Remove extra whitespace
    cleaned = cleaned.trim();
    
    // Try to extract JSON from response if it contains other text
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleaned = jsonMatch[0];
    }
    
    return cleaned;
  }

  private calculateSQLConfidence(query: string): number {
    let confidence = 0.5; // Base confidence
    
    // Check for valid SQL keywords
    const sqlKeywords = ['SELECT', 'FROM', 'WHERE', 'JOIN', 'GROUP BY', 'ORDER BY', 'HAVING'];
    const foundKeywords = sqlKeywords.filter(keyword => 
      query.toUpperCase().includes(keyword)
    );
    
    confidence += (foundKeywords.length / sqlKeywords.length) * 0.3;
    
    // Penalty for dangerous operations
    const dangerousKeywords = ['DROP', 'DELETE', 'UPDATE', 'INSERT', 'TRUNCATE', 'ALTER'];
    const hasDangerous = dangerousKeywords.some(keyword => 
      query.toUpperCase().includes(keyword)
    );
    
    if (hasDangerous) {
      confidence = Math.max(0.1, confidence - 0.5);
    }
    
    // Check for error indicators
    if (query.toLowerCase().includes('error') || query.toLowerCase().includes('unsupported')) {
      confidence = 0.1;
    }
    
    return Math.min(1, Math.max(0, confidence));
  }

  private calculateAPIConfidence(apiCall: any): number {
    let confidence = 0.5; // Base confidence
    
    // Check for required fields
    if (apiCall.method && apiCall.path) {
      confidence += 0.3;
    }
    
    // Check for valid HTTP method
    const validMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
    if (validMethods.includes(apiCall.method?.toUpperCase())) {
      confidence += 0.2;
    }
    
    return Math.min(1, Math.max(0, confidence));
  }

  private getSQLDialect(connectionType: ConnectionType): string {
    switch (connectionType) {
      case ConnectionType.MYSQL:
        return 'MySQL';
      case ConnectionType.POSTGRESQL:
      case ConnectionType.SUPABASE:
        return 'PostgreSQL';
      default:
        return 'SQL';
    }
  }

  private formatSchemaInfo(schemaInfo: SchemaInfo[]): string {
    const tables = schemaInfo.reduce((acc, info) => {
      if (!acc[info.tableName]) {
        acc[info.tableName] = [];
      }
      acc[info.tableName].push(`${info.columnName} (${info.dataType})`);
      return acc;
    }, {} as Record<string, string[]>);

    return Object.entries(tables)
      .map(([tableName, columns]) => `Table: ${tableName}\nColumns: ${columns.join(', ')}`)
      .join('\n\n');
  }

  // Method to update API key at runtime
  updateApiKey(newApiKey: string): void {
    this.geminiConfig.apiKey = newApiKey;
  }

  // Method to test the API connection
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const testPrompt = "Translate 'show tables' to SQL for MySQL database.";
      const response = await this.callGeminiAPI(testPrompt);
      
      return {
        success: true,
        message: 'Gemini API connection successful'
      };
    } catch (error) {
      return {
        success: false,
        message: `Gemini API connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}