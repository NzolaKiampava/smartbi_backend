# SmartBI Management API Testing Guide

## Overview
This guide provides comprehensive testing instructions for all SmartBI management APIs including company and user CRUD operations.

## Prerequisites

### 1. Database Setup
First, execute the migration script in your Supabase dashboard:
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `database/migration.sql`
4. Execute the script to create all tables and sample data

### 2. Server Running
Ensure your GraphQL server is running:
```bash
npm run dev
```
Server should be available at: `http://localhost:4000/graphql`

### 3. Import Postman Collections
Import both collection files:
- `testing/SmartBI-Management.postman_collection.json` (General management APIs)
- `testing/SmartBI-SuperAdmin.postman_collection.json` (SUPER_ADMIN specific tests)

## Available Test Accounts

After running the migration, you'll have these test accounts:

### SUPER_ADMIN Account
- **Email**: superadmin@smartbi.com
- **Password**: superadmin123
- **Role**: SUPER_ADMIN
- **Special Access**: Can manage all companies and users

### Demo Company (slug: demo)
- **Super Admin**: superadmin@smartbi.com / superadmin123 (can access any company)
- **Company Admin**: admin@demo.com / password123
- **Manager**: manager@demo.com / password123
- **Analyst**: analyst@demo.com / password123
- **Viewer**: viewer@demo.com / password123

### TechCorp Company (slug: techcorp)
- **Company Admin**: admin@techcorp.com / password123
- **Manager**: manager@techcorp.com / password123

**Security Note**: Change all default passwords immediately in production!

## Testing Workflow

### Step 1: Authentication
1. **SUPER_ADMIN Login**: Use `superadmin@smartbi.com` / `superadmin123`
   - Can login to any company (demo, techcorp)
   - Gets full access to all operations
   - Copy the `accessToken` for subsequent requests

2. **Regular User Login**: Use role-specific accounts
   - Company Admin: `admin@demo.com` / `password123`
   - Manager: `manager@demo.com` / `password123`
   - Set tokens in Postman variables or Authorization headers

### Step 2: SUPER_ADMIN Testing
Use the dedicated SUPER_ADMIN collection (`SmartBI-SuperAdmin.postman_collection.json`):

1. **Cross-Company Access**: Test login to different companies
2. **Global Company Management**: List and update all companies
3. **Global User Management**: Manage users across all companies
4. **Permission Validation**: Verify other roles cannot access SUPER_ADMIN operations

**See detailed guide**: `testing/SUPERADMIN_TESTING_GUIDE.md`

### Step 2: Company Management Testing

#### 2.1 List Companies (SUPER_ADMIN only)
```graphql
query GetCompanies($pagination: PaginationInput) {
  companies(pagination: $pagination) {
    success
    message
    data {
      companies {
        id
        name
        slug
        domain
        isActive
        subscriptionTier
        maxUsers
        createdAt
        updatedAt
      }
      total
      hasMore
    }
    errors
  }
}
```

**Variables:**
```json
{
  "pagination": {
    "limit": 10,
    "offset": 0,
    "search": ""
  }
}
```

#### 2.2 Get Specific Company
Test both by ID and by slug:
- Use "Get Company by ID" with a company ID from the list
- Use "Get Company by Slug" with slug "demo"

#### 2.3 Update Company (SUPER_ADMIN only)
```json
{
  "id": "company-uuid-here",
  "input": {
    "name": "Updated Company Name",
    "domain": "newdomain.com",
    "subscriptionTier": "PROFESSIONAL",
    "maxUsers": 25
  }
}
```

### Step 3: User Management Testing

#### 3.1 List All Users (SUPER_ADMIN only)
```graphql
query GetUsers($pagination: PaginationInput) {
  users(pagination: $pagination) {
    success
    message
    data {
      users {
        id
        email
        firstName
        lastName
        role
        companyId
        isActive
        emailVerified
        lastLoginAt
        createdAt
        updatedAt
      }
      total
      hasMore
    }
    errors
  }
}
```

#### 3.2 Get Specific User
Test with a user ID from the users list.

#### 3.3 Get Users by Company
Test with your company ID to see company-specific users.

#### 3.4 Update User (Admin operations)
```json
{
  "id": "user-uuid-here",
  "input": {
    "firstName": "Updated First Name",
    "lastName": "Updated Last Name",
    "role": "MANAGER",
    "isActive": true,
    "emailVerified": true
  }
}
```

#### 3.5 Update User Settings (Self-service)
```json
{
  "input": {
    "firstName": "New First Name",
    "lastName": "New Last Name",
    "email": "newemail@example.com",
    "currentPassword": "password123",
    "newPassword": "newpassword123"
  }
}
```

#### 3.6 Role Management
- **Change User Role**: Test changing roles between COMPANY_ADMIN, MANAGER, ANALYST, VIEWER
- **Deactivate User**: Set user as inactive
- **Activate User**: Reactivate a user

## Permission Testing Matrix

Test these scenarios to verify role-based access control:

### SUPER_ADMIN Can:
✅ List all companies  
✅ Get any company details  
✅ Update any company  
✅ List all users across companies  
✅ Get any user details  
✅ Update any user  
✅ Change user roles  
✅ Activate/deactivate users  

### COMPANY_ADMIN Can:
❌ List all companies (only their own)  
✅ Get their company details  
✅ Update their company  
✅ List users in their company  
✅ Get user details in their company  
✅ Update users in their company  
✅ Change roles (except SUPER_ADMIN)  
✅ Activate/deactivate users in their company  

### MANAGER Can:
❌ Company management operations  
✅ List users in their company  
✅ Get user details in their company  
✅ Update basic user info (limited)  
❌ Change user roles  
❌ Activate/deactivate users  

### ANALYST/VIEWER Can:
❌ Most management operations  
✅ Update their own settings only  
✅ View their own profile  

## Expected Response Format

All responses follow this structure:
```json
{
  "data": {
    "operationName": {
      "success": true,
      "message": "Operation completed successfully",
      "data": {
        // Actual data here
      },
      "errors": null
    }
  }
}
```

## Error Testing

Test these error scenarios:

### Authentication Errors
1. **Missing Token**: Remove Authorization header
   - Expected: "Authentication token required"

2. **Invalid Token**: Use malformed token
   - Expected: "Invalid token format"

3. **Expired Token**: Use expired token
   - Expected: "Token has expired"

### Permission Errors
1. **Insufficient Permissions**: Try admin operations with lower role
   - Expected: "Insufficient permissions"

2. **Cross-Company Access**: Try accessing other company's data
   - Expected: "Access denied to this resource"

### Validation Errors
1. **Invalid Email Format**: Use malformed email
   - Expected: "Invalid email format"

2. **Weak Password**: Use password less than 8 characters
   - Expected: "Password must be at least 8 characters"

3. **Invalid UUID**: Use malformed ID
   - Expected: "Invalid ID format"

### Business Logic Errors
1. **Duplicate Email**: Try updating to existing email
   - Expected: "Email already exists"

2. **Invalid Role Transition**: Try invalid role changes
   - Expected: "Invalid role assignment"

3. **Deactivate Last Admin**: Try deactivating the only admin
   - Expected: "Cannot deactivate the last admin"

## Testing Collections

### Primary Collections:
1. **SmartBI-Management.postman_collection.json**: General CRUD operations
2. **SmartBI-SuperAdmin.postman_collection.json**: SUPER_ADMIN specific tests

### Quick Test Sequence:
1. Run SUPER_ADMIN collection first to test system-wide operations
2. Run regular management collection with different role tokens
3. Compare results to verify permission boundaries

For detailed SUPER_ADMIN testing, see: `testing/SUPERADMIN_TESTING_GUIDE.md`

## Troubleshooting

### Common Issues

1. **"Table doesn't exist" errors**
   - Solution: Run the migration script in Supabase

2. **"Authentication token required"**
   - Solution: Ensure Authorization header is set with Bearer token

3. **"Insufficient permissions"**
   - Solution: Check user role and operation requirements

4. **"Access denied to this resource"**
   - Solution: Verify you're accessing resources within your company

### GraphQL Playground
You can also test using GraphQL Playground at `http://localhost:4000/graphql`
- Set Authorization header: `Bearer your-token-here`
- Use the provided queries with appropriate variables

## Performance Testing

For load testing:
1. Create multiple users using the registration API
2. Test pagination with large datasets
3. Measure response times for complex queries
4. Test concurrent operations

## Security Testing

1. **SQL Injection**: Try malicious input in search fields
2. **XSS Protection**: Test script injection in text fields
3. **Rate Limiting**: Make rapid consecutive requests
4. **Token Security**: Test with manipulated tokens

## Next Steps

After successful testing:
1. Replace the temporary JWT implementation with a proper one
2. Implement proper logging for all operations
3. Add monitoring and alerting
4. Set up automated testing pipeline
5. Configure production environment variables
