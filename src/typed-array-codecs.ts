import { JsonCodecError } from "./errors";
import { JsonCodec } from "./json-codec";
import {
  _safeJsonNumeric,
  encodeBigInt,
  isSafeJsonArray,
  isSafeJsonNumeric,
  isUnsafeJsonArray,
  SafeJson,
  SafeOutArray,
  UnsafeJson,
} from "./safe-json";

interface TypedArrayLike {
  readonly length: number;
  [index: number]: number;
}

export class TypedArrayCodec<T extends TypedArrayLike> extends JsonCodec<T> {
  constructor(private readonly arrayConstructor: new (nums: Array<number>) => T) {
    super();
  }

  protected override get selfExpectsBigInts() {
    return false;
  }

  decode(src: SafeJson): T {
    if (!isSafeJsonArray(src)) throw new JsonCodecError("Expected JSON array");
    const nums = src.map((value) => {
      if (!isSafeJsonNumeric(value)) throw new JsonCodecError("Expected numeric value");
      return value[_safeJsonNumeric];
    });
    return new this.arrayConstructor(nums);
  }

  decodeUnsafe(src: UnsafeJson): T {
    if (!isUnsafeJsonArray(src)) throw new JsonCodecError("Expected JSON array");
    for (let i = 0; i < src.length; i++) {
      if (typeof src[i] !== "number") {
        throw new JsonCodecError("Expected numeric value");
      }
    }
    return new this.arrayConstructor(src as number[]);
  }

  encode(x: T): SafeOutArray {
    return [...(x as unknown as number[])];
  }
}

interface TypedBigIntArrayLike {
  readonly length: number;
  [index: number]: bigint;
}

export class TypedBigIntArrayCodec<T extends TypedBigIntArrayLike> extends JsonCodec<T> {
  constructor(private readonly arrayConstructor: new (nums: Array<bigint>) => T) {
    super();
  }

  protected override get selfExpectsBigInts() {
    return true;
  }

  decode(src: SafeJson): T {
    if (!isSafeJsonArray(src)) throw new JsonCodecError("Expected JSON array");
    const nums = src.map((value) => {
      if (!isSafeJsonNumeric(value)) throw new JsonCodecError("Expected numeric value");
      return BigInt(value.source);
    });
    return new this.arrayConstructor(nums);
  }

  decodeUnsafe(): T {
    throw new JsonCodecError("Cannot decode BigIntArray in unsafe mode");
  }

  encode(x: T): SafeOutArray {
    return [...(x as unknown as bigint[])].map(encodeBigInt);
  }
}

export const TypedArrayCodecs = {
  Uint8Array: new TypedArrayCodec(Uint8Array),
  Uint16Array: new TypedArrayCodec(Uint16Array),
  Uint32Array: new TypedArrayCodec(Uint32Array),
  Int8Array: new TypedArrayCodec(Int8Array),
  Int16Array: new TypedArrayCodec(Int16Array),
  Int32Array: new TypedArrayCodec(Int32Array),
  Float32Array: new TypedArrayCodec(Float32Array),
  Float64Array: new TypedArrayCodec(Float64Array),
  BigUint64Array: new TypedBigIntArrayCodec(BigUint64Array),
  BigInt64Array: new TypedBigIntArrayCodec(BigInt64Array),
} as const;
