import { test } from "vitest";
import { JsonCodec, SafeOutJson, SafeJson } from "../../src";

export class ForcedSafeCodec<T> extends JsonCodec<T> {
  constructor(private readonly codec: JsonCodec<T>) {
    super();
  }

  decode(src: SafeJson): T {
    return this.codec.decode(src);
  }

  decodeUnsafe(): T {
    throw new Error("Unexpected test failure, attempted forcing safe decoding but decodeUnsafe was called");
  }

  encode(x: T): SafeOutJson {
    return this.codec.encode(x);
  }

  protected get selfExpectsBigInts(): boolean {
    // enforces safe mode decoding by claiming to require bigint handling
    return true;
  }
}

export function safeModeTest<T>(name: string, codec: JsonCodec<T>, fn: (codec: JsonCodec<T>) => any) {
  test(name, () => fn(codec));
  test(`[SAFE DECODE] ${name}`, () => fn(new ForcedSafeCodec(codec)));
}
