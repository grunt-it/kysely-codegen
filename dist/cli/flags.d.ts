type Flag = {
    default?: string;
    description: string;
    example?: string;
    examples?: string[];
    longName: string;
    shortName?: string;
    values?: readonly string[];
};
export declare const FLAGS: ({
    description: string;
    longName: string;
    default?: undefined;
    values?: undefined;
    examples?: undefined;
    shortName?: undefined;
    example?: undefined;
} | {
    default: string;
    description: string;
    longName: string;
    values: string[];
    examples?: undefined;
    shortName?: undefined;
    example?: undefined;
} | {
    description: string;
    longName: string;
    values: string[];
    default?: undefined;
    examples?: undefined;
    shortName?: undefined;
    example?: undefined;
} | {
    description: string;
    examples: string[];
    longName: string;
    default?: undefined;
    values?: undefined;
    shortName?: undefined;
    example?: undefined;
} | {
    description: string;
    longName: string;
    shortName: string;
    default?: undefined;
    values?: undefined;
    examples?: undefined;
    example?: undefined;
} | {
    default: string;
    description: string;
    longName: string;
    values: readonly ["debug", "info", "warn", "error", "silent"];
    examples?: undefined;
    shortName?: undefined;
    example?: undefined;
} | {
    default: string;
    description: string;
    longName: string;
    values?: undefined;
    examples?: undefined;
    shortName?: undefined;
    example?: undefined;
} | {
    description: string;
    example: string;
    longName: string;
    default?: undefined;
    values?: undefined;
    examples?: undefined;
    shortName?: undefined;
})[];
export declare const serializeFlags: (flags: Flag[]) => string;
export {};
