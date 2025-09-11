-- ====================================
-- COPY THIS ENTIRE SCRIPT TO SUPABASE SQL EDITOR
-- ====================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create ENUM types
CREATE TYPE user_role AS ENUM (
    'SUPER_ADMIN',
    'COMPANY_ADMIN',
    'MANAGER',
    'ANALYST',
    'VIEWER'
);

CREATE TYPE subscription_tier AS ENUM (
    'FREE',
    'BASIC',
    'PROFESSIONAL',
    'ENTERPRISE'
);

-- Create Companies table
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    domain VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT true,
    subscription_tier subscription_tier NOT NULL DEFAULT 'FREE',
    max_users INTEGER NOT NULL DEFAULT 5,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role user_role NOT NULL DEFAULT 'VIEWER',
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    email_verified BOOLEAN NOT NULL DEFAULT false,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(email, company_id)
);

-- Create indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_company_id ON users(company_id);
CREATE INDEX idx_users_is_active ON users(is_active);
CREATE INDEX idx_companies_slug ON companies(slug);
CREATE INDEX idx_companies_is_active ON companies(is_active);

-- Create function for timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers
CREATE TRIGGER update_companies_updated_at 
    BEFORE UPDATE ON companies 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data
INSERT INTO companies (name, slug, subscription_tier, max_users) 
VALUES ('Demo Company', 'demo', 'BASIC', 10);

-- Insert demo user
DO $$
DECLARE
    demo_company_id UUID;
BEGIN
    SELECT id INTO demo_company_id FROM companies WHERE slug = 'demo';
    
    INSERT INTO users (
        email, 
        password_hash, 
        first_name, 
        last_name, 
        role, 
        company_id, 
        email_verified
    ) VALUES (
        'admin@demo.com',
        '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LpYMPJ0F8A0Z3mK6u',
        'Admin',
        'User',
        'COMPANY_ADMIN',
        demo_company_id,
        true
    );
END $$;
