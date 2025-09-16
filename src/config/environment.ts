import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('4000'),
  
  // Supabase
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string(),
  SUPABASE_SERVICE_ROLE_KEY: z.string(),
  
  // JWT
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('7d'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),
  
  // Security
  BCRYPT_ROUNDS: z.string().transform(Number).default('12'),
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default('900000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default('100'),
  
  // CORS
  ALLOWED_ORIGINS: z.string().default('http://localhost:3000,http://localhost:5173,http://localhost:4000'),
});

const env = envSchema.safeParse(process.env);

if (!env.success) {
  console.error('❌ Invalid environment variables:');
  console.error(env.error.flatten().fieldErrors);
  process.exit(1);
}

export const config = {
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