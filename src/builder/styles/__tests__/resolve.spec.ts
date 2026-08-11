import { describe, expect, it } from "vitest";

import { resolveResponsiveStyles } from "@/builder/styles/resolve";
import type { ResponsiveStyles } from "@/builder/styles/types";

const px = (value: number) => ({ value, unit: "px" as const });

describe("resolveResponsiveStyles", () => {
  it("should cascade base, tablet, and mobile patches with field-level merges", () => {
    const styles = {
      base: {
        display: "grid",
        padding: {
          top: px(24),
          right: px(24),
          bottom: px(24),
          left: px(24),
        },
        grid: {
          columns: 4,
          columnGap: px(24),
          rowGap: px(24),
          alignItems: "stretch",
        },
      },
      tablet: {
        padding: { right: px(16), left: px(16) },
        grid: { columns: 2 },
      },
      mobile: {
        padding: { top: px(12), bottom: px(12) },
        grid: { rowGap: px(12) },
      },
    } satisfies ResponsiveStyles;

    const resolved = resolveResponsiveStyles(styles, "mobile");

    expect(resolved.padding).toEqual({
      top: px(12),
      right: px(16),
      bottom: px(12),
      left: px(16),
    });
    expect(resolved.grid).toEqual({
      columns: 2,
      columnGap: px(24),
      rowGap: px(12),
      alignItems: "stretch",
    });
  });

  it("should return cloned values without mutating the persisted style layers", () => {
    const styles = {
      base: {
        width: { mode: "fixed", value: 320, unit: "px" },
        padding: {
          top: px(8),
          right: px(8),
          bottom: px(8),
          left: px(8),
        },
      },
    } satisfies ResponsiveStyles;

    const resolved = resolveResponsiveStyles(styles, "desktop");

    expect(resolved).not.toBe(styles.base);
    expect(resolved.width).not.toBe(styles.base.width);
    expect(resolved.padding).not.toBe(styles.base.padding);
    expect(styles.base.padding.top).toEqual(px(8));
  });

  it("should cascade uniform border fields and clone the resolved width", () => {
    const styles = {
      base: {
        borderWidth: { value: 1, unit: "px" },
        borderStyle: "solid",
        borderColor: "#111827",
      },
      tablet: {
        borderWidth: { value: 0.125, unit: "rem" },
        borderColor: "#2563eb",
      },
      mobile: {
        borderStyle: "none",
      },
    } satisfies ResponsiveStyles;

    const resolved = resolveResponsiveStyles(styles, "mobile");

    expect(resolved).toMatchObject({
      borderWidth: { value: 0.125, unit: "rem" },
      borderStyle: "none",
      borderColor: "#2563eb",
    });
    expect(resolved.borderWidth).not.toBe(styles.base.borderWidth);
    expect(styles.tablet?.borderColor).toBe("#2563eb");
  });

  it("should cascade text decoration across responsive layers", () => {
    const styles = {
      base: { textDecoration: "underline" },
      tablet: { textDecoration: "overline" },
      mobile: { textDecoration: "none" },
    } satisfies ResponsiveStyles;

    expect(resolveResponsiveStyles(styles, "desktop").textDecoration).toBe(
      "underline",
    );
    expect(resolveResponsiveStyles(styles, "tablet").textDecoration).toBe(
      "overline",
    );
    expect(resolveResponsiveStyles(styles, "mobile").textDecoration).toBe(
      "none",
    );
  });

  it("should atomically cascade and clone shared visual effects", () => {
    const baseShadow = {
      offsetX: 0,
      offsetY: 8,
      blurRadius: 24,
      spreadRadius: -12,
      unit: "px" as const,
      color: "#5b45d64d",
      inset: false,
    };
    const mobileShadow = {
      ...baseShadow,
      offsetY: 4,
      blurRadius: 12,
    };
    const styles = {
      base: {
        boxShadow: [baseShadow],
        backdropBlur: { value: 12, unit: "px" },
      },
      mobile: {
        boxShadow: [mobileShadow],
        backdropBlur: { value: 6, unit: "px" },
      },
    } satisfies ResponsiveStyles;

    const resolved = resolveResponsiveStyles(styles, "mobile");

    expect(resolved.boxShadow).toEqual([mobileShadow]);
    expect(resolved.boxShadow).not.toBe(styles.mobile?.boxShadow);
    expect(resolved.boxShadow?.[0]).not.toBe(mobileShadow);
    expect(resolved.backdropBlur).toEqual({ value: 6, unit: "px" });
    expect(resolved.backdropBlur).not.toBe(styles.mobile?.backdropBlur);
    expect(styles.base.boxShadow?.[0]).toBe(baseShadow);
  });

  it("should atomically cascade and clone background image configurations", () => {
    const baseImage = {
      kind: "image" as const,
      source: "https://cdn.example.com/hero.webp",
      size: "cover" as const,
      positionX: "center" as const,
      positionY: "center" as const,
      repeat: "no-repeat" as const,
    };
    const tabletImage = {
      ...baseImage,
      size: "contain" as const,
      positionX: "right" as const,
    };
    const styles = {
      base: { backgroundImage: baseImage },
      tablet: { backgroundImage: tabletImage },
      mobile: { backgroundImage: { kind: "none" as const } },
    } satisfies ResponsiveStyles;

    const tablet = resolveResponsiveStyles(styles, "tablet");
    const mobile = resolveResponsiveStyles(styles, "mobile");

    expect(tablet.backgroundImage).toEqual(tabletImage);
    expect(tablet.backgroundImage).not.toBe(tabletImage);
    expect(mobile.backgroundImage).toEqual({ kind: "none" });
    expect(styles.base.backgroundImage).toBe(baseImage);
  });

  it("should atomically cascade and clone linear gradient configurations", () => {
    const baseGradient = {
      kind: "linear-gradient" as const,
      angle: 135,
      startColor: "#7c3aed",
      endColor: "#2563eb",
    };
    const mobileGradient = {
      ...baseGradient,
      angle: 180,
      endColor: "#0f172a",
    };
    const styles = {
      base: { backgroundImage: baseGradient },
      mobile: { backgroundImage: mobileGradient },
    } satisfies ResponsiveStyles;

    const resolved = resolveResponsiveStyles(styles, "mobile");

    expect(resolved.backgroundImage).toEqual(mobileGradient);
    expect(resolved.backgroundImage).not.toBe(mobileGradient);
    expect(styles.base.backgroundImage).toBe(baseGradient);
  });
});
