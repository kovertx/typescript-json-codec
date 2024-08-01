import { describe, expect } from "vitest";
import { Codecs, JsonCodecError } from "../../src";
import { safeModeTest } from "./forced-safe-codec";

describe("Codecs.recursive", () => {
  type LinkedList = { value: number; next: LinkedList | null };
  const linkedListCodec = Codecs.recursive<LinkedList>((self) => ({
    value: Codecs.number,
    next: self.nullable,
  }));

  safeModeTest("decodes self-recursive definitions", linkedListCodec, (linkedListCodec) => {
    expect(linkedListCodec.parse('{"value":1,"next":null}')).toEqual({ value: 1, next: null });
    expect(linkedListCodec.parse('{"value":1,"next":{"value":2,"next":null}}')).toEqual({
      value: 1,
      next: { value: 2, next: null },
    });
  });
});

describe("Codecs.uuid", () => {
  const codec = Codecs.uuid;

  safeModeTest("decodes UUIDs", codec, (codec) => {
    expect(() => codec.parse('"0000"')).toThrow(JsonCodecError);
  });
});
