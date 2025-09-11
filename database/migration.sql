-- SmartBI Backend Database Migration
-- This script creates all the necessary tables for the SmartBI application

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create ENUM types (only if they don't exist)
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM (
        'SUPER_ADMIN',
        'COMPANY_ADMIN',
        'MANAGER',
        'ANALYST',
        'VIEWER'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE subscription_tier AS ENUM (
        'FREE',
        'BASIC',
        'PROFESSIONAL',
        'ENTERPRISE'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create Companies table (only if it doesn't exist)
CREATE TABLE IF NOT EXISTS companies (
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

-- Create Users table (only if it doesn't exist)
CREATE TABLE IF NOT EXISTS users (
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
    
    -- Ensure unique email per company
    UNIQUE(email, company_id)
);

-- Create indexes for better performance (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_company_id ON users(company_id);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_companies_slug ON companies(slug);
CREATE INDEX IF NOT EXISTS idx_companies_is_active ON companies(is_active);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at (only if they don't exist)
DROP TRIGGER IF EXISTS update_companies_updated_at ON companies;
CREATE TRIGGER update_companies_updated_at 
    BEFORE UPDATE ON companies 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample companies for testing (only if they don't exist)
INSERT INTO companies (name, slug, subscription_tier, max_users) 
SELECT 'Demo Company', 'demo', 'BASIC', 10
WHERE NOT EXISTS (SELECT 1 FROM companies WHERE slug = 'demo');

-- Insert another company for testing multi-tenant features
INSERT INTO companies (name, slug, subscription_tier, max_users) 
SELECT 'TechCorp', 'techcorp', 'PROFESSIONAL', 50
WHERE NOT EXISTS (SELECT 1 FROM companies WHERE slug = 'techcorp');

-- Insert test users (only if they don't exist)
DO $$
DECLARE
    demo_company_id UUID;
    techcorp_company_id UUID;
BEGIN
    SELECT id INTO demo_company_id FROM companies WHERE slug = 'demo';
    SELECT id INTO techcorp_company_id FROM companies WHERE slug = 'techcorp';
    
    -- Insert SUPER_ADMIN user (only if it doesn't exist)
    INSERT INTO users (
        email, 
        password_hash, 
        first_name, 
        last_name, 
        role, 
        company_id, 
        email_verified
    ) 
    SELECT 
        'superadmin@smartbi.com',
        '$2b$12$9vP3ZGx0Kx8Vb2Cq1Yp0.ORzFMJy7Xx3Wz6Qq9Pp8Nn5Rr4Tt6Uu7V', -- 'superadmin123'
        'Super',
        'Admin',
        'SUPER_ADMIN',
        demo_company_id,
        true
    WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'superadmin@smartbi.com');
    
    -- Insert Demo Company admin user (only if it doesn't exist)
    INSERT INTO users (
        email, 
        password_hash, 
        first_name, 
        last_name, 
        role, 
        company_id, 
        email_verified
    ) 
    SELECT 
        'admin@demo.com',
        '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LpYMPJ0F8A0Z3mK6u', -- 'password123'
        'Admin',
        'User',
        'COMPANY_ADMIN',
        demo_company_id,
        true
    WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@demo.com');

    -- Insert additional test users for Demo Company (only if they don't exist)
    INSERT INTO users (email, password_hash, first_name, last_name, role, company_id, email_verified) 
    SELECT 'manager@demo.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LpYMPJ0F8A0Z3mK6u', 'Manager', 'User', 'MANAGER', demo_company_id, true
    WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'manager@demo.com');
    
    INSERT INTO users (email, password_hash, first_name, last_name, role, company_id, email_verified) 
    SELECT 'analyst@demo.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LpYMPJ0F8A0Z3mK6u', 'Analyst', 'User', 'ANALYST', demo_company_id, true
    WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'analyst@demo.com');
    
    INSERT INTO users (email, password_hash, first_name, last_name, role, company_id, email_verified) 
    SELECT 'viewer@demo.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LpYMPJ0F8A0Z3mK6u', 'Viewer', 'User', 'VIEWER', demo_company_id, true
    WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'viewer@demo.com');

    -- Insert test users for TechCorp Company (only if they don't exist)
    INSERT INTO users (email, password_hash, first_name, last_name, role, company_id, email_verified) 
    SELECT 'admin@techcorp.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LpYMPJ0F8A0Z3mK6u', 'Tech', 'Admin', 'COMPANY_ADMIN', techcorp_company_id, true
    WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@techcorp.com');
    
    INSERT INTO users (email, password_hash, first_name, last_name, role, company_id, email_verified) 
    SELECT 'manager@techcorp.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LpYMPJ0F8A0Z3mK6u', 'Tech', 'Manager', 'MANAGER', techcorp_company_id, true
    WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'manager@techcorp.com');
END $$;

-- Create additional tables for business intelligence features
-- You can expand these based on your specific BI requirements

-- Data Sources table (for connecting to external data)
CREATE TABLE IF NOT EXISTS data_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'database', 'api', 'file', etc.
    connection_config JSONB, -- Store connection details
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Dashboards table
CREATE TABLE IF NOT EXISTS dashboards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    config JSONB, -- Store dashboard layout and configuration
    is_public BOOLEAN NOT NULL DEFAULT false,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Reports table
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    dashboard_id UUID REFERENCES dashboards(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    query_config JSONB, -- Store SQL queries and parameters
    chart_config JSONB, -- Store chart type and styling
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add triggers for new tables (only if they don't exist)
DROP TRIGGER IF EXISTS update_data_sources_updated_at ON data_sources;
CREATE TRIGGER update_data_sources_updated_at 
    BEFORE UPDATE ON data_sources 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_dashboards_updated_at ON dashboards;
CREATE TRIGGER update_dashboards_updated_at 
    BEFORE UPDATE ON dashboards 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_reports_updated_at ON reports;
CREATE TRIGGER update_reports_updated_at 
    BEFORE UPDATE ON reports 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for BI tables (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_data_sources_company_id ON data_sources(company_id);
CREATE INDEX IF NOT EXISTS idx_dashboards_company_id ON dashboards(company_id);
CREATE INDEX IF NOT EXISTS idx_reports_company_id ON reports(company_id);
CREATE INDEX IF NOT EXISTS idx_reports_dashboard_id ON reports(dashboard_id);

-- Enable Row Level Security (RLS) for multi-tenant isolation
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (drop existing ones first to avoid conflicts)
DROP POLICY IF EXISTS users_company_isolation ON users;
DROP POLICY IF EXISTS companies_isolation ON companies;
DROP POLICY IF EXISTS data_sources_company_isolation ON data_sources;
DROP POLICY IF EXISTS dashboards_company_isolation ON dashboards;
DROP POLICY IF EXISTS reports_company_isolation ON reports;

-- Users can only see data from their own company
CREATE POLICY users_company_isolation ON users
    FOR ALL USING (company_id = current_setting('app.current_company_id')::UUID);

CREATE POLICY companies_isolation ON companies
    FOR ALL USING (id = current_setting('app.current_company_id')::UUID);

CREATE POLICY data_sources_company_isolation ON data_sources
    FOR ALL USING (company_id = current_setting('app.current_company_id')::UUID);

CREATE POLICY dashboards_company_isolation ON dashboards
    FOR ALL USING (company_id = current_setting('app.current_company_id')::UUID);

CREATE POLICY reports_company_isolation ON reports
    FOR ALL USING (company_id = current_setting('app.current_company_id')::UUID);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
