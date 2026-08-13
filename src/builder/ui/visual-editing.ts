import type { CSSProperties } from "react";

import type { StyleChange } from "@/builder/commands/types";
import type { BuilderNode } from "@/builder/model/project-document";
import { compileStyleValues } from "@/builder/styles/compile";
import {
  cloneStyleValues,
  resolveResponsiveStyles,
} from "@/builder/styles/resolve";
import type {
  DimensionUnit,
  DimensionValue,
  FlexConfig,
  GridConfig,
  LengthValue,
  ResponsiveStyles,
  SpacingValue,
  StyleValues,
  Viewport,
} from "@/builder/styles/types";

export const INSPECTOR_UNITS = ["px", "%", "rem", "em"] as const;

export type InspectorUnit = (typeof INSPECTOR_UNITS)[number];
export type ResizeHandle = "east" | "south" | "south-east";
export type ResizeContext = {
  dimensions: Readonly<Pick<StyleValues, "width" | "height" | "position">>;
  parentContentWidth: number | null;
  parentContentHeight: number | null;
  parentHasDefiniteHeight: boolean;
  elementFontSize: number | null;
  rootFontSize: number | null;
  viewportWidth: number | null;
  viewportHeight: number | null;
};
export type SpacingProperty = "padding" | "margin";
export type SpacingSide = keyof SpacingValue;
export type SpacingMode = "axes" | "all";
export type VisualOverlayMode = "none" | "padding" | "margin" | "layout";
export type PositionPoint = { x: number; y: number };
export type PositionPointerSample = {
  clientX: number;
  clientY: number;
  scrollX: number;
  scrollY: number;
};
export type PositionRect = PositionPoint & { width: number; height: number };
export type PositionGeometry = {
  offset: PositionPoint;
  rect: PositionRect;
};
export type PositionProposal = {
  raw: PositionGeometry;
  adjusted: PositionGeometry;
};
export type PositionAdjustment = (
  raw: Readonly<PositionGeometry>,
) => PositionGeometry;
export type PositioningKeyAction =
  | { kind: "nudge"; delta: PositionPoint }
  | { kind: "commit" }
  | { kind: "cancel" };

export type VisualEditSession = {
  nodeId: BuilderNode["id"];
  changes: readonly [StyleChange, ...StyleChange[]];
  announcement?: string;
};

export function spacingSidesForMode(
  mode: SpacingMode,
  side: SpacingSide,
): readonly SpacingSide[] {
  if (mode === "all") return [side];
  return side === "top" || side === "bottom"
    ? ["top", "bottom"]
    : ["left", "right"];
}

export const DEFAULT_FLEX_CONFIG: FlexConfig = {
  direction: "row",
  wrap: "nowrap",
  justifyContent: "flex-start",
  alignItems: "stretch",
  gap: { value: 0, unit: "px" },
};

export const DEFAULT_GRID_CONFIG: GridConfig = {
  columns: 2,
  columnGap: { value: 16, unit: "px" },
  rowGap: { value: 16, unit: "px" },
  justifyItems: "stretch",
  alignItems: "stretch",
};

const ZERO_SPACING: SpacingValue = {
  top: { value: 0, unit: "px" },
  right: { value: 0, unit: "px" },
  bottom: { value: 0, unit: "px" },
  left: { value: 0, unit: "px" },
};

function copyLength(value: LengthValue): LengthValue {
  return { ...value };
}

function copySpacing(value: SpacingValue): SpacingValue {
  return {
    top: copyLength(value.top),
    right: copyLength(value.right),
    bottom: copyLength(value.bottom),
    left: copyLength(value.left),
  };
}

function applyStyleChanges(
  values: Readonly<StyleValues>,
  changes: readonly StyleChange[],
): StyleValues {
  const next = cloneStyleValues(values) as Record<string, unknown>;

  for (const change of changes) {
    const property = change.target.property;
    if (change.operation === "reset") {
      if ("field" in change.target && change.target.field !== undefined) {
        const current = next[property];
        if (typeof current === "object" && current !== null) {
          const nested = { ...(current as Record<string, unknown>) };
          delete nested[change.target.field];
          if (Object.keys(nested).length === 0) delete next[property];
          else next[property] = nested;
        }
      } else {
        delete next[property];
      }
      continue;
    }

    if ("field" in change.target && change.target.field !== undefined) {
      const current = next[property];
      const nested =
        typeof current === "object" && current !== null
          ? { ...(current as Record<string, unknown>) }
          : {};
      nested[change.target.field] = change.value;
      next[property] = nested;
    } else {
      next[property] = change.value;
    }
  }

  return next as StyleValues;
}

export function positionDeltaInArtboard(
  start: Readonly<PositionPointerSample>,
  current: Readonly<PositionPointerSample>,
  zoom: number,
): PositionPoint {
  if (!Number.isFinite(zoom) || zoom <= 0) {
    throw new Error("Zoom must be a positive finite number");
  }

  return {
    x: (current.clientX - start.clientX + current.scrollX - start.scrollX) / zoom,
    y: (current.clientY - start.clientY + current.scrollY - start.scrollY) / zoom,
  };
}

function clonePositionGeometry(value: Readonly<PositionGeometry>): PositionGeometry {
  return {
    offset: { ...value.offset },
    rect: { ...value.rect },
  };
}

export function positionProposal(
  startOffset: Readonly<PositionPoint>,
  startRect: Readonly<PositionRect>,
  delta: Readonly<PositionPoint>,
  adjust: PositionAdjustment = clonePositionGeometry,
): PositionProposal {
  const raw: PositionGeometry = {
    offset: {
      x: startOffset.x + delta.x,
      y: startOffset.y + delta.y,
    },
    rect: {
      x: startRect.x + delta.x,
      y: startRect.y + delta.y,
      width: startRect.width,
      height: startRect.height,
    },
  };

  return {
    raw: clonePositionGeometry(raw),
    adjusted: clonePositionGeometry(adjust(clonePositionGeometry(raw))),
  };
}

export function positionOffsetStyleChange(
  offset: Readonly<PositionPoint>,
): StyleChange {
  if (!Number.isFinite(offset.x) || !Number.isFinite(offset.y)) {
    throw new Error("Position offset values must be finite");
  }

  return {
    target: { property: "positionOffset" },
    value: {
      x: { value: offset.x, unit: "px" },
      y: { value: offset.y, unit: "px" },
    },
  };
}

export function positioningKeyAction(
  key: string,
  shiftKey: boolean,
): PositioningKeyAction | null {
  if (key === "Enter") return { kind: "commit" };
  if (key === "Escape") return { kind: "cancel" };

  const step = shiftKey ? 10 : 1;
  switch (key) {
    case "ArrowLeft":
      return { kind: "nudge", delta: { x: -step, y: 0 } };
    case "ArrowRight":
      return { kind: "nudge", delta: { x: step, y: 0 } };
    case "ArrowUp":
      return { kind: "nudge", delta: { x: 0, y: -step } };
    case "ArrowDown":
      return { kind: "nudge", delta: { x: 0, y: step } };
    default:
      return null;
  }
}

export function previewStyleForChanges(
  styles: Readonly<ResponsiveStyles>,
  viewport: Viewport,
  changes: readonly StyleChange[],
): CSSProperties {
  const resolved = resolveResponsiveStyles(styles, viewport);
  return compileStyleValues(applyStyleChanges(resolved, changes));
}

const FILL_SNAP_PERCENTAGE = 1;

function positiveFinite(value: number | null): value is number {
  return value !== null && Number.isFinite(value) && value > 0;
}

function roundResizeValue(value: number, unit: DimensionUnit): number {
  return unit === "px"
    ? Math.round(value)
    : Math.round(value * 100) / 100;
}

function unitBasis(
  unit: DimensionUnit,
  axis: "width" | "height",
  context: Readonly<ResizeContext>,
): number | null {
  if (unit === "px") return 1;
  if (unit === "%") {
    if (axis === "height" && !context.parentHasDefiniteHeight) return null;
    const parentSize =
      axis === "width"
        ? context.parentContentWidth
        : context.parentContentHeight;
    return positiveFinite(parentSize) ? parentSize / 100 : null;
  }
  if (unit === "rem") {
    return positiveFinite(context.rootFontSize) ? context.rootFontSize : null;
  }
  if (unit === "em") {
    return positiveFinite(context.elementFontSize)
      ? context.elementFontSize
      : null;
  }
  const viewportSize =
    unit === "vw" ? context.viewportWidth : context.viewportHeight;
  return positiveFinite(viewportSize) ? viewportSize / 100 : null;
}

function fixedDimensionFromPixels(
  current: DimensionValue | undefined,
  axis: "width" | "height",
  pixels: number,
  context: Readonly<ResizeContext>,
): DimensionValue | null {
  if (current?.mode !== "fixed") return null;
  const basis = unitBasis(current.unit, axis, context);
  if (!positiveFinite(basis)) return null;
  return {
    mode: "fixed",
    value: roundResizeValue(pixels / basis, current.unit),
    unit: current.unit,
  };
}

function widthFromPixels(
  pixels: number,
  context: Readonly<ResizeContext>,
): DimensionValue {
  const current = context.dimensions.width;
  const preserved = fixedDimensionFromPixels(
    current,
    "width",
    pixels,
    context,
  );
  if (preserved) return preserved;

  const normalFlow =
    context.dimensions.position !== "absolute" &&
    context.dimensions.position !== "fixed";
  const firstSemanticResize =
    current === undefined ||
    current.mode === "fill" ||
    current.mode === "fit" ||
    current.mode === "auto";

  if (
    normalFlow &&
    firstSemanticResize &&
    positiveFinite(context.parentContentWidth)
  ) {
    const percentage = (pixels / context.parentContentWidth) * 100;
    if (Math.abs(percentage - 100) <= FILL_SNAP_PERCENTAGE) {
      return { mode: "fill" };
    }
    return {
      mode: "fixed",
      value: roundResizeValue(percentage, "%"),
      unit: "%",
    };
  }

  return { mode: "fixed", value: Math.round(pixels), unit: "px" };
}

function heightFromPixels(
  pixels: number,
  context: Readonly<ResizeContext>,
): DimensionValue {
  return (
    fixedDimensionFromPixels(
      context.dimensions.height,
      "height",
      pixels,
      context,
    ) ?? { mode: "fixed", value: Math.round(pixels), unit: "px" }
  );
}

export function resizeStyleChanges(
  handle: ResizeHandle,
  start: Readonly<{ width: number; height: number }>,
  delta: Readonly<{ x: number; y: number }>,
  context: Readonly<ResizeContext>,
): readonly [StyleChange, ...StyleChange[]] {
  const changes: StyleChange[] = [];

  if (handle === "east" || handle === "south-east") {
    const width = Math.max(0, start.width + delta.x);
    changes.push({
      target: { property: "width" },
      value: widthFromPixels(width, context),
    });
  }

  if (handle === "south" || handle === "south-east") {
    const height = Math.max(0, start.height + delta.y);
    changes.push({
      target: { property: "height" },
      value: heightFromPixels(height, context),
    });
  }

  return [changes[0]!, ...changes.slice(1)];
}

export function spacingStyleChanges(
  styles: Readonly<ResponsiveStyles>,
  viewport: Viewport,
  property: SpacingProperty,
  updates: Readonly<Partial<Record<SpacingSide, LengthValue>>>,
): readonly [StyleChange, ...StyleChange[]] {
  const resolved = resolveResponsiveStyles(styles, viewport);
  const current = resolved[property];

  if (current === undefined) {
    const complete = copySpacing(ZERO_SPACING);
    for (const [side, value] of Object.entries(updates) as [
      SpacingSide,
      LengthValue | undefined,
    ][]) {
      if (value !== undefined) complete[side] = copyLength(value);
    }
    return [{ target: { property }, value: complete }];
  }

  const changes = (Object.entries(updates) as [
    SpacingSide,
    LengthValue | undefined,
  ][])
    .filter((entry): entry is [SpacingSide, LengthValue] => entry[1] !== undefined)
    .map(([side, value]) => ({
      target: { property, field: side },
      value,
    })) satisfies StyleChange[];

  if (changes.length === 0) {
    throw new Error("At least one spacing update is required");
  }

  return [changes[0]!, ...changes.slice(1)];
}

export function layoutModeStyleChanges(
  display: "block" | "flex" | "grid",
  resolved: Readonly<StyleValues>,
): readonly [StyleChange, ...StyleChange[]] {
  const changes: StyleChange[] = [
    { target: { property: "display" }, value: display },
  ];

  if (display === "flex" && resolved.flex === undefined) {
    changes.push({ target: { property: "flex" }, value: DEFAULT_FLEX_CONFIG });
  }
  if (display === "grid" && resolved.grid === undefined) {
    changes.push({ target: { property: "grid" }, value: DEFAULT_GRID_CONFIG });
  }

  return [changes[0]!, ...changes.slice(1)];
}
