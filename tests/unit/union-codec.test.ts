import { describe, expect } from "vitest";
import { Codecs, JsonCodecError } from "../../src";
import { safeModeTest } from "./forced-safe-codec";

describe("UnionCodec", () => {
  type MyTypeA = { t: "a"; a: boolean };
  type MyTypeB = { t: "b"; b: number };
  type TestUnion = MyTypeA | MyTypeB;

  const typeACodec = Codecs.object<MyTypeA>({
    t: Codecs.literal("a"),
    a: Codecs.boolean,
  });
  const typeBCodec = Codecs.object<MyTypeB>({
    t: Codecs.literal("b"),
    b: Codecs.number,
  });

  const codec = Codecs.union([typeACodec, typeBCodec]);

  safeModeTest("decodes correct type", codec, (codec) => {
    expect(codec.parse('{"t":"a","a":true}')).toEqual({ t: "a", a: true });
    expect(codec.parse('{"t":"b","b":1}')).toEqual({ t: "b", b: 1 });
  });

  safeModeTest("decoding fails with unexpected discriminator value", codec, (codec) => {
    expect(() => codec.parse('{"t":"c","a":true}')).toThrow(JsonCodecError);
    expect(() => codec.parse('{"t":"bd","b":1}')).toThrow(JsonCodecError);
  });

  safeModeTest("encoding succeeds with correct type", codec, (codec) => {
    expect(codec.stringify({ t: "a", a: true })).toEqual('{"t":"a","a":true}');
  });

  safeModeTest("encoding fails with invalid type", codec, (codec) => {
    expect(() => codec.stringify({ t: "c", a: true } as unknown as TestUnion)).toThrow(JsonCodecError);
  });
});
