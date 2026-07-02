"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostgresIntrospector = void 0;
const kysely_1 = require("kysely");
const enum_collection_1 = require("../../enum-collection");
const introspector_1 = require("../../introspector");
const database_metadata_1 = require("../../metadata/database-metadata");
class PostgresIntrospector extends introspector_1.Introspector {
    constructor(options) {
        super();
        this.options = {
            defaultSchemas: options?.defaultSchemas && options.defaultSchemas.length > 0
                ? options.defaultSchemas
                : ['public'],
            domains: options?.domains ?? true,
            partitions: options?.partitions,
        };
    }
    createDatabaseMetadata({ checkConstraints, domains, enums, partitions, tables: rawTables, }) {
        const tables = rawTables
            .map((table) => {
            const tableChecks = checkConstraints.get(table.name) ?? new Map();
            const columns = table.columns.map((column) => {
                const dataType = this.getRootType(column, domains);
                const enumValues = enums.get(`${column.dataTypeSchema ?? this.options.defaultSchemas}.${dataType}`) ?? tableChecks.get(column.name) ?? null;
                const isArray = dataType.startsWith('_');
                return {
                    comment: column.comment ?? null,
                    dataType: isArray ? dataType.slice(1) : dataType,
                    dataTypeSchema: column.dataTypeSchema,
                    enumValues,
                    hasDefaultValue: column.hasDefaultValue,
                    isArray,
                    isAutoIncrementing: column.isAutoIncrementing,
                    isNullable: column.isNullable,
                    name: column.name,
                };
            });
            const isPartition = partitions.some((partition) => {
                return (partition.schema === table.schema && partition.name === table.name);
            });
            return {
                columns,
                isPartition,
                isView: table.isView,
                name: table.name,
                schema: table.schema,
            };
        })
            .filter((table) => {
            return this.options.partitions ? true : !table.isPartition;
        });
        return new database_metadata_1.DatabaseMetadata({ enums, tables });
    }
    getRootType(column, domains) {
        const foundDomain = domains.find((domain) => {
            return (domain.typeName === column.dataType &&
                domain.typeSchema === column.dataTypeSchema);
        });
        return foundDomain?.rootType ?? column.dataType;
    }
    async introspect(options) {
        const tables = await this.getTables(options);
        const [domains, enums, partitions, checkConstraints] = await Promise.all([
            this.introspectDomains(options.db),
            this.introspectEnums(options.db),
            this.introspectPartitions(options.db),
            this.introspectCheckConstraints(options.db),
        ]);
        return this.createDatabaseMetadata({ checkConstraints, enums, domains, partitions, tables });
    }
    async introspectDomains(db) {
        if (!this.options.domains) {
            return [];
        }
        const result = await (0, kysely_1.sql) `
      with recursive domain_hierarchy as (
        select oid, typbasetype
        from pg_type
        where typtype = 'd'
        and 'information_schema'::regnamespace::oid <> typnamespace

        union all

        select dh.oid, t.typbasetype
        from domain_hierarchy as dh
        join pg_type as t ON t.oid = dh.typbasetype
      )

      select
        t.typname as "typeName",
        t.typnamespace::regnamespace::text as "typeSchema",
        bt.typname as "rootType"
      from domain_hierarchy as dh
      join pg_type as t on dh.oid = t.oid
      join pg_type as bt on dh.typbasetype = bt.oid
      where bt.typbasetype = 0;
    `.execute(db);
        return result.rows;
    }
    async introspectEnums(db) {
        const enums = new enum_collection_1.EnumCollection();
        const rows = await db
            .withoutPlugins()
            .selectFrom('pg_type as type')
            .innerJoin('pg_enum as enum', 'type.oid', 'enum.enumtypid')
            .innerJoin('pg_catalog.pg_namespace as namespace', 'namespace.oid', 'type.typnamespace')
            .select([
            'namespace.nspname as schemaName',
            'type.typname as enumName',
            'enum.enumlabel as enumValue',
        ])
            .execute();
        for (const row of rows) {
            enums.add(`${row.schemaName}.${row.enumName}`, row.enumValue);
        }
        return enums;
    }
    async introspectCheckConstraints(db) {
        const result = await (0, kysely_1.sql) `
      select
        c.relname as "tableName",
        a.attname as "columnName",
        pg_get_constraintdef(con.oid) as "values"
      from pg_constraint con
      join pg_class c on c.oid = con.conrelid
      join pg_namespace n on n.oid = c.relnamespace
      join lateral unnest(con.conkey) with ordinality as u(attnum, ord) on true
      join pg_attribute a on a.attrelid = c.oid and a.attnum = u.attnum
      where con.contype = 'c'
        and n.nspname = any(current_schemas(true))
        and pg_get_constraintdef(con.oid) ~ 'ANY\\s*\\(\\s*ARRAY\\s*\\['
    `.execute(db);
        const constraints = new Map();
        for (const row of result.rows) {
            const match = row.values.match(/ANY\s*\(\s*ARRAY\s*\[([^\]]+)\]/i);
            if (!match)
                continue;
            const values = match[1]
                .split(',')
                .map((v) => v.trim().replace(/^'(.*)'(::\w+)?$/, '$1'))
                .filter((v) => v.length > 0);
            if (values.length === 0)
                continue;
            let tableConstraints = constraints.get(row.tableName);
            if (!tableConstraints) {
                tableConstraints = new Map();
                constraints.set(row.tableName, tableConstraints);
            }
            tableConstraints.set(row.columnName, values);
        }
        return constraints;
    }
    async introspectPartitions(db) {
        const result = await (0, kysely_1.sql) `
      select pg_namespace.nspname as schema, pg_class.relname as name
      from pg_inherits
      join pg_class on pg_inherits.inhrelid = pg_class.oid
      join pg_namespace on pg_namespace.oid = pg_class.relnamespace;
    `.execute(db);
        return result.rows;
    }
}
exports.PostgresIntrospector = PostgresIntrospector;
//# sourceMappingURL=postgres-introspector.js.map