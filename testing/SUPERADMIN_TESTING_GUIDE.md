# SUPER_ADMIN Testing Guide

## Overview
This guide provides comprehensive testing instructions specifically for SUPER_ADMIN functionality in the SmartBI backend.

## SUPER_ADMIN Account Details

After running the migration, you'll have this SUPER_ADMIN account:

```
Email: superadmin@smartbi.com
Password: superadmin123
Role: SUPER_ADMIN
```

**Security Note**: Change this password immediately after setup in production!

## Authentication Testing

### 1. SUPER_ADMIN Login Test

**GraphQL Mutation:**
```graphql
mutation LoginSuperAdmin {
  login(input: {
    email: "superadmin@smartbi.com"
    password: "superadmin123"
    companySlug: "demo"
  }) {
    success
    message
    data {
      user {
        id
        email
        firstName
        lastName
        role
      }
      company {
        id
        name
        slug
      }
      tokens {
        accessToken
        refreshToken
        expiresIn
      }
    }
    errors
  }
}
```

**Expected Result:**
- `success: true`
- `user.role: "SUPER_ADMIN"`
- Valid `accessToken` returned
- Can login to any company (demo, techcorp, etc.)

**Postman Test:**
```json
{
  "query": "mutation LoginSuperAdmin { login(input: { email: \"superadmin@smartbi.com\", password: \"superadmin123\", companySlug: \"demo\" }) { success message data { user { id email firstName lastName role } company { id name slug } tokens { accessToken refreshToken expiresIn } } errors } }"
}
```

### 2. Cross-Company Login Test

Test that SUPER_ADMIN can login to different companies:

**Demo Company Login:**
```json
{
  "input": {
    "email": "superadmin@smartbi.com",
    "password": "superadmin123",
    "companySlug": "demo"
  }
}
```

**TechCorp Company Login:**
```json
{
  "input": {
    "email": "superadmin@smartbi.com",
    "password": "superadmin123",
    "companySlug": "techcorp"
  }
}
```

Both should succeed and return the same user but different company contexts.

## SUPER_ADMIN Permissions Testing

### 3. List All Companies (SUPER_ADMIN Only)

**GraphQL Query:**
```graphql
query GetAllCompanies {
  companies(pagination: { limit: 10, offset: 0 }) {
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

**Authorization Header:**
```
Authorization: Bearer <superadmin-access-token>
```

**Expected Result:**
- Should return ALL companies (Demo Company, TechCorp, etc.)
- Other roles should get "Insufficient permissions" error

### 4. List All Users Across Companies

**GraphQL Query:**
```graphql
query GetAllUsers {
  users(pagination: { limit: 20, offset: 0 }) {
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
        createdAt
      }
      total
      hasMore
    }
    errors
  }
}
```

**Expected Result:**
- Should return users from ALL companies
- Should see users from both demo.com and techcorp.com domains

### 5. Update Any Company

**GraphQL Mutation:**
```graphql
mutation UpdateAnyCompany($id: ID!, $input: UpdateCompanyInput!) {
  updateCompany(id: $id, input: $input) {
    success
    message
    data {
      id
      name
      subscriptionTier
      maxUsers
      updatedAt
    }
    errors
  }
}
```

**Variables:**
```json
{
  "id": "demo-company-uuid-here",
  "input": {
    "subscriptionTier": "ENTERPRISE",
    "maxUsers": 100
  }
}
```

**Expected Result:**
- SUPER_ADMIN can update any company's settings
- Company admins can only update their own company

### 6. Update Any User

**GraphQL Mutation:**
```graphql
mutation UpdateAnyUser($id: ID!, $input: UpdateUserInput!) {
  updateUser(id: $id, input: $input) {
    success
    message
    data {
      id
      email
      role
      isActive
      updatedAt
    }
    errors
  }
}
```

**Variables:**
```json
{
  "id": "any-user-uuid-here",
  "input": {
    "role": "COMPANY_ADMIN",
    "isActive": true
  }
}
```

**Expected Result:**
- SUPER_ADMIN can update any user in any company
- Can promote users to any role including COMPANY_ADMIN

### 7. Change User Roles (Including SUPER_ADMIN)

**GraphQL Mutation:**
```graphql
mutation ChangeAnyUserRole($userId: ID!, $role: UserRole!) {
  changeUserRole(userId: $userId, role: $role) {
    success
    message
    data {
      id
      email
      role
      updatedAt
    }
    errors
  }
}
```

**Test Cases:**
1. Promote regular user to COMPANY_ADMIN
2. Demote COMPANY_ADMIN to MANAGER
3. Create another SUPER_ADMIN (only SUPER_ADMIN can do this)

### 8. Cross-Company User Management

Test managing users from different companies:

**Get TechCorp Users:**
```graphql
query GetTechCorpUsers($companyId: ID!) {
  usersByCompany(companyId: $companyId, pagination: { limit: 10 }) {
    success
    data {
      users {
        id
        email
        role
        companyId
      }
    }
  }
}
```

Then update a TechCorp user while logged in as SUPER_ADMIN.

## Permission Comparison Tests

### 9. Test Against Other Roles

Run the same queries with different user roles to verify SUPER_ADMIN exclusivity:

**COMPANY_ADMIN Token Test:**
```bash
# Login as admin@demo.com (COMPANY_ADMIN)
# Try to list all companies -> Should fail
# Try to update TechCorp company -> Should fail
# Try to manage TechCorp users -> Should fail
```

**MANAGER Token Test:**
```bash
# Login as manager@demo.com (MANAGER)
# Try to list companies -> Should fail
# Try to update any company -> Should fail
# Try to change user roles -> Should fail
```

## Error Testing

### 10. Invalid Super Admin Operations

**Test Invalid Company Update:**
```json
{
  "id": "invalid-uuid",
  "input": { "name": "Updated Name" }
}
```
Expected: "Company not found" error

**Test Invalid User Update:**
```json
{
  "id": "invalid-uuid",
  "input": { "role": "MANAGER" }
}
```
Expected: "User not found" error

### 11. Business Logic Validation

**Test Deactivating Last Super Admin:**
- Should prevent deactivating if it's the only SUPER_ADMIN
- Should prevent role change if it's the only SUPER_ADMIN

## Complete Test Sequence

### Step-by-Step Testing Workflow:

1. **Setup:**
   - Run database migration
   - Start server (`npm run dev`)
   - Import Postman collection

2. **Authentication:**
   - Test SUPER_ADMIN login to demo company
   - Test SUPER_ADMIN login to techcorp company
   - Verify tokens work correctly

3. **Company Management:**
   - List all companies
   - Get specific company details
   - Update company settings
   - Verify cross-company access

4. **User Management:**
   - List all users across companies
   - Get specific user details
   - Update users from different companies
   - Change user roles
   - Activate/deactivate users

5. **Permission Verification:**
   - Login as COMPANY_ADMIN and verify limited access
   - Login as MANAGER and verify restricted permissions
   - Compare results with SUPER_ADMIN access

6. **Error Handling:**
   - Test invalid operations
   - Test business logic constraints
   - Verify proper error messages

## Expected Outcomes

✅ **SUPER_ADMIN Should Be Able To:**
- Login to any company
- View all companies and their details
- Update any company's settings
- View all users across all companies
- Update any user's information
- Change any user's role (including promoting to SUPER_ADMIN)
- Activate/deactivate any user
- Access cross-company resources

❌ **Other Roles Should NOT Be Able To:**
- View companies other than their own
- Access users from other companies
- Update cross-company resources
- Promote users to SUPER_ADMIN
- Access SUPER_ADMIN exclusive operations

## Postman Collection Variables

Set these variables in Postman for easy testing:

```json
{
  "superAdminToken": "bearer-token-from-super-admin-login",
  "companyAdminToken": "bearer-token-from-company-admin-login",
  "managerToken": "bearer-token-from-manager-login",
  "demoCompanyId": "uuid-of-demo-company",
  "techCorpCompanyId": "uuid-of-techcorp-company",
  "testUserId": "uuid-of-test-user"
}
```

## Security Notes

1. **Production Security:**
   - Change default SUPER_ADMIN password immediately
   - Use strong, unique passwords
   - Enable 2FA for SUPER_ADMIN accounts

2. **Token Security:**
   - SUPER_ADMIN tokens should have shorter expiration
   - Monitor SUPER_ADMIN login activities
   - Implement session logging

3. **Audit Trail:**
   - Log all SUPER_ADMIN operations
   - Monitor cross-company access
   - Track role changes and user modifications

This comprehensive testing ensures that SUPER_ADMIN functionality works correctly while maintaining proper security boundaries for other user roles.
