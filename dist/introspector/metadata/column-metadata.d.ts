export type ColumnMetadataOptions = {
    comment?: string | null;
    dataType: string;
    dataTypeSchema?: string;
    enumValues?: (string | number)[] | null;
    hasDefaultValue?: boolean;
    isArray?: boolean;
    isAutoIncrementing?: boolean;
    isNullable?: boolean;
    name: string;
};
export declare class ColumnMetadata {
    comment: string | null;
    dataType: string;
    dataTypeSchema: string | undefined;
    enumValues: (string | number)[] | null;
    hasDefaultValue: boolean;
    isArray: boolean;
    isAutoIncrementing: boolean;
    isNullable: boolean;
    name: string;
    constructor(options: ColumnMetadataOptions);
}
