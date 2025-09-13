import { authResolvers } from './auth.resolvers';
import { managementResolvers } from './management.resolvers';
import { dataQueryResolvers } from './data-query.resolvers';

export const resolvers = {
  Query: {
    ...authResolvers.Query,
    ...managementResolvers.Query,
    ...dataQueryResolvers.Query,
  },
  Mutation: {
    ...authResolvers.Mutation,
    ...managementResolvers.Mutation,
    ...dataQueryResolvers.Mutation,
  },
  // Include custom field resolvers and scalars
  ...dataQueryResolvers.DataConnection && { DataConnection: dataQueryResolvers.DataConnection },
  ...dataQueryResolvers.JSON && { JSON: dataQueryResolvers.JSON },
};