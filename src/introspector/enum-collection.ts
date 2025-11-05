type EnumMap = Record<string, (string | number)[] | undefined>;

export class EnumCollection {
  readonly enums: EnumMap = {};

  constructor(enums: EnumMap = {}) {
    this.enums = Object.fromEntries(
      Object.entries(enums).map(([key, value]) => {
        return [key.toLowerCase(), value];
      }),
    );
  }

  add(key: string, value: string | number) {
    (this.enums[key.toLowerCase()] ??= []).push(value);
  }

  get(key: string) {
    return (
      this.enums[key.toLowerCase()]?.sort((a, b) => {
        // Handle mixed types by converting to strings for comparison
        if (typeof a === 'string' && typeof b === 'string') {
          return a.localeCompare(b);
        }
        // For numbers or mixed types, use standard comparison
        return a < b ? -1 : a > b ? 1 : 0;
      }) ?? null
    );
  }

  has(key: string) {
    return !!this.enums[key.toLowerCase()];
  }

  set(key: string, values: (string | number)[]) {
    this.enums[key.toLowerCase()] = values;
  }
}
