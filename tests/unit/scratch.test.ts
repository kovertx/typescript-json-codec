import { describe, expect } from "vitest";

abstract class Base {
  abstract foo(): string;
}

class Foo extends Base {
  override foo(): string {
    this.foo = () => "bar";
    return "foo";
  }
}

describe("scratchpad tests", () => {
  const it = new Foo();

  test("WTF", () => {
    expect(it.foo()).toEqual("foo");
    expect(it.foo()).toEqual("bar");
    expect(it.foo()).toEqual("bar");
  });
});