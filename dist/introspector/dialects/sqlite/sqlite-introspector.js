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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SqliteIntrospector = void 0;
const enum_collection_1 = require("../../enum-collection");
const introspector_1 = require("../../introspector");
const database_metadata_1 = require("../../metadata/database-metadata");
// Simple SQL parser for CHECK constraints with IN clauses
class CheckConstraintParser {
    static parseEnumConstraints(sql, columnTypes) {
        const constraints = [];
        // Normalize the SQL by removing extra whitespace and converting to lowercase for parsing
        const normalizedSql = sql.replaceAll(/\s+/g, ' ').toLowerCase();
        // Find all CHECK constraints
        let searchIndex = 0;
        while (true) {
            const checkIndex = normalizedSql.indexOf('check', searchIndex);
            if (checkIndex === -1)
                break;
            // Find the opening parenthesis after CHECK
            const openParenIndex = normalizedSql.indexOf('(', checkIndex);
            if (openParenIndex === -1)
                break;
            // Find the matching closing parenthesis
            const constraintContent = this.extractParenthesesContent(normalizedSql, openParenIndex);
            if (!constraintContent) {
                searchIndex = openParenIndex + 1;
                continue;
            }
            // Parse the constraint content for IN clauses
            const enumConstraint = this.parseInConstraint(constraintContent, columnTypes);
            if (enumConstraint) {
                constraints.push(enumConstraint);
            }
            searchIndex = openParenIndex + constraintContent.length + 2; // +2 for the parentheses
        }
        return constraints;
    }
    static extractParenthesesContent(sql, startIndex) {
        let depth = 0;
        let content = '';
        for (let i = startIndex; i < sql.length; i++) {
            const char = sql[i];
            if (char === '(') {
                depth++;
                if (depth > 1)
                    content += char;
            }
            else if (char === ')') {
                depth--;
                if (depth === 0) {
                    return content;
                }
                content += char;
            }
            else if (depth > 0)
                content += char;
        }
        return null; // Unmatched parentheses
    }
    static parseInConstraint(constraintContent, columnTypes) {
        // Look for pattern: column_name IN (value1, value2, ...)
        const inMatch = constraintContent.match(/^\s*([A-Z_a-z]\w*)\s+in\s*\(\s*(.+?)\s*\)\s*$/);
        if (!inMatch?.[1] || !inMatch[2])
            return null;
        const columnName = inMatch[1];
        const valuesString = inMatch[2];
        // Get the column type to determine how to parse values
        const columnType = columnTypes.get(columnName);
        const isNumericType = columnType === 'INTEGER' ||
            columnType === 'REAL' ||
            columnType === 'NUMERIC';
        // Parse the comma-separated values
        const values = this.parseValueList(valuesString, isNumericType);
        return values.length > 0 ? { column: columnName, values } : null;
    }
    static parseValueList(valuesString, isNumericType) {
        const values = [];
        let currentValue = '';
        let inQuotes = false;
        let quoteChar = '';
        for (let i = 0; i < valuesString.length; i++) {
            const char = valuesString[i];
            if (!inQuotes && (char === '"' || char === "'")) {
                inQuotes = true;
                quoteChar = char;
            }
            else if (inQuotes && char === quoteChar) {
                // Check for escaped quote
                if (i + 1 < valuesString.length && valuesString[i + 1] === quoteChar) {
                    currentValue += char;
                    i++; // Skip the next quote
                }
                else {
                    inQuotes = false;
                    quoteChar = '';
                }
            }
            else if (!inQuotes && char === ',') {
                const trimmed = currentValue.trim();
                if (trimmed) {
                    // For numeric types, convert unquoted values to numbers
                    if (isNumericType) {
                        const numValue = Number(trimmed);
                        values.push(Number.isNaN(numValue) ? trimmed : numValue);
                    }
                    else {
                        values.push(trimmed);
                    }
                }
                currentValue = '';
            }
            else {
                currentValue += char;
            }
        }
        // Add the last value
        const trimmed = currentValue.trim();
        if (trimmed) {
            // For numeric types, convert unquoted values to numbers
            if (isNumericType) {
                const numValue = Number(trimmed);
                values.push(Number.isNaN(numValue) ? trimmed : numValue);
            }
            else {
                values.push(trimmed);
            }
        }
        return values;
    }
}
class SqliteIntrospector extends introspector_1.Introspector {
    createDatabaseMetadata({ enums, tables: rawTables, }) {
        const tables = rawTables.map((table) => ({
            ...table,
            columns: table.columns.map((column) => {
                const enumKey = `${table.name}.${column.name}`;
                const enumValues = enums.get(enumKey);
                return {
                    ...column,
                    enumValues,
                };
            }),
        }));
        return new database_metadata_1.DatabaseMetadata({ tables });
    }
    async introspect(options) {
        const tables = await this.getTables(options);
        const enums = await this.introspectCheckConstraintEnums(options.db);
        return this.createDatabaseMetadata({ enums, tables });
    }
    async introspectCheckConstraintEnums(db) {
        const enums = new enum_collection_1.EnumCollection();
        // Query sqlite_master to get CREATE TABLE statements
        const rows = await db
            .withoutPlugins()
            .selectFrom('sqlite_master')
            .select(['name', 'sql'])
            .where('type', '=', 'table')
            .where('sql', 'is not', null)
            .execute();
        for (const row of rows) {
            if (!row.sql)
                continue;
            // Get column types from PRAGMA table_info instead of parsing SQL
            const columnTypes = await this.getColumnTypes(db, row.name);
            // Parse CHECK constraints from the CREATE TABLE statement
            const constraints = CheckConstraintParser.parseEnumConstraints(row.sql, columnTypes);
            for (const constraint of constraints) {
                const key = `${row.name}.${constraint.column}`;
                // Sort the enum values for consistency
                const sortedValues = [...constraint.values].sort((a, b) => {
                    if (typeof a === 'string' && typeof b === 'string') {
                        return a.localeCompare(b);
                    }
                    return a < b ? -1 : a > b ? 1 : 0;
                });
                enums.set(key, sortedValues);
            }
        }
        return enums;
    }
    async getColumnTypes(db, tableName) {
        const columnTypes = new Map();
        // Use PRAGMA table_info to get reliable column type information
        const { sql } = await Promise.resolve().then(() => __importStar(require('kysely')));
        const result = await sql `PRAGMA table_info(${sql.ref(tableName)})`.execute(db.withoutPlugins());
        for (const column of result.rows) {
            if (column.name && column.type) {
                columnTypes.set(column.name.toLowerCase(), column.type.toUpperCase());
            }
        }
        return columnTypes;
    }
}
exports.SqliteIntrospector = SqliteIntrospector;
//# sourceMappingURL=sqlite-introspector.js.map