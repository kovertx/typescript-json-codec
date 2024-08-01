import { expect } from "vitest";
import { Codecs } from "../../src";
import { safeModeTest } from "./forced-safe-codec";

describe("ArrayCodec", () => {
  const codec = Codecs.array(Codecs.number);

  safeModeTest("parses empty arrays", codec, (codec) => {
    expect(codec.parse("[]")).toEqual([]);
  });

  safeModeTest("parses arrays", codec, (codec) => {
    expect(codec.parse("[1]")).toEqual([1]);
    expect(codec.parse("[1, 2]")).toEqual([1, 2]);
    expect(codec.parse("[1,2,3]")).toEqual([1, 2, 3]);
    expect(codec.parse("[1,4,1,599949]")).toEqual([1, 4, 1, 599_949]);
  });
});
