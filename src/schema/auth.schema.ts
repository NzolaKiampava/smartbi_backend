export const authTypeDefs = `#graphql
  enum UserRole {
    SUPER_ADMIN
    COMPANY_ADMIN
    MANAGER
    ANALYST
    VIEWER
  }

  enum SubscriptionTier {
    FREE
    BASIC
    PROFESSIONAL
    ENTERPRISE
  }

  type User {
    id: ID!
    email: String!
    firstName: String!
    lastName: String!
    role: UserRole!
    companyId: ID!
    isActive: Boolean!
    emailVerified: Boolean!
    lastLoginAt: String
    createdAt: String!
    updatedAt: String!
  }

  type Company {
    id: ID!
    name: String!
    slug: String!
    domain: String
    isActive: Boolean!
    subscriptionTier: SubscriptionTier!
    maxUsers: Int!
    createdAt: String!
    updatedAt: String!
  }

  type AuthTokens {
    accessToken: String!
    refreshToken: String!
    expiresIn: Int!
  }

  type AuthPayload {
    user: User!
    company: Company!
    tokens: AuthTokens!
  }

  type MePayload {
    user: User!
    company: Company!
  }

  type TokenPayload {
    tokens: AuthTokens!
  }

  input LoginInput {
    email: String!
    password: String!
    companySlug: String
  }

  input RegisterInput {
    email: String!
    password: String!
    firstName: String!
    lastName: String!
    companyName: String!
    companySlug: String!
  }

  input RefreshTokenInput {
    refreshToken: String!
  }

  type AuthResponse {
    success: Boolean!
    data: AuthPayload
    message: String
    errors: [String!]
  }

  type TokenResponse {
    success: Boolean!
    data: TokenPayload
    message: String
    errors: [String!]
  }

  type LogoutResponse {
    success: Boolean!
    message: String
  }

  extend type Query {
    me: MePayload
  }

  extend type Mutation {
    login(input: LoginInput!): AuthResponse!
    register(input: RegisterInput!): AuthResponse!
    refreshToken(input: RefreshTokenInput!): TokenResponse!
    logout: LogoutResponse!
  }
`;