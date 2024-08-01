import { expect } from "vitest";
import { JsonCodecError, Codecs, LiteralType } from "../../src";
import { ForcedSafeCodec } from "./forced-safe-codec";

const sampleLiterals: Array<LiteralType> = [
  null,
  1,
  2,
  3,
  40_583,
  1n,
  2n,
  138_989_842_442_498_582_984_758_938_578_393n,
  true,
  false,
  "",
  "1",
  "2",
  "1n",
  "2n",
  "true",
];

describe("LiteralCodecs.literal", () => {
  test("encodes and decodes the expected value", () => {
    for (const value of sampleLiterals) {
      const codec = Codecs.literal(value);
      const safeCodec = new ForcedSafeCodec(codec);

      const encoded = codec.stringify(value);
      expect(codec.parse(encoded)).toEqual(value);
      expect(safeCodec.parse(encoded)).toEqual(value);
    }
  });

  test("fails encoding other values", () => {
    for (const value of sampleLiterals) {
      const codec = Codecs.literal(value);
      const safeCodec = new ForcedSafeCodec(codec);
      for (const otherValue of sampleLiterals) {
        if (value == otherValue) continue;
        expect(() => codec.stringify(otherValue)).toThrow(JsonCodecError);
        expect(() => safeCodec.stringify(otherValue)).toThrow(JsonCodecError);
      }
    }
  });

  test("fails decoding other values", () => {
    for (const value of sampleLiterals) {
      const codec = Codecs.literal(value);
      const safeCodec = new ForcedSafeCodec(codec);
      for (const otherValue of sampleLiterals) {
        if (value == otherValue) continue;

        const otherValueJson = typeof otherValue === "bigint" ? otherValue.toString(10) : JSON.stringify(otherValue);

        expect(() => codec.parse(otherValueJson)).toThrow(JsonCodecError);
        expect(() => safeCodec.parse(otherValueJson)).toThrow(JsonCodecError);
      }
    }
  });
});
