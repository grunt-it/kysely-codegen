type EnumMap = Record<string, (string | number)[] | undefined>;
export declare class EnumCollection {
    readonly enums: EnumMap;
    constructor(enums?: EnumMap);
    add(key: string, value: string | number): void;
    get(key: string): (string | number)[] | null;
    has(key: string): boolean;
    set(key: string, values: (string | number)[]): void;
}
export {};
