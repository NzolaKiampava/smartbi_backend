"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.APIRestAdapter = exports.SupabaseAdapter = exports.PostgreSQLAdapter = exports.MySQLAdapter = exports.BaseAdapter = void 0;
exports.createDatabaseAdapter = createDatabaseAdapter;
const data_query_1 = require("../types/data-query");
const promise_1 = __importDefault(require("mysql2/promise"));
const pg_1 = require("pg");
const axios_1 = __importDefault(require("axios"));
class BaseAdapter {
    constructor(timeout = 30000) {
        this.timeout = timeout;
    }
    sanitizeQuery(query) {
        const dangerousKeywords = [
            'DROP', 'DELETE', 'UPDATE', 'INSERT', 'TRUNCATE', 'ALTER',
            'CREATE', 'GRANT', 'REVOKE', 'EXEC', 'EXECUTE'
        ];
        const upperQuery = query.toUpperCase();
        for (const keyword of dangerousKeywords) {
            if (upperQuery.includes(keyword)) {
                throw new Error(`Query contains prohibited keyword: ${keyword}`);
            }
        }
        const suspiciousPatterns = [
            /;\s*DROP/i,
            /;\s*DELETE/i,
            /;\s*UPDATE/i,
            /;\s*INSERT/i,
            /UNION\s+SELECT/i,
            /LOAD_FILE/i,
            /INTO\s+OUTFILE/i
        ];
        for (const pattern of suspiciousPatterns) {
            if (pattern.test(query)) {
                throw new Error('Query contains suspicious patterns');
            }
        }
        return query.trim();
    }
}
exports.BaseAdapter = BaseAdapter;
class MySQLAdapter extends BaseAdapter {
    async createConnection(config) {
        return await promise_1.default.createConnection({
            host: config.host,
            port: config.port || 3306,
            user: config.username,
            password: config.password,
            database: config.database
        });
    }
    async testConnection(config) {
        const startTime = Date.now();
        let connection = null;
        try {
            connection = await this.createConnection(config);
            await connection.ping();
            const latency = Date.now() - startTime;
            return {
                success: true,
                message: 'MySQL connection successful',
                latency
            };
        }
        catch (error) {
            return {
                success: false,
                message: `MySQL connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        }
        finally {
            if (connection) {
                await connection.end();
            }
        }
    }
    async getSchemaInfo(config) {
        let connection = null;
        try {
            connection = await this.createConnection(config);
            const [tablesResult] = await connection.execute('SHOW TABLES');
            const tables = [];
            for (const tableRow of tablesResult) {
                const tableName = Object.values(tableRow)[0];
                const [columnsResult] = await connection.execute('DESCRIBE ??', [tableName]);
                const columns = columnsResult.map((col) => ({
                    name: col.Field,
                    type: col.Type,
                    nullable: col.Null === 'YES',
                    defaultValue: col.Default
                }));
                tables.push({
                    name: tableName,
                    columns
                });
            }
            return {
                tables,
                totalTables: tables.length
            };
        }
        catch (error) {
            throw new Error(`Failed to get MySQL schema: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
        finally {
            if (connection) {
                await connection.end();
            }
        }
    }
    async executeQuery(config, query) {
        let connection = null;
        try {
            const sanitizedQuery = this.sanitizeQuery(query);
            connection = await this.createConnection(config);
            const [results] = await connection.execute(sanitizedQuery);
            return Array.isArray(results) ? results : [results];
        }
        catch (error) {
            throw new Error(`MySQL query execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
        finally {
            if (connection) {
                await connection.end();
            }
        }
    }
}
exports.MySQLAdapter = MySQLAdapter;
class PostgreSQLAdapter extends BaseAdapter {
    createClient(config) {
        return new pg_1.Client({
            host: config.host,
            port: config.port || 5432,
            user: config.username,
            password: config.password,
            database: config.database,
            ssl: config.host?.includes('supabase.co') ? { rejectUnauthorized: false } : false,
            connectionTimeoutMillis: this.timeout,
            query_timeout: this.timeout
        });
    }
    async testConnection(config) {
        const startTime = Date.now();
        let client = null;
        try {
            client = this.createClient(config);
            await client.connect();
            await client.query('SELECT 1');
            const latency = Date.now() - startTime;
            return {
                success: true,
                message: 'PostgreSQL connection successful',
                latency
            };
        }
        catch (error) {
            return {
                success: false,
                message: `PostgreSQL connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        }
        finally {
            if (client) {
                await client.end();
            }
        }
    }
    async getSchemaInfo(config) {
        let client = null;
        try {
            client = this.createClient(config);
            await client.connect();
            const tablesResult = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
      `);
            const tables = [];
            for (const tableRow of tablesResult.rows) {
                const tableName = tableRow.table_name;
                const columnsResult = await client.query(`
          SELECT 
            column_name, 
            data_type, 
            is_nullable, 
            column_default
          FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = $1
          ORDER BY ordinal_position
        `, [tableName]);
                const columns = columnsResult.rows.map((col) => ({
                    name: col.column_name,
                    type: col.data_type,
                    nullable: col.is_nullable === 'YES',
                    defaultValue: col.column_default
                }));
                tables.push({
                    name: tableName,
                    columns
                });
            }
            return {
                tables,
                totalTables: tables.length
            };
        }
        catch (error) {
            throw new Error(`Failed to get PostgreSQL schema: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
        finally {
            if (client) {
                await client.end();
            }
        }
    }
    async executeQuery(config, query) {
        let client = null;
        try {
            const sanitizedQuery = this.sanitizeQuery(query);
            client = this.createClient(config);
            await client.connect();
            const result = await client.query(sanitizedQuery);
            return result.rows;
        }
        catch (error) {
            throw new Error(`PostgreSQL query execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
        finally {
            if (client) {
                await client.end();
            }
        }
    }
}
exports.PostgreSQLAdapter = PostgreSQLAdapter;
class SupabaseAdapter extends BaseAdapter {
    async testConnection(config) {
        const startTime = Date.now();
        try {
            const supabaseUrl = config.host;
            const apiKey = config.password;
            const response = await axios_1.default.get(`${supabaseUrl}/rest/v1/`, {
                headers: {
                    'apikey': apiKey,
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: this.timeout
            });
            const latency = Date.now() - startTime;
            return {
                success: true,
                message: `Supabase API connection successful (Status: ${response.status})`,
                latency
            };
        }
        catch (error) {
            if (axios_1.default.isAxiosError(error)) {
                return {
                    success: false,
                    message: `Supabase API connection failed: ${error.response?.status} ${error.response?.statusText || error.message}`
                };
            }
            return {
                success: false,
                message: `Supabase API connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        }
    }
    async getSchemaInfo(config) {
        try {
            const supabaseUrl = config.host;
            const apiKey = config.password;
            const response = await axios_1.default.get(`${supabaseUrl}/rest/v1/`, {
                headers: {
                    'apikey': apiKey,
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: this.timeout
            });
            const tables = [];
            if (response.data && response.data.paths) {
                Object.keys(response.data.paths).forEach(path => {
                    if (path.startsWith('/') && !path.includes('{')) {
                        const tableName = path.substring(1);
                        tables.push({
                            name: tableName,
                            columns: [
                                { name: 'id', type: 'uuid', nullable: false },
                                { name: 'created_at', type: 'timestamp', nullable: true },
                                { name: 'updated_at', type: 'timestamp', nullable: true }
                            ]
                        });
                    }
                });
            }
            if (tables.length === 0) {
                tables.push({
                    name: 'supabase_api',
                    columns: [
                        { name: 'endpoint', type: 'string', nullable: false },
                        { name: 'data', type: 'json', nullable: true }
                    ]
                });
            }
            return {
                tables,
                totalTables: tables.length
            };
        }
        catch (error) {
            throw new Error(`Failed to get Supabase schema: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async executeQuery(config, query) {
        try {
            const sanitizedQuery = this.sanitizeQuery(query);
            const supabaseUrl = config.host;
            const apiKey = config.password;
            const selectMatch = sanitizedQuery.match(/SELECT\s+[\s\S]*?\s+FROM\s+(\w+)/i);
            if (selectMatch) {
                const tableName = selectMatch[1];
                let endpoint = `/${tableName}`;
                const limitMatch = sanitizedQuery.match(/LIMIT\s+(\d+)/i);
                if (limitMatch) {
                    endpoint += `?limit=${limitMatch[1]}`;
                }
                const response = await axios_1.default.get(`${supabaseUrl}/rest/v1${endpoint}`, {
                    headers: {
                        'apikey': apiKey,
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: this.timeout
                });
                return Array.isArray(response.data) ? response.data : [response.data];
            }
            const countMatch = sanitizedQuery.match(/SELECT\s+COUNT\(\*\)\s+FROM\s+(\w+)/i);
            if (countMatch) {
                const tableName = countMatch[1];
                const response = await axios_1.default.head(`${supabaseUrl}/rest/v1/${tableName}`, {
                    headers: {
                        'apikey': apiKey,
                        'Authorization': `Bearer ${apiKey}`,
                        'Prefer': 'count=exact'
                    },
                    timeout: this.timeout
                });
                const count = response.headers['content-range']?.split('/')[1] || '0';
                return [{ count: parseInt(count) }];
            }
            throw new Error('Complex SQL queries not supported for Supabase REST API. Use simple SELECT or COUNT queries.');
        }
        catch (error) {
            if (axios_1.default.isAxiosError(error)) {
                throw new Error(`Supabase query failed: ${error.response?.status} ${error.response?.statusText || error.message}`);
            }
            throw new Error(`Supabase query failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}
exports.SupabaseAdapter = SupabaseAdapter;
class APIRestAdapter extends BaseAdapter {
    async testConnection(config) {
        const startTime = Date.now();
        try {
            const url = config.apiUrl || `${config.host}${config.port ? ':' + config.port : ''}`;
            const headers = {};
            if (config.apiKey) {
                headers['X-API-Key'] = config.apiKey;
                headers['Authorization'] = `Bearer ${config.apiKey}`;
            }
            if (config.username && config.password) {
                const auth = Buffer.from(`${config.username}:${config.password}`).toString('base64');
                headers.Authorization = `Basic ${auth}`;
            }
            const response = await axios_1.default.get(url, {
                headers,
                timeout: this.timeout,
                validateStatus: (status) => status < 500
            });
            const latency = Date.now() - startTime;
            return {
                success: true,
                message: `API connection successful (Status: ${response.status})`,
                latency
            };
        }
        catch (error) {
            if (axios_1.default.isAxiosError(error)) {
                return {
                    success: false,
                    message: `API connection failed: ${error.response?.status} ${error.response?.statusText || error.message}`
                };
            }
            return {
                success: false,
                message: `API connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        }
    }
    async getSchemaInfo(config) {
        try {
            const url = config.apiUrl || `${config.host}${config.port ? ':' + config.port : ''}`;
            const headers = {};
            if (config.apiKey) {
                headers['X-API-Key'] = config.apiKey;
                headers['Authorization'] = `Bearer ${config.apiKey}`;
            }
            if (config.username && config.password) {
                const auth = Buffer.from(`${config.username}:${config.password}`).toString('base64');
                headers.Authorization = `Basic ${auth}`;
            }
            const schemaEndpoints = [
                '/schema',
                '/api/schema',
                '/swagger.json',
                '/openapi.json',
                '/docs',
                '/api/docs'
            ];
            let schemaData = null;
            for (const endpoint of schemaEndpoints) {
                try {
                    const response = await axios_1.default.get(`${url}${endpoint}`, {
                        headers,
                        timeout: this.timeout / schemaEndpoints.length
                    });
                    if (response.data) {
                        schemaData = response.data;
                        break;
                    }
                }
                catch (error) {
                    continue;
                }
            }
            if (!schemaData) {
                return {
                    tables: [{
                            name: 'api_endpoint',
                            columns: [
                                { name: 'method', type: 'string', nullable: false },
                                { name: 'path', type: 'string', nullable: false },
                                { name: 'response', type: 'json', nullable: true }
                            ]
                        }],
                    totalTables: 1
                };
            }
            if (schemaData.paths || schemaData.openapi || schemaData.swagger) {
                const tables = [];
                if (schemaData.paths) {
                    Object.keys(schemaData.paths).forEach(path => {
                        const methods = schemaData.paths[path];
                        Object.keys(methods).forEach(method => {
                            const tableName = `${method.toUpperCase()}_${path.replace(/[^a-zA-Z0-9]/g, '_')}`;
                            tables.push({
                                name: tableName,
                                columns: [
                                    { name: 'method', type: 'string', nullable: false, defaultValue: method.toUpperCase() },
                                    { name: 'path', type: 'string', nullable: false, defaultValue: path },
                                    { name: 'response', type: 'json', nullable: true }
                                ]
                            });
                        });
                    });
                }
                return {
                    tables,
                    totalTables: tables.length
                };
            }
            return {
                tables: [{
                        name: 'api_data',
                        columns: [
                            { name: 'endpoint', type: 'string', nullable: false },
                            { name: 'data', type: 'json', nullable: true }
                        ]
                    }],
                totalTables: 1
            };
        }
        catch (error) {
            throw new Error(`Failed to get API schema: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async executeQuery(config, query) {
        try {
            const sanitizedQuery = this.sanitizeQuery(query);
            const baseUrl = config.apiUrl || `${config.host}${config.port ? ':' + config.port : ''}`;
            const headers = { 'Content-Type': 'application/json' };
            if (config.apiKey) {
                headers['X-API-Key'] = config.apiKey;
                headers['Authorization'] = `Bearer ${config.apiKey}`;
            }
            if (config.username && config.password) {
                const auth = Buffer.from(`${config.username}:${config.password}`).toString('base64');
                headers.Authorization = `Basic ${auth}`;
            }
            let method = 'GET';
            let endpoint = sanitizedQuery;
            const methodMatch = sanitizedQuery.match(/^(GET|POST|PUT|DELETE|PATCH)\s+(.+)$/i);
            if (methodMatch) {
                method = methodMatch[1].toUpperCase();
                endpoint = methodMatch[2];
            }
            if (!endpoint.startsWith('/')) {
                endpoint = '/' + endpoint;
            }
            const response = await (0, axios_1.default)({
                method: method,
                url: `${baseUrl}${endpoint}`,
                headers,
                timeout: this.timeout
            });
            if (Array.isArray(response.data)) {
                return response.data;
            }
            else if (response.data && typeof response.data === 'object') {
                return [response.data];
            }
            else {
                return [{ result: response.data, status: response.status }];
            }
        }
        catch (error) {
            if (axios_1.default.isAxiosError(error)) {
                throw new Error(`API query failed: ${error.response?.status} ${error.response?.statusText || error.message}`);
            }
            throw new Error(`API query failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    sanitizeQuery(query) {
        const sanitized = query
            .replace(/[<>'"]/g, '')
            .replace(/\.\.\//g, '')
            .replace(/[;&|`$]/g, '');
        return sanitized.trim();
    }
}
exports.APIRestAdapter = APIRestAdapter;
function createDatabaseAdapter(type) {
    switch (type) {
        case data_query_1.ConnectionType.MYSQL:
            return new MySQLAdapter();
        case data_query_1.ConnectionType.POSTGRESQL:
            return new PostgreSQLAdapter();
        case data_query_1.ConnectionType.SUPABASE:
            return new SupabaseAdapter();
        case data_query_1.ConnectionType.FIREBASE:
            return new SupabaseAdapter();
        case data_query_1.ConnectionType.API_REST:
            return new APIRestAdapter();
        default:
            throw new Error(`Unsupported connection type: ${type}`);
    }
}
exports.default = {
    MySQLAdapter,
    PostgreSQLAdapter,
    SupabaseAdapter,
    APIRestAdapter,
    createDatabaseAdapter
};
//# sourceMappingURL=database-adapters.service.js.map