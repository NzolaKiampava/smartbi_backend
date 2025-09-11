import { authResolvers } from './auth.resolvers';

export const resolvers = {
  Query: {
    ...authResolvers.Query,
  },
  Mutation: {
    ...authResolvers.Mutation,
  },
};