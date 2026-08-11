import { describe, expect, it } from "vitest";

import type { ResponsiveStyles } from "@/builder/styles/types";
import {
  DEFAULT_FLEX_CONFIG,
  DEFAULT_GRID_CONFIG,
  layoutModeStyleChanges,
  previewStyleForChanges,
  resizeStyleChanges,
  spacingStyleChanges,
  type ResizeContext,
} from "@/builder/ui/visual-editing";

const baseStyles: ResponsiveStyles = {
  base: {
    display: "block",
    width: { mode: "fill" },
    height: { mode: "auto" },
    padding: {
      top: { value: 10, unit: "px" },
      right: { value: 20, unit: "px" },
      bottom: { value: 10, unit: "px" },
      left: { value: 20, unit: "px" },
    },
  },
  mobile: { padding: { top: { value: 6, unit: "px" } } },
};

function createResizeContext(
  overrides: Partial<Omit<ResizeContext, "dimensions">> & {
    dimensions?: ResizeContext["dimensions"];
  } = {},
): ResizeContext {
  const { dimensions, ...metrics } = overrides;
  return {
    dimensions: {
      width: { mode: "fill" },
      height: { mode: "auto" },
      position: "static",
      ...dimensions,
    },
    parentContentWidth: 800,
    parentContentHeight: 400,
    parentHasDefiniteHeight: false,
    elementFontSize: 20,
    rootFontSize: 16,
    viewportWidth: 1_000,
    viewportHeight: 800,
    ...metrics,
  };
}

describe("Phase 5 visual editing change builders", () => {
  it("should store a first normal-flow width resize as percent and height as pixels", () => {
    expect(
      resizeStyleChanges(
        "south-east",
        { width: 320, height: 180 },
        { x: 80, y: 20 },
        createResizeContext(),
      ),
    ).toEqual([
      {
        target: { property: "width" },
        value: { mode: "fixed", value: 50, unit: "%" },
      },
      {
        target: { property: "height" },
        value: { mode: "fixed", value: 200, unit: "px" },
      },
    ]);
  });

  it.each(["absolute", "fixed"] as const)(
    "should store a first %s-positioned width resize as pixels",
    (position) => {
      expect(
        resizeStyleChanges(
          "east",
          { width: 320, height: 180 },
          { x: 80, y: 0 },
          createResizeContext({ dimensions: { position } }),
        ),
      ).toEqual([
        {
          target: { property: "width" },
          value: { mode: "fixed", value: 400, unit: "px" },
        },
      ]);
    },
  );

  it("should preserve every existing explicit width unit during resize", () => {
    const resizeWidth = (
      width: ResizeContext["dimensions"]["width"],
    ) =>
      resizeStyleChanges(
        "east",
        { width: 320, height: 180 },
        { x: 80, y: 0 },
        createResizeContext({ dimensions: { width } }),
      )[0].value;

    expect([
      resizeWidth({ mode: "fixed", value: 320, unit: "px" }),
      resizeWidth({ mode: "fixed", value: 40, unit: "%" }),
      resizeWidth({ mode: "fixed", value: 20, unit: "rem" }),
      resizeWidth({ mode: "fixed", value: 16, unit: "em" }),
      resizeWidth({ mode: "fixed", value: 32, unit: "vw" }),
      resizeWidth({ mode: "fixed", value: 40, unit: "vh" }),
    ]).toEqual([
      { mode: "fixed", value: 400, unit: "px" },
      { mode: "fixed", value: 50, unit: "%" },
      { mode: "fixed", value: 25, unit: "rem" },
      { mode: "fixed", value: 20, unit: "em" },
      { mode: "fixed", value: 40, unit: "vw" },
      { mode: "fixed", value: 50, unit: "vh" },
    ]);
  });

  it("should snap a first semantic width resize near the parent width to fill", () => {
    expect(
      resizeStyleChanges(
        "east",
        { width: 990, height: 80 },
        { x: 5, y: 0 },
        createResizeContext({ parentContentWidth: 1_000 }),
      ),
    ).toEqual([
      {
        target: { property: "width" },
        value: { mode: "fill" },
      },
    ]);
  });

  it("should preserve percentage height only with a definite parent height", () => {
    const currentHeight = {
      mode: "fixed" as const,
      value: 50,
      unit: "%" as const,
    };

    const valid = resizeStyleChanges(
      "south",
      { width: 320, height: 200 },
      { x: 0, y: 20 },
      createResizeContext({
        dimensions: { height: currentHeight },
        parentHasDefiniteHeight: true,
      }),
    );
    const invalid = resizeStyleChanges(
      "south",
      { width: 320, height: 200 },
      { x: 0, y: 20 },
      createResizeContext({ dimensions: { height: currentHeight } }),
    );

    expect({ valid: valid[0].value, invalid: invalid[0].value }).toEqual({
      valid: { mode: "fixed", value: 55, unit: "%" },
      invalid: { mode: "fixed", value: 220, unit: "px" },
    });
  });

  it("should clamp context-dependent resize values to zero", () => {
    expect(
      resizeStyleChanges(
        "east",
        { width: 20, height: 80 },
        { x: -100, y: 999 },
        createResizeContext(),
      ),
    ).toEqual([
      {
        target: { property: "width" },
        value: { mode: "fixed", value: 0, unit: "%" },
      },
    ]);
  });

  it("should compile a responsive preview without mutating the document styles", () => {
    const before = structuredClone(baseStyles);
    const changes = resizeStyleChanges(
      "east",
      { width: 100, height: 40 },
      { x: 24, y: 0 },
      createResizeContext({
        dimensions: {
          width: { mode: "fixed", value: 100, unit: "px" },
        },
      }),
    );

    const preview = previewStyleForChanges(baseStyles, "mobile", changes);

    expect(preview).toMatchObject({
      width: "124px",
      paddingTop: "6px",
      paddingRight: "20px",
    });
    expect(baseStyles).toEqual(before);
  });

  it("should preserve responsive inheritance with field-level spacing changes", () => {
    const changes = spacingStyleChanges(baseStyles, "mobile", "padding", {
      top: { value: 2, unit: "rem" },
      bottom: { value: 2, unit: "rem" },
    });

    expect(changes).toEqual([
      {
        target: { property: "padding", field: "top" },
        value: { value: 2, unit: "rem" },
      },
      {
        target: { property: "padding", field: "bottom" },
        value: { value: 2, unit: "rem" },
      },
    ]);
  });

  it("should initialize a complete spacing value only when no inherited value exists", () => {
    const changes = spacingStyleChanges(
      { base: { display: "block" } },
      "tablet",
      "margin",
      { left: { value: -12, unit: "px" } },
    );

    expect(changes).toEqual([
      {
        target: { property: "margin" },
        value: {
          top: { value: 0, unit: "px" },
          right: { value: 0, unit: "px" },
          bottom: { value: 0, unit: "px" },
          left: { value: -12, unit: "px" },
        },
      },
    ]);
  });

  it("should initialize flex or grid configuration only when the mode needs it", () => {
    expect(layoutModeStyleChanges("flex", { display: "block" })).toEqual([
      { target: { property: "display" }, value: "flex" },
      { target: { property: "flex" }, value: DEFAULT_FLEX_CONFIG },
    ]);
    expect(layoutModeStyleChanges("grid", { display: "block" })).toEqual([
      { target: { property: "display" }, value: "grid" },
      { target: { property: "grid" }, value: DEFAULT_GRID_CONFIG },
    ]);
    expect(
      layoutModeStyleChanges("flex", {
        display: "grid",
        flex: DEFAULT_FLEX_CONFIG,
      }),
    ).toEqual([{ target: { property: "display" }, value: "flex" }]);
  });
});
