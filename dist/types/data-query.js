"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryStatus = exports.ConnectionStatus = exports.ConnectionType = void 0;
var ConnectionType;
(function (ConnectionType) {
    ConnectionType["MYSQL"] = "MYSQL";
    ConnectionType["POSTGRESQL"] = "POSTGRESQL";
    ConnectionType["SUPABASE"] = "SUPABASE";
    ConnectionType["API_REST"] = "API_REST";
    ConnectionType["API_GRAPHQL"] = "API_GRAPHQL";
    ConnectionType["FIREBASE"] = "FIREBASE";
    ConnectionType["MONGODB"] = "MONGODB";
    ConnectionType["REDIS"] = "REDIS";
    ConnectionType["ELASTICSEARCH"] = "ELASTICSEARCH";
    ConnectionType["CASSANDRA"] = "CASSANDRA";
    ConnectionType["DYNAMODB"] = "DYNAMODB";
})(ConnectionType || (exports.ConnectionType = ConnectionType = {}));
var ConnectionStatus;
(function (ConnectionStatus) {
    ConnectionStatus["ACTIVE"] = "ACTIVE";
    ConnectionStatus["INACTIVE"] = "INACTIVE";
    ConnectionStatus["ERROR"] = "ERROR";
})(ConnectionStatus || (exports.ConnectionStatus = ConnectionStatus = {}));
var QueryStatus;
(function (QueryStatus) {
    QueryStatus["SUCCESS"] = "SUCCESS";
    QueryStatus["ERROR"] = "ERROR";
    QueryStatus["TIMEOUT"] = "TIMEOUT";
})(QueryStatus || (exports.QueryStatus = QueryStatus = {}));
//# sourceMappingURL=data-query.js.map