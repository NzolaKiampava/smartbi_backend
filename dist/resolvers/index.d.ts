export declare const resolvers: {
    Upload: import("graphql").GraphQLScalarType<any, any>;
    JSON: import("graphql").GraphQLScalarType<any, any>;
    DateTime: import("graphql").GraphQLScalarType<Date, Date>;
    DataConnection: {
        config: (parent: import("../types/data-query").DataConnection) => {
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
    Query: {
        getAnalysisReport: (_: any, { id }: {
            id: string;
        }) => Promise<import("../types/file-analysis").AnalysisReport | null>;
        getAnalysisReportByFileId: (_: any, { fileId }: {
            fileId: string;
        }) => Promise<import("../types/file-analysis").AnalysisReport | null>;
        getInsight: (_: any, { id }: {
            id: string;
        }) => Promise<import("../types/file-analysis").Insight | null>;
        getInsightsByReport: (_: any, { reportId }: {
            reportId: string;
        }) => Promise<import("../types/file-analysis").Insight[]>;
        getInsightsByType: (_: any, { type, limit }: {
            type: string;
            limit?: number;
        }) => Promise<any[]>;
        getFileUpload: (_: any, { id }: {
            id: string;
        }) => Promise<import("../types/file-analysis").FileUpload | null>;
        listFileUploads: (_: any, { limit, offset }: {
            limit?: number;
            offset?: number;
        }) => Promise<import("../types/file-analysis").FileUpload[]>;
        listAnalysisReports: (_: any, { limit, offset }: {
            limit?: number;
            offset?: number;
        }) => Promise<import("../types/file-analysis").AnalysisReport[]>;
        searchReports: (_: any, { query }: {
            query: string;
        }) => Promise<import("../types/file-analysis").AnalysisReport[]>;
        getReportsByDateRange: (_: any, { startDate, endDate }: {
            startDate: string;
            endDate: string;
        }) => Promise<import("../types/file-analysis").AnalysisReport[]>;
        getReportsByFileType: (_: any, { fileType }: {
            fileType: string;
        }) => Promise<import("../types/file-analysis").AnalysisReport[]>;
        getDataConnections: (_: any, __: any, context: import("../types/graphql").GraphQLContext) => Promise<import("../types/data-query").DataConnection[]>;
        getDataConnection: (_: any, { id }: {
            id: string;
        }, context: import("../types/graphql").GraphQLContext) => Promise<import("../types/data-query").DataConnection | null>;
        testDataConnection: (_: any, { id }: {
            id: string;
        }, context: import("../types/graphql").GraphQLContext) => Promise<import("../types/data-query").ConnectionTestResult>;
        getSchemaInfo: (_: any, { connectionId }: {
            connectionId: string;
        }, context: import("../types/graphql").GraphQLContext) => Promise<import("../types/data-query").SchemaInfo>;
        getAIQueryHistory: (_: any, { limit }: {
            limit?: number;
        }, context: import("../types/graphql").GraphQLContext) => Promise<import("../types/data-query").AIQueryResult[]>;
        getAIQuery: (_: any, { id }: {
            id: string;
        }, context: import("../types/graphql").GraphQLContext) => Promise<import("../types/data-query").AIQueryResult | null>;
        getDataConnectionsPublic: (_: any, __: any, context: import("../types/graphql").GraphQLContext) => Promise<import("../types/data-query").DataConnection[]>;
        getAIQueryHistoryPublic: (_: any, { limit }: {
            limit?: number;
        }, context: import("../types/graphql").GraphQLContext) => Promise<import("../types/data-query").AIQueryResult[]>;
        getAIQueryPublic: (_: any, { id }: {
            id: string;
        }, context: import("../types/graphql").GraphQLContext) => Promise<import("../types/data-query").AIQueryResult | null>;
        companies: (_: any, { pagination }: {
            pagination?: import("../services/management.service").PaginationInput;
        }, context: import("../types/graphql").GraphQLContext) => Promise<{
            success: boolean;
            data: {
                companies: import("../types/auth").Company[];
                total: number;
                hasMore: boolean;
            };
            message?: undefined;
            errors?: undefined;
        } | {
            success: boolean;
            message: string;
            errors: string[];
            data?: undefined;
        }>;
        company: (_: any, { id }: {
            id: string;
        }, context: import("../types/graphql").GraphQLContext) => Promise<{
            success: boolean;
            data: import("../types/auth").Company;
            message?: undefined;
            errors?: undefined;
        } | {
            success: boolean;
            message: string;
            errors: string[];
            data?: undefined;
        }>;
        companyBySlug: (_: any, { slug }: {
            slug: string;
        }, context: import("../types/graphql").GraphQLContext) => Promise<{
            success: boolean;
            data: import("../types/auth").Company;
            message?: undefined;
            errors?: undefined;
        } | {
            success: boolean;
            message: string;
            errors: string[];
            data?: undefined;
        }>;
        users: (_: any, { pagination }: {
            pagination?: import("../services/management.service").PaginationInput;
        }, context: import("../types/graphql").GraphQLContext) => Promise<{
            success: boolean;
            data: {
                users: import("../types/auth").User[];
                total: number;
                hasMore: boolean;
            };
            message?: undefined;
            errors?: undefined;
        } | {
            success: boolean;
            message: string;
            errors: string[];
            data?: undefined;
        }>;
        user: (_: any, { id }: {
            id: string;
        }, context: import("../types/graphql").GraphQLContext) => Promise<{
            success: boolean;
            data: import("../types/auth").User;
            message?: undefined;
            errors?: undefined;
        } | {
            success: boolean;
            message: string;
            errors: string[];
            data?: undefined;
        }>;
        usersByCompany: (_: any, { companyId, pagination }: {
            companyId: string;
            pagination?: import("../services/management.service").PaginationInput;
        }, context: import("../types/graphql").GraphQLContext) => Promise<{
            success: boolean;
            data: {
                users: import("../types/auth").User[];
                total: number;
                hasMore: boolean;
            };
            message?: undefined;
            errors?: undefined;
        } | {
            success: boolean;
            message: string;
            errors: string[];
            data?: undefined;
        }>;
        me: (_: any, __: any, context: import("../types/graphql").GraphQLContext) => Promise<{
            user: import("../types/auth").User | undefined;
            company: import("../types/auth").Company | undefined;
        }>;
    };
    Mutation: {
        uploadAndAnalyzeFile: (_: any, { input }: {
            input: import("../types/file-analysis").FileUploadInput;
        }) => Promise<import("../types/file-analysis").AnalysisReport>;
        reanalyzeFile: (_: any, { fileId, options }: {
            fileId: string;
            options?: import("../types/file-analysis").AnalysisOptionsInput;
        }) => Promise<import("../types/file-analysis").AnalysisReport>;
        generateCustomAnalysis: (_: any, { fileId, prompts }: {
            fileId: string;
            prompts: string[];
        }) => Promise<import("../types/file-analysis").AnalysisReport>;
        updateReportTitle: (_: any, { reportId, title }: {
            reportId: string;
            title: string;
        }) => Promise<{
            title: string;
            id: string;
            fileUploadId: string;
            fileUpload: import("../types/file-analysis").FileUpload;
            status: import("../types/file-analysis").AnalysisStatus;
            summary: string;
            executionTime?: number;
            insights: import("../types/file-analysis").Insight[];
            recommendations: string[];
            dataQuality?: import("../types/file-analysis").DataQuality;
            visualizations: import("../types/file-analysis").Visualization[];
            extractedText?: string;
            rawAnalysis?: Record<string, any>;
            createdAt: Date;
            updatedAt: Date;
            error?: string;
        }>;
        addCustomInsight: (_: any, { reportId, insight }: {
            reportId: string;
            insight: string;
        }) => Promise<import("../types/file-analysis").AnalysisReport | null>;
        deleteReport: (_: any, { reportId }: {
            reportId: string;
        }) => Promise<{
            success: boolean;
            message: string;
        }>;
        exportReport: (_: any, { input }: {
            input: import("../types/file-analysis").ReportExportInput;
        }) => Promise<import("../types/file-analysis").ReportExport>;
        deleteFileUpload: (_: any, { id }: {
            id: string;
        }) => Promise<{
            success: boolean;
            message: string;
        }>;
        updateFileMetadata: (_: any, { id, metadata }: {
            id: string;
            metadata: Record<string, any>;
        }) => Promise<{
            metadata: {
                [x: string]: any;
            };
            id: string;
            filename: string;
            originalName: string;
            mimetype: string;
            encoding: string;
            size: number;
            path: string;
            fileType: import("../types/file-analysis").FileType;
            uploadedAt: Date;
            analysisReport?: import("../types/file-analysis").AnalysisReport;
        }>;
        createDataConnection: (_: any, { input }: {
            input: import("../types/data-query").DataConnectionInput;
        }, context: import("../types/graphql").GraphQLContext) => Promise<import("../types/data-query").DataConnection>;
        updateDataConnection: (_: any, { id, input }: {
            id: string;
            input: import("../types/data-query").DataConnectionInput;
        }, context: import("../types/graphql").GraphQLContext) => Promise<import("../types/data-query").DataConnection>;
        deleteDataConnection: (_: any, { id }: {
            id: string;
        }, context: import("../types/graphql").GraphQLContext) => Promise<boolean>;
        testConnection: (_: any, { input }: {
            input: import("../types/data-query").DataConnectionInput;
        }, context: import("../types/graphql").GraphQLContext) => Promise<import("../types/data-query").ConnectionTestResult>;
        testConnectionPublic: (_: any, { input }: {
            input: import("../types/data-query").ConnectionTestInput;
        }) => Promise<import("../types/data-query").ConnectionTestResult>;
        createDataConnectionPublic: (_: any, { input }: {
            input: import("../types/data-query").DataConnectionInput;
        }, context: import("../types/graphql").GraphQLContext) => Promise<import("../types/data-query").DataConnection>;
        deleteDataConnectionPublic: (_: any, { id }: {
            id: string;
        }, context: import("../types/graphql").GraphQLContext) => Promise<boolean>;
        executeAIQuery: (_: any, { input }: {
            input: import("../types/data-query").AIQueryInput;
        }, context: import("../types/graphql").GraphQLContext) => Promise<import("../types/data-query").AIQueryResult>;
        executeAIQueryPublic: (_: any, { input }: {
            input: import("../types/data-query").AIQueryInput;
        }, context: import("../types/graphql").GraphQLContext) => Promise<import("../types/data-query").AIQueryResult>;
        deleteAIQueryPublic: (_: any, { id }: {
            id: string;
        }, context: import("../types/graphql").GraphQLContext) => Promise<boolean>;
        deleteMultipleAIQueriesPublic: (_: any, { ids }: {
            ids: string[];
        }, context: import("../types/graphql").GraphQLContext) => Promise<{
            deletedCount: number;
            errors: string[];
        }>;
        clearAIQueryHistoryPublic: (_: any, __: any, context: import("../types/graphql").GraphQLContext) => Promise<{
            deletedCount: number;
            message: string;
        }>;
        updateUser: (_: any, { id, input }: {
            id: string;
            input: import("../services/management.service").UpdateUserInput;
        }, context: import("../types/graphql").GraphQLContext) => Promise<{
            success: boolean;
            data: import("../types/auth").User;
            message: string;
            errors?: undefined;
        } | {
            success: boolean;
            message: string;
            errors: string[];
            data?: undefined;
        }>;
        updateUserSettings: (_: any, { input }: {
            input: import("../services/management.service").UpdateUserSettingsInput;
        }, context: import("../types/graphql").GraphQLContext) => Promise<{
            success: boolean;
            data: import("../types/auth").User;
            message: string;
            errors?: undefined;
        } | {
            success: boolean;
            message: string;
            errors: string[];
            data?: undefined;
        }>;
        deleteUser: (_: any, { id }: {
            id: string;
        }, context: import("../types/graphql").GraphQLContext) => Promise<{
            success: boolean;
            data: import("../types/auth").User;
            message: string;
            errors?: undefined;
        } | {
            success: boolean;
            message: string;
            errors: string[];
            data?: undefined;
        }>;
        updateCompany: (_: any, { id, input }: {
            id: string;
            input: import("../services/management.service").UpdateCompanyInput;
        }, context: import("../types/graphql").GraphQLContext) => Promise<{
            success: boolean;
            data: import("../types/auth").Company;
            message: string;
            errors?: undefined;
        } | {
            success: boolean;
            message: string;
            errors: string[];
            data?: undefined;
        }>;
        deleteCompany: (_: any, { id }: {
            id: string;
        }, context: import("../types/graphql").GraphQLContext) => Promise<{
            success: boolean;
            data: import("../types/auth").Company;
            message: string;
            errors?: undefined;
        } | {
            success: boolean;
            message: string;
            errors: string[];
            data?: undefined;
        }>;
        changeUserRole: (_: any, { userId, role }: {
            userId: string;
            role: import("../types/auth").UserRole;
        }, context: import("../types/graphql").GraphQLContext) => Promise<{
            success: boolean;
            data: import("../types/auth").User;
            message: string;
            errors?: undefined;
        } | {
            success: boolean;
            message: string;
            errors: string[];
            data?: undefined;
        }>;
        deactivateUser: (_: any, { userId }: {
            userId: string;
        }, context: import("../types/graphql").GraphQLContext) => Promise<{
            success: boolean;
            data: import("../types/auth").User;
            message: string;
            errors?: undefined;
        } | {
            success: boolean;
            message: string;
            errors: string[];
            data?: undefined;
        }>;
        activateUser: (_: any, { userId }: {
            userId: string;
        }, context: import("../types/graphql").GraphQLContext) => Promise<{
            success: boolean;
            data: import("../types/auth").User;
            message: string;
            errors?: undefined;
        } | {
            success: boolean;
            message: string;
            errors: string[];
            data?: undefined;
        }>;
        login: (_: any, { input }: {
            input: import("../types/auth").LoginInput;
        }) => Promise<{
            success: boolean;
            data: {
                user: import("../types/auth").User;
                company: import("../types/auth").Company;
                tokens: import("../types/auth").AuthTokens;
            };
            message: string;
            errors?: undefined;
        } | {
            success: boolean;
            message: string;
            errors: string[];
            data?: undefined;
        }>;
        register: (_: any, { input }: {
            input: import("../types/auth").RegisterInput;
        }) => Promise<{
            success: boolean;
            data: {
                user: import("../types/auth").User;
                company: import("../types/auth").Company;
                tokens: import("../types/auth").AuthTokens;
            };
            message: string;
            errors?: undefined;
        } | {
            success: boolean;
            message: string;
            errors: string[];
            data?: undefined;
        }>;
        refreshToken: (_: any, { input }: {
            input: {
                refreshToken: string;
            };
        }) => Promise<{
            success: boolean;
            data: {
                tokens: import("../types/auth").AuthTokens;
            };
            message: string;
            errors?: undefined;
        } | {
            success: boolean;
            message: string;
            errors: string[];
            data?: undefined;
        }>;
        logout: (_: any, __: any, context: import("../types/graphql").GraphQLContext) => Promise<{
            success: boolean;
            message: string;
        }>;
    };
};
//# sourceMappingURL=index.d.ts.map