import { JsonCodec } from "./json-codec";
import {
  _safeJsonNumeric,
  isJsonString,
  isSafeJsonNumeric, isUnsafeJsonNumeric,
  SafeJson,
  SafeOutJson,
  UnsafeJson
} from "./safe-json";
import { JsonCodecError } from "./errors";

export class EnumCodec<T extends Record<string, string | number>> extends JsonCodec<T[keyof T]> {
  private valueLiterals = new Set<T[keyof T]>();
  protected selfExpectsBigInts: boolean = false;

  constructor(enumLiteral: T) {
    super()
    for (let valueName in enumLiteral) {
      // typescript enums generate keys for numbers encoded as strings (e.g. X = 1 will create a property "1": "X"),
      // we skip those so we don't inadvertently add bad mappings
      if (/^\d+(\.\d+)?$/.test(valueName)) continue;
      this.valueLiterals.add(enumLiteral[valueName]);
    }
  }

  private decodeIfValid(x: string | number): T[keyof T] {
    if (!this.valueLiterals.has(x as T[keyof T])) throw new JsonCodecError("Expected a valid enum value");
    return x as T[keyof T];
  }

  decode(src: SafeJson): T[keyof T] {
    if (isSafeJsonNumeric(src)) {
      return this.decodeIfValid(src[_safeJsonNumeric]);
    } else if (isJsonString(src)) {
      return this.decodeIfValid(src);
    }
    throw new JsonCodecError("Enum value not a string or number");
  }

  decodeUnsafe(src: UnsafeJson): T[keyof T] {
    if (isUnsafeJsonNumeric(src)) {
      return this.decodeIfValid(src);
    } else if (isJsonString(src)) {
      return this.decodeIfValid(src);
    }
    throw new JsonCodecError("Enum value not a string or number");
  }

  encode(x: T[keyof T]): SafeOutJson {
    if (!this.valueLiterals.has(x as T[keyof T])) throw new JsonCodecError("Expected a valid enum value");
    return x as SafeOutJson;
  }
}
