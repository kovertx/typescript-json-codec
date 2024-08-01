import { JsonCodecError } from "./errors";
import { JsonCodec } from "./json-codec";
import { isSafeJsonArray, isUnsafeJsonArray, SafeJson, SafeOutArray, UnsafeJson } from "./safe-json";

export type TupleCodecs<T extends any[]> = { [K in keyof T]: JsonCodec<T[K]> };

export class TupleCodec<T extends any[]> extends JsonCodec<T> {
  constructor(private readonly codecs: TupleCodecs<T>) {
    super();
  }

  protected override get selfExpectsBigInts() {
    return false;
  }

  protected override *dependencies(): Generator<JsonCodec<any>> {
    for (let i = 0; i < this.codecs.length; i++) {
      yield this.codecs[i];
    }
  }
  decode(src: SafeJson): T {
    if (!isSafeJsonArray(src)) throw new JsonCodecError("Expected JSON array");
    if (src.length !== this.codecs.length) throw new JsonCodecError(`Expected JSON array length=${this.codecs.length}`);

    const tuple = Array.from({ length: this.codecs.length }) as T;
    for (let i = 0; i < this.codecs.length; ++i) {
      tuple[i] = this.codecs[i].decode(src[i]) as T[typeof i];
    }
    return tuple;
  }

  override decodeUnsafe(src: UnsafeJson): T {
    if (!isUnsafeJsonArray(src)) throw new JsonCodecError("Expected JSON array");
    if (src.length !== this.codecs.length) throw new JsonCodecError(`Expected JSON array length=${this.codecs.length}`);

    const tuple = Array.from({ length: this.codecs.length }) as T;
    for (let i = 0; i < this.codecs.length; ++i) {
      tuple[i] = this.codecs[i].decodeUnsafe(src[i]) as T[typeof i];
    }
    return tuple;
  }

  override encode(x: T): SafeOutArray {
    const tuple = Array.from({ length: this.codecs.length }) as SafeOutArray;
    for (let i = 0; i < this.codecs.length; ++i) {
      tuple[i] = this.codecs[i].encode(x[i]);
    }
    return tuple;
  }
}
