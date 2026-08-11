import { describe, expect, it } from "vitest";

import { compileStyleValues } from "@/builder/styles/compile";
import type { StyleValues } from "@/builder/styles/types";

const px = (value: number) => ({ value, unit: "px" as const });

const layoutValues = {
  width: { mode: "fill" },
  height: { mode: "auto" },
  grid: {
    columns: 3,
    columnGap: px(20),
    rowGap: px(12),
  },
  flex: {
    direction: "column",
    wrap: "nowrap",
    justifyContent: "center",
    alignItems: "stretch",
    gap: px(8),
  },
} satisfies StyleValues;

describe("compileStyleValues", () => {
  it("should compile dimensions and only the active grid configuration", () => {
    const style = compileStyleValues({ ...layoutValues, display: "grid" });

    expect(style).toMatchObject({
      display: "grid",
      width: "100%",
      height: "auto",
      gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
      columnGap: "20px",
      rowGap: "12px",
    });
    expect(style).not.toHaveProperty("flexDirection");
    expect(style).not.toHaveProperty("gap");
  });

  it("should compile only the active flex configuration", () => {
    const style = compileStyleValues({ ...layoutValues, display: "flex" });

    expect(style).toMatchObject({
      display: "flex",
      flexDirection: "column",
      flexWrap: "nowrap",
      justifyContent: "center",
      alignItems: "stretch",
      gap: "8px",
    });
    expect(style).not.toHaveProperty("gridTemplateColumns");
    expect(style).not.toHaveProperty("columnGap");
  });

  it("should compile viewport dimensions as a growable viewport minimum", () => {
    const style = compileStyleValues({
      width: { mode: "viewport" },
      height: { mode: "viewport" },
      minHeight: { value: 20, unit: "rem" },
    });

    expect(style).toMatchObject({
      width: "100vw",
      height: "auto",
      minHeight: "100dvh",
    });
  });

  it("should compile uniform border width, style, color, and radius", () => {
    const style = compileStyleValues({
      borderWidth: { value: 0.125, unit: "rem" },
      borderStyle: "dashed",
      borderColor: "#3366998c",
      borderRadius: { value: 12, unit: "px" },
    });

    expect(style).toMatchObject({
      borderWidth: "0.125rem",
      borderStyle: "dashed",
      borderColor: "#3366998c",
      borderRadius: "12px",
    });
  });

  it("should compile text decoration", () => {
    expect(
      compileStyleValues({ textDecoration: "line-through" }),
    ).toEqual({ textDecoration: "line-through" });
  });

  it("should compile multiple shadows and backdrop blur for every renderer", () => {
    const style = compileStyleValues({
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
    });

    expect(style).toMatchObject({
      boxShadow:
        "0px 8px 24px -12px #5b45d64d, inset 0px 1px 0px 0px #ffffff99",
      backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)",
    });
  });

  it("should compile an empty shadow list as an explicit responsive reset", () => {
    expect(compileStyleValues({ boxShadow: [] })).toEqual({
      boxShadow: "none",
    });
  });

  it("should compile a complete background image configuration", () => {
    const style = compileStyleValues({
      backgroundImage: {
        kind: "image",
        source: "https://cdn.example.com/hero.webp",
        size: "contain",
        positionX: "right",
        positionY: "top",
        repeat: "repeat-x",
      },
    });

    expect(style).toMatchObject({
      backgroundImage: 'url("https://cdn.example.com/hero.webp")',
      backgroundSize: "contain",
      backgroundPosition: "right top",
      backgroundRepeat: "repeat-x",
    });
  });

  it("should compile a two-color linear gradient without image subproperties", () => {
    const style = compileStyleValues({
      backgroundImage: {
        kind: "linear-gradient",
        angle: 135,
        startColor: "#7c3aed",
        endColor: "#2563ebcc",
      },
    });

    expect(style).toEqual({
      backgroundImage: "linear-gradient(135deg, #7c3aed, #2563ebcc)",
    });
  });

  it("should compile explicit background image removal without stale subproperties", () => {
    const style = compileStyleValues({
      backgroundImage: { kind: "none" },
    });

    expect(style).toEqual({ backgroundImage: "none" });
  });
});
