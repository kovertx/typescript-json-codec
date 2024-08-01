import { JsonCodecError } from "./errors";
import { JsonCodec } from "./json-codec";
import {
  _safeJsonNumeric,
  encodeBigInt,
  isJsonBoolean,
  isJsonString,
  isSafeJsonNumeric,
  isUnsafeJsonNumeric,
  SafeJson,
  SafeOutBigInt,
  UnsafeJson,
} from "./safe-json";

export class NumberCodec extends JsonCodec<number> {
  protected override get selfExpectsBigInts() {
    return false;
  }

  override decode(src: SafeJson): number {
    if (!isSafeJsonNumeric(src)) throw new JsonCodecError("Expected numeric value");
    return src[_safeJsonNumeric];
  }

  override decodeUnsafe(src: UnsafeJson): number {
    if (!isUnsafeJsonNumeric(src)) throw new JsonCodecError("Expected numeric value");
    return src;
  }

  encode(x: number): number {
    return x;
  }
}

export class BigIntCodec extends JsonCodec<bigint> {
  protected override get selfExpectsBigInts() {
    return true;
  }

  override decode(src: SafeJson): bigint {
    if (!isSafeJsonNumeric(src)) throw new JsonCodecError("Expected numeric value");
    return BigInt(src.source);
  }

  override decodeUnsafe(): bigint {
    throw new JsonCodecError("Cannot decode bigint in unsafe mode");
  }

  override encode(x: bigint): SafeOutBigInt {
    return encodeBigInt(x);
  }
}

export class StringCodec extends JsonCodec<string> {
  protected override get selfExpectsBigInts() {
    return false;
  }

  override decode(src: SafeJson): string {
    if (!isJsonString(src)) throw new JsonCodecError("Expected string value");
    return src;
  }

  override decodeUnsafe(src: UnsafeJson): string {
    if (!isJsonString(src)) throw new JsonCodecError("Expected string value");
    return src;
  }

  override encode(x: string): string {
    return x;
  }

  matching<T extends string = string>(re: RegExp, message: string = "Doesn't match regular expression"): JsonCodec<T> {
    return this.validating((s): s is T => re.test(s), message);
  }
}

export class BooleanCodec extends JsonCodec<boolean> {
  protected override get selfExpectsBigInts() {
    return false;
  }

  override decode(src: SafeJson) {
    if (!isJsonBoolean(src)) throw new JsonCodecError("Expected boolean value");
    return src;
  }

  override decodeUnsafe(src: UnsafeJson) {
    if (!isJsonBoolean(src)) throw new JsonCodecError("Expected boolean value");
    return src;
  }

  override encode(x: boolean): boolean {
    return x;
  }
}
