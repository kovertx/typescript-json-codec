import { describe } from "vitest";
import { safeModeTest } from "./forced-safe-codec";
import { Codecs, JsonCodec, JsonCodecError } from "../../src";

describe("EnumCodec", () => {

  describe("with all computed values", () => {
    enum MyEnum { A, B, C }
    const codec = Codecs.enum(MyEnum);

    safeModeTest("decodes valid values", codec, (codec) => {
      expect(codec.parse("0")).toEqual(MyEnum.A);
      expect(codec.parse("1")).toEqual(MyEnum.B);
      expect(codec.parse("2")).toEqual(MyEnum.C);
    });

    safeModeTest("fails decoding invalid values", codec, (codec) => {
      expect(() => codec.parse("3")).toThrow(JsonCodecError);
      expect(() => codec.parse("null")).toThrow(JsonCodecError);
      expect(() => codec.parse('"A"')).toThrow(JsonCodecError);
    });
  });

  describe("with all literal values", () => {
    enum MyEnum { A = 0.1, B = 2.0e3, C = "A" }
    const codec = Codecs.enum(MyEnum);

    safeModeTest("decodes valid values", codec, (codec) => {
      expect(codec.parse("0.1")).toEqual(MyEnum.A);
      expect(codec.parse("2000")).toEqual(MyEnum.B);
      expect(codec.parse('"A"')).toEqual(MyEnum.C);
    });

    safeModeTest("fails decoding invalid values", codec, (codec: JsonCodec<MyEnum>) => {
      expect(() => codec.parse("0")).toThrow(JsonCodecError);
      expect(() => codec.parse("2.0")).toThrow(JsonCodecError);
      expect(() => codec.parse('"C"')).toThrow(JsonCodecError);
    });
  });

})