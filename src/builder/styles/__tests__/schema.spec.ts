import { describe, expect, it } from "vitest";

import { parseResponsiveStyles } from "@/builder/styles/schema";

describe("parseResponsiveStyles", () => {
  it("should accept atomic signed pixel position offsets in every responsive layer", () => {
    const parsed = parseResponsiveStyles({
      base: {
        positionOffset: {
          x: { value: -24, unit: "px" },
          y: { value: 12.5, unit: "px" },
        },
      },
      tablet: {
        positionOffset: {
          x: { value: 0, unit: "px" },
          y: { value: 0, unit: "px" },
        },
      },
    });

    expect(parsed).toMatchObject({
      base: {
        positionOffset: {
          x: { value: -24, unit: "px" },
          y: { value: 12.5, unit: "px" },
        },
      },
      tablet: {
        positionOffset: {
          x: { value: 0, unit: "px" },
          y: { value: 0, unit: "px" },
        },
      },
    });
  });

  it.each([
    [
      { x: { value: 1, unit: "px" } },
      "a missing axis",
    ],
    [
      {
        x: { value: 1, unit: "%" },
        y: { value: 2, unit: "px" },
      },
      "a non-pixel unit",
    ],
    [
      {
        x: { keyword: "auto" },
        y: { value: 2, unit: "px" },
      },
      "a length keyword",
    ],
    [
      {
        x: { value: Number.POSITIVE_INFINITY, unit: "px" },
        y: { value: 2, unit: "px" },
      },
      "a non-finite value",
    ],
  ] as readonly [unknown, string][])("should reject a position offset with %s (%s)", (positionOffset) => {
    expect(() =>
      parseResponsiveStyles({
        base: { positionOffset },
      }),
    ).toThrow();
  });

  it("should accept complete base values and partial responsive patches", () => {
    const parsed = parseResponsiveStyles({
      base: {
        display: "block",
        padding: {
          top: { value: 24, unit: "px" },
          right: { value: 24, unit: "px" },
          bottom: { value: 24, unit: "px" },
          left: { value: 24, unit: "px" },
        },
      },
      tablet: {
        padding: { left: { value: 16, unit: "px" } },
      },
    });

    expect(parsed.tablet?.padding?.left).toEqual({ value: 16, unit: "px" });
  });

  it("should accept the viewport dimension mode in responsive layers", () => {
    const parsed = parseResponsiveStyles({
      base: { height: { mode: "auto" } },
      mobile: { height: { mode: "viewport" } },
    });

    expect(parsed.mobile?.height).toEqual({ mode: "viewport" });
  });

  it("should accept uniform border values and responsive border overrides", () => {
    const parsed = parseResponsiveStyles({
      base: {
        borderWidth: { value: 1, unit: "px" },
        borderStyle: "solid",
        borderColor: "#336699cc",
        borderRadius: { value: 12, unit: "px" },
      },
      tablet: {
        borderWidth: { value: 0.125, unit: "rem" },
        borderStyle: "dashed",
      },
      mobile: {
        borderStyle: "none",
      },
    });

    expect(parsed.tablet).toMatchObject({
      borderWidth: { value: 0.125, unit: "rem" },
      borderStyle: "dashed",
    });
    expect(parsed.mobile?.borderStyle).toBe("none");
  });

  it("should accept responsive text decoration values", () => {
    const parsed = parseResponsiveStyles({
      base: { textDecoration: "underline" },
      tablet: { textDecoration: "overline" },
      mobile: { textDecoration: "line-through" },
    });

    expect(parsed.base.textDecoration).toBe("underline");
    expect(parsed.tablet?.textDecoration).toBe("overline");
    expect(parsed.mobile?.textDecoration).toBe("line-through");
  });

  it("should accept reusable shadows, backdrop blur, and responsive effect removal", () => {
    const parsed = parseResponsiveStyles({
      base: {
        boxShadow: [
          {
            offsetX: 0,
            offsetY: 8,
            blurRadius: 24,
            spreadRadius: -12,
            unit: "px",
            color: "#5b45d64d",
            inset: false,
          },
          {
            offsetX: 0,
            offsetY: 1,
            blurRadius: 0,
            spreadRadius: 0,
            unit: "px",
            color: "#ffffff99",
            inset: true,
          },
        ],
        backdropBlur: { value: 12, unit: "px" },
      },
      mobile: {
        boxShadow: [],
        backdropBlur: { value: 0, unit: "px" },
      },
    });

    expect(parsed.base.boxShadow).toHaveLength(2);
    expect(parsed.mobile).toMatchObject({
      boxShadow: [],
      backdropBlur: { value: 0, unit: "px" },
    });
  });

  it("should accept complete background images and explicit responsive removal", () => {
    const parsed = parseResponsiveStyles({
      base: {
        backgroundImage: {
          kind: "image",
          source: "https://cdn.example.com/hero.webp",
          size: "cover",
          positionX: "center",
          positionY: "top",
          repeat: "no-repeat",
        },
      },
      tablet: {
        backgroundImage: {
          kind: "image",
          source: "/images/hero-tablet.webp",
          size: "contain",
          positionX: "right",
          positionY: "center",
          repeat: "repeat-x",
        },
      },
      mobile: {
        backgroundImage: { kind: "none" },
      },
    });

    expect(parsed.tablet?.backgroundImage).toMatchObject({
      kind: "image",
      source: "/images/hero-tablet.webp",
      size: "contain",
    });
    expect(parsed.mobile?.backgroundImage).toEqual({ kind: "none" });
  });

  it("should accept two-color linear gradients in responsive layers", () => {
    const parsed = parseResponsiveStyles({
      base: {
        backgroundImage: {
          kind: "linear-gradient",
          angle: 135,
          startColor: "#7c3aed",
          endColor: "#2563ebcc",
        },
      },
      mobile: {
        backgroundImage: {
          kind: "linear-gradient",
          angle: 180,
          startColor: "transparent",
          endColor: "#0f172a",
        },
      },
    });

    expect(parsed.mobile?.backgroundImage).toEqual({
      kind: "linear-gradient",
      angle: 180,
      startColor: "transparent",
      endColor: "#0f172a",
    });
  });

  it.each([
    [
      {
        kind: "linear-gradient",
        angle: -1,
        startColor: "#7c3aed",
        endColor: "#2563eb",
      },
      "angles below zero",
    ],
    [
      {
        kind: "linear-gradient",
        angle: 361,
        startColor: "#7c3aed",
        endColor: "#2563eb",
      },
      "angles above 360 degrees",
    ],
    [
      {
        kind: "linear-gradient",
        angle: 135,
        startColor: "red, url(https://example.com/tracker.png)",
        endColor: "#2563eb",
      },
      "unsafe color expressions",
    ],
    [
      {
        kind: "linear-gradient",
        angle: 135,
        startColor: "#7c3aed",
      },
      "incomplete color stops",
    ],
  ] as readonly [Record<string, unknown>, string][])(
    "should reject linear gradients with %s (%s)",
    (backgroundImage) => {
    expect(() =>
      parseResponsiveStyles({
        base: { backgroundImage },
      }),
    ).toThrow();
    },
  );

  it.each([
    ["", "empty values"],
    ["http://cdn.example.com/hero.webp", "insecure HTTP URLs"],
    ["//cdn.example.com/hero.webp", "protocol-relative URLs"],
    ["data:image/png;base64,AAAA", "embedded data URLs"],
    ["blob:https://example.com/id", "temporary blob URLs"],
    ["javascript:alert(1)", "script URLs"],
    ["https://cdn.example.com/hero.webp\n", "control characters"],
    [`https://cdn.example.com/${"a".repeat(2_049)}`, "overlong URLs"],
  ])("should reject background image source %s (%s)", (source) => {
    expect(() =>
      parseResponsiveStyles({
        base: {
          backgroundImage: {
            kind: "image",
            source,
            size: "cover",
            positionX: "center",
            positionY: "center",
            repeat: "no-repeat",
          },
        },
      }),
    ).toThrow();
  });

  it("should reject incomplete background image configurations", () => {
    expect(() =>
      parseResponsiveStyles({
        base: {
          backgroundImage: {
            kind: "image",
            source: "https://cdn.example.com/hero.webp",
            size: "cover",
            positionX: "center",
            positionY: "center",
          },
        },
      }),
    ).toThrow();
  });

  it.each([
    [{ value: -1, unit: "px" }, "negative values"],
    [{ value: Number.POSITIVE_INFINITY, unit: "px" }, "non-finite values"],
    [{ value: 1, unit: "%" }, "percentage units"],
    [{ value: 1, unit: "vw" }, "viewport units"],
  ])("should reject border width %s (%s)", (borderWidth) => {
    expect(() =>
      parseResponsiveStyles({
        base: { borderWidth },
      }),
    ).toThrow();
  });

  it("should reject an unsupported border style", () => {
    expect(() =>
      parseResponsiveStyles({
        base: { borderStyle: "double" },
      }),
    ).toThrow();
  });

  it("should reject an unsupported text decoration", () => {
    expect(() =>
      parseResponsiveStyles({
        base: { textDecoration: "blink" },
      }),
    ).toThrow();
  });

  it.each([
    [
      {
        boxShadow: [
          {
            offsetX: 0,
            offsetY: 4,
            blurRadius: -1,
            spreadRadius: 0,
            unit: "px",
            color: "#00000033",
            inset: false,
          },
        ],
      },
      "negative shadow blur",
    ],
    [
      {
        boxShadow: [
          {
            offsetX: 0,
            offsetY: 4,
            blurRadius: 12,
            spreadRadius: 0,
            unit: "%",
            color: "#00000033",
            inset: false,
          },
        ],
      },
      "unsupported shadow units",
    ],
    [{ backdropBlur: { value: -1, unit: "px" } }, "negative backdrop blur"],
  ])("should reject invalid effect values (%s: %s)", (base, description) => {
    expect(() => parseResponsiveStyles({ base }), description).toThrow();
  });

  it("should reject unknown fields and non-finite values", () => {
    expect(() =>
      parseResponsiveStyles({
        base: { display: "block", opacity: 0.5 },
      }),
    ).toThrow();

    expect(() =>
      parseResponsiveStyles({
        base: {
          width: { mode: "fixed", value: Number.POSITIVE_INFINITY, unit: "px" },
        },
      }),
    ).toThrow();
  });

  it("should reject a responsive nested patch that cannot resolve completely", () => {
    expect(() =>
      parseResponsiveStyles({
        base: { display: "block" },
        tablet: {
          padding: { left: { value: 16, unit: "px" } },
        },
      }),
    ).toThrow();
  });
});
