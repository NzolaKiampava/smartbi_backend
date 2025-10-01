import { GraphQLContext } from '../types/graphql';
import { DataConnectionInput, AIQueryInput, DataConnection, AIQueryResult, ConnectionTestResult, ConnectionTestInput, SchemaInfo } from '../types/data-query';
export declare const dataQueryResolvers: {
    Query: {
        getDataConnections: (_: any, __: any, context: GraphQLContext) => Promise<DataConnection[]>;
        getDataConnection: (_: any, { id }: {
            id: string;
        }, context: GraphQLContext) => Promise<DataConnection | null>;
        testDataConnection: (_: any, { id }: {
            id: string;
        }, context: GraphQLContext) => Promise<ConnectionTestResult>;
        getSchemaInfo: (_: any, { connectionId }: {
            connectionId: string;
        }, context: GraphQLContext) => Promise<SchemaInfo>;
        getAIQueryHistory: (_: any, { limit }: {
            limit?: number;
        }, context: GraphQLContext) => Promise<AIQueryResult[]>;
        getAIQuery: (_: any, { id }: {
            id: string;
        }, context: GraphQLContext) => Promise<AIQueryResult | null>;
        getDataConnectionsPublic: (_: any, __: any, context: GraphQLContext) => Promise<DataConnection[]>;
        getAIQueryHistoryPublic: (_: any, { limit }: {
            limit?: number;
        }, context: GraphQLContext) => Promise<AIQueryResult[]>;
        getAIQueryPublic: (_: any, { id }: {
            id: string;
        }, context: GraphQLContext) => Promise<AIQueryResult | null>;
    };
    Mutation: {
        createDataConnection: (_: any, { input }: {
            input: DataConnectionInput;
        }, context: GraphQLContext) => Promise<DataConnection>;
        updateDataConnection: (_: any, { id, input }: {
            id: string;
            input: DataConnectionInput;
        }, context: GraphQLContext) => Promise<DataConnection>;
        deleteDataConnection: (_: any, { id }: {
            id: string;
        }, context: GraphQLContext) => Promise<boolean>;
        testConnection: (_: any, { input }: {
            input: DataConnectionInput;
        }, context: GraphQLContext) => Promise<ConnectionTestResult>;
        testConnectionPublic: (_: any, { input }: {
            input: ConnectionTestInput;
        }) => Promise<ConnectionTestResult>;
        createDataConnectionPublic: (_: any, { input }: {
            input: DataConnectionInput;
        }, context: GraphQLContext) => Promise<DataConnection>;
        deleteDataConnectionPublic: (_: any, { id }: {
            id: string;
        }, context: GraphQLContext) => Promise<boolean>;
        executeAIQuery: (_: any, { input }: {
            input: AIQueryInput;
        }, context: GraphQLContext) => Promise<AIQueryResult>;
        executeAIQueryPublic: (_: any, { input }: {
            input: AIQueryInput;
        }, context: GraphQLContext) => Promise<AIQueryResult>;
        deleteAIQueryPublic: (_: any, { id }: {
            id: string;
        }, context: GraphQLContext) => Promise<boolean>;
        deleteMultipleAIQueriesPublic: (_: any, { ids }: {
            ids: string[];
        }, context: GraphQLContext) => Promise<{
            deletedCount: number;
            errors: string[];
        }>;
        clearAIQueryHistoryPublic: (_: any, __: any, context: GraphQLContext) => Promise<{
            deletedCount: number;
            message: string;
        }>;
    };
    DataConnection: {
        config: (parent: DataConnection) => {
            hasPassword: boolean;
            hasApiKey: boolean;
            host?: string;
            port?: number;
            database?: string;
            username?: string;
            apiUrl?: string;
            headers?: import("../types/data-query").KeyValuePair[];
            timeout?: number;
        };
    };
    JSON: {
        serialize: (value: any) => any;
        parseValue: (value: any) => any;
        parseLiteral: (ast: any) => any;
    };
};
//# sourceMappingURL=data-query.resolvers.d.ts.map