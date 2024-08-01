import { JsonCodecError } from "./errors";
import { JsonCodec } from "./json-codec";
import {
  _safeJsonNumeric,
  encodeBigInt,
  isSafeJsonNumeric,
  isUnsafeJsonNumeric,
  SafeJson,
  SafeOutJson,
  UnsafeJson,
} from "./safe-json";

export type LiteralType = string | number | boolean | null | bigint;

/**
 * A codec that only accepts a single literal value.
 *
 * For example:
 *
 * ````
 * new LiteralCodec("a") // JsonCodec<"a">
 * new LiteralCodec(true) // JsonCodec<true>
 * new LiteralCodec(123) // JsonCodec<123>
 * ````
 */
export class LiteralNumberCodec<T extends number> extends JsonCodec<T> {
  constructor(private readonly literal: T) {
    super();
  }

  protected override get selfExpectsBigInts() {
    return false;
  }

  decode(src: SafeJson): T {
    if (!isSafeJsonNumeric(src) || src[_safeJsonNumeric] !== this.literal)
      throw new JsonCodecError(`Expected number literal ${this.literal}`);
    return this.literal;
  }

  decodeUnsafe(src: UnsafeJson): T {
    if (!isUnsafeJsonNumeric(src) || src !== this.literal)
      throw new JsonCodecError(`Expected number literal ${this.literal}`);
    return this.literal;
  }

  override encode(x: T): SafeOutJson {
    if (x !== this.literal) throw new JsonCodecError(`Expected number literal ${this.literal}`);
    return x;
  }
}

export class LiteralBigIntCodec<T extends bigint> extends JsonCodec<T> {
  constructor(private readonly literal: T) {
    super();
  }

  protected override get selfExpectsBigInts() {
    return true;
  }

  decode(src: SafeJson): T {
    if (!isSafeJsonNumeric(src) || BigInt(src.source) !== this.literal)
      throw new JsonCodecError(`Expected bigint literal ${this.literal}`);
    return this.literal;
  }

  override decodeUnsafe(): T {
    throw new JsonCodecError("Cannot decode BigInt literal in unsafe mode");
  }

  override encode(x: T): SafeOutJson {
    if (x !== this.literal) throw new JsonCodecError(`Expected bigint literal ${this.literal}`);
    return encodeBigInt(x);
  }
}

export class LiteralOtherCodec<T extends Exclude<LiteralType, number | bigint>> extends JsonCodec<T> {
  constructor(private readonly literal: T) {
    super();
  }

  protected override get selfExpectsBigInts() {
    return false;
  }

  override decode(src: SafeJson): T {
    if (src !== this.literal) throw new JsonCodecError(`Expected literal ${this.literal}`);
    return this.literal;
  }

  override decodeUnsafe(src: UnsafeJson): T {
    if (src !== this.literal) throw new JsonCodecError(`Expected literal ${this.literal}`);
    return this.literal;
  }

  override encode(x: T): SafeOutJson {
    if (x !== this.literal) throw new JsonCodecError(`Expected literal ${this.literal}`);
    return this.literal;
  }
}
