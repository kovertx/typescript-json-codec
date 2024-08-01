import { describe, expect } from "vitest";

import { JsonCodec, SafeOutJson, UnsafeJson, TypedArrayCodecs } from "../../src";

import { safeModeTest } from "./forced-safe-codec";

const typeArrayCases: Array<[keyof typeof TypedArrayCodecs, (arr: number[]) => any]> = [
  ["Int8Array", (x) => new Int8Array(x)],
  ["Int16Array", (x) => new Int16Array(x)],
  ["Int32Array", (x) => new Int32Array(x)],
  ["Uint8Array", (x) => new Uint8Array(x)],
  ["Uint16Array", (x) => new Uint16Array(x)],
  ["Uint32Array", (x) => new Uint32Array(x)],
  ["Float32Array", (x) => new Float32Array(x)],
  ["Float64Array", (x) => new Float64Array(x)],
  ["BigUint64Array", (x) => new BigUint64Array(x.map(BigInt))],
  ["BigInt64Array", (x) => new BigInt64Array(x.map(BigInt))],
];

for (const testCase of typeArrayCases) {
  describe(`TypedArrayCodecs.${testCase[0]}`, () => {
    const codec = TypedArrayCodecs[testCase[0]] as JsonCodec<any>;

    safeModeTest("decodes valid arrays", codec, (codec) => {
      expect(codec.parse("[]")).toEqual(testCase[1]([]));
      expect(codec.parse("[1]")).toEqual(testCase[1]([1]));
      expect(codec.parse("[1,2,3]")).toEqual(testCase[1]([1, 2, 3]));
    });

    safeModeTest("encodes valid array", codec, (codec) => {
      expect(codec.stringify(testCase[1]([]))).toEqual("[]");
      expect(codec.stringify(testCase[1]([1]))).toEqual("[1]");
      expect(codec.stringify(testCase[1]([1, 2, 3]))).toEqual("[1,2,3]");
    });

    safeModeTest("fails decoding invalid arrays", codec, (codec) => {
      expect(() => codec.parse("")).toThrow();
      expect(() => codec.parse("[")).toThrow();
      expect(() => codec.parse("[,]")).toThrow();
      expect(() => codec.parse("[1 null,]")).toThrow();
    });
  });
}

/**
 * Test utility codec -- defers to another codec, but reports no bigints or descendents. This should cause an attempt
 * at unsafe decoding, so we can check the wrapped codec fails as expected.
 */
class WrapperCodecIgnoringDescendent<T> extends JsonCodec<T> {
  constructor(private readonly codec: JsonCodec<T>) {
    super();
  }

  decode(): T {
    return undefined!;
  }

  decodeUnsafe(src: UnsafeJson): T {
    return this.codec.decodeUnsafe(src);
  }

  encode(x: T): SafeOutJson {
    return this.codec.encode(x);
  }

  protected get selfExpectsBigInts(): boolean {
    return false;
  }
}

describe("TypedBigIntArrayCodec", () => {
  const codec = new WrapperCodecIgnoringDescendent(TypedArrayCodecs.BigInt64Array);
  test("unsafe decoding fails", () => {
    expect(() => codec.parse("[]")).toThrow();
    expect(() => codec.parse("[1,2,3]")).toThrow();
  });
});
