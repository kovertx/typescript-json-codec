import { JsonCodecError } from "./errors";
import { JsonCodec } from "./json-codec";
import { isSafeJsonArray, isUnsafeJsonArray, SafeJson, SafeOutArray, UnsafeJson } from "./safe-json";

export class ArrayCodec<T> extends JsonCodec<Array<T>> {
  constructor(private readonly itemCodec: JsonCodec<T>) {
    super();
  }

  protected override get selfExpectsBigInts() {
    return false;
  }

  protected override *dependencies(): Generator<JsonCodec<any>> {
    yield this.itemCodec;
  }

  override decode(src: SafeJson): Array<T> {
    if (!isSafeJsonArray(src)) throw new JsonCodecError("Expected JSON array");
    return src.map((item) => this.itemCodec.decode(item));
  }

  override decodeUnsafe(src: UnsafeJson): Array<T> {
    if (!isUnsafeJsonArray(src)) throw new JsonCodecError("Expected JSON array");
    return src.map((item) => this.itemCodec.decodeUnsafe(item));
  }

  override encode(x: Array<T>): SafeOutArray {
    return x.map((item) => this.itemCodec.encode(item));
  }
}
