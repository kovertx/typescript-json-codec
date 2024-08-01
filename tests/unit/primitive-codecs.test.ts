import { Codecs, JsonValidationError } from "../../src";

import { safeModeTest } from "./forced-safe-codec";

describe("StringCodec.matching", () => {
  const codec = Codecs.string.matching(/^[a-z]+$/);

  safeModeTest("parse accepts matched strings", codec, (codec) => {
    expect(codec.parse('"a"')).toEqual("a");
    expect(codec.parse('"abc"')).toEqual("abc");
    expect(codec.parse('"abbcdakjnakd"')).toEqual("abbcdakjnakd");
  });

  safeModeTest("parse rejects unmatched strings", codec, (codec) => {
    expect(() => codec.parse('""')).toThrow(JsonValidationError);
    expect(() => codec.parse('"1"')).toThrow(JsonValidationError);
    expect(() => codec.parse('"ab1"')).toThrow(JsonValidationError);
  });
});
