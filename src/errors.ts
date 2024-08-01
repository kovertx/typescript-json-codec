/**
 * General error type for errors that occur during JSON lexing
 */
export class JsonLexerError extends Error {
  constructor(public message: string) {
    super(message);
  }
}

/**
 * General error type for errors that occur during encoding/decoding JSON values
 */
export class JsonCodecError extends Error {
  constructor(public message: string) {
    super(message);
  }
}

/**
 * Specialization of JsonCodecError indicating that a value is logically incorrect even though it may have been
 * valid structurally (e.g. a string that didn't match a regex, or a number outside of expected bounds)
 */
export class JsonValidationError extends JsonCodecError {
  constructor(message: string) {
    super(message);
  }
}
