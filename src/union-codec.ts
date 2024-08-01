import { JsonCodecError } from "./errors";
import { JsonCodec } from "./json-codec";
import { SafeJson, SafeOutJson, UnsafeJson } from "./safe-json";

export type UnionCodecs<T extends readonly [unknown, ...unknown[]]> = {
  [K in keyof T]: JsonCodec<T[K]>;
};

/**
 * A codec that will try to encode/decode a value using multiple alternative codecs.
 */
export class UnionCodec<T extends readonly [unknown, ...unknown[]]> extends JsonCodec<T[number]> {
  constructor(private readonly options: UnionCodecs<T>) {
    super();
  }

  protected override get selfExpectsBigInts() {
    return false;
  }

  protected override *dependencies(): Generator<JsonCodec<any>> {
    for (let i = 0; i < this.options.length; i++) {
      yield this.options[i];
    }
  }

  decode(src: SafeJson): T[number] {
    for (let i = 0; i < this.options.length; i++) {
      try {
        return this.options[i].decode(src);
      } catch {
        // continue
      }
    }
    throw new JsonCodecError("All union branches failed to decode");
  }

  decodeUnsafe(src: UnsafeJson): T[number] {
    for (let i = 0; i < this.options.length; i++) {
      try {
        return this.options[i].decodeUnsafe(src);
      } catch {
        // continue
      }
    }
    throw new JsonCodecError("All union branches failed to decode");
  }

  encode(x: T[number]): SafeOutJson {
    for (let i = 0; i < this.options.length; i++) {
      try {
        return this.options[i].encode(x);
      } catch {
        // continue
      }
    }
    throw new JsonCodecError("All union branches failed to encode");
  }
}
