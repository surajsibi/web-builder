import { describe, expect, it } from "vitest";

import { isJsonObject, isJsonValue } from "@/builder/model/json";

describe("JSON value guards", () => {
  it("should accept JSON primitives, nested collections, and null-prototype objects", () => {
    const nullPrototype = Object.assign(Object.create(null) as object, {
      enabled: true,
      values: [null, 1, "two"],
    });

    expect(isJsonValue(null)).toBe(true);
    expect(isJsonValue({ nested: [{ count: 2 }], empty: {} })).toBe(true);
    expect(isJsonObject(nullPrototype)).toBe(true);
  });

  it.each([
    undefined,
    Number.NaN,
    Number.POSITIVE_INFINITY,
    BigInt(1),
    Symbol("value"),
    () => undefined,
    new Date("2026-08-12T00:00:00.000Z"),
    new Map(),
  ])("should reject non-JSON value %#", (value) => {
    expect(isJsonValue(value)).toBe(false);
  });

  it("should reject invalid nested values and circular references", () => {
    const invalidNested = { valid: [1, { invalid: undefined }] };
    const circular: { self?: unknown } = {};
    circular.self = circular;

    expect(isJsonValue(invalidNested)).toBe(false);
    expect(isJsonValue(circular)).toBe(false);
  });

  it("should accept shared non-circular references", () => {
    const shared = { label: "shared" };

    expect(isJsonValue({ first: shared, second: shared })).toBe(true);
  });

  it("should reject accessors without invoking them", () => {
    const accessor = {} as Record<string, unknown>;
    let accessed = false;
    Object.defineProperty(accessor, "unsafe", {
      enumerable: true,
      get: () => {
        accessed = true;
        return "unsafe";
      },
    });

    expect(isJsonValue(accessor)).toBe(false);
    expect(accessed).toBe(false);
  });

  it("should reject sparse arrays and enumerable properties that JSON would discard", () => {
    const sparse = Array(1);
    const extended = ["kept"] as unknown[] & { discarded?: string };
    extended.discarded = "value";

    expect(isJsonValue(sparse)).toBe(false);
    expect(isJsonValue(extended)).toBe(false);
  });

  it("should require the top-level object guard to receive a non-array object", () => {
    expect(isJsonObject({ value: 1 })).toBe(true);
    expect(isJsonObject([1, 2])).toBe(false);
    expect(isJsonObject("value")).toBe(false);
    expect(isJsonObject(null)).toBe(false);
  });
});
