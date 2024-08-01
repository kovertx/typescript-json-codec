import { ArrayCodec } from "./array-codec";
import { DiscriminatedCodecBuilder } from "./discriminated-object-codec";
import { JsonCodec, LazyCodec } from "./json-codec";
import { LiteralBigIntCodec, LiteralNumberCodec, LiteralOtherCodec, LiteralType } from "./literal-codecs";
import { ObjectCodec, ObjectCodecFields } from "./object-codec";
import { BigIntCodec, BooleanCodec, NumberCodec, StringCodec } from "./primitive-codecs";
import { TupleCodec, TupleCodecs } from "./tuple-codec";
import { TypedArrayCodecs } from "./typed-array-codecs";
import { UnionCodec, UnionCodecs } from "./union-codec";
import { assertValidUuid } from "./uuid";
import { EnumCodec } from "./enum-codec";

/**
 * A collection of standard codecs
 */
export const JsonCodecs = {
  number: new NumberCodec(),
  bigint: new BigIntCodec(),
  string: new StringCodec(),
  boolean: new BooleanCodec(),
  uuid: new StringCodec().asserting(assertValidUuid),
  literal<K extends LiteralType>(lit: K): JsonCodec<K> {
    if (typeof lit === "bigint") {
      return new LiteralBigIntCodec(lit) as JsonCodec<K>;
    } else if (typeof lit === "number") {
      return new LiteralNumberCodec(lit) as JsonCodec<K>;
    } else {
      return new LiteralOtherCodec(lit) as unknown as JsonCodec<K>;
    }
  },
  enum<T extends Record<string, string | number>>(enumLiteral: T) {
    return new EnumCodec(enumLiteral);
  },
  tuple<T extends any[]>(codecs: TupleCodecs<T>) {
    return new TupleCodec(codecs);
  },
  array<T>(itemCodec: JsonCodec<T>) {
    return new ArrayCodec<T>(itemCodec);
  },
  object<T>(properties: ObjectCodecFields<T>) {
    return new ObjectCodec<T>(properties);
  },
  discriminated<K extends string>(discriminator: K) {
    return new DiscriminatedCodecBuilder(discriminator);
  },
  union<T extends readonly [unknown, ...unknown[]]>(codecs: UnionCodecs<T>) {
    return new UnionCodec(codecs);
  },
  lazy<T>(factory: () => JsonCodec<T>) {
    return new LazyCodec(factory);
  },
  recursive<T>(propertyFactory: (self: JsonCodec<T>) => ObjectCodecFields<T>) {
    const self: JsonCodec<T> = this.lazy<T>(() => new ObjectCodec(propertyFactory(self)));
    return self;
  },
  ...TypedArrayCodecs,
} as const;
export const Codecs = JsonCodecs;
export const JC = Codecs;
export const C = JC;
