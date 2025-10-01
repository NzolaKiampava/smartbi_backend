"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataQueryService = void 0;
const data_query_1 = require("../types/data-query");
const ai_query_service_1 = require("./ai-query.service");
const database_adapters_service_1 = require("./database-adapters.service");
class DataQueryService {
    constructor(supabase, geminiConfig) {
        this.supabase = supabase;
        this.aiService = new ai_query_service_1.AIQueryService(geminiConfig);
    }
    async createDataConnection(companyId, input) {
        try {
            const encryptedConfig = this.encryptSensitiveData(input.config);
            const { data, error } = await this.supabase
                .from('data_connections')
                .insert({
                company_id: companyId,
                name: input.name,
                type: input.type,
                config: encryptedConfig,
                is_default: input.isDefault || false,
                status: 'INACTIVE'
            })
                .select()
                .single();
            if (error) {
                throw new Error(`Failed to create connection: ${error.message}`);
            }
            return this.mapDatabaseToConnection(data);
        }
        catch (error) {
            throw new Error(`Failed to create data connection: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async getDataConnections(companyId) {
        try {
            const { data, error } = await this.supabase
                .from('data_connections')
                .select('*')
                .eq('company_id', companyId)
                .order('created_at', { ascending: false });
            if (error) {
                throw new Error(`Failed to fetch connections: ${error.message}`);
            }
            return data.map(row => this.mapDatabaseToConnection(row));
        }
        catch (error) {
            throw new Error(`Failed to get data connections: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async getDataConnection(companyId, connectionId) {
        try {
            const { data, error } = await this.supabase
                .from('data_connections')
                .select('*')
                .eq('id', connectionId)
                .eq('company_id', companyId)
                .single();
            if (error) {
                if (error.code === 'PGRST116') {
                    return null;
                }
                throw new Error(`Failed to fetch connection: ${error.message}`);
            }
            return this.mapDatabaseToConnection(data);
        }
        catch (error) {
            throw new Error(`Failed to get data connection: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async updateDataConnection(companyId, connectionId, input) {
        try {
            const encryptedConfig = this.encryptSensitiveData(input.config);
            const { data, error } = await this.supabase
                .from('data_connections')
                .update({
                name: input.name,
                type: input.type,
                config: encryptedConfig,
                is_default: input.isDefault || false,
                updated_at: new Date().toISOString()
            })
                .eq('id', connectionId)
                .eq('company_id', companyId)
                .select()
                .single();
            if (error) {
                throw new Error(`Failed to update connection: ${error.message}`);
            }
            return this.mapDatabaseToConnection(data);
        }
        catch (error) {
            throw new Error(`Failed to update data connection: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async deleteDataConnection(companyId, connectionId) {
        try {
            const { error } = await this.supabase
                .from('data_connections')
                .delete()
                .eq('id', connectionId)
                .eq('company_id', companyId);
            if (error) {
                throw new Error(`Failed to delete connection: ${error.message}`);
            }
            return true;
        }
        catch (error) {
            throw new Error(`Failed to delete data connection: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async testConnection(input) {
        try {
            const adapter = (0, database_adapters_service_1.createDatabaseAdapter)(input.type);
            if (adapter instanceof database_adapters_service_1.APIRestAdapter) {
                return await adapter.testConnection(input.config);
            }
            else {
                const result = await adapter.testConnection(input.config);
                if (result.success) {
                    try {
                        const schemaPreview = await adapter.getSchemaInfo(input.config);
                        return { ...result, schemaPreview };
                    }
                    catch (schemaError) {
                        return {
                            ...result,
                            message: `${result.message} (Schema preview unavailable: ${schemaError instanceof Error ? schemaError.message : 'Unknown error'})`
                        };
                    }
                }
                return result;
            }
        }
        catch (error) {
            return {
                success: false,
                message: `Connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        }
    }
    async testExistingConnection(companyId, connectionId) {
        try {
            const connection = await this.getDataConnection(companyId, connectionId);
            if (!connection) {
                throw new Error('Connection not found');
            }
            const decryptedConfig = this.decryptSensitiveData(connection.config);
            const result = await this.testConnection({
                name: connection.name,
                type: connection.type,
                config: decryptedConfig
            });
            await this.supabase
                .from('data_connections')
                .update({
                status: result.success ? 'ACTIVE' : 'ERROR',
                last_tested_at: new Date().toISOString()
            })
                .eq('id', connectionId)
                .eq('company_id', companyId);
            return result;
        }
        catch (error) {
            return {
                success: false,
                message: `Connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        }
    }
    async getSchemaInfo(companyId, connectionId) {
        try {
            const connection = await this.getDataConnection(companyId, connectionId);
            if (!connection) {
                throw new Error('Connection not found');
            }
            if (connection.type === data_query_1.ConnectionType.API_REST || connection.type === data_query_1.ConnectionType.API_GRAPHQL) {
                throw new Error('Schema information is not available for API connections');
            }
            const adapter = (0, database_adapters_service_1.createDatabaseAdapter)(connection.type);
            const decryptedConfig = this.decryptSensitiveData(connection.config);
            return await adapter.getSchemaInfo(decryptedConfig);
        }
        catch (error) {
            throw new Error(`Failed to get schema info: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async executeAIQuery(companyId, userId, input) {
        const startTime = Date.now();
        try {
            const connection = await this.getDataConnection(companyId, input.connectionId);
            if (!connection) {
                throw new Error('Connection not found');
            }
            const decryptedConfig = this.decryptSensitiveData(connection.config);
            let results = [];
            let generatedQuery = '';
            let status = data_query_1.QueryStatus.SUCCESS;
            let errorMessage;
            if (connection.type === data_query_1.ConnectionType.API_REST || connection.type === data_query_1.ConnectionType.API_GRAPHQL) {
                const apiAdapter = new database_adapters_service_1.APIRestAdapter();
                const apiEndpoints = this.getKnownAPIEndpoints(decryptedConfig.apiUrl || decryptedConfig.host || '');
                const aiResult = await this.aiService.translateToAPICall({
                    connectionType: connection.type,
                    naturalQuery: input.naturalQuery,
                    apiEndpoints: apiEndpoints
                });
                generatedQuery = aiResult.generatedQuery;
                if (aiResult.queryType === 'ERROR') {
                    status = data_query_1.QueryStatus.ERROR;
                    errorMessage = aiResult.explanation;
                }
                else {
                    try {
                        const apiCallConfig = JSON.parse(aiResult.generatedQuery);
                        if (apiCallConfig.error) {
                            status = data_query_1.QueryStatus.ERROR;
                            errorMessage = apiCallConfig.error;
                        }
                        else {
                            const endpoint = `${apiCallConfig.method || 'GET'} ${apiCallConfig.path}`;
                            const apiResult = await apiAdapter.executeQuery(decryptedConfig, endpoint);
                            results = Array.isArray(apiResult) ? apiResult : [apiResult];
                        }
                    }
                    catch (error) {
                        status = data_query_1.QueryStatus.ERROR;
                        errorMessage = `API execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
                    }
                }
            }
            else {
                const adapter = (0, database_adapters_service_1.createDatabaseAdapter)(connection.type);
                const schemaInfo = await adapter.getSchemaInfo(decryptedConfig);
                const aiSchemaInfo = schemaInfo.tables.flatMap(table => table.columns.map(column => ({
                    tableName: table.name,
                    columnName: column.name,
                    dataType: column.type
                })));
                const aiResult = await this.aiService.translateToSQL({
                    connectionType: connection.type,
                    database: decryptedConfig.database,
                    schemaInfo: aiSchemaInfo,
                    naturalQuery: input.naturalQuery
                });
                generatedQuery = aiResult.generatedQuery;
                if (aiResult.queryType === 'ERROR') {
                    status = data_query_1.QueryStatus.ERROR;
                    errorMessage = aiResult.explanation;
                }
                else {
                    try {
                        results = await adapter.executeQuery(decryptedConfig, aiResult.generatedQuery);
                    }
                    catch (error) {
                        status = data_query_1.QueryStatus.ERROR;
                        errorMessage = `Query execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
                    }
                }
            }
            const executionTime = Date.now() - startTime;
            const { data: historyData, error: historyError } = await this.supabase
                .from('ai_query_history')
                .insert({
                company_id: companyId,
                connection_id: input.connectionId,
                user_id: userId,
                natural_query: input.naturalQuery,
                generated_query: generatedQuery,
                results: results,
                execution_time: executionTime,
                status: status,
                error_message: errorMessage
            })
                .select()
                .single();
            if (historyError) {
                console.error('Failed to save query history:', historyError);
            }
            return {
                id: historyData?.id || 'unknown',
                companyId,
                connectionId: input.connectionId,
                naturalQuery: input.naturalQuery,
                generatedQuery,
                results: results.map(row => ({ data: row })),
                executionTime,
                status,
                error: errorMessage,
                createdAt: new Date().toISOString()
            };
        }
        catch (error) {
            const executionTime = Date.now() - startTime;
            return {
                id: 'error',
                companyId,
                connectionId: input.connectionId,
                naturalQuery: input.naturalQuery,
                generatedQuery: '',
                results: [],
                executionTime,
                status: data_query_1.QueryStatus.ERROR,
                error: error instanceof Error ? error.message : 'Unknown error',
                createdAt: new Date().toISOString()
            };
        }
    }
    async getAIQueryHistory(companyId, limit = 50) {
        try {
            const { data, error } = await this.supabase
                .from('ai_query_history')
                .select('*')
                .eq('company_id', companyId)
                .order('created_at', { ascending: false })
                .limit(limit);
            if (error) {
                throw new Error(`Failed to fetch query history: ${error.message}`);
            }
            return data.map(row => ({
                id: row.id,
                companyId: row.company_id,
                connectionId: row.connection_id,
                naturalQuery: row.natural_query,
                generatedQuery: row.generated_query,
                results: (row.results || []).map((item) => ({ data: item })),
                executionTime: row.execution_time || 0,
                status: row.status,
                error: row.error_message,
                createdAt: row.created_at
            }));
        }
        catch (error) {
            throw new Error(`Failed to get AI query history: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async getAIQuery(companyId, queryId) {
        try {
            const { data, error } = await this.supabase
                .from('ai_query_history')
                .select('*')
                .eq('id', queryId)
                .eq('company_id', companyId)
                .single();
            if (error) {
                if (error.code === 'PGRST116') {
                    return null;
                }
                throw new Error(`Failed to fetch query: ${error.message}`);
            }
            return {
                id: data.id,
                companyId: data.company_id,
                connectionId: data.connection_id,
                naturalQuery: data.natural_query,
                generatedQuery: data.generated_query,
                results: (data.results || []).map((item) => ({ data: item })),
                executionTime: data.execution_time || 0,
                status: data.status,
                error: data.error_message,
                createdAt: data.created_at
            };
        }
        catch (error) {
            throw new Error(`Failed to get AI query: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    mapDatabaseToConnection(row) {
        return {
            id: row.id,
            companyId: row.company_id,
            name: row.name,
            type: row.type,
            status: row.status,
            config: this.decryptSensitiveData(row.config),
            isDefault: row.is_default,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            lastTestedAt: row.last_tested_at
        };
    }
    encryptSensitiveData(config) {
        return { ...config };
    }
    decryptSensitiveData(config) {
        return { ...config };
    }
    getKnownAPIEndpoints(apiUrl) {
        if (apiUrl.includes('jsonplaceholder.typicode.com')) {
            return [
                { path: '/posts', method: 'GET', description: 'Get all posts' },
                { path: '/posts/{id}', method: 'GET', description: 'Get a specific post by ID' },
                { path: '/albums', method: 'GET', description: 'Get all albums' },
                { path: '/albums/{id}', method: 'GET', description: 'Get a specific album by ID' },
                { path: '/photos', method: 'GET', description: 'Get all photos' },
                { path: '/photos/{id}', method: 'GET', description: 'Get a specific photo by ID' },
                { path: '/users', method: 'GET', description: 'Get all users' },
                { path: '/users/{id}', method: 'GET', description: 'Get a specific user by ID' },
                { path: '/comments', method: 'GET', description: 'Get all comments' },
                { path: '/comments/{id}', method: 'GET', description: 'Get a specific comment by ID' },
                { path: '/todos', method: 'GET', description: 'Get all todos' },
                { path: '/todos/{id}', method: 'GET', description: 'Get a specific todo by ID' }
            ];
        }
        return [
            { path: '/api/data', method: 'GET', description: 'Get data from API' },
            { path: '/api/list', method: 'GET', description: 'Get list of items' },
            { path: '/api/search', method: 'GET', description: 'Search API' }
        ];
    }
}
exports.DataQueryService = DataQueryService;
//# sourceMappingURL=data-query.service.js.map