"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var _MssqlDialect_instances, _MssqlDialect_parseConnectionString;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MssqlDialect = void 0;
const mssql_dialect_1 = require("../../../introspector/dialects/mssql/mssql-dialect");
const mssql_adapter_1 = require("./mssql-adapter");
const DEFAULT_MSSQL_PORT = 1433;
class MssqlDialect extends mssql_dialect_1.MssqlIntrospectorDialect {
    constructor() {
        super(...arguments);
        _MssqlDialect_instances.add(this);
        this.adapter = new mssql_adapter_1.MssqlAdapter();
    }
}
exports.MssqlDialect = MssqlDialect;
_MssqlDialect_instances = new WeakSet(), _MssqlDialect_parseConnectionString = 
/**
 * @see https://www.connectionstrings.com/microsoft-data-sqlclient/using-a-non-standard-port/
 */
async function _MssqlDialect_parseConnectionString(connectionString) {
    const { parseConnectionString } = await Promise.resolve().then(() => __importStar(require('@tediousjs/connection-string')));
    const parsed = parseConnectionString(connectionString);
    const tokens = parsed.server.split(',');
    const server = tokens[0];
    const port = tokens[1]
        ? Number.parseInt(tokens[1], 10)
        : DEFAULT_MSSQL_PORT;
    return {
        database: parsed.database,
        password: parsed.password,
        port,
        server,
        userName: parsed['user id'],
    };
};
//# sourceMappingURL=mssql-dialect.js.map