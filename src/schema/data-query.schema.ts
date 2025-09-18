export const dataQueryTypeDefs = `#graphql
  enum ConnectionType {
    MYSQL
    POSTGRESQL
    SUPABASE
    API_REST
    API_GRAPHQL
  }

  enum ConnectionStatus {
    ACTIVE
    INACTIVE
    ERROR
  }

  type DataConnection {
    id: ID!
    companyId: ID!
    name: String!
    type: ConnectionType!
    status: ConnectionStatus!
    config: DataConnectionConfig!
    isDefault: Boolean!
    createdAt: String!
    updatedAt: String!
    lastTestedAt: String
  }

  type DataConnectionConfig {
    host: String
    port: Int
    database: String
    username: String
    # password is never returned in queries
    apiUrl: String
    apiKey: String
    headers: [KeyValuePair!]
    timeout: Int
  }

  type KeyValuePair {
    key: String!
    value: String!
  }

  input DataConnectionInput {
    name: String!
    type: ConnectionType!
    config: DataConnectionConfigInput!
    isDefault: Boolean
  }

  input DataConnectionConfigInput {
    host: String
    port: Int
    database: String
    username: String
    password: String
    apiUrl: String
    apiKey: String
    headers: [KeyValuePairInput!]
    timeout: Int
  }

  input KeyValuePairInput {
    key: String!
    value: String!
  }

  input ConnectionTestInput {
    type: ConnectionType!
    host: String
    port: Int
    database: String
    username: String
    password: String
    apiUrl: String
    apiKey: String
  }

  type AIQueryResult {
    id: ID!
    companyId: ID!
    connectionId: ID!
    naturalQuery: String!
    generatedQuery: String!
    results: [QueryResultRow!]!
    executionTime: Float!
    status: QueryStatus!
    error: String
    createdAt: String!
  }

  enum QueryStatus {
    SUCCESS
    ERROR
    TIMEOUT
  }

  type QueryResultRow {
    data: JSON!
  }

  type DeleteResult {
    deletedCount: Int!
    errors: [String!]!
  }

  type ClearHistoryResult {
    deletedCount: Int!
    message: String!
  }

  type SchemaInfo {
    tables: [TableInfo!]!
    totalTables: Int!
  }

  type TableInfo {
    name: String!
    columns: [ColumnInfo!]!
  }

  type ColumnInfo {
    name: String!
    type: String!
    nullable: Boolean!
    defaultValue: String
  }

  input AIQueryInput {
    connectionId: ID!
    naturalQuery: String!
  }

  type Query {
    # Data Connections
    getDataConnections: [DataConnection!]!
    getDataConnection(id: ID!): DataConnection
    testDataConnection(id: ID!): ConnectionTestResult!
    
    # Get connections without authentication (development only)
    getDataConnectionsPublic: [DataConnection!]!
    getSchemaInfo(connectionId: ID!): SchemaInfo!
    
    # AI Queries
    getAIQueryHistory: [AIQueryResult!]!
    getAIQuery(id: ID!): AIQueryResult
    
    # AI Queries without authentication (development only)
    getAIQueryHistoryPublic(limit: Int): [AIQueryResult!]!
    getAIQueryPublic(id: ID!): AIQueryResult
  }

  type Mutation {
    # Data Connections Management
    createDataConnection(input: DataConnectionInput!): DataConnection!
    updateDataConnection(id: ID!, input: DataConnectionInput!): DataConnection!
    deleteDataConnection(id: ID!): Boolean!
    testConnection(input: DataConnectionInput!): ConnectionTestResult!
    
    # Testing without authentication (development only)
    testConnectionPublic(input: ConnectionTestInput!): ConnectionTestResult!
    
    # Create connection without authentication (development only)
    createDataConnectionPublic(input: DataConnectionInput!): DataConnection!
    
    # AI Query Execution
    executeAIQuery(input: AIQueryInput!): AIQueryResult!
    
    # Execute AI query without authentication (development only)
    executeAIQueryPublic(input: AIQueryInput!): AIQueryResult!
    
    # Delete AI queries without authentication (development only)
    deleteAIQueryPublic(id: ID!): Boolean!
    deleteMultipleAIQueriesPublic(ids: [ID!]!): DeleteResult!
    clearAIQueryHistoryPublic: ClearHistoryResult!
  }

  type ConnectionTestResult {
    success: Boolean!
    message: String!
    latency: Float
    schemaPreview: SchemaInfo
  }

  scalar JSON
`;