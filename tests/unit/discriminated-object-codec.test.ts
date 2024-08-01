import { describe, expect } from "vitest";
import { JsonCodec, JsonCodecError, Codecs } from "../../src";

import { safeModeTest } from "./forced-safe-codec";

describe("DiscriminatedObjectCodec", () => {
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

  const codec = Codecs.discriminated("t")
    .associate("a", typeACodec)
    .associate("b", typeBCodec)
    .build() as JsonCodec<TestUnion>;

  safeModeTest("decodes correct type", codec, (codec) => {
    expect(codec.parse('{"t":"a","a":true}')).toEqual({ t: "a", a: true });
    expect(codec.parse('{"t":"b","b":1}')).toEqual({ t: "b", b: 1 });
  });

  safeModeTest("decodes correct type with late discriminator", codec, (codec) => {
    expect(codec.parse('{"a":true,"t":"a"}')).toEqual({ t: "a", a: true });
    expect(codec.parse('{"b":1,"t":"b"}')).toEqual({ t: "b", b: 1 });
  });

  safeModeTest("decoding fails with unexpected discriminator value", codec, (codec) => {
    expect(() => codec.parse('{"t":"c","a":true}')).toThrow(JsonCodecError);
    expect(() => codec.parse('{"t":"bd","b":1}')).toThrow(JsonCodecError);
  });

  safeModeTest("decoding fails on empty object", codec, (codec) => {
    expect(() => codec.parse("{}")).toThrow(JsonCodecError);
  });

  safeModeTest("decoding fails with missing discriminator", codec, (codec) => {
    expect(() => codec.parse('{"a":true}')).toThrow(JsonCodecError);
    expect(() => codec.parse('{"b":1}')).toThrow(JsonCodecError);
  });

  safeModeTest("encodes valid values", codec, (codec) => {
    expect(codec.stringify({ t: "a", a: true })).toEqual('{"t":"a","a":true}');
    expect(codec.stringify({ t: "b", b: 1 })).toEqual('{"t":"b","b":1}');
  });

  safeModeTest("encoding fails with invalid values", codec, (codec) => {
    expect(() => codec.stringify({ a: true } as MyTypeA)).toThrow(JsonCodecError);
    expect(() => codec.stringify({ b: 1 } as MyTypeB)).toThrow(JsonCodecError);
  });
});
