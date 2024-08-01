import { JsonValidationError } from "./errors";
import { Branded } from "./json-codec";

export type Uuid = Branded<string, "UUID">;

export function isValidUuid(str: string): str is Uuid {
  return /^[\da-f]{8}(?:-?[\da-f]{4}){3}-?[\da-f]{12}$/i.test(str);
}

export function assertValidUuid(str: string): asserts str is Uuid {
  if (!isValidUuid(str)) throw new JsonValidationError("Invalid UUID");
}
