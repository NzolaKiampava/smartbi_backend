import { DataConnectionConfig, ConnectionType, SchemaInfo, TableInfo, ColumnInfo } from '../types/data-query';
import mysql from 'mysql2/promise';
import { Pool, Client } from 'pg';
import axios from 'axios';

export interface DatabaseAdapter {
  testConnection(config: DataConnectionConfig): Promise<{ success: boolean; message: string; latency?: number }>;
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

// Base adapter with common functionality
export abstract class BaseAdapter implements DatabaseAdapter {
  protected timeout: number;

  constructor(timeout: number = 30000) {
    this.timeout = timeout;
  }

  abstract testConnection(config: DataConnectionConfig): Promise<{ success: boolean; message: string; latency?: number }>;
  abstract getSchemaInfo(config: DataConnectionConfig): Promise<SchemaInfo>;
  abstract executeQuery(config: DataConnectionConfig, query: string): Promise<any[]>;

  sanitizeQuery(query: string): string {
    // Remove dangerous keywords
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

    // Basic SQL injection protection
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

// MySQL Adapter with Real Implementation
export class MySQLAdapter extends BaseAdapter {
  private async createConnection(config: DataConnectionConfig): Promise<mysql.Connection> {
    return await mysql.createConnection({
      host: config.host,
      port: config.port || 3306,
      user: config.username,
      password: config.password,
      database: config.database
    });
  }

  async testConnection(config: DataConnectionConfig): Promise<{ success: boolean; message: string; latency?: number }> {
    const startTime = Date.now();
    let connection: mysql.Connection | null = null;
    
    try {
      connection = await this.createConnection(config);
      await connection.ping();
      
      const latency = Date.now() - startTime;
      
      return {
        success: true,
        message: 'MySQL connection successful',
        latency
      };
    } catch (error) {
      return {
        success: false,
        message: `MySQL connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    } finally {
      if (connection) {
        await connection.end();
      }
    }
  }

  async getSchemaInfo(config: DataConnectionConfig): Promise<SchemaInfo> {
    let connection: mysql.Connection | null = null;
    
    try {
      connection = await this.createConnection(config);
      
      // Get all tables
      const [tablesResult] = await connection.execute(
        'SHOW TABLES'
      ) as [any[], any];
      
      const tables: TableInfo[] = [];
      
      for (const tableRow of tablesResult) {
        const tableName = Object.values(tableRow)[0] as string;
        
        // Get columns for each table
        const [columnsResult] = await connection.execute(
          'DESCRIBE ??',
          [tableName]
        ) as [any[], any];
        
        const columns: ColumnInfo[] = columnsResult.map((col: any) => ({
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
    } catch (error) {
      throw new Error(`Failed to get MySQL schema: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      if (connection) {
        await connection.end();
      }
    }
  }

  async executeQuery(config: DataConnectionConfig, query: string): Promise<any[]> {
    let connection: mysql.Connection | null = null;
    
    try {
      const sanitizedQuery = this.sanitizeQuery(query);
      connection = await this.createConnection(config);
      
      const [results] = await connection.execute(sanitizedQuery) as [any[], any];
      
      return Array.isArray(results) ? results : [results];
    } catch (error) {
      throw new Error(`MySQL query execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      if (connection) {
        await connection.end();
      }
    }
  }
}

// PostgreSQL Adapter with Real Implementation
export class PostgreSQLAdapter extends BaseAdapter {
  private createClient(config: DataConnectionConfig): Client {
    return new Client({
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

  async testConnection(config: DataConnectionConfig): Promise<{ success: boolean; message: string; latency?: number }> {
    const startTime = Date.now();
    let client: Client | null = null;
    
    try {
      client = this.createClient(config);
      await client.connect();
      
      // Test with a simple query
      await client.query('SELECT 1');
      
      const latency = Date.now() - startTime;
      
      return {
        success: true,
        message: 'PostgreSQL connection successful',
        latency
      };
    } catch (error) {
      return {
        success: false,
        message: `PostgreSQL connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    } finally {
      if (client) {
        await client.end();
      }
    }
  }

  async getSchemaInfo(config: DataConnectionConfig): Promise<SchemaInfo> {
    let client: Client | null = null;
    
    try {
      client = this.createClient(config);
      await client.connect();
      
      // Get all tables from public schema
      const tablesResult = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
      `);
      
      const tables: TableInfo[] = [];
      
      for (const tableRow of tablesResult.rows) {
        const tableName = tableRow.table_name;
        
        // Get columns for each table
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
        
        const columns: ColumnInfo[] = columnsResult.rows.map((col: any) => ({
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
    } catch (error) {
      throw new Error(`Failed to get PostgreSQL schema: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      if (client) {
        await client.end();
      }
    }
  }

  async executeQuery(config: DataConnectionConfig, query: string): Promise<any[]> {
    let client: Client | null = null;
    
    try {
      const sanitizedQuery = this.sanitizeQuery(query);
      client = this.createClient(config);
      await client.connect();
      
      const result = await client.query(sanitizedQuery);
      
      return result.rows;
    } catch (error) {
      throw new Error(`PostgreSQL query execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      if (client) {
        await client.end();
      }
    }
  }
}
// Supabase API Adapter (uses REST API instead of direct PostgreSQL)
export class SupabaseAdapter extends BaseAdapter {
  async testConnection(config: DataConnectionConfig): Promise<{ success: boolean; message: string; latency?: number }> {
    const startTime = Date.now();
    
    try {
      // For Supabase, we expect the config to have:
      // host: Supabase URL (https://project.supabase.co)
      // password: Service Role Key or Anon Key
      
      const supabaseUrl = config.host;
      const apiKey = config.password; // Using password field for API key
      
      const response = await axios.get(`${supabaseUrl}/rest/v1/`, {
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
    } catch (error) {
      if (axios.isAxiosError(error)) {
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

  async getSchemaInfo(config: DataConnectionConfig): Promise<SchemaInfo> {
    try {
      const supabaseUrl = config.host;
      const apiKey = config.password;
      
      // Get all tables from Supabase REST API
      const response = await axios.get(`${supabaseUrl}/rest/v1/`, {
        headers: {
          'apikey': apiKey,
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: this.timeout
      });
      
      // Parse OpenAPI schema to extract table information
      const tables: TableInfo[] = [];
      
      if (response.data && response.data.paths) {
        Object.keys(response.data.paths).forEach(path => {
          if (path.startsWith('/') && !path.includes('{')) {
            const tableName = path.substring(1); // Remove leading slash
            
            // Basic column info (Supabase doesn't expose full schema via REST)
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
      
      // If no tables found from schema, try to get some basic info
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
    } catch (error) {
      throw new Error(`Failed to get Supabase schema: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async executeQuery(config: DataConnectionConfig, query: string): Promise<any[]> {
    try {
      const sanitizedQuery = this.sanitizeQuery(query);
      const supabaseUrl = config.host;
      const apiKey = config.password;
      
      // For SQL queries in Supabase, we need to use RPC or convert to PostgREST
      // For now, let's try to extract table name from SELECT queries and use PostgREST
      
      const selectMatch = sanitizedQuery.match(/SELECT\s+[\s\S]*?\s+FROM\s+(\w+)/i);
      if (selectMatch) {
        const tableName = selectMatch[1];
        let endpoint = `/${tableName}`;
        
        // Add basic LIMIT support
        const limitMatch = sanitizedQuery.match(/LIMIT\s+(\d+)/i);
        if (limitMatch) {
          endpoint += `?limit=${limitMatch[1]}`;
        }
        
        const response = await axios.get(`${supabaseUrl}/rest/v1${endpoint}`, {
          headers: {
            'apikey': apiKey,
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: this.timeout
        });
        
        return Array.isArray(response.data) ? response.data : [response.data];
      }
      
      // For COUNT queries, try to use PostgREST head request
      const countMatch = sanitizedQuery.match(/SELECT\s+COUNT\(\*\)\s+FROM\s+(\w+)/i);
      if (countMatch) {
        const tableName = countMatch[1];
        
        const response = await axios.head(`${supabaseUrl}/rest/v1/${tableName}`, {
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
      
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Supabase query failed: ${error.response?.status} ${error.response?.statusText || error.message}`);
      }
      
      throw new Error(`Supabase query failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
export class APIRestAdapter extends BaseAdapter {
  async testConnection(config: DataConnectionConfig): Promise<{ success: boolean; message: string; latency?: number }> {
    const startTime = Date.now();
    
    try {
      // Use apiUrl if provided, otherwise fallback to host:port
      const url = config.apiUrl || `${config.host}${config.port ? ':' + config.port : ''}`;
      const headers: any = {};
      
      // Add API key if provided
      if (config.apiKey) {
        headers['X-API-Key'] = config.apiKey;
        headers['Authorization'] = `Bearer ${config.apiKey}`;
      }
      
      // Add basic auth if provided
      if (config.username && config.password) {
        const auth = Buffer.from(`${config.username}:${config.password}`).toString('base64');
        headers.Authorization = `Basic ${auth}`;
      }
      
      const response = await axios.get(url, {
        headers,
        timeout: this.timeout,
        validateStatus: (status) => status < 500 // Accept any status less than 500
      });
      
      const latency = Date.now() - startTime;
      
      return {
        success: true,
        message: `API connection successful (Status: ${response.status})`,
        latency
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
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

  async getSchemaInfo(config: DataConnectionConfig): Promise<SchemaInfo> {
    try {
      // Use apiUrl if provided, otherwise fallback to host:port
      const url = config.apiUrl || `${config.host}${config.port ? ':' + config.port : ''}`;
      const headers: any = {};
      
      // Add API key if provided
      if (config.apiKey) {
        headers['X-API-Key'] = config.apiKey;
        headers['Authorization'] = `Bearer ${config.apiKey}`;
      }
      
      // Add basic auth if provided
      if (config.username && config.password) {
        const auth = Buffer.from(`${config.username}:${config.password}`).toString('base64');
        headers.Authorization = `Basic ${auth}`;
      }
      
      // Try to get schema information from common endpoints
      const schemaEndpoints = [
        '/schema',
        '/api/schema',
        '/swagger.json',
        '/openapi.json',
        '/docs',
        '/api/docs'
      ];
      
      let schemaData: any = null;
      
      for (const endpoint of schemaEndpoints) {
        try {
          const response = await axios.get(`${url}${endpoint}`, {
            headers,
            timeout: this.timeout / schemaEndpoints.length
          });
          
          if (response.data) {
            schemaData = response.data;
            break;
          }
        } catch (error) {
          // Continue to next endpoint
          continue;
        }
      }
      
      // If no schema endpoint found, return basic info
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
      
      // Parse OpenAPI/Swagger schema if available
      if (schemaData.paths || schemaData.openapi || schemaData.swagger) {
        const tables: TableInfo[] = [];
        
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
      
      // Fallback for unknown schema format
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
    } catch (error) {
      throw new Error(`Failed to get API schema: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async executeQuery(config: DataConnectionConfig, query: string): Promise<any[]> {
    try {
      // For APIs, we interpret "query" as an endpoint path
      const sanitizedQuery = this.sanitizeQuery(query);
      
      // Use apiUrl if provided, otherwise fallback to host:port
      const baseUrl = config.apiUrl || `${config.host}${config.port ? ':' + config.port : ''}`;
      const headers: any = { 'Content-Type': 'application/json' };
      
      // Add API key if provided
      if (config.apiKey) {
        headers['X-API-Key'] = config.apiKey;
        headers['Authorization'] = `Bearer ${config.apiKey}`;
      }
      
      // Add authentication headers if provided
      if (config.username && config.password) {
        const auth = Buffer.from(`${config.username}:${config.password}`).toString('base64');
        headers.Authorization = `Basic ${auth}`;
      }
      
      // Parse query to extract method and endpoint
      let method = 'GET';
      let endpoint = sanitizedQuery;
      
      // Check if query specifies HTTP method
      const methodMatch = sanitizedQuery.match(/^(GET|POST|PUT|DELETE|PATCH)\s+(.+)$/i);
      if (methodMatch) {
        method = methodMatch[1].toUpperCase();
        endpoint = methodMatch[2];
      }
      
      // Ensure endpoint starts with /
      if (!endpoint.startsWith('/')) {
        endpoint = '/' + endpoint;
      }
      
      const response = await axios({
        method: method as any,
        url: `${baseUrl}${endpoint}`,
        headers,
        timeout: this.timeout
      });
      
      // Normalize response to array format
      if (Array.isArray(response.data)) {
        return response.data;
      } else if (response.data && typeof response.data === 'object') {
        return [response.data];
      } else {
        return [{ result: response.data, status: response.status }];
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`API query failed: ${error.response?.status} ${error.response?.statusText || error.message}`);
      }
      
      throw new Error(`API query failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  sanitizeQuery(query: string): string {
    // For APIs, we need different sanitization
    // Remove potentially dangerous characters for URL paths
    const sanitized = query
      .replace(/[<>'"]/g, '') // Remove HTML/script injection chars
      .replace(/\.\.\//g, '') // Remove directory traversal
      .replace(/[;&|`$]/g, ''); // Remove command injection chars
    
    return sanitized.trim();
  }
}

// Factory function to create appropriate adapter
export function createDatabaseAdapter(type: ConnectionType): DatabaseAdapter {
  switch (type) {
    case ConnectionType.MYSQL:
      return new MySQLAdapter();
    case ConnectionType.POSTGRESQL:
      return new PostgreSQLAdapter();
    case ConnectionType.SUPABASE:
      return new SupabaseAdapter();
    case ConnectionType.FIREBASE:
      return new SupabaseAdapter(); // Using Supabase adapter for Firebase for now
    case ConnectionType.API_REST:
      return new APIRestAdapter();
    default:
      throw new Error(`Unsupported connection type: ${type}`);
  }
}

export default {
  MySQLAdapter,
  PostgreSQLAdapter,
  SupabaseAdapter,
  APIRestAdapter,
  createDatabaseAdapter
};