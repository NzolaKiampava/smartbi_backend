import { ConnectionType } from '../types/data-query';
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
    schemaInfo?: SchemaInfo[];
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
export declare class AIQueryService {
    private geminiConfig;
    private readonly GEMINI_URL;
    constructor(geminiConfig: GeminiConfig);
    translateToSQL(options: AIQueryOptions): Promise<AIQueryResult>;
    translateToAPICall(options: Omit<AIQueryOptions, 'schemaInfo'>): Promise<AIQueryResult>;
    private buildSQLPrompt;
    private buildAPIPrompt;
    private callGeminiAPIWithRetry;
    private callGeminiAPI;
    private parseSQLResponse;
    private parseAPIResponse;
    private cleanSQLResponse;
    private cleanAPIResponse;
    private calculateSQLConfidence;
    private calculateAPIConfidence;
    private getSQLDialect;
    private formatSchemaInfo;
    private sleep;
    updateApiKey(newApiKey: string): void;
    testConnection(): Promise<{
        success: boolean;
        message: string;
    }>;
    checkAPIStatus(): Promise<{
        available: boolean;
        message: string;
    }>;
}
//# sourceMappingURL=ai-query.service.d.ts.map