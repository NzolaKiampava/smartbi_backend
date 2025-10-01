"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.typeDefs = exports.baseTypeDefs = void 0;
const auth_schema_1 = require("./auth.schema");
const management_schema_1 = require("./management.schema");
const data_query_schema_1 = require("./data-query.schema");
const file_analysis_schema_1 = require("./file-analysis.schema");
exports.baseTypeDefs = `#graphql
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
exports.typeDefs = [
    exports.baseTypeDefs,
    auth_schema_1.authTypeDefs,
    management_schema_1.managementTypeDefs,
    data_query_schema_1.dataQueryTypeDefs,
    file_analysis_schema_1.fileAnalysisTypeDefs,
];
//# sourceMappingURL=index.js.map