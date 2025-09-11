import { authResolvers } from './auth.resolvers';
import { managementResolvers } from './management.resolvers';

export const resolvers = {
  Query: {
    ...authResolvers.Query,
    ...managementResolvers.Query,
  },
  Mutation: {
    ...authResolvers.Mutation,
    ...managementResolvers.Mutation,
  },
};