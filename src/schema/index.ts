import { authTypeDefs } from './auth.schema';
import { managementTypeDefs } from './management.schema';

export const baseTypeDefs = `#graphql
  type Query {
    _empty: String
  }

  type Mutation {
    _empty: String
  }

  type Subscription {
    _empty: String
  }
`;

export const typeDefs = [
  baseTypeDefs,
  authTypeDefs,
  managementTypeDefs,
];