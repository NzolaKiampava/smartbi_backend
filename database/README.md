# Database Setup Guide for SmartBI Backend

## Quick Setup Instructions

### Step 1: Access Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Sign in to your account
3. Select your project: `yazvflcxyqdughavhthm`

### Step 2: Run the Migration
1. In your Supabase dashboard, navigate to **SQL Editor**
2. Create a new query
3. Copy the entire content from `database/migration.sql` 
4. Paste it into the SQL editor
5. Click **Run** to execute the migration

### Step 3: Verify Setup
After running the migration, you should have these tables:
- `companies` - Multi-tenant company data
- `users` - User accounts and authentication
- `data_sources` - External data connections
- `dashboards` - Dashboard configurations
- `reports` - Report definitions

### Step 4: Test the Backend
1. Your backend server should now start successfully
2. Visit http://localhost:4000/graphql to access GraphQL Playground
3. Try the health check: http://localhost:4000/health

## Sample Data Created

The migration creates:
- **Demo Company**: slug = "demo"
- **Admin User**: email = "admin@demo.com", password = "password123"

⚠️ **Important**: Change the default password immediately after setup!

## What the Migration Does

1. **Creates ENUM types** for user roles and subscription tiers
2. **Creates core tables** with proper relationships and constraints
3. **Sets up indexes** for better query performance
4. **Enables Row Level Security (RLS)** for multi-tenant data isolation
5. **Creates sample data** for testing
6. **Sets up triggers** for automatic timestamp updates

## Tables Structure

### Companies Table
- Multi-tenant company management
- Subscription tiers and user limits
- Company slugs for URL routing

### Users Table
- Authentication and authorization
- Role-based access control
- Company association

### Business Intelligence Tables
- Data Sources: External data connections
- Dashboards: BI dashboard configurations  
- Reports: Individual report definitions

## Security Features
- Row Level Security (RLS) policies
- Multi-tenant data isolation
- Encrypted password storage
- JWT-based authentication
