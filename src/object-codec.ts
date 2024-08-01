import { JsonCodecError } from "./errors";
import { JsonCodec, OptionalPropertyHint } from "./json-codec";
import {
  isSafeJsonObject,
  isUnsafeJsonObject,
  SafeJson,
  SafeJsonObject,
  SafeOutJson,
  SafeOutObject,
  UnsafeJson,
} from "./safe-json";

/**
 * The configuration object for an ObjectCodec<T>. This itself an object, with one property per property on T. Most
 * property values should be a JsonCodec<X>, where X matches the type of the corresponding property value on T. The
 * exception is optional properties, which should be a JsonCodec wrapped in an OptionalPropertyHint object.
 */
export type ObjectCodecFields<T> = {
  [key in keyof T]: undefined extends T[key] ? OptionalPropertyHint<Exclude<T[key], undefined>> : JsonCodec<T[key]>;
};

interface PropertyCodec<T> {
  readonly codec: JsonCodec<T>;
  readonly required: boolean;
}

/**
 * A codec dealing in "plain" objects -- things encoded as JSON object, and decoded as simple Object types, generally
 * with 1:1 mapping of properties.
 *
 * For example:
 *
 * ````
 * new ObjectCodec({ x: Codecs.string }); // JsonCodec<{ x: string }>
 * new ObjectCodec({ x: Codecs.string, y: Codecs.number.optional() }) // JsonCodec<{ x: string, y?: number }>
 * ````
 */
export class ObjectCodec<T> extends JsonCodec<T> {
  private readonly propertyCodecs: Map<keyof T, PropertyCodec<T[keyof T]>>;
  private readonly nRequiredProperties: number;

  constructor(fieldCodecs: ObjectCodecFields<T>) {
    super();
    this.propertyCodecs = new Map();
    let nReq = 0;
    for (const key in fieldCodecs) {
      const codec = fieldCodecs[key] as unknown as JsonCodec<T[keyof T]> | OptionalPropertyHint<T[keyof T]>;
      if (codec instanceof OptionalPropertyHint) {
        this.propertyCodecs.set(key, { codec: codec.propertyCodec, required: false });
      } else {
        this.propertyCodecs.set(key, { codec: codec, required: true });
        ++nReq;
      }
    }
    this.nRequiredProperties = nReq;
  }

  protected override get selfExpectsBigInts() {
    return false;
  }

  protected override *dependencies(): Generator<JsonCodec<any>> {
    for (const propertyCodec of this.propertyCodecs) {
      yield propertyCodec[1].codec;
    }
  }

  decode(src: SafeJson): T {
    if (!isSafeJsonObject(src)) throw new JsonCodecError("Expecting an object");

    const result = src as unknown as T;
    let nRequiredPropertiesObserved = 0;
    for (const property in src) {
      const propertyCodec = this.propertyCodecs.get(property as keyof T);
      if (propertyCodec === undefined) throw new JsonCodecError(`Unexpected property ${property}`);
      if (propertyCodec.required) nRequiredPropertiesObserved++;

      result[property as keyof T] = propertyCodec.codec.decode((src as SafeJsonObject)[property]);
    }

    if (nRequiredPropertiesObserved != this.nRequiredProperties) {
      throw new JsonCodecError("missing required fields");
    }

    return result;
  }

  decodeUnsafe(src: UnsafeJson): T {
    if (!isUnsafeJsonObject(src)) throw new JsonCodecError("Expecting an object");

    const result = src as unknown as T;
    let nRequiredPropertiesObserved = 0;
    for (const property in src) {
      const propertyCodec = this.propertyCodecs.get(property as keyof T);
      if (propertyCodec === undefined) throw new JsonCodecError(`Unexpected property ${property}`);
      if (propertyCodec.required) nRequiredPropertiesObserved++;

      result[property as keyof T] = propertyCodec.codec.decodeUnsafe((src as SafeJsonObject)[property]);
    }

    if (nRequiredPropertiesObserved != this.nRequiredProperties) {
      throw new JsonCodecError("missing required fields");
    }

    return result;
  }

  encode(x: T): SafeOutJson {
    const output = {} as SafeOutObject;
    let nRequiredPropertiesEncoded = 0;

    for (const property in x) {
      const propertyCodec = this.propertyCodecs.get(property);
      if (propertyCodec === undefined) throw new JsonCodecError(`Unexpected property ${property}`);
      output[property] = propertyCodec.codec.encode(x[property]);
      if (propertyCodec.required) ++nRequiredPropertiesEncoded;
    }

    if (nRequiredPropertiesEncoded != this.nRequiredProperties) {
      throw new JsonCodecError("Missing required properties on object");
    }

    return output;
  }

  /**
   * Creates a new ObjectCodec omitting a set of given properties.
   *
   * For example:
   *
   * ````
   * new ObjectCodec({ a: Codecs.string, b: Codecs.number }).omit("a") // JsonCodec<{ b: number }>
   * ````
   * @param omittedProperties
   */
  omit<K extends keyof T>(...omittedProperties: Array<K>): ObjectCodec<Omit<T, K>> {
    if (omittedProperties.length === 0) return this as unknown as ObjectCodec<Omit<T, K>>;

    const props: Record<string, any> = {};
    function isRetained(property: keyof T): property is Exclude<keyof T, K> {
      return !omittedProperties.includes(property as K);
    }

    for (const [property, propertyCodec] of this.propertyCodecs.entries()) {
      if (!isRetained(property)) continue;
      props[property as string] = propertyCodec.required ? propertyCodec.codec : propertyCodec.codec.optional();
    }

    return new ObjectCodec<Omit<T, K>>(props as ObjectCodecFields<Omit<T, K>>);
  }
}
