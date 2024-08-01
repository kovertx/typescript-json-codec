import { describe, expect } from "vitest";
import { JsonCodec, JsonCodecError, Codecs } from "../../src";
import { safeModeTest } from "./forced-safe-codec";

function simpleTests<T>(
  name: string,
  cases: Record<string, T>,
): (codec: JsonCodec<any>, expectSuccess: boolean) => void {
  return function (codec, expectSuccess) {
    if (expectSuccess) {
      safeModeTest(`${name} succeeds`, codec, (codec) => {
        for (const input in cases) expect(codec.parse(input)).toEqual(cases[input]);
      });
    } else {
      safeModeTest(`${name} fails`, codec, (codec) => {
        for (const input in cases) expect(() => codec.parse(input)).toThrow(JsonCodecError);
      });
    }
  };
}

function expectEncodeDecodeIdentity<T>(codec: JsonCodec<T>, json: string) {
  const x = codec.parse(json);
  const json2 = codec.stringify(x);
  expect(json2).toEqual(json);
}

function testEncodeDecodeIdentity<T>(codec: JsonCodec<T>, cases: Array<string>) {
  for (const json of cases) {
    safeModeTest(`encode(decode(${json})) is an identity`, codec, (codec) => {
      expectEncodeDecodeIdentity(codec, json);
    });
  }
}

const testNull = simpleTests("parsing null", {
  null: null,
});

const testBooleans = simpleTests("parsing booleans", {
  true: true,
  false: false,
});

const testStrings = simpleTests("parsing strings", {
  '""': "",
  '"hello"': "hello",
  '"123"': "123",
  '"null"': "null",
});

const testNumbers = simpleTests("parsing numbers", {
  "0": 0,
  "1": 1,
  "123": 123,
  "2498592487593": 2_498_592_487_593,
  "1.2": 1.2,
  "-1": -1,
  "1e1": 1e1,
  "1e10": 1e10,
  "-1.2485E5": -1.2485e5,
});

const testBigints = simpleTests("parsing bigints", {
  "0": 0n,
  "1": 1n,
  "123": 123n,
  "2498592487593": 2_498_592_487_593n,
  "249859248759324985924875932498592487593249859248759324985924875932498592487593":
    249_859_248_759_324_985_924_875_932_498_592_487_593_249_859_248_759_324_985_924_875_932_498_592_487_593n,
});

describe("JsonCodecs.boolean", () => {
  const codec = Codecs.boolean;

  testBooleans(codec, true);
  testStrings(codec, false);
  testNumbers(codec, false);
  testNull(codec, false);

  testEncodeDecodeIdentity(codec, ["true", "false"]);
});

describe("JsonCodecs.number", () => {
  const codec = Codecs.number;

  testBooleans(codec, false);
  testStrings(codec, false);
  testNumbers(codec, true);
  testNull(codec, false);

  testEncodeDecodeIdentity(codec, ["0", "1", "123", "-1"]);
});

describe("JsonCodecs.bigint", () => {
  const codec = Codecs.bigint;

  testBooleans(codec, false);
  testStrings(codec, false);
  testBigints(codec, true);
  testNull(codec, false);

  testEncodeDecodeIdentity(codec, ["0", "1", "123"]);
});

describe("JsonCodecs.string", () => {
  const codec = Codecs.string;

  testBooleans(codec, false);
  testStrings(codec, true);
  testNumbers(codec, false);
  testNull(codec, false);

  testEncodeDecodeIdentity(codec, ['""', '"hello"', '"123"', '"null"', '"{}"', '"[]"']);
});

describe("JsonCodecs.array", () => {
  const arrayAnyCodec = Codecs.array(Codecs.number);

  testBooleans(arrayAnyCodec, false);
  testStrings(arrayAnyCodec, false);
  testNumbers(arrayAnyCodec, false);
  testNull(arrayAnyCodec, false);

  testEncodeDecodeIdentity(arrayAnyCodec, ["[]", "[1]", "[2]", "[3]", "[1,2,3]"]);

  test("Incomplete arrays fail", () => {
    expect(() => arrayAnyCodec.parse("")).toThrow();
    expect(() => arrayAnyCodec.parse("[")).toThrow();
    expect(() => arrayAnyCodec.parse("]")).toThrow();
    expect(() => arrayAnyCodec.parse("[,,]")).toThrow();
  });
});

describe("JsonCodec.asserting", () => {
  const codec = Codecs.number.asserting((x) => {
    if (x < 0 || x > 10) throw new JsonCodecError("Out of range");
  });

  safeModeTest("decodes valid values", codec, (codec) => {
    expect(codec.parse("0")).toEqual(0);
    expect(codec.parse("5")).toEqual(5);
    expect(codec.parse("10")).toEqual(10);
  });

  safeModeTest("encodes valid values", codec, (codec) => {
    expect(codec.stringify(0)).toEqual("0");
    expect(codec.stringify(5)).toEqual("5");
    expect(codec.stringify(10)).toEqual("10");
  });

  safeModeTest("fails decoding invalid values", codec, (codec) => {
    expect(() => codec.parse("11")).toThrow(JsonCodecError);
    expect(() => codec.parse("500")).toThrow(JsonCodecError);
    expect(() => codec.parse("10000")).toThrow(JsonCodecError);
  });

  safeModeTest("fails encoding invalid values", codec, (codec) => {
    expect(() => codec.stringify(11)).toThrow(JsonCodecError);
    expect(() => codec.stringify(500)).toThrow(JsonCodecError);
    expect(() => codec.stringify(1000)).toThrow(JsonCodecError);
  });
});

describe("JsonCodec.nullable", () => {
  const stringOrNull = Codecs.string.nullable;
  const numberOrNull = Codecs.number.nullable;

  test("fails on invalid json", () => {
    expect(() => stringOrNull.parse("")).toThrow();
    expect(() => numberOrNull.parse("")).toThrow();
  });

  test("decodes null values", () => {
    expect(stringOrNull.parse("null")).toEqual(null);
    expect(numberOrNull.parse("null")).toEqual(null);
  });

  test("decodes non-null values", () => {
    expect(stringOrNull.parse('"hello world"')).toEqual("hello world");
    expect(numberOrNull.parse("123")).toEqual(123);
  });

  describe("repeated nullables", () => {
    const stringOrNullOrNull = stringOrNull.nullable;
    const numberOrNullOrNull = numberOrNull.nullable.nullable;

    test("decodes null values", () => {
      expect(stringOrNullOrNull.parse("null")).toEqual(null);
      expect(numberOrNullOrNull.parse("null")).toEqual(null);
    });

    test("decodes non-null values", () => {
      expect(stringOrNullOrNull.parse('"hello world"')).toEqual("hello world");
      expect(numberOrNullOrNull.parse("123")).toEqual(123);
    });
  });
});

describe("JsonCodecs.lazy", () => {
  describe("constructing a self-recursive codec", () => {
    type LinkedList = { value: number; next: LinkedList | null };
    const linkedListCodec: JsonCodec<LinkedList> = Codecs.lazy(() =>
      Codecs.object({
        value: Codecs.number,
        next: linkedListCodec.nullable,
      }),
    );

    safeModeTest("decodes valid json", linkedListCodec, (linkedListCodec) => {
      expect(linkedListCodec.parse('{"value":1,"next":null}')).toEqual({ value: 1, next: null });
      expect(linkedListCodec.parse('{"value":1,"next":{"value":2,"next":null}}')).toEqual({
        value: 1,
        next: { value: 2, next: null },
      });
    });

    safeModeTest("encodes valid values", linkedListCodec, (linkedListCodec) => {
      expect(linkedListCodec.stringify({ value: 1, next: null })).toEqual('{"value":1,"next":null}');
      expect(linkedListCodec.stringify({ value: 1, next: { value: 2, next: null } })).toEqual(
        '{"value":1,"next":{"value":2,"next":null}}',
      );
    });
  });

  type TypeA = { b: TypeB | null };
  type TypeB = { a: TypeA | null };

  const codecA: JsonCodec<TypeA> = Codecs.lazy(() =>
    Codecs.object({
      b: codecB.nullable,
    }),
  );
  const codecB: JsonCodec<TypeB> = Codecs.lazy(() =>
    Codecs.object({
      a: codecA.nullable,
    }),
  );

  safeModeTest("decodes mutually recursive definitions", codecA, (codecA) => {
    expect(codecA.parse('{"b":{"a":null}}')).toEqual({ b: { a: null } });
  });
});

describe("JsonCodec.branded", () => {
  const codec = Codecs.string.branded<"UUID">();

  safeModeTest("decodes values without complaint", codec, (codec) => {
    expect(codec.parse('""')).toEqual("");
  });
});

describe("JsonCodec.mapped", () => {
  const codec = Codecs.number.mapped(
    (a) => a * 2,
    (b) => b / 2,
  );

  safeModeTest("decodes expected values", codec, (codec) => {
    expect(codec.parse("1")).toEqual(2);
  });

  safeModeTest("encodes expected values", codec, (codec) => {
    expect(codec.stringify(2)).toEqual("1");
  });
});
