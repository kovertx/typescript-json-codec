import { JsonCodecError } from "./errors";
import { JsonCodec } from "./json-codec";
import { LiteralType } from "./literal-codecs";
import {
  isSafeJsonObject,
  isUnsafeJsonObject,
  SafeJson,
  SafeJsonObject,
  SafeOutJson,
  UnsafeJson,
} from "./safe-json";

export class DiscriminatedCodecBuilder<K extends string, T = never> {
  private readonly codecs: Map<any, JsonCodec<any>> = new Map();

  constructor(private readonly discriminator: K) {}

  associate<V extends LiteralType, TNew extends Record<K, V>>(
    v: V,
    codec: JsonCodec<TNew>,
  ): DiscriminatedCodecBuilder<K, T | TNew> {
    this.codecs.set(v, codec);
    return this as DiscriminatedCodecBuilder<K, T | TNew>;
  }

  build(): JsonCodec<T> {
    return new DiscrimatedObjectCodec<T, K>(this.discriminator, this.codecs);
  }
}

/**
 * Discriminated objects are unions of object types that have a common key (the discriminator) with different literal
 * values. For example, the type `{ t: "a", a: number } | { t: "b", b: boolean }` can rely on the property "t" to
 * decide which sort of concrete object structure to expect.
 *
 * This codec will examine values to find the discriminator value, and select a sub-codec appropriate to that type.
 */
export class DiscrimatedObjectCodec<T, K extends string> extends JsonCodec<T> {
  constructor(
    private readonly discriminator: K,
    private readonly codecs: Map<any, JsonCodec<any>>,
  ) {
    super();
  }

  protected override get selfExpectsBigInts() {
    return false;
  }

  protected override *dependencies(): Generator<JsonCodec<any>> {
    for (const dependency of this.codecs.values()) {
      yield dependency;
    }
  }

  override decode(src: SafeJson): T {
    if (!isSafeJsonObject(src)) throw new JsonCodecError("Expected JSON object");
    const src2 = src as SafeJsonObject;

    const discriminatorValue = src2[this.discriminator];
    if (discriminatorValue === undefined)
      throw new JsonCodecError(`Missing discriminator property ${this.discriminator}`);

    const selectedCodec = this.codecs.get(discriminatorValue);
    if (selectedCodec === undefined)
      throw new JsonCodecError(`Unknown discriminator value ${discriminatorValue as string}`);

    return selectedCodec.decode(src) as T;
  }

  override decodeUnsafe(src: UnsafeJson): T {
    if (!isUnsafeJsonObject(src)) throw new JsonCodecError("Expected JSON object");
    const src2 = src;

    const discriminatorValue = src2[this.discriminator];
    if (discriminatorValue === undefined)
      throw new JsonCodecError(`Missing discriminator property ${this.discriminator}`);

    const selectedCodec = this.codecs.get(discriminatorValue);
    if (selectedCodec === undefined)
      throw new JsonCodecError(`Unknown discriminator value ${discriminatorValue as string}`);

    return selectedCodec.decodeUnsafe(src) as T;
  }

  override encode(x: T): SafeOutJson {
    const value: any = (x as Record<string, any>)[this.discriminator];
    const codec = this.codecs.get(value);
    if (codec === undefined) {
      throw new JsonCodecError(`Discriminator value '${value} not associated with a codec`);
    }
    return codec.encode(x);
  }
}
