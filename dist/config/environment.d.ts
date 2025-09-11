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