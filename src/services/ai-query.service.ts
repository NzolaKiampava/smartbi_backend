import { ConnectionType, QueryStatus } from '../types/data-query';

export interface GeminiConfig {
  apiKey: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  maxRetries?: number;
  retryDelay?: number;
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
      model: 'gemini-2.0-flash',
      maxTokens: 2048,
      temperature: 0.1,
      maxRetries: 3,
      retryDelay: 1000,
      ...geminiConfig
    };
  }

  async translateToSQL(options: AIQueryOptions): Promise<AIQueryResult> {
    try {
      // Validate API key before making request
      if (!this.geminiConfig.apiKey || this.geminiConfig.apiKey.trim() === '') {
        return {
          generatedQuery: "SELECT 'API key not configured' AS error;",
          queryType: 'ERROR',
          confidence: 0,
          explanation: 'Gemini API key is not configured. Please check your environment variables.'
        };
      }

      const prompt = this.buildSQLPrompt(options);
      const response = await this.callGeminiAPIWithRetry(prompt);
      
      return this.parseSQLResponse(response, options.connectionType);
    } catch (error) {
      console.error('Error translating to SQL:', error);
      
      // Provide more specific error messages
      let errorMessage = 'Unknown error';
      let explanation = 'An unexpected error occurred while translating the query.';
      
      if (error instanceof Error) {
        errorMessage = error.message;
        
        if (error.message.includes('503')) {
          explanation = 'O serviço Gemini está temporariamente indisponível. Tente novamente em alguns minutos.';
        } else if (error.message.includes('429')) {
          explanation = 'Limite de requisições excedido. Aguarde alguns minutos antes de tentar novamente.';
        } else if (error.message.includes('401') || error.message.includes('403')) {
          explanation = 'Erro de autenticação. Verifique se a API key do Gemini está configurada corretamente.';
        } else if (error.message.includes('400')) {
          explanation = 'Erro na requisição. Verifique se a consulta está bem formatada.';
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          explanation = 'Erro de conexão. Verifique sua conexão com a internet.';
        }
      }
      
      return {
        generatedQuery: `SELECT '${errorMessage}' AS error;`,
        queryType: 'ERROR',
        confidence: 0,
        explanation
      };
    }
  }

  async translateToAPICall(options: Omit<AIQueryOptions, 'schemaInfo'>): Promise<AIQueryResult> {
    try {
      // Validate API key before making request
      if (!this.geminiConfig.apiKey || this.geminiConfig.apiKey.trim() === '') {
        return {
          generatedQuery: JSON.stringify({ error: 'API key not configured' }),
          queryType: 'ERROR',
          confidence: 0,
          explanation: 'Gemini API key is not configured. Please check your environment variables.'
        };
      }

      const prompt = this.buildAPIPrompt(options as AIQueryOptions);
      const response = await this.callGeminiAPIWithRetry(prompt);
      
      return this.parseAPIResponse(response);
    } catch (error) {
      console.error('Error translating to API call:', error);
      
      let errorMessage = 'Unknown error';
      let explanation = 'An unexpected error occurred while translating the query to API call.';
      
      if (error instanceof Error) {
        errorMessage = error.message;
        
        if (error.message.includes('503')) {
          explanation = 'O serviço Gemini está temporariamente indisponível. Tente novamente em alguns minutos.';
        } else if (error.message.includes('429')) {
          explanation = 'Limite de requisições excedido. Aguarde alguns minutos antes de tentar novamente.';
        } else if (error.message.includes('401') || error.message.includes('403')) {
          explanation = 'Erro de autenticação. Verifique se a API key do Gemini está configurada corretamente.';
        }
      }
      
      return {
        generatedQuery: JSON.stringify({ error: errorMessage }),
        queryType: 'ERROR',
        confidence: 0,
        explanation
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

  private async callGeminiAPIWithRetry(prompt: string): Promise<string> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= (this.geminiConfig.maxRetries || 3); attempt++) {
      try {
        console.log(`Gemini API attempt ${attempt}/${this.geminiConfig.maxRetries || 3}`);
        return await this.callGeminiAPI(prompt);
      } catch (error) {
        lastError = error as Error;
        console.error(`Gemini API attempt ${attempt} failed:`, lastError.message);
        
        // Don't retry for certain error types
        if (lastError.message.includes('401') || 
            lastError.message.includes('403') || 
            lastError.message.includes('400')) {
          throw lastError;
        }
        
        // Wait before retrying (exponential backoff)
        if (attempt < (this.geminiConfig.maxRetries || 3)) {
          const delay = (this.geminiConfig.retryDelay || 1000) * Math.pow(2, attempt - 1);
          console.log(`Waiting ${delay}ms before retry...`);
          await this.sleep(delay);
        }
      }
    }
    
    throw lastError!;
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
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`Gemini API request failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data: any = await response.json();

    if (!data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      if (data?.error) {
        throw new Error(`Gemini API error: ${data.error.message || 'Unknown API error'}`);
      }
      throw new Error('Invalid response from Gemini API - no content generated');
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
      case ConnectionType.FIREBASE:
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

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Method to update API key at runtime
  updateApiKey(newApiKey: string): void {
    this.geminiConfig.apiKey = newApiKey;
  }

  // Method to test the API connection
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      if (!this.geminiConfig.apiKey || this.geminiConfig.apiKey.trim() === '') {
        return {
          success: false,
          message: 'Gemini API key is not configured'
        };
      }

      const testPrompt = "Translate 'show tables' to SQL for MySQL database.";
      const response = await this.callGeminiAPIWithRetry(testPrompt);
      
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

  // Method to check API status
  async checkAPIStatus(): Promise<{ available: boolean; message: string }> {
    try {
      const testResponse = await fetch(`${this.GEMINI_URL}/${this.geminiConfig.model}:generateContent?key=${this.geminiConfig.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: "Test"
            }]
          }]
        })
      });

      if (testResponse.status === 503) {
        return {
          available: false,
          message: 'Gemini API is temporarily unavailable (503 Service Unavailable)'
        };
      } else if (testResponse.status === 429) {
        return {
          available: false,
          message: 'Gemini API rate limit exceeded (429 Too Many Requests)'
        };
      } else if (testResponse.ok || testResponse.status === 400) {
        // 400 is OK for this test as it means the API is responding
        return {
          available: true,
          message: 'Gemini API is available'
        };
      } else {
        return {
          available: false,
          message: `Gemini API returned status: ${testResponse.status}`
        };
      }
    } catch (error) {
      return {
        available: false,
        message: `Failed to check API status: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}