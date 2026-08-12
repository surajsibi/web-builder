import { describe, expect, it } from "vitest";

import {
  createGeneratedPageSlug,
  isCanonicalNonHomeSlug,
  normalizeExplicitPageSlug,
} from "@/builder/project/slug";

describe("page slugs", () => {
  it.each([
    [" About Our Téam ", "/about-our-team"],
    ["///Pricing & Plans///", "/pricing-plans"],
    ["already-canonical", "/already-canonical"],
  ])("should normalize %j to %j", (input, expected) => {
    expect(normalizeExplicitPageSlug(input)).toBe(expected);
  });

  it.each(["", "   ", "/", "https://example.com", "mailto:team@example.com", "/about?tab=team", "/about#team"])(
    "should reject an empty, root, URL, query, or fragment slug: %j",
    (input) => {
      expect(normalizeExplicitPageSlug(input)).toBeNull();
    },
  );

  it("should recognize only canonical non-home slugs", () => {
    expect(isCanonicalNonHomeSlug("/about-us-2")).toBe(true);
    expect(isCanonicalNonHomeSlug("/")).toBe(false);
    expect(isCanonicalNonHomeSlug("/About")).toBe(false);
    expect(isCanonicalNonHomeSlug("/about/")).toBe(false);
    expect(isCanonicalNonHomeSlug("/about_us")).toBe(false);
  });

  it("should generate a fallback and the first available collision suffix", () => {
    expect(createGeneratedPageSlug("!!!", new Set())).toBe("/page");
    expect(
      createGeneratedPageSlug(
        "About",
        new Set(["/about", "/about-2", "/about-3"]),
      ),
    ).toBe("/about-4");
  });
});
