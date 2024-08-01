// export type JsonString = string;
// export type JsonNumber = number;
// export type JsonBoolean = boolean;
// export type JsonNull = null;
// export type JsonPrimitive = JsonString | JsonNumber | JsonBoolean | JsonNull;
// export type JsonArray = Array<JsonValue>;
// export type JsonObject = { [key: string]: JsonValue };
//
// /**
//  * A simple JSON value representation, closely aligned with the possible inputs/output of builtin JSON .stringify and
//  * .parse
//  */
// export type JsonValue = JsonPrimitive | JsonArray | JsonObject;
//
// /**
//  * Tests if a JsonValue is one of the primitive types (string, number, boolean, or null).
//  * @param value the JsonValue to test
//  */
// export function isJsonPrimitive(value: JsonValue): value is JsonPrimitive {
//   return isJsonNull(value) || isJsonString(value) || isJsonBoolean(value) || isJsonNumber(value);
// }
//
// /**
//  * Tests if a JsonValue is a string.
//  * @param value the JsonValue to test
//  */
// export function isJsonString(value: JsonValue): value is JsonString {
//   return typeof value === "string";
// }
//
// /**
//  * Tests if a JsonValue is a number.
//  * @param value the JsonValue to test
//  */
// export function isJsonNumber(value: JsonValue): value is JsonNumber {
//   return typeof value === "number";
// }
//
// /**
//  * Tests if a JsonValue is a boolean.
//  * @param value the JsonValue to test
//  */
// export function isJsonBoolean(value: JsonValue): value is JsonBoolean {
//   return typeof value === "boolean";
// }
//
// /**
//  * Tests if a JsonValue is a null.
//  * @param value the JsonValue to test
//  */
// export function isJsonNull(value: JsonValue): value is JsonNull {
//   return value === null;
// }
//
// /**
//  * Tests if a JsonValue is an array.
//  * @param value the JsonValue to test
//  */
// export function isJsonArray(value: JsonValue): value is JsonArray {
//   return Array.isArray(value);
// }
//
// /**
//  * Tests if a JsonValue is an object.
//  * @param value the JsonValue to test
//  */
// export function isJsonObject(value: JsonValue): value is JsonObject {
//   return value !== null && typeof value === "object" && !Array.isArray(value);
// }
