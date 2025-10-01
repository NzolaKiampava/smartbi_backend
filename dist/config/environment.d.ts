export declare const config: {
    env: "development" | "production" | "test";
    port: number;
    isDevelopment: boolean;
    isProduction: boolean;
    supabase: {
        url: string;
        anonKey: string;
        serviceRoleKey: string;
    };
    ai: {
        geminiApiKey: string | undefined;
    };
    docai: {
        projectId: string | undefined;
        location: string | undefined;
        processorId: string | undefined;
        keyFile: string | undefined;
    };
    jwt: {
        secret: string;
        expiresIn: string;
        refreshExpiresIn: string;
    };
    security: {
        bcryptRounds: number;
        rateLimitWindowMs: number;
        rateLimitMaxRequests: number;
    };
    cors: {
        allowedOrigins: string[];
    };
};
//# sourceMappingURL=environment.d.ts.map