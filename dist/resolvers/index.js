"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolvers = void 0;
const auth_resolvers_1 = require("./auth.resolvers");
const management_resolvers_1 = require("./management.resolvers");
const data_query_resolvers_1 = require("./data-query.resolvers");
const file_analysis_resolvers_1 = require("./file-analysis.resolvers");
const fileAnalysisResolversInstance = new file_analysis_resolvers_1.FileAnalysisResolvers();
const fileAnalysisResolvers = fileAnalysisResolversInstance.getResolvers();
exports.resolvers = {
    Query: {
        ...auth_resolvers_1.authResolvers.Query,
        ...management_resolvers_1.managementResolvers.Query,
        ...data_query_resolvers_1.dataQueryResolvers.Query,
        ...fileAnalysisResolvers.Query,
    },
    Mutation: {
        ...auth_resolvers_1.authResolvers.Mutation,
        ...management_resolvers_1.managementResolvers.Mutation,
        ...data_query_resolvers_1.dataQueryResolvers.Mutation,
        ...fileAnalysisResolvers.Mutation,
    },
    ...data_query_resolvers_1.dataQueryResolvers.DataConnection && { DataConnection: data_query_resolvers_1.dataQueryResolvers.DataConnection },
    Upload: fileAnalysisResolvers.Upload,
    JSON: fileAnalysisResolvers.JSON || data_query_resolvers_1.dataQueryResolvers.JSON,
    DateTime: fileAnalysisResolvers.DateTime,
};
//# sourceMappingURL=index.js.map