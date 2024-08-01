export const _safeJsonNumeric: unique symbol = Symbol("SafeJsonNumeric");
export type SafeJsonNumeric = { [_safeJsonNumeric]: number; source: string };
export type SafeJsonObject = { [property: string]: SafeJson };
export type SafeJsonArray = Array<SafeJson>;
export type SafeJson = string | SafeJsonNumeric | boolean | SafeJsonObject | SafeJsonArray | null;

export declare const _safeOutBigInt: unique symbol;
export type SafeOutBigInt = string & { [_safeOutBigInt]: true };
export type SafeOutObject = { [property: string]: SafeOutJson };
export type SafeOutArray = Array<SafeOutJson>;
export type SafeOutJson = string | number | SafeOutBigInt | boolean | SafeOutObject | SafeOutArray | null;

export function encodeBigInt(x: bigint): SafeOutBigInt {
  return (JSON as unknown as { rawJSON: (s: string) => SafeOutBigInt }).rawJSON(x.toString(10));
}

export type UnsafeJsonArray = Array<UnsafeJson>;
export type UnsafeJsonObject = { [property: string]: UnsafeJson };
export type UnsafeJson = string | number | boolean | null | UnsafeJsonObject | UnsafeJsonArray;

export function isJsonNull(value: SafeJson | UnsafeJson): value is null {
  return value === null;
}

export function isJsonString(value: SafeJson | UnsafeJson): value is string {
  return typeof value === "string";
}

export function isJsonBoolean(value: SafeJson | UnsafeJson): value is boolean {
  return typeof value === "boolean";
}

export function isSafeJsonArray(value: SafeJson): value is SafeJsonArray {
  return Array.isArray(value);
}

export function isUnsafeJsonArray(value: UnsafeJson): value is UnsafeJsonArray {
  return Array.isArray(value);
}

export function isSafeJsonNumeric(value: SafeJson): value is SafeJsonNumeric {
  return value !== null && (value as SafeJsonNumeric)[_safeJsonNumeric] !== undefined;
}

export function isUnsafeJsonNumeric(value: UnsafeJson): value is number {
  return typeof value === "number";
}

export function isSafeJsonObject(value: SafeJson): value is SafeJsonObject {
  return (
    value !== null && // rules out null
    typeof value === "object" && // rules out string | boolean
    !Array.isArray(value) && // rules out SafeJsonArray
    (value as SafeJsonNumeric)[_safeJsonNumeric] === undefined
  ); // rules out SafeJsonNumeric
}

export function isUnsafeJsonObject(value: UnsafeJson): value is UnsafeJsonObject {
  return (
    value !== null && // rules out null
    typeof value === "object" && // rules out string | boolean | number
    !Array.isArray(value)
  ); // rules out SafeJsonArray
}
