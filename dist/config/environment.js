"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const zod_1 = require("zod");
dotenv_1.default.config();
const envSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    PORT: zod_1.z.string().transform(Number).default('4000'),
    SUPABASE_URL: zod_1.z.string().url(),
    SUPABASE_ANON_KEY: zod_1.z.string(),
    SUPABASE_SERVICE_ROLE_KEY: zod_1.z.string(),
    JWT_SECRET: zod_1.z.string().min(32),
    JWT_EXPIRES_IN: zod_1.z.string().default('7d'),
    JWT_REFRESH_EXPIRES_IN: zod_1.z.string().default('30d'),
    BCRYPT_ROUNDS: zod_1.z.string().transform(Number).default('12'),
    RATE_LIMIT_WINDOW_MS: zod_1.z.string().transform(Number).default('900000'),
    RATE_LIMIT_MAX_REQUESTS: zod_1.z.string().transform(Number).default('100'),
    ALLOWED_ORIGINS: zod_1.z.string().default('http://localhost:3000,http://localhost:5173'),
});
const env = envSchema.safeParse(process.env);
if (!env.success) {
    console.error('❌ Invalid environment variables:');
    console.error(env.error.flatten().fieldErrors);
    process.exit(1);
}
exports.config = {
    env: env.data.NODE_ENV,
    port: env.data.PORT,
    isDevelopment: env.data.NODE_ENV === 'development',
    isProduction: env.data.NODE_ENV === 'production',
    supabase: {
        url: env.data.SUPABASE_URL,
        anonKey: env.data.SUPABASE_ANON_KEY,
        serviceRoleKey: env.data.SUPABASE_SERVICE_ROLE_KEY,
    },
    jwt: {
        secret: env.data.JWT_SECRET,
        expiresIn: env.data.JWT_EXPIRES_IN,
        refreshExpiresIn: env.data.JWT_REFRESH_EXPIRES_IN,
    },
    security: {
        bcryptRounds: env.data.BCRYPT_ROUNDS,
        rateLimitWindowMs: env.data.RATE_LIMIT_WINDOW_MS,
        rateLimitMaxRequests: env.data.RATE_LIMIT_MAX_REQUESTS,
    },
    cors: {
        allowedOrigins: env.data.ALLOWED_ORIGINS.split(','),
    },
};
//# sourceMappingURL=environment.js.map