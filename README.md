<h1 align="center">typescript-json-codec</h1>

<p align="center">Safe JSON parsing and serialization.</p>

## Motivation

````typescript
const x: bigint = JsonCodecs.bigint.parse("123");
const y: Float32Array = TypedArrayCodecs.Float32Array.parse("[1,2,3]");
````

There's more, but those examples show an important feature: you can parse JSON into the structures you expect.

Critically, we don't use JSON.parse or JSON.stringify unless it's safe to do so. If you decode a `bigint`, it doesn't
get parsed as a `number` first (a potentially lossy conversion).

## At a Glance

````typescript
import { JsonCodecs } from "json-codec";

interface User {
    name: string
    email: string
}

const usersCodec = JsonCodecs.objectAsMap(JsonCodecs.object<User>({
    name: JsonCodecs.string,
    email: JsonCodecs.string
}))

// fails, 123 isn't a string
const s: string = JsonCodecs.string.parse('123')

// fails, "123" isn't a number
const n: number = JsonCodecs.number.parse('"123"')

// yep
const users: Map<string, User> = usersCodec.parse('{"001":{"name":"Bob","email":"bob@loblaw.com"}}')

// 12345678901234567890123456789012345678901234567890123456789012345678901234567890n -- an actual bigint
const big: bigint = JsonCodecs.bigint.parse('12345678901234567890123456789012345678901234567890123456789012345678901234567890')
````

## Installation

TODO

## Basic Usage

Using primitive codecs.

````typescript
import { Codecs } from "typescript-json-codec";

Codecs.string.parse('"Hello, World!"') // => "Hello, World!"
Codecs.number.parse("123") // => 123
Codecs.boolean.parse("true") // => true
````

Defining an object codec.

````typescript
import { Codecs } from "typescript-json-codec";

const userCodec = Codecs.object({
  name: Codecs.string,
  email: Codecs.string.optional()
});

userCodec.parse('{"name":"admin"}') // => { name: "admin" }
userCodec.parse('{"name":"admin","email":"root@admin.com"}') // => { name: "admin", email: "root@admin.com" }
````

Defining a tuple codec.

```typescript
import { Codecs } from "typescript-json-codec";

const tupleCodec = Codecs.tuple(Codecs.string, Codecs.number);

tupleCodec.parse('["hello",42]'); // => ["hello", 42]
```

## Recursive Codecs

Codecs for recursive types need a way to reference codecs that don't exist (yet).The `LazyCodec` helper allows us to define a codec that won't be instantiated until needed.

````typescript
type LinkedList = { value: number, next?: LinkedList };

const linkedListCodec = Codecs.lazy(() => Codecs.object({
  value: Codecs.number,
  next: linkedListCodec.optional()
}));

linkedListCodec.parse('{"value":1}'); // => { value: 1 }
linkedListCodec.parse('{"value":1,"next":{"value":2}}'); // => { value: 1, next: { value: 2 } }
````

Mutual recursion works similarly:

````typescript
type NodeA = [NodeB | null, number];
type NodeB = [NodeA | null, NodeB | null];

const codecA = Codecs.lazy(() => Codecs.tuple(codecB.nullable, Codecs.number));
const codecB = Codecs.lazy(() => Codecs.tuple(codecA.nullable, codecB.nullable))
````

## Validation

JsonCodecs define a simple helper for defining additional validation logic beyond the "does it match structurally".

Validate functions are type-asserting function, and should throw an error if constraints aren't met.

````typescript
import { Codecs, JsonValidationError } from "typescript-json-codecs";

const usernameCodec = Codecs.string.validating(s => {
  if (s.length < 3 || s.length > 6) throw new JsonValidationError("username must be 3-6 characters");
});

usernameCodec.parse('""'); // => throws JsonValidationError
usernameCodec.parse('"root"'); // => "root"
````

Validation functions can be used to refine the type, for example:

````typescript
import { Codecs } from "typescript-json-codec";

// a form of type "branding"
declare const isValidUsername: unique symbol;
type Username = string & { [isValidUsername]: true };

const usernameCodec = Codecs.string.validating<Username>(s => {
  if (s.length < 3 || s.length > 6) throw new JsonValidationError("username must be 3-6 characters");
});
````

## Typed Arrays

Types arrays codecs let you work with typed array representations out of the box.

````typescript
import { Codecs } from "typescript-json-codec";

Codecs.Int8Array.parse("[1,2,3]"); // => Int8Array([1, 2, 3])
Codecs.Float32Array.parse("[1.23,4.56,7.89]"); // => Float64Array([1.23, 4.56, 7.89])
````

## Custom Codecs

Sometimes you want to do something different, or more efficient that using mapped codecs.

````typescript
import { JsonTokenIterator, readExpectedToken, JsonCodecError, JsonToken, JsonTokens } from "typescript-json-codec";

export class PairCodec<A, B> extends JsonCodec<[A, B]> {
  constructor(a: JsonCodec<A>, b: JsonCodec<B>) {
    super();
  }

  decode(src: JsonTokenIterator): [A, B] {
    // readExpected tokens expects the next token in src to be of a specific type (and not EOS),
    // and will either advance src past that token, or throw an exception.
    readExpectedToken(src, "[");
    
    // we defer to another codec for individual values -- we should expect such a codec to either
    // read all input associated with that value, or throw an exception
    const a = this.a.decode(src);
    
    readExpectedToken(src, ",");
    
    const b = this.b.decode(src);
    
    readExpectedToken(src, "]");
    
    return [a, b];
  }

  *encode(pair: [A, B]): Generator<JsonToken> {
    // encoding is just a process of generating JsonTokens
    yield JsonTokens.ArrayStart;
    yield* this.a.encode(pair[0]);
    yield JsonTokens.Comma;
    yield* this.b.encode(pair[1]);
    yield JsonTokens.ArrayEnd;
  }
}
````

### Lookahead decoding

Sometimes, it's not possible to know in advance how to parse 
