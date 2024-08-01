import { describe, expect } from "vitest";
import { JsonCodecError, Codecs } from "../../src";

import { safeModeTest } from "./forced-safe-codec";

describe("TupleCodec", () => {
  describe("for empty tuple", () => {
    const codec = Codecs.tuple([]);

    safeModeTest("fails decoding non-array", codec, (codec) => {
      expect(() => codec.parse("{}")).toThrow(JsonCodecError);
      expect(() => codec.parse("null")).toThrow(JsonCodecError);
    });

    safeModeTest("decodes empty array", codec, (codec) => {
      expect(codec.parse("[]")).toEqual([]);
    });

    safeModeTest("fails decoding array with values", codec, (codec) => {
      expect(() => codec.parse("[1]")).toThrow(JsonCodecError);
      expect(() => codec.parse("[null]")).toThrow(JsonCodecError);
      expect(() => codec.parse("[true]")).toThrow(JsonCodecError);
      expect(() => codec.parse("[null, null]")).toThrow(JsonCodecError);
      expect(() => codec.parse("[1,2,3,4]")).toThrow(JsonCodecError);
      expect(() => codec.parse("[[]]")).toThrow(JsonCodecError);
      expect(() => codec.parse("[{}]")).toThrow(JsonCodecError);
    });

    safeModeTest("encodes empty tuple", codec, (codec) => {
      expect(codec.stringify([])).toEqual("[]");
    });
  });

  describe("for singleton tuple", () => {
    const codec = Codecs.tuple([Codecs.number]);

    safeModeTest("fails decoding empty array", codec, (codec) => {
      expect(() => codec.parse("[]")).toThrow(JsonCodecError);
    });

    safeModeTest("decodes matching arrays", codec, (codec) => {
      expect(codec.parse("[1]")).toEqual([1]);
      expect(codec.parse("[10249]")).toEqual([10_249]);
      expect(codec.parse("[-1]")).toEqual([-1]);
      expect(codec.parse("[1.2489e5]")).toEqual([1.2489e5]);
    });

    safeModeTest("encodes singleton tuple", codec, (codec) => {
      expect(codec.stringify([1])).toEqual("[1]");
    });
  });

  describe("for multipart tuple", () => {
    const codec = Codecs.tuple([Codecs.boolean, Codecs.string]);

    safeModeTest("fails decoding empty array", codec, (codec) => {
      expect(() => codec.parse("[]")).toThrow(JsonCodecError);
    });

    safeModeTest("fails decoding incomplete tuples", codec, (codec) => {
      expect(() => codec.parse("[true]")).toThrow(JsonCodecError);
      expect(() => codec.parse("[false]")).toThrow(JsonCodecError);
      expect(() => codec.parse('["hello"]')).toThrow(JsonCodecError);
    });

    safeModeTest("decodes valid tuples", codec, (codec) => {
      expect(codec.parse('[true,""]')).toEqual([true, ""]);
      expect(codec.parse('[false,"true"]')).toEqual([false, "true"]);
      expect(codec.parse('[true,"false"]')).toEqual([true, "false"]);
    });

    safeModeTest("encodes valid tuples", codec, (codec) => {
      expect(codec.stringify([true, ""])).toEqual('[true,""]');
    });
  });
});
