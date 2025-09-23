import { authTypeDefs } from './auth.schema';
import { managementTypeDefs } from './management.schema';
import { dataQueryTypeDefs } from './data-query.schema';
import { fileAnalysisTypeDefs } from './file-analysis.schema';

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
  dataQueryTypeDefs,
  fileAnalysisTypeDefs,
];