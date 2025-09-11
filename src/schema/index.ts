import { authTypeDefs } from './auth.schema';

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
];