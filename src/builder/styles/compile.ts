import type { CSSProperties } from "react";

import type {
  BoxShadowValue,
  DimensionValue,
  LengthValue,
  SpacingValue,
  StyleValues,
} from "./types";

export const VIEWPORT_MIN_HEIGHT = "100dvh";

function compileLength(value: LengthValue): string {
  if ("keyword" in value) return value.keyword;

  return `${value.value}${value.unit}`;
}

function compileDimension(
  value: DimensionValue,
  axis: "width" | "height",
): string {
  switch (value.mode) {
    case "fill":
      return "100%";
    case "viewport":
      return axis === "width" ? "100vw" : "auto";
    case "fit":
      return "fit-content";
    case "auto":
      return "auto";
    case "fixed":
      return `${value.value}${value.unit}`;
  }
}

function compileSpacing(
  target: CSSProperties,
  prefix: "margin" | "padding",
  value: SpacingValue,
): void {
  const properties = {
    top: `${prefix}Top`,
    right: `${prefix}Right`,
    bottom: `${prefix}Bottom`,
    left: `${prefix}Left`,
  } as const;

  target[properties.top] = compileLength(value.top);
  target[properties.right] = compileLength(value.right);
  target[properties.bottom] = compileLength(value.bottom);
  target[properties.left] = compileLength(value.left);
}

function compileBoxShadow(value: BoxShadowValue): string {
  const unit = value.unit;
  const shadow = `${value.offsetX}${unit} ${value.offsetY}${unit} ${value.blurRadius}${unit} ${value.spreadRadius}${unit} ${value.color}`;
  return value.inset ? `inset ${shadow}` : shadow;
}

export function compileStyleValues(
  values: Readonly<StyleValues>,
): CSSProperties {
  const style: CSSProperties = {};

  if (values.display !== undefined) style.display = values.display;
  if (values.width !== undefined) {
    style.width = compileDimension(values.width, "width");
  }
  if (values.height !== undefined) {
    style.height = compileDimension(values.height, "height");
    if (values.height.mode === "viewport") {
      style.minHeight = VIEWPORT_MIN_HEIGHT;
    }
  }
  if (values.minWidth !== undefined) {
    style.minWidth = compileLength(values.minWidth);
  }
  if (
    values.minHeight !== undefined &&
    values.height?.mode !== "viewport"
  ) {
    style.minHeight = compileLength(values.minHeight);
  }
  if (values.maxWidth !== undefined) {
    style.maxWidth = compileLength(values.maxWidth);
  }
  if (values.maxHeight !== undefined) {
    style.maxHeight = compileLength(values.maxHeight);
  }
  if (values.margin !== undefined) {
    compileSpacing(style, "margin", values.margin);
  }
  if (values.padding !== undefined) {
    compileSpacing(style, "padding", values.padding);
  }
  if (values.color !== undefined) style.color = values.color;
  if (values.backgroundColor !== undefined) {
    style.backgroundColor = values.backgroundColor;
  }
  if (values.backgroundImage !== undefined) {
    switch (values.backgroundImage.kind) {
      case "none":
        style.backgroundImage = "none";
        break;
      case "linear-gradient":
        style.backgroundImage = `linear-gradient(${values.backgroundImage.angle}deg, ${values.backgroundImage.startColor}, ${values.backgroundImage.endColor})`;
        break;
      case "image":
        style.backgroundImage = `url(${JSON.stringify(values.backgroundImage.source)})`;
        style.backgroundSize = values.backgroundImage.size;
        style.backgroundPosition = `${values.backgroundImage.positionX} ${values.backgroundImage.positionY}`;
        style.backgroundRepeat = values.backgroundImage.repeat;
        break;
    }
  }
  if (values.fontFamily !== undefined) style.fontFamily = values.fontFamily;
  if (values.fontSize !== undefined) {
    style.fontSize = compileLength(values.fontSize);
  }
  if (values.fontWeight !== undefined) style.fontWeight = values.fontWeight;
  if (values.lineHeight !== undefined) {
    style.lineHeight =
      typeof values.lineHeight === "number"
        ? values.lineHeight
        : compileLength(values.lineHeight);
  }
  if (values.letterSpacing !== undefined) {
    style.letterSpacing = compileLength(values.letterSpacing);
  }
  if (values.textAlign !== undefined) style.textAlign = values.textAlign;
  if (values.textDecoration !== undefined) {
    style.textDecoration = values.textDecoration;
  }
  if (values.borderWidth !== undefined) {
    style.borderWidth = `${values.borderWidth.value}${values.borderWidth.unit}`;
  }
  if (values.borderStyle !== undefined) style.borderStyle = values.borderStyle;
  if (values.borderColor !== undefined) style.borderColor = values.borderColor;
  if (values.borderRadius !== undefined) {
    style.borderRadius = compileLength(values.borderRadius);
  }
  if (values.boxShadow !== undefined) {
    style.boxShadow =
      values.boxShadow.length === 0
        ? "none"
        : values.boxShadow.map(compileBoxShadow).join(", ");
  }
  if (values.backdropBlur !== undefined) {
    const blur = `blur(${values.backdropBlur.value}${values.backdropBlur.unit})`;
    style.backdropFilter = blur;
    style.WebkitBackdropFilter = blur;
  }
  if (values.position !== undefined) style.position = values.position;
  if (values.zIndex !== undefined) style.zIndex = values.zIndex;

  if (values.display === "grid" && values.grid !== undefined) {
    style.gridTemplateColumns = `repeat(${values.grid.columns}, minmax(0, 1fr))`;
    if (values.grid.rows !== undefined) {
      style.gridTemplateRows = `repeat(${values.grid.rows}, minmax(0, 1fr))`;
    }
    style.columnGap = compileLength(values.grid.columnGap);
    style.rowGap = compileLength(values.grid.rowGap);
    if (values.grid.justifyItems !== undefined) {
      style.justifyItems = values.grid.justifyItems;
    }
    if (values.grid.alignItems !== undefined) {
      style.alignItems = values.grid.alignItems;
    }
  }

  if (values.display === "flex" && values.flex !== undefined) {
    style.flexDirection = values.flex.direction;
    style.flexWrap = values.flex.wrap;
    style.justifyContent = values.flex.justifyContent;
    style.alignItems = values.flex.alignItems;
    style.gap = compileLength(values.flex.gap);
  }

  return style;
}
