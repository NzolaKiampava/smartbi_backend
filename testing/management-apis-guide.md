# Management APIs - Postman Test Guide

## Authentication Required
For all management APIs, you need to include the Authorization header:
```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

Get the token from login/register response and use it in subsequent requests.

## Company Management APIs

### 1. List All Companies (Super Admin Only)
**POST** `http://localhost:4000/graphql`
```json
{
  "query": "query GetCompanies($pagination: PaginationInput) { companies(pagination: $pagination) { success message data { companies { id name slug domain isActive subscriptionTier maxUsers createdAt updatedAt } total hasMore } errors } }",
  "variables": {
    "pagination": {
      "limit": 10,
      "offset": 0,
      "search": ""
    }
  }
}
```

### 2. Get Specific Company by ID
**POST** `http://localhost:4000/graphql`
```json
{
  "query": "query GetCompany($id: ID!) { company(id: $id) { success message data { id name slug domain isActive subscriptionTier maxUsers createdAt updatedAt } errors } }",
  "variables": {
    "id": "COMPANY_ID_HERE"
  }
}
```

### 3. Get Company by Slug
**POST** `http://localhost:4000/graphql`
```json
{
  "query": "query GetCompanyBySlug($slug: String!) { companyBySlug(slug: $slug) { success message data { id name slug domain isActive subscriptionTier maxUsers createdAt updatedAt } errors } }",
  "variables": {
    "slug": "demo"
  }
}
```

### 4. Update Company Settings
**POST** `http://localhost:4000/graphql`
```json
{
  "query": "mutation UpdateCompany($id: ID!, $input: UpdateCompanyInput!) { updateCompany(id: $id, input: $input) { success message data { id name slug domain isActive subscriptionTier maxUsers updatedAt } errors } }",
  "variables": {
    "id": "COMPANY_ID_HERE",
    "input": {
      "name": "Updated Company Name",
      "domain": "newdomain.com",
      "subscriptionTier": "PROFESSIONAL",
      "maxUsers": 25
    }
  }
}
```

### 5. Delete Company (Super Admin Only)
**POST** `http://localhost:4000/graphql`
```json
{
  "query": "mutation DeleteCompany($id: ID!) { deleteCompany(id: $id) { success message data { id name slug } errors } }",
  "variables": {
    "id": "COMPANY_ID_HERE"
  }
}
```

## User Management APIs

### 6. List All Users (Super Admin Only)
**POST** `http://localhost:4000/graphql`
```json
{
  "query": "query GetUsers($pagination: PaginationInput) { users(pagination: $pagination) { success message data { users { id email firstName lastName role companyId isActive emailVerified lastLoginAt createdAt updatedAt } total hasMore } errors } }",
  "variables": {
    "pagination": {
      "limit": 10,
      "offset": 0,
      "search": ""
    }
  }
}
```

### 7. Get Specific User by ID
**POST** `http://localhost:4000/graphql`
```json
{
  "query": "query GetUser($id: ID!) { user(id: $id) { success message data { id email firstName lastName role companyId isActive emailVerified lastLoginAt createdAt updatedAt } errors } }",
  "variables": {
    "id": "USER_ID_HERE"
  }
}
```

### 8. Get Users by Company
**POST** `http://localhost:4000/graphql`
```json
{
  "query": "query GetUsersByCompany($companyId: ID!, $pagination: PaginationInput) { usersByCompany(companyId: $companyId, pagination: $pagination) { success message data { users { id email firstName lastName role isActive emailVerified createdAt } total hasMore } errors } }",
  "variables": {
    "companyId": "COMPANY_ID_HERE",
    "pagination": {
      "limit": 10,
      "offset": 0,
      "search": ""
    }
  }
}
```

### 9. Update User (Admin)
**POST** `http://localhost:4000/graphql`
```json
{
  "query": "mutation UpdateUser($id: ID!, $input: UpdateUserInput!) { updateUser(id: $id, input: $input) { success message data { id email firstName lastName role isActive emailVerified updatedAt } errors } }",
  "variables": {
    "id": "USER_ID_HERE",
    "input": {
      "firstName": "Updated First Name",
      "lastName": "Updated Last Name",
      "role": "MANAGER",
      "isActive": true,
      "emailVerified": true
    }
  }
}
```

### 10. Update Own User Settings
**POST** `http://localhost:4000/graphql`
```json
{
  "query": "mutation UpdateUserSettings($input: UpdateUserSettingsInput!) { updateUserSettings(input: $input) { success message data { id email firstName lastName updatedAt } errors } }",
  "variables": {
    "input": {
      "firstName": "New First Name",
      "lastName": "New Last Name",
      "email": "newemail@example.com",
      "currentPassword": "currentpassword123",
      "newPassword": "newpassword123"
    }
  }
}
```

### 11. Change User Role
**POST** `http://localhost:4000/graphql`
```json
{
  "query": "mutation ChangeUserRole($userId: ID!, $role: UserRole!) { changeUserRole(userId: $userId, role: $role) { success message data { id email firstName lastName role updatedAt } errors } }",
  "variables": {
    "userId": "USER_ID_HERE",
    "role": "ANALYST"
  }
}
```

### 12. Deactivate User
**POST** `http://localhost:4000/graphql`
```json
{
  "query": "mutation DeactivateUser($userId: ID!) { deactivateUser(userId: $userId) { success message data { id email firstName lastName isActive updatedAt } errors } }",
  "variables": {
    "userId": "USER_ID_HERE"
  }
}
```

### 13. Activate User
**POST** `http://localhost:4000/graphql`
```json
{
  "query": "mutation ActivateUser($userId: ID!) { activateUser(userId: $userId) { success message data { id email firstName lastName isActive updatedAt } errors } }",
  "variables": {
    "userId": "USER_ID_HERE"
  }
}
```

### 14. Delete User
**POST** `http://localhost:4000/graphql`
```json
{
  "query": "mutation DeleteUser($id: ID!) { deleteUser(id: $id) { success message data { id email firstName lastName } errors } }",
  "variables": {
    "id": "USER_ID_HERE"
  }
}
```

## Testing Workflow

### Step 1: Authenticate
1. Register or login to get access token
2. Save the token for subsequent requests

### Step 2: Test Company Operations
1. List companies (if super admin)
2. Get your company details
3. Update company settings
4. Search companies

### Step 3: Test User Operations
1. List users in your company
2. Get specific user details
3. Update user information
4. Change user roles
5. Activate/deactivate users

### Step 4: Test Permissions
1. Try operations as different user roles
2. Verify permission restrictions work
3. Test cross-company access restrictions

## Permission Matrix

| Operation | Super Admin | Company Admin | Manager | Analyst | Viewer |
|-----------|------------|---------------|---------|---------|--------|
| List all companies | ✅ | ❌ | ❌ | ❌ | ❌ |
| View own company | ✅ | ✅ | ✅ | ✅ | ✅ |
| Update company | ✅ | ✅ | ❌ | ❌ | ❌ |
| Delete company | ✅ | ❌ | ❌ | ❌ | ❌ |
| List all users | ✅ | ❌ | ❌ | ❌ | ❌ |
| List company users | ✅ | ✅ | ✅ | ❌ | ❌ |
| View user details | ✅ | ✅ (same company) | ❌ | ❌ | ❌ |
| Update user | ✅ | ✅ (same company) | ❌ | ❌ | ❌ |
| Update own settings | ✅ | ✅ | ✅ | ✅ | ✅ |
| Change user role | ✅ | ✅ (same company) | ❌ | ❌ | ❌ |
| Delete user | ✅ | ✅ (same company) | ❌ | ❌ | ❌ |

## Expected Responses

### Success Response
```json
{
  "data": {
    "companies": {
      "success": true,
      "message": null,
      "data": {
        "companies": [...],
        "total": 5,
        "hasMore": false
      },
      "errors": null
    }
  }
}
```

### Error Response
```json
{
  "data": {
    "updateUser": {
      "success": false,
      "message": "Insufficient permissions",
      "data": null,
      "errors": ["Insufficient permissions"]
    }
  }
}
```
