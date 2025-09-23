import { DataConnectionConfig, ConnectionType, SchemaInfo } from '../types/data-query';
export interface DatabaseAdapter {
    testConnection(config: DataConnectionConfig): Promise<{
        success: boolean;
        message: string;
        latency?: number;
    }>;
    getSchemaInfo(config: DataConnectionConfig): Promise<SchemaInfo>;
    executeQuery(config: DataConnectionConfig, query: string): Promise<any[]>;
    sanitizeQuery(query: string): string;
}
export interface QueryExecutionResult {
    success: boolean;
    data?: any[];
    error?: string;
    executionTime: number;
}
export declare abstract class BaseAdapter implements DatabaseAdapter {
    protected timeout: number;
    constructor(timeout?: number);
    abstract testConnection(config: DataConnectionConfig): Promise<{
        success: boolean;
        message: string;
        latency?: number;
    }>;
    abstract getSchemaInfo(config: DataConnectionConfig): Promise<SchemaInfo>;
    abstract executeQuery(config: DataConnectionConfig, query: string): Promise<any[]>;
    sanitizeQuery(query: string): string;
}
export declare class MySQLAdapter extends BaseAdapter {
    private createConnection;
    testConnection(config: DataConnectionConfig): Promise<{
        success: boolean;
        message: string;
        latency?: number;
    }>;
    getSchemaInfo(config: DataConnectionConfig): Promise<SchemaInfo>;
    executeQuery(config: DataConnectionConfig, query: string): Promise<any[]>;
}
export declare class PostgreSQLAdapter extends BaseAdapter {
    private createClient;
    testConnection(config: DataConnectionConfig): Promise<{
        success: boolean;
        message: string;
        latency?: number;
    }>;
    getSchemaInfo(config: DataConnectionConfig): Promise<SchemaInfo>;
    executeQuery(config: DataConnectionConfig, query: string): Promise<any[]>;
}
export declare class SupabaseAdapter extends BaseAdapter {
    testConnection(config: DataConnectionConfig): Promise<{
        success: boolean;
        message: string;
        latency?: number;
    }>;
    getSchemaInfo(config: DataConnectionConfig): Promise<SchemaInfo>;
    executeQuery(config: DataConnectionConfig, query: string): Promise<any[]>;
}
export declare class APIRestAdapter extends BaseAdapter {
    testConnection(config: DataConnectionConfig): Promise<{
        success: boolean;
        message: string;
        latency?: number;
    }>;
    getSchemaInfo(config: DataConnectionConfig): Promise<SchemaInfo>;
    executeQuery(config: DataConnectionConfig, query: string): Promise<any[]>;
    sanitizeQuery(query: string): string;
}
export declare class FirebaseAdapter extends BaseAdapter {
    testConnection(config: DataConnectionConfig): Promise<{
        success: boolean;
        message: string;
        latency?: number;
    }>;
    getSchemaInfo(config: DataConnectionConfig): Promise<SchemaInfo>;
    executeQuery(config: DataConnectionConfig, query: string): Promise<any[]>;
}
export declare class MongoDBAdapter extends BaseAdapter {
    testConnection(config: DataConnectionConfig): Promise<{
        success: boolean;
        message: string;
        latency?: number;
    }>;
    getSchemaInfo(config: DataConnectionConfig): Promise<SchemaInfo>;
    executeQuery(config: DataConnectionConfig, query: string): Promise<any[]>;
}
export declare function createDatabaseAdapter(type: ConnectionType): DatabaseAdapter;
declare const _default: {
    MySQLAdapter: typeof MySQLAdapter;
    PostgreSQLAdapter: typeof PostgreSQLAdapter;
    SupabaseAdapter: typeof SupabaseAdapter;
    APIRestAdapter: typeof APIRestAdapter;
    FirebaseAdapter: typeof FirebaseAdapter;
    MongoDBAdapter: typeof MongoDBAdapter;
    createDatabaseAdapter: typeof createDatabaseAdapter;
};
export default _default;
//# sourceMappingURL=database-adapters.service.d.ts.map