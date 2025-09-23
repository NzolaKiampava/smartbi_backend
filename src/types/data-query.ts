export enum ConnectionType {
  MYSQL = 'MYSQL',
  POSTGRESQL = 'POSTGRESQL',
  SUPABASE = 'SUPABASE',
  FIREBASE = 'FIREBASE',
  API_REST = 'API_REST',
  API_GRAPHQL = 'API_GRAPHQL'
}

export enum ConnectionStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ERROR = 'ERROR'
}

export enum QueryStatus {
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
  TIMEOUT = 'TIMEOUT'
}

export interface DataConnection {
  id: string;
  companyId: string;
  name: string;
  type: ConnectionType;
  status: ConnectionStatus;
  config: DataConnectionConfig;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  lastTestedAt?: string;
}

export interface DataConnectionConfig {
  host?: string;
  port?: number;
  database?: string;
  username?: string;
  password?: string;
  apiUrl?: string;
  apiKey?: string;
  headers?: KeyValuePair[];
  timeout?: number;
}

export interface KeyValuePair {
  key: string;
  value: string;
}

export interface AIQueryResult {
  id: string;
  companyId: string;
  connectionId: string;
  naturalQuery: string;
  generatedQuery: string;
  results: QueryResultRow[];
  executionTime: number;
  status: QueryStatus;
  error?: string;
  createdAt: string;
}

export interface QueryResultRow {
  data: Record<string, any>;
}

export interface SchemaInfo {
  tables: TableInfo[];
  totalTables: number;
}

export interface TableInfo {
  name: string;
  columns: ColumnInfo[];
}

export interface ColumnInfo {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue?: string;
}

export interface ConnectionTestResult {
  success: boolean;
  message: string;
  latency?: number;
  schemaPreview?: SchemaInfo;
}

export interface ConnectionTestInput {
  type: ConnectionType;
  host?: string;
  port?: number;
  database?: string;
  username?: string;
  password?: string;
  apiUrl?: string;
  apiKey?: string;
}

// Input types
export interface DataConnectionInput {
  name: string;
  type: ConnectionType;
  config: DataConnectionConfigInput;
  isDefault?: boolean;
}

export interface DataConnectionConfigInput {
  host?: string;
  port?: number;
  database?: string;
  username?: string;
  password?: string;
  apiUrl?: string;
  apiKey?: string;
  headers?: KeyValuePairInput[];
  timeout?: number;
}

export interface KeyValuePairInput {
  key: string;
  value: string;
}

export interface AIQueryInput {
  connectionId: string;
  naturalQuery: string;
}