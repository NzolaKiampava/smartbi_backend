import { authResolvers } from './auth.resolvers';
import { managementResolvers } from './management.resolvers';
import { dataQueryResolvers } from './data-query.resolvers';
import { FileAnalysisResolvers } from './file-analysis.resolvers';

// Create instance of FileAnalysisResolvers
const fileAnalysisResolversInstance = new FileAnalysisResolvers();
const fileAnalysisResolvers = fileAnalysisResolversInstance.getResolvers();

export const resolvers = {
  Query: {
    ...authResolvers.Query,
    ...managementResolvers.Query,
    ...dataQueryResolvers.Query,
    ...fileAnalysisResolvers.Query,
  },
  Mutation: {
    ...authResolvers.Mutation,
    ...managementResolvers.Mutation,
    ...dataQueryResolvers.Mutation,
    ...fileAnalysisResolvers.Mutation,
  },
  // Include custom field resolvers and scalars
  ...dataQueryResolvers.DataConnection && { DataConnection: dataQueryResolvers.DataConnection },
  // Use file analysis scalars (they are more comprehensive)
  Upload: fileAnalysisResolvers.Upload,
  JSON: fileAnalysisResolvers.JSON || dataQueryResolvers.JSON,
  DateTime: fileAnalysisResolvers.DateTime,
};