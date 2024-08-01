// import { JsonCodec } from "@src/json-codec/json-codec";
// import { ErrNew } from "@src/json-codec/json-token-iterator";
//
// export type CodecKey<T> = { readonly name: string; readonly defaultCodec?: JsonCodec<T> };
//
// export function declareCodec<T>(name: string, defaultCodec?: JsonCodec<T>): CodecKey<T> {
//   return { name, defaultCodec };
// }
//
// export class CodecMapper {
//   private readonly _boundCodecs = new WeakMap<CodecKey<any>, JsonCodec<any>>();
//
//   bind<T>(key: CodecKey<T>, codec: JsonCodec<T>) {
//     this._boundCodecs.set(key, codec);
//   }
//
//   get<T>(key: CodecKey<T>, err: ErrNew): JsonCodec<T> {
//     let codec = this._boundCodecs.get(key);
//     if (codec === undefined) {
//       codec = key.defaultCodec;
//       if (codec === undefined) throw new err(`Unable to locate codec ${key.name}`);
//       this._boundCodecs.set(key, codec);
//     }
//     return codec as JsonCodec<T>;
//   }
// }
