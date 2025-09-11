export const managementTypeDefs = `#graphql
  # User Management Types
  type UserList {
    users: [User!]!
    total: Int!
    hasMore: Boolean!
  }

  type CompanyList {
    companies: [Company!]!
    total: Int!
    hasMore: Boolean!
  }

  # Input Types for Updates
  input UpdateUserInput {
    firstName: String
    lastName: String
    role: UserRole
    isActive: Boolean
    emailVerified: Boolean
  }

  input UpdateCompanyInput {
    name: String
    domain: String
    subscriptionTier: SubscriptionTier
    maxUsers: Int
    isActive: Boolean
  }

  input UpdateUserSettingsInput {
    firstName: String
    lastName: String
    email: String
    currentPassword: String
    newPassword: String
  }

  # Pagination Input
  input PaginationInput {
    limit: Int = 10
    offset: Int = 0
    search: String
  }

  # Response Types
  type UserResponse {
    success: Boolean!
    data: User
    message: String
    errors: [String!]
  }

  type CompanyResponse {
    success: Boolean!
    data: Company
    message: String
    errors: [String!]
  }

  type UserListResponse {
    success: Boolean!
    data: UserList
    message: String
    errors: [String!]
  }

  type CompanyListResponse {
    success: Boolean!
    data: CompanyList
    message: String
    errors: [String!]
  }

  extend type Query {
    # Company Queries
    companies(pagination: PaginationInput): CompanyListResponse!
    company(id: ID!): CompanyResponse!
    companyBySlug(slug: String!): CompanyResponse!
    
    # User Queries
    users(pagination: PaginationInput): UserListResponse!
    user(id: ID!): UserResponse!
    usersByCompany(companyId: ID!, pagination: PaginationInput): UserListResponse!
  }

  extend type Mutation {
    # User Management
    updateUser(id: ID!, input: UpdateUserInput!): UserResponse!
    deleteUser(id: ID!): UserResponse!
    updateUserSettings(input: UpdateUserSettingsInput!): UserResponse!
    
    # Company Management
    updateCompany(id: ID!, input: UpdateCompanyInput!): CompanyResponse!
    deleteCompany(id: ID!): CompanyResponse!
    
    # User Role Management
    changeUserRole(userId: ID!, role: UserRole!): UserResponse!
    deactivateUser(userId: ID!): UserResponse!
    activateUser(userId: ID!): UserResponse!
  }
`;
