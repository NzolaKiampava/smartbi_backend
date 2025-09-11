"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolvers = void 0;
const auth_resolvers_1 = require("./auth.resolvers");
const management_resolvers_1 = require("./management.resolvers");
exports.resolvers = {
    Query: {
        ...auth_resolvers_1.authResolvers.Query,
        ...management_resolvers_1.managementResolvers.Query,
    },
    Mutation: {
        ...auth_resolvers_1.authResolvers.Mutation,
        ...management_resolvers_1.managementResolvers.Mutation,
    },
};
//# sourceMappingURL=index.js.map