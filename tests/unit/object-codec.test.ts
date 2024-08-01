import { describe, expect } from "vitest";
import { JsonCodecError, Codecs } from "../../src";

import { safeModeTest } from "./forced-safe-codec";

describe("ObjectCodec", () => {
  describe("describing an empty object", () => {
    const codec = Codecs.object({});
    test("fails decoding non-objects", () => {
      expect(() => codec.parse('""')).toThrow(JsonCodecError);
      expect(() => codec.parse('"{}"')).toThrow(JsonCodecError);
      expect(() => codec.parse("null")).toThrow(JsonCodecError);
      expect(() => codec.parse("1")).toThrow(JsonCodecError);
      expect(() => codec.parse("true")).toThrow(JsonCodecError);
      expect(() => codec.parse("[]")).toThrow(JsonCodecError);
    });

    test("decodes an empty object", () => {
      expect(codec.parse("{}")).toEqual({});
    });

    test("fails decoding non-empty objects", () => {
      expect(() => codec.parse('{"a":null}')).toThrow(JsonCodecError);
      expect(() => codec.parse('{"":null}')).toThrow(JsonCodecError);
      expect(() => codec.parse('{"hello world":1}')).toThrow(JsonCodecError);
      expect(() => codec.parse('{"":{}}')).toThrow(JsonCodecError);
    });
  });

  describe("describing a single property", () => {
    const codec = Codecs.object({ a: Codecs.number });
    type TheType = ReturnType<(typeof codec)["decode"]>;

    safeModeTest("fails decoding non-objects", codec, (codec) => {
      expect(() => codec.parse('""')).toThrow(JsonCodecError);
      expect(() => codec.parse('"{}"')).toThrow(JsonCodecError);
      expect(() => codec.parse("null")).toThrow(JsonCodecError);
      expect(() => codec.parse("0")).toThrow(JsonCodecError);
      expect(() => codec.parse("true")).toThrow(JsonCodecError);
      expect(() => codec.parse("[]")).toThrow(JsonCodecError);
    });

    safeModeTest("fails decoding bad json", codec, (codec) => {
      expect(() => codec.parse("{")).toThrow();
      expect(() => codec.parse('{"a"}')).toThrow();
      expect(() => codec.parse('{"a"')).toThrow();
      expect(() => codec.parse('{"a":')).toThrow();
      expect(() => codec.parse('{"a":1')).toThrow();
      expect(() => codec.parse('{"a":1]')).toThrow();
      expect(() => codec.parse('{"a":}')).toThrow();
    });

    safeModeTest("fails decoding an empty object", codec, (codec) => {
      expect(() => codec.parse("{}")).toThrow(JsonCodecError);
    });

    safeModeTest("decodes matching objects", codec, (codec) => {
      expect(codec.parse('{"a":1}')).toEqual({ a: 1 });
      expect(codec.parse('{"a":2}')).toEqual({ a: 2 });
      expect(codec.parse('{"a":3}')).toEqual({ a: 3 });
      expect(codec.parse('{"a":4}')).toEqual({ a: 4 });
    });

    safeModeTest("fails decoding properties with incorrect schema", codec, (codec) => {
      expect(() => codec.parse('{"a":null}')).toThrow(JsonCodecError);
      expect(() => codec.parse('{"a":true}')).toThrow(JsonCodecError);
      expect(() => codec.parse('{"a":{}}')).toThrow(JsonCodecError);
      expect(() => codec.parse('{"a":""}')).toThrow(JsonCodecError);
      expect(() => codec.parse('{"a":"123"}')).toThrow(JsonCodecError);
    });

    safeModeTest("fails encoding an object with extra properties", codec, (codec) => {
      expect(() => codec.stringify({ a: 1, b: 2 } as TheType)).toThrow(JsonCodecError);
      expect(() => codec.stringify({ a: 1, c: null } as TheType)).toThrow(JsonCodecError);
      expect(() => codec.stringify({ a: 1, b: undefined } as TheType)).toThrow(JsonCodecError);
    });

    safeModeTest("fails encoding an object with missing properties", codec, (codec) => {
      expect(() => codec.stringify({} as TheType)).toThrow(JsonCodecError);
      expect(() => codec.stringify({} as TheType)).toThrow(JsonCodecError);
      expect(() => codec.stringify({} as TheType)).toThrow(JsonCodecError);
    });
  });

  describe("describing an object with optional fields", () => {
    interface SomeType {
      status: boolean;
      error?: string;
    }

    const codec = Codecs.object<SomeType>({
      status: Codecs.boolean,
      error: Codecs.string.optional(),
    });

    safeModeTest("decodes objects without optional property", codec, (codec) => {
      expect(codec.parse('{"status":true}')).toEqual({ status: true });
      expect(codec.parse('{"status":false}')).toEqual({ status: false });
    });

    safeModeTest("decodes objects with optional property", codec, (codec) => {
      expect(codec.parse('{"status":true,"error":"wat"}')).toEqual({ status: true, error: "wat" });
      expect(codec.parse('{"status":false,"error":""}')).toEqual({ status: false, error: "" });
    });

    safeModeTest("encodes objects without optional property", codec, (codec) => {
      expect(codec.stringify({ status: true })).toEqual('{"status":true}');
      expect(codec.stringify({ status: false })).toEqual('{"status":false}');
    });

    safeModeTest("encodes objects with optional property", codec, (codec) => {
      expect(codec.stringify({ status: true, error: "wat" })).toEqual('{"status":true,"error":"wat"}');
      expect(codec.stringify({ status: false, error: "" })).toEqual('{"status":false,"error":""}');
    });
  });
});

describe("ObjectCodec.omit", () => {
  const base = Codecs.object({
    x: Codecs.bigint,
    y: Codecs.boolean,
  });

  test("called without omitted fields returns itself", () => {
    expect(base.omit()).toStrictEqual(base);
  });

  describe("omitting a field from base codec", () => {
    const codec = base.omit("y");

    safeModeTest("decodes correct matching json", codec, (codec) => {
      expect(codec.parse('{"x":1}')).toEqual({ x: 1n });
    });

    safeModeTest("fails decoding json with the omitted property", codec, (codec) => {
      expect(() => codec.parse('{"x":1,"y":true}')).toThrow(JsonCodecError);
    });
  });
});
