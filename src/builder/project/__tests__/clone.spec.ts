import { describe, expect, it } from "vitest";

import { valuesEqual } from "@/builder/project/clone";

describe("valuesEqual", () => {
  it("should treat nested JSON objects as equal regardless of key insertion order", () => {
    expect(
      valuesEqual(
        { label: "Card", styles: { color: "#ffffff", padding: [8, 16] } },
        { styles: { padding: [8, 16], color: "#ffffff" }, label: "Card" },
      ),
    ).toBe(true);
  });

  it("should preserve array order and detect nested value changes", () => {
    expect(valuesEqual({ values: [1, 2] }, { values: [2, 1] })).toBe(false);
    expect(
      valuesEqual({ styles: { color: "#ffffff" } }, { styles: { color: "#000000" } }),
    ).toBe(false);
  });
});
