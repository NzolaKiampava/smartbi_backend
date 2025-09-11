# Postman Testing Guide for SmartBI GraphQL API

## Server Information
- **GraphQL Endpoint**: `http://localhost:4000/graphql`
- **Health Check**: `http://localhost:4000/health`
- **Method**: POST (for GraphQL)
- **Content-Type**: `application/json`

## Postman Setup

### 1. Basic Request Configuration
- **Method**: POST
- **URL**: `http://localhost:4000/graphql`
- **Headers**:
  ```
  Content-Type: application/json
  ```

### 2. GraphQL Request Structure
GraphQL requests have this structure:
```json
{
  "query": "your GraphQL query here",
  "variables": {
    "variable1": "value1"
  }
}
```

## Test Cases

### 1. Health Check (GET Request)
**Method**: GET  
**URL**: `http://localhost:4000/health`  
**Expected Response**:
```json
{
  "status": "healthy",
  "timestamp": "2025-09-11T...",
  "environment": "development"
}
```

### 2. User Registration (POST)
**Method**: POST  
**URL**: `http://localhost:4000/graphql`  
**Body** (raw JSON):
```json
{
  "query": "mutation RegisterUser($input: RegisterInput!) { register(input: $input) { success message data { user { id email firstName lastName role } company { id name slug } tokens { accessToken refreshToken expiresIn } } errors } }",
  "variables": {
    "input": {
      "email": "test@example.com",
      "password": "password123",
      "firstName": "John",
      "lastName": "Doe",
      "companyName": "Test Company",
      "companySlug": "test-company"
    }
  }
}
```

### 3. User Login (POST)
**Method**: POST  
**URL**: `http://localhost:4000/graphql`  
**Body** (raw JSON):
```json
{
  "query": "mutation LoginUser($input: LoginInput!) { login(input: $input) { success message data { user { id email firstName lastName role } company { id name slug } tokens { accessToken refreshToken expiresIn } } errors } }",
  "variables": {
    "input": {
      "email": "admin@demo.com",
      "password": "password123",
      "companySlug": "demo"
    }
  }
}
```

### 4. Get Current User (Authenticated Request)
**Method**: POST  
**URL**: `http://localhost:4000/graphql`  
**Headers**:
```
Content-Type: application/json
Authorization: Bearer YOUR_ACCESS_TOKEN_HERE
```
**Body** (raw JSON):
```json
{
  "query": "query GetMe { me { user { id email firstName lastName role } company { id name slug } } }"
}
```

### 5. Refresh Token (POST)
**Method**: POST  
**URL**: `http://localhost:4000/graphql`  
**Body** (raw JSON):
```json
{
  "query": "mutation RefreshToken($input: RefreshTokenInput!) { refreshToken(input: $input) { success message data { tokens { accessToken refreshToken expiresIn } } errors } }",
  "variables": {
    "input": {
      "refreshToken": "YOUR_REFRESH_TOKEN_HERE"
    }
  }
}
```

### 6. Logout (POST)
**Method**: POST  
**URL**: `http://localhost:4000/graphql`  
**Headers**:
```
Content-Type: application/json
Authorization: Bearer YOUR_ACCESS_TOKEN_HERE
```
**Body** (raw JSON):
```json
{
  "query": "mutation Logout { logout { success message } }"
}
```

## Sample Test Flow

### Step 1: Test Health Check
1. Create a GET request to `http://localhost:4000/health`
2. Should return 200 status with health information

### Step 2: Register a New User
1. Use the registration mutation above
2. Should return success with user data and tokens
3. Save the `accessToken` and `refreshToken` for next tests

### Step 3: Login with Demo User
1. Use the login mutation with demo credentials
2. Should return success with user data and tokens

### Step 4: Test Authenticated Request
1. Use the `me` query with Authorization header
2. Should return current user information

### Step 5: Test Token Refresh
1. Use the refresh token mutation
2. Should return new tokens

## Error Testing

### Test Invalid Login
```json
{
  "query": "mutation LoginUser($input: LoginInput!) { login(input: $input) { success message errors } }",
  "variables": {
    "input": {
      "email": "wrong@example.com",
      "password": "wrongpassword"
    }
  }
}
```

### Test Unauthorized Access
Try the `me` query without Authorization header - should return an error.

## Expected Response Formats

### Success Response
```json
{
  "data": {
    "login": {
      "success": true,
      "message": "Login successful",
      "data": {
        "user": { /* user object */ },
        "company": { /* company object */ },
        "tokens": { /* tokens object */ }
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
    "login": {
      "success": false,
      "message": "Login failed",
      "data": null,
      "errors": ["Invalid credentials"]
    }
  }
}
```

## Notes
1. Replace `YOUR_ACCESS_TOKEN_HERE` with actual token from login response
2. Replace `YOUR_REFRESH_TOKEN_HERE` with actual refresh token
3. Make sure your server is running on `http://localhost:4000`
4. Ensure database tables are created (run the migration first)
5. GraphQL introspection is available at the same endpoint for exploring schema
