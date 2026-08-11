export const BREAKPOINTS = {
  tabletMaxWidth: 1024,
  mobileMaxWidth: 767,
} as const;

export type Viewport = "desktop" | "tablet" | "mobile";

export type DimensionUnit = "px" | "%" | "rem" | "em" | "vw" | "vh";

export type DimensionValue =
  | { mode: "fill" }
  | { mode: "viewport" }
  | { mode: "fit" }
  | { mode: "auto" }
  | {
      mode: "fixed";
      value: number;
      unit: DimensionUnit;
    };

export type LengthValue =
  | { value: number; unit: DimensionUnit }
  | {
      keyword: "auto" | "fit-content" | "max-content" | "min-content";
    };

export type BorderWidthUnit = "px" | "rem" | "em";

export type BorderWidthValue = {
  value: number;
  unit: BorderWidthUnit;
};

export type BorderStyle = "none" | "solid" | "dashed" | "dotted";

export type EffectUnit = "px" | "rem" | "em";

export type EffectLengthValue = {
  value: number;
  unit: EffectUnit;
};

export type BoxShadowValue = {
  offsetX: number;
  offsetY: number;
  blurRadius: number;
  spreadRadius: number;
  unit: EffectUnit;
  color: string;
  inset: boolean;
};

export type TextDecoration =
  | "none"
  | "underline"
  | "overline"
  | "line-through";

export type LinearGradientValue = {
  kind: "linear-gradient";
  angle: number;
  startColor: string;
  endColor: string;
};

export type BackgroundImageValue =
  | { kind: "none" }
  | LinearGradientValue
  | {
      kind: "image";
      source: string;
      size: "cover" | "contain" | "auto";
      positionX: "left" | "center" | "right";
      positionY: "top" | "center" | "bottom";
      repeat: "no-repeat" | "repeat" | "repeat-x" | "repeat-y";
    };

export type SpacingValue = {
  top: LengthValue;
  right: LengthValue;
  bottom: LengthValue;
  left: LengthValue;
};

export type GridConfig = {
  columns: number;
  rows?: number;
  columnGap: LengthValue;
  rowGap: LengthValue;
  justifyItems?: "start" | "center" | "end" | "stretch";
  alignItems?: "start" | "center" | "end" | "stretch";
};

export type FlexConfig = {
  direction: "row" | "column" | "row-reverse" | "column-reverse";
  wrap: "nowrap" | "wrap" | "wrap-reverse";
  justifyContent: string;
  alignItems: string;
  gap: LengthValue;
};

export type StyleValues = {
  display?: "block" | "flex" | "grid" | "none";
  width?: DimensionValue;
  height?: DimensionValue;
  minWidth?: LengthValue;
  minHeight?: LengthValue;
  maxWidth?: LengthValue;
  maxHeight?: LengthValue;
  margin?: SpacingValue;
  padding?: SpacingValue;
  color?: string;
  backgroundColor?: string;
  backgroundImage?: BackgroundImageValue;
  fontFamily?: string;
  fontSize?: LengthValue;
  fontWeight?: number;
  lineHeight?: number | LengthValue;
  letterSpacing?: LengthValue;
  textAlign?: "left" | "center" | "right" | "justify";
  textDecoration?: TextDecoration;
  borderWidth?: BorderWidthValue;
  borderStyle?: BorderStyle;
  borderColor?: string;
  borderRadius?: LengthValue;
  boxShadow?: BoxShadowValue[];
  backdropBlur?: EffectLengthValue;
  position?: "static" | "relative" | "absolute" | "fixed" | "sticky";
  zIndex?: "auto" | number;
  grid?: GridConfig;
  flex?: FlexConfig;
};

export type StylePatch = Omit<
  Partial<StyleValues>,
  "margin" | "padding" | "grid" | "flex"
> & {
  margin?: Partial<SpacingValue>;
  padding?: Partial<SpacingValue>;
  grid?: Partial<GridConfig>;
  flex?: Partial<FlexConfig>;
};

export type ResponsiveStyles = {
  base: StyleValues;
  tablet?: StylePatch;
  mobile?: StylePatch;
};
