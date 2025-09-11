# Company Registration Test - Copy this into Postman

## Request Details:
- **Method**: POST
- **URL**: http://localhost:4000/graphql
- **Headers**: Content-Type: application/json

## Request Body (copy this exactly):

```json
{
  "query": "mutation RegisterUser($input: RegisterInput!) { register(input: $input) { success message data { user { id email firstName lastName role } company { id name slug } tokens { accessToken refreshToken expiresIn } } errors } }",
  "variables": {
    "input": {
      "email": "john@mycompany.com",
      "password": "password123",
      "firstName": "John",
      "lastName": "Doe",
      "companyName": "My Test Company",
      "companySlug": "my-test-company"
    }
  }
}
```

## What This Will Do:
1. Create a new company called "My Test Company" with slug "my-test-company"
2. Create a new user "John Doe" as the company admin
3. Return authentication tokens
4. Insert data into the companies table you're looking at

## Expected Success Response:
```json
{
  "data": {
    "register": {
      "success": true,
      "message": "Registration successful",
      "data": {
        "user": {
          "id": "uuid-here",
          "email": "john@mycompany.com",
          "firstName": "John",
          "lastName": "Doe",
          "role": "COMPANY_ADMIN"
        },
        "company": {
          "id": "uuid-here",
          "name": "My Test Company",
          "slug": "my-test-company"
        },
        "tokens": {
          "accessToken": "jwt-token-here",
          "refreshToken": "refresh-token-here",
          "expiresIn": 3600
        }
      },
      "errors": null
    }
  }
}
```

## Test Different Companies:
Try these variations to create multiple companies:

### Test Company 2:
```json
{
  "query": "mutation RegisterUser($input: RegisterInput!) { register(input: $input) { success message data { user { id email firstName lastName role } company { id name slug } tokens { accessToken refreshToken expiresIn } } errors } }",
  "variables": {
    "input": {
      "email": "admin@acmetech.com",
      "password": "password123",
      "firstName": "Jane",
      "lastName": "Smith",
      "companyName": "ACME Technologies",
      "companySlug": "acme-tech"
    }
  }
}
```

### Test Company 3:
```json
{
  "query": "mutation RegisterUser($input: RegisterInput!) { register(input: $input) { success message data { user { id email firstName lastName role } company { id name slug } tokens { accessToken refreshToken expiresIn } } errors } }",
  "variables": {
    "input": {
      "email": "ceo@startupco.com",
      "password": "password123",
      "firstName": "Alex",
      "lastName": "Johnson",
      "companyName": "Startup Co",
      "companySlug": "startup-co"
    }
  }
}
```
