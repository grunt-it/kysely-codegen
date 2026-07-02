import type { TableMetadata as KyselyTableMetadata } from 'kysely';
import { EnumCollection } from '../../enum-collection';
import type { IntrospectOptions } from '../../introspector';
import { Introspector } from '../../introspector';
import { DatabaseMetadata } from '../../metadata/database-metadata';
export declare class SqliteIntrospector extends Introspector<any> {
    createDatabaseMetadata({ enums, tables: rawTables, }: {
        enums: EnumCollection;
        tables: KyselyTableMetadata[];
    }): DatabaseMetadata;
    introspect(options: IntrospectOptions<any>): Promise<DatabaseMetadata>;
    private introspectCheckConstraintEnums;
    private getColumnTypes;
}
