import { JsonValidationError } from "./errors";
import { _safeJsonNumeric, SafeJson, SafeOutJson, UnsafeJson } from "./safe-json";

export declare const _brand: unique symbol;
export type Branded<T, Brand> = T & { [_brand]: Brand };

function makeNumbersSafe(_: any, value: any, context?: any): SafeJson {
  return typeof value === "number"
    ? { [_safeJsonNumeric]: value, source: (context as { source: string }).source }
    : (value as SafeJson);
}

/**
 * Base class for all JsonCodecs. A JsonCodec provides methods for encoding and decoding JSON.
 */
export abstract class JsonCodec<T> {
  private _cachedNullable: NullableCodec<T> | undefined;
  private _cachedOptional: OptionalPropertyHint<T> | undefined;
  private _selfOrDescendentExpectsBigInts: boolean | undefined;

  protected abstract selfExpectsBigInts: boolean;
  protected *dependencies(): Generator<JsonCodec<any>> {}

  private get selfOrDescendentExpectsBigInts(): boolean {
    if (this._selfOrDescendentExpectsBigInts === undefined) {
      const explored = new WeakSet<JsonCodec<any>>();
      const frontier = new Array<JsonCodec<any>>();

      this._selfOrDescendentExpectsBigInts = false;
      for (let next: JsonCodec<any> | undefined = this; next != undefined; next = frontier.pop()) {
        explored.add(next);
        if (next.selfExpectsBigInts) {
          this._selfOrDescendentExpectsBigInts = true;
          break;
        }
        for (const dependency of next.dependencies()) {
          if (explored.has(dependency)) continue;
          frontier.push(dependency);
        }
      }
    }
    return this._selfOrDescendentExpectsBigInts;
  }

  abstract decode(src: SafeJson): T;

  abstract decodeUnsafe(src: UnsafeJson): T;

  /**
   * Transform to safe JSON output structure
   */
  abstract encode(x: T): SafeOutJson;

  stringify(x: T): string {
    return JSON.stringify(this.encode(x));
  }

  parse(src: string, forceSafeDecoding?: boolean): T {
    return forceSafeDecoding || this.selfOrDescendentExpectsBigInts
      ? this.decode(JSON.parse(src, makeNumbersSafe) as SafeJson)
      : this.decodeUnsafe(JSON.parse(src) as UnsafeJson);
  }

  /**
   * Checks input/output functions against
   * @param validator
   */
  asserting<T2 extends T = T>(validator: (x: T) => asserts x is T2) {
    return new ValidationCodec(this, validator);
  }

  validating<T2 extends T = T>(validator: (x: T) => x is T2, message: string = "Validation failed") {
    return this.asserting((x: T): asserts x is T2 => {
      if (!validator(x)) throw new JsonValidationError(message);
    });
  }

  /**
   * Get the nullable equivalent of this codec -- a codec that accepts `null` OR the original type T.
   */
  get nullable(): NullableCodec<T> {
    // if this happens to be a nullable codec already there's no point wrapping again, `T | null | null` is equivalent
    // to `T | null`.
    this._cachedNullable =
      this._cachedNullable ?? this instanceof NullableCodec
        ? (this as unknown as NullableCodec<T>)
        : new NullableCodec(this);
    return this._cachedNullable;
  }

  /**
   * Mark this codec as "optional". This is primarily meant for use in other codecs. For example, an ObjectCodec take
   * an object mapping properties to codecs or an OptionalPropertyHint, which is used to indicate a property doesn't
   * need to be present on the object.
   */
  optional(): OptionalPropertyHint<T> {
    this._cachedOptional = this._cachedOptional ?? new OptionalPropertyHint<T>(this);
    return this._cachedOptional;
  }

  /**
   * Create a new codec which maps between two different representations. For example, a "URL" codec might encode as a
   * string on-the-wire, then parse into a URL object.
   *
   * Note that while not strictly enforced, it is recommended that the map/inverse functions e isomorphic.
   * @param map function that maps from input to output type
   * @param inverse function that maps from output to input type
   */
  mapped<T2>(map: (a: T) => T2, inverse: (b: T2) => T): MappedCodec<T, T2> {
    return new MappedCodec(this, map, inverse);
  }

  /**
   * Applies branding to the codec, without validation (modification to type signature but not runtime constraints)
   */
  branded<V>(): JsonCodec<Branded<T, V>> {
    return this as JsonCodec<Branded<T, V>>;
  }
}

export class OptionalPropertyHint<T> {
  constructor(readonly propertyCodec: JsonCodec<T>) {}
}

/**
 * Utility codec wraps another, allowing for null values to be accepted.
 */
export class NullableCodec<T> extends JsonCodec<T | null> {
  protected override get selfExpectsBigInts() {
    return false;
  }

  protected override *dependencies(): Generator<JsonCodec<any>> {
    yield this.valueCodec;
  }

  constructor(private readonly valueCodec: JsonCodec<T>) {
    super();
  }

  decode(src: SafeJson): T | null {
    if (src === null) return null;
    return this.valueCodec.decode(src);
  }

  override decodeUnsafe(src: UnsafeJson): T | null {
    if (src === null) return null;
    return this.valueCodec.decodeUnsafe(src);
  }

  encode(x: T | null): SafeOutJson {
    if (x === null) return null;
    return this.valueCodec.encode(x);
  }
}

export class MappedCodec<A, B> extends JsonCodec<B> {
  protected override get selfExpectsBigInts() {
    return false;
  }

  protected override *dependencies(): Generator<JsonCodec<any>> {
    yield this.a;
  }

  constructor(
    private readonly a: JsonCodec<A>,
    private readonly map: (a: A) => B,
    private readonly inverse: (b: B) => A,
  ) {
    super();
  }

  override decode(src: SafeJson): B {
    return this.map(this.a.decode(src));
  }

  override decodeUnsafe(src: UnsafeJson): B {
    return this.map(this.a.decodeUnsafe(src));
  }

  encode(x: B): SafeOutJson {
    return this.a.encode(this.inverse(x));
  }
}

export class ValidationCodec<T, T2 extends T = T> extends JsonCodec<T2> {
  protected override get selfExpectsBigInts() {
    return false;
  }

  protected override *dependencies(): Generator<JsonCodec<any>> {
    yield this.codec;
  }

  constructor(
    private readonly codec: JsonCodec<T>,
    readonly validate: (x: T) => asserts x is T2,
  ) {
    super();
  }

  override decode(src: SafeJson): T2 {
    const x = this.codec.decode(src);
    this.validate(x);
    return x;
  }

  override decodeUnsafe(src: UnsafeJson): T2 {
    const x = this.codec.decodeUnsafe(src);
    this.validate(x);
    return x;
  }

  override encode(x: T2): SafeOutJson {
    this.validate(x);
    return this.codec.encode(x);
  }
}

/**
 * A codec that resolves to another codec as needed in encode/decode methods. More generally this allows constructing
 * recursive codecs -- the LazyCodec wrapper can be constructed without calling the factory function. The factory fn
 * is called only after that point, so it's possible to reference other codec instances (including itself).
 */
export class LazyCodec<T> extends JsonCodec<T> {
  private impl_: JsonCodec<T> | undefined;
  constructor(private readonly factory: () => JsonCodec<T>) {
    super();
  }

  protected override get selfExpectsBigInts() {
    return false;
  }

  protected override *dependencies(): Generator<JsonCodec<any>> {
    yield this.impl;
  }

  private get impl(): JsonCodec<T> {
    if (this.impl_ === undefined) {
      this.impl_ = this.factory();
    }
    return this.impl_;
  }

  override decode(src: SafeJson): T {
    return this.impl.decode(src);
  }

  override decodeUnsafe(src: SafeJson): T {
    return this.impl.decodeUnsafe(src);
  }

  override encode(x: T): SafeOutJson {
    return this.impl.encode(x);
  }
}
