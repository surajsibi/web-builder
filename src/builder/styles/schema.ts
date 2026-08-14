import { z } from "zod";

import { isJsonValue } from "@/builder/model/json";

import { mergeStylePatch } from "./resolve";
import type {
  BackgroundImageValue,
  BoxShadowValue,
  BorderStyle,
  BorderWidthValue,
  DimensionValue,
  EffectLengthValue,
  FlexConfig,
  GridConfig,
  LengthValue,
  PositionOffsetValue,
  ResponsiveStyles,
  SpacingValue,
  StylePatch,
  StyleValues,
  TextDecoration,
} from "./types";

const finiteNumberSchema = z.number().finite();
const dimensionUnitSchema = z.enum(["px", "%", "rem", "em", "vw", "vh"]);
const borderWidthUnitSchema = z.enum(["px", "rem", "em"]);
const effectUnitSchema = z.enum(["px", "rem", "em"]);
const gradientColorSchema = z.string().regex(
  /^(?:transparent|#[\da-f]{3}|#[\da-f]{4}|#[\da-f]{6}|#[\da-f]{8})$/i,
  "Gradient colors must be transparent or a three-, four-, six-, or eight-digit hex color",
);
export const IMAGE_SOURCE_MAX_LENGTH = 2_048;
export const BACKGROUND_IMAGE_SOURCE_MAX_LENGTH = IMAGE_SOURCE_MAX_LENGTH;

export function isSafeImageSource(source: string): boolean {
  if (
    source.length === 0 ||
    source.length > IMAGE_SOURCE_MAX_LENGTH ||
    source !== source.trim() ||
    /[\u0000-\u0020\u007f"'\\]/.test(source)
  ) {
    return false;
  }

  if (/^\/(?!\/)/.test(source)) return true;
  if (!/^https:\/\//i.test(source)) return false;

  try {
    const url = new URL(source);
    return (
      url.protocol === "https:" &&
      url.username === "" &&
      url.password === ""
    );
  } catch {
    return false;
  }
}

export const isSafeBackgroundImageSource = isSafeImageSource;

export const backgroundImageValueSchema: z.ZodType<BackgroundImageValue> =
  z.discriminatedUnion("kind", [
    z.object({ kind: z.literal("none") }).strict(),
    z
      .object({
        kind: z.literal("linear-gradient"),
        angle: finiteNumberSchema.min(0).max(360),
        startColor: gradientColorSchema,
        endColor: gradientColorSchema,
      })
      .strict(),
    z
      .object({
        kind: z.literal("image"),
        source: z.string().refine(isSafeBackgroundImageSource, {
          message: "Background image source must be a safe HTTPS URL or root-relative path",
        }),
        size: z.enum(["cover", "contain", "auto"]),
        positionX: z.enum(["left", "center", "right"]),
        positionY: z.enum(["top", "center", "bottom"]),
        repeat: z.enum(["no-repeat", "repeat", "repeat-x", "repeat-y"]),
      })
      .strict(),
  ]);

export const borderWidthValueSchema: z.ZodType<BorderWidthValue> = z
  .object({
    value: finiteNumberSchema.nonnegative(),
    unit: borderWidthUnitSchema,
  })
  .strict();

export const borderStyleSchema: z.ZodType<BorderStyle> = z.enum([
  "none",
  "solid",
  "dashed",
  "dotted",
]);

export const effectLengthValueSchema: z.ZodType<EffectLengthValue> = z
  .object({
    value: finiteNumberSchema.nonnegative(),
    unit: effectUnitSchema,
  })
  .strict();

const positionOffsetLengthValueSchema = z
  .object({
    value: finiteNumberSchema,
    unit: z.literal("px"),
  })
  .strict();

export const positionOffsetValueSchema: z.ZodType<PositionOffsetValue> = z
  .object({
    x: positionOffsetLengthValueSchema,
    y: positionOffsetLengthValueSchema,
  })
  .strict();

export const boxShadowValueSchema: z.ZodType<BoxShadowValue> = z
  .object({
    offsetX: finiteNumberSchema,
    offsetY: finiteNumberSchema,
    blurRadius: finiteNumberSchema.nonnegative(),
    spreadRadius: finiteNumberSchema,
    unit: effectUnitSchema,
    color: z.string().trim().min(1).max(128),
    inset: z.boolean(),
  })
  .strict();

export const textDecorationSchema: z.ZodType<TextDecoration> = z.enum([
  "none",
  "underline",
  "overline",
  "line-through",
]);

export const dimensionValueSchema: z.ZodType<DimensionValue> =
  z.discriminatedUnion("mode", [
    z.object({ mode: z.literal("fill") }).strict(),
    z.object({ mode: z.literal("viewport") }).strict(),
    z.object({ mode: z.literal("fit") }).strict(),
    z.object({ mode: z.literal("auto") }).strict(),
    z
      .object({
        mode: z.literal("fixed"),
        value: finiteNumberSchema,
        unit: dimensionUnitSchema,
      })
      .strict(),
  ]);

export const lengthValueSchema: z.ZodType<LengthValue> = z.union([
  z
    .object({
      value: finiteNumberSchema,
      unit: dimensionUnitSchema,
    })
    .strict(),
  z
    .object({
      keyword: z.enum([
        "auto",
        "fit-content",
        "max-content",
        "min-content",
      ]),
    })
    .strict(),
]);

export const spacingValueSchema: z.ZodType<SpacingValue> = z
  .object({
    top: lengthValueSchema,
    right: lengthValueSchema,
    bottom: lengthValueSchema,
    left: lengthValueSchema,
  })
  .strict();

export const gridConfigSchema: z.ZodType<GridConfig> = z
  .object({
    columns: z.number().int().positive(),
    rows: z.number().int().positive().optional(),
    columnGap: lengthValueSchema,
    rowGap: lengthValueSchema,
    justifyItems: z.enum(["start", "center", "end", "stretch"]).optional(),
    alignItems: z.enum(["start", "center", "end", "stretch"]).optional(),
  })
  .strict();

export const flexConfigSchema: z.ZodType<FlexConfig> = z
  .object({
    direction: z.enum(["row", "column", "row-reverse", "column-reverse"]),
    wrap: z.enum(["nowrap", "wrap", "wrap-reverse"]),
    justifyContent: z.string().min(1),
    alignItems: z.string().min(1),
    gap: lengthValueSchema,
  })
  .strict();

const styleValuesObjectSchema = z
  .object({
    display: z.enum(["block", "flex", "grid", "none"]).optional(),
    width: dimensionValueSchema.optional(),
    height: dimensionValueSchema.optional(),
    minWidth: lengthValueSchema.optional(),
    minHeight: lengthValueSchema.optional(),
    maxWidth: lengthValueSchema.optional(),
    maxHeight: lengthValueSchema.optional(),
    margin: spacingValueSchema.optional(),
    padding: spacingValueSchema.optional(),
    color: z.string().optional(),
    backgroundColor: z.string().optional(),
    backgroundImage: backgroundImageValueSchema.optional(),
    fontFamily: z.string().optional(),
    fontSize: lengthValueSchema.optional(),
    fontWeight: finiteNumberSchema.optional(),
    lineHeight: z.union([finiteNumberSchema, lengthValueSchema]).optional(),
    letterSpacing: lengthValueSchema.optional(),
    textAlign: z.enum(["left", "center", "right", "justify"]).optional(),
    textDecoration: textDecorationSchema.optional(),
    borderWidth: borderWidthValueSchema.optional(),
    borderStyle: borderStyleSchema.optional(),
    borderColor: z.string().optional(),
    borderRadius: lengthValueSchema.optional(),
    boxShadow: z.array(boxShadowValueSchema).max(4).optional(),
    backdropBlur: effectLengthValueSchema.optional(),
    position: z
      .enum(["static", "relative", "absolute", "fixed", "sticky"])
      .optional(),
    positionOffset: positionOffsetValueSchema.optional(),
    zIndex: z.union([z.literal("auto"), finiteNumberSchema]).optional(),
    grid: gridConfigSchema.optional(),
    flex: flexConfigSchema.optional(),
  })
  .strict();

export const styleValuesSchema: z.ZodType<StyleValues> =
  styleValuesObjectSchema.superRefine((value, context) => {
    if (!isJsonValue(value)) {
      context.addIssue({
        code: "custom",
        message: "Style values must contain only JSON-safe values",
      });
    }
  });

const spacingPatchSchema = z
  .object({
    top: lengthValueSchema.optional(),
    right: lengthValueSchema.optional(),
    bottom: lengthValueSchema.optional(),
    left: lengthValueSchema.optional(),
  })
  .strict();

const gridPatchSchema = z
  .object({
    columns: z.number().int().positive().optional(),
    rows: z.number().int().positive().optional(),
    columnGap: lengthValueSchema.optional(),
    rowGap: lengthValueSchema.optional(),
    justifyItems: z.enum(["start", "center", "end", "stretch"]).optional(),
    alignItems: z.enum(["start", "center", "end", "stretch"]).optional(),
  })
  .strict();

const flexPatchSchema = z
  .object({
    direction: z
      .enum(["row", "column", "row-reverse", "column-reverse"])
      .optional(),
    wrap: z.enum(["nowrap", "wrap", "wrap-reverse"]).optional(),
    justifyContent: z.string().min(1).optional(),
    alignItems: z.string().min(1).optional(),
    gap: lengthValueSchema.optional(),
  })
  .strict();

const stylePatchObjectSchema = z
  .object({
    display: z.enum(["block", "flex", "grid", "none"]).optional(),
    width: dimensionValueSchema.optional(),
    height: dimensionValueSchema.optional(),
    minWidth: lengthValueSchema.optional(),
    minHeight: lengthValueSchema.optional(),
    maxWidth: lengthValueSchema.optional(),
    maxHeight: lengthValueSchema.optional(),
    margin: spacingPatchSchema.optional(),
    padding: spacingPatchSchema.optional(),
    color: z.string().optional(),
    backgroundColor: z.string().optional(),
    backgroundImage: backgroundImageValueSchema.optional(),
    fontFamily: z.string().optional(),
    fontSize: lengthValueSchema.optional(),
    fontWeight: finiteNumberSchema.optional(),
    lineHeight: z.union([finiteNumberSchema, lengthValueSchema]).optional(),
    letterSpacing: lengthValueSchema.optional(),
    textAlign: z.enum(["left", "center", "right", "justify"]).optional(),
    textDecoration: textDecorationSchema.optional(),
    borderWidth: borderWidthValueSchema.optional(),
    borderStyle: borderStyleSchema.optional(),
    borderColor: z.string().optional(),
    borderRadius: lengthValueSchema.optional(),
    boxShadow: z.array(boxShadowValueSchema).max(4).optional(),
    backdropBlur: effectLengthValueSchema.optional(),
    position: z
      .enum(["static", "relative", "absolute", "fixed", "sticky"])
      .optional(),
    positionOffset: positionOffsetValueSchema.optional(),
    zIndex: z.union([z.literal("auto"), finiteNumberSchema]).optional(),
    grid: gridPatchSchema.optional(),
    flex: flexPatchSchema.optional(),
  })
  .strict();

export const stylePatchSchema: z.ZodType<StylePatch> =
  stylePatchObjectSchema.superRefine((value, context) => {
    if (!isJsonValue(value)) {
      context.addIssue({
        code: "custom",
        message: "Style patches must contain only JSON-safe values",
      });
    }
  });

const responsiveStylesObjectSchema = z
  .object({
    base: styleValuesSchema,
    tablet: stylePatchSchema.optional(),
    mobile: stylePatchSchema.optional(),
  })
  .strict();

export const responsiveStylesSchema: z.ZodType<ResponsiveStyles> =
  responsiveStylesObjectSchema.superRefine((styles, context) => {
    if (!isJsonValue(styles)) {
      context.addIssue({
        code: "custom",
        message: "Responsive styles must contain only JSON-safe values",
      });
      return;
    }

    const tablet = mergeStylePatch(styles.base, styles.tablet);
    const mobile = mergeStylePatch(tablet, styles.mobile);

    for (const [layer, resolved] of [
      ["tablet", tablet],
      ["mobile", mobile],
    ] as const) {
      const result = styleValuesSchema.safeParse(resolved);

      if (!result.success) {
        context.addIssue({
          code: "custom",
          path: [layer],
          message: `${layer} overrides do not resolve to complete style values`,
        });
      }
    }
  });

export function parseResponsiveStyles(input: unknown): ResponsiveStyles {
  return responsiveStylesSchema.parse(input);
}
