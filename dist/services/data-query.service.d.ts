import { SupabaseClient } from '@supabase/supabase-js';
import { DataConnection, DataConnectionInput, ConnectionTestResult, AIQueryInput, AIQueryResult, SchemaInfo } from '../types/data-query';
import { GeminiConfig } from './ai-query.service';
export declare class DataQueryService {
    private supabase;
    private aiService;
    constructor(supabase: SupabaseClient, geminiConfig: GeminiConfig);
    createDataConnection(companyId: string, input: DataConnectionInput): Promise<DataConnection>;
    getDataConnections(companyId: string): Promise<DataConnection[]>;
    getDataConnection(companyId: string, connectionId: string): Promise<DataConnection | null>;
    updateDataConnection(companyId: string, connectionId: string, input: DataConnectionInput): Promise<DataConnection>;
    deleteDataConnection(companyId: string, connectionId: string): Promise<boolean>;
    testConnection(input: DataConnectionInput): Promise<ConnectionTestResult>;
    testExistingConnection(companyId: string, connectionId: string): Promise<ConnectionTestResult>;
    getSchemaInfo(companyId: string, connectionId: string): Promise<SchemaInfo>;
    executeAIQuery(companyId: string, userId: string, input: AIQueryInput): Promise<AIQueryResult>;
    getAIQueryHistory(companyId: string, limit?: number): Promise<AIQueryResult[]>;
    getAIQuery(companyId: string, queryId: string): Promise<AIQueryResult | null>;
    private mapDatabaseToConnection;
    private encryptSensitiveData;
    private decryptSensitiveData;
    private getKnownAPIEndpoints;
}
//# sourceMappingURL=data-query.service.d.ts.map