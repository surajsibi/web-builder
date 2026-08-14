import type {
  BackgroundImageValue,
  BoxShadowValue,
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
  Viewport,
} from "./types";

function cloneLength(value: LengthValue): LengthValue {
  return { ...value };
}

function cloneBorderWidth(value: BorderWidthValue): BorderWidthValue {
  return { ...value };
}

function cloneEffectLength(value: EffectLengthValue): EffectLengthValue {
  return { ...value };
}

function clonePositionOffset(value: PositionOffsetValue): PositionOffsetValue {
  return {
    x: { ...value.x },
    y: { ...value.y },
  };
}

function cloneBoxShadow(value: BoxShadowValue): BoxShadowValue {
  return { ...value };
}

function cloneBackgroundImage(
  value: BackgroundImageValue,
): BackgroundImageValue {
  return { ...value };
}

function cloneDimension(value: DimensionValue): DimensionValue {
  return { ...value };
}

function cloneSpacing(value: SpacingValue): SpacingValue {
  return {
    top: cloneLength(value.top),
    right: cloneLength(value.right),
    bottom: cloneLength(value.bottom),
    left: cloneLength(value.left),
  };
}

function cloneGrid(value: GridConfig): GridConfig {
  return {
    ...value,
    columnGap: cloneLength(value.columnGap),
    rowGap: cloneLength(value.rowGap),
  };
}

function cloneFlex(value: FlexConfig): FlexConfig {
  return {
    ...value,
    gap: cloneLength(value.gap),
  };
}

export function cloneStyleValues(styles: Readonly<StyleValues>): StyleValues {
  return {
    ...styles,
    ...(styles.width && { width: cloneDimension(styles.width) }),
    ...(styles.height && { height: cloneDimension(styles.height) }),
    ...(styles.minWidth && { minWidth: cloneLength(styles.minWidth) }),
    ...(styles.minHeight && { minHeight: cloneLength(styles.minHeight) }),
    ...(styles.maxWidth && { maxWidth: cloneLength(styles.maxWidth) }),
    ...(styles.maxHeight && { maxHeight: cloneLength(styles.maxHeight) }),
    ...(styles.margin && { margin: cloneSpacing(styles.margin) }),
    ...(styles.padding && { padding: cloneSpacing(styles.padding) }),
    ...(styles.backgroundImage && {
      backgroundImage: cloneBackgroundImage(styles.backgroundImage),
    }),
    ...(styles.fontSize && { fontSize: cloneLength(styles.fontSize) }),
    ...(typeof styles.lineHeight === "object" && {
      lineHeight: cloneLength(styles.lineHeight),
    }),
    ...(styles.letterSpacing && {
      letterSpacing: cloneLength(styles.letterSpacing),
    }),
    ...(styles.borderWidth && {
      borderWidth: cloneBorderWidth(styles.borderWidth),
    }),
    ...(styles.borderRadius && {
      borderRadius: cloneLength(styles.borderRadius),
    }),
    ...(styles.boxShadow && {
      boxShadow: styles.boxShadow.map(cloneBoxShadow),
    }),
    ...(styles.backdropBlur && {
      backdropBlur: cloneEffectLength(styles.backdropBlur),
    }),
    ...(styles.positionOffset && {
      positionOffset: clonePositionOffset(styles.positionOffset),
    }),
    ...(styles.grid && { grid: cloneGrid(styles.grid) }),
    ...(styles.flex && { flex: cloneFlex(styles.flex) }),
  };
}

function mergeSpacingPatch(
  current: SpacingValue | undefined,
  patch: Partial<SpacingValue>,
): SpacingValue {
  const merged = current ? cloneSpacing(current) : ({} as SpacingValue);

  if (patch.top !== undefined) merged.top = cloneLength(patch.top);
  if (patch.right !== undefined) merged.right = cloneLength(patch.right);
  if (patch.bottom !== undefined) merged.bottom = cloneLength(patch.bottom);
  if (patch.left !== undefined) merged.left = cloneLength(patch.left);

  return merged;
}

function mergeGridPatch(
  current: GridConfig | undefined,
  patch: Partial<GridConfig>,
): GridConfig {
  const merged = current ? cloneGrid(current) : ({} as GridConfig);

  if (patch.columns !== undefined) merged.columns = patch.columns;
  if (patch.rows !== undefined) merged.rows = patch.rows;
  if (patch.columnGap !== undefined) {
    merged.columnGap = cloneLength(patch.columnGap);
  }
  if (patch.rowGap !== undefined) merged.rowGap = cloneLength(patch.rowGap);
  if (patch.justifyItems !== undefined) {
    merged.justifyItems = patch.justifyItems;
  }
  if (patch.alignItems !== undefined) merged.alignItems = patch.alignItems;

  return merged;
}

function mergeFlexPatch(
  current: FlexConfig | undefined,
  patch: Partial<FlexConfig>,
): FlexConfig {
  const merged = current ? cloneFlex(current) : ({} as FlexConfig);

  if (patch.direction !== undefined) merged.direction = patch.direction;
  if (patch.wrap !== undefined) merged.wrap = patch.wrap;
  if (patch.justifyContent !== undefined) {
    merged.justifyContent = patch.justifyContent;
  }
  if (patch.alignItems !== undefined) merged.alignItems = patch.alignItems;
  if (patch.gap !== undefined) merged.gap = cloneLength(patch.gap);

  return merged;
}

export function mergeStylePatch(
  current: Readonly<StyleValues>,
  patch: Readonly<StylePatch> | undefined,
): StyleValues {
  const merged = cloneStyleValues(current);

  if (!patch) return merged;

  if (patch.display !== undefined) merged.display = patch.display;
  if (patch.width !== undefined) merged.width = cloneDimension(patch.width);
  if (patch.height !== undefined) merged.height = cloneDimension(patch.height);
  if (patch.minWidth !== undefined) {
    merged.minWidth = cloneLength(patch.minWidth);
  }
  if (patch.minHeight !== undefined) {
    merged.minHeight = cloneLength(patch.minHeight);
  }
  if (patch.maxWidth !== undefined) {
    merged.maxWidth = cloneLength(patch.maxWidth);
  }
  if (patch.maxHeight !== undefined) {
    merged.maxHeight = cloneLength(patch.maxHeight);
  }
  if (patch.margin !== undefined) {
    merged.margin = mergeSpacingPatch(merged.margin, patch.margin);
  }
  if (patch.padding !== undefined) {
    merged.padding = mergeSpacingPatch(merged.padding, patch.padding);
  }
  if (patch.color !== undefined) merged.color = patch.color;
  if (patch.backgroundColor !== undefined) {
    merged.backgroundColor = patch.backgroundColor;
  }
  if (patch.backgroundImage !== undefined) {
    merged.backgroundImage = cloneBackgroundImage(patch.backgroundImage);
  }
  if (patch.fontFamily !== undefined) merged.fontFamily = patch.fontFamily;
  if (patch.fontSize !== undefined) {
    merged.fontSize = cloneLength(patch.fontSize);
  }
  if (patch.fontWeight !== undefined) merged.fontWeight = patch.fontWeight;
  if (patch.lineHeight !== undefined) {
    merged.lineHeight =
      typeof patch.lineHeight === "number"
        ? patch.lineHeight
        : cloneLength(patch.lineHeight);
  }
  if (patch.letterSpacing !== undefined) {
    merged.letterSpacing = cloneLength(patch.letterSpacing);
  }
  if (patch.textAlign !== undefined) merged.textAlign = patch.textAlign;
  if (patch.textDecoration !== undefined) {
    merged.textDecoration = patch.textDecoration;
  }
  if (patch.borderWidth !== undefined) {
    merged.borderWidth = cloneBorderWidth(patch.borderWidth);
  }
  if (patch.borderStyle !== undefined) merged.borderStyle = patch.borderStyle;
  if (patch.borderColor !== undefined) merged.borderColor = patch.borderColor;
  if (patch.borderRadius !== undefined) {
    merged.borderRadius = cloneLength(patch.borderRadius);
  }
  if (patch.boxShadow !== undefined) {
    merged.boxShadow = patch.boxShadow.map(cloneBoxShadow);
  }
  if (patch.backdropBlur !== undefined) {
    merged.backdropBlur = cloneEffectLength(patch.backdropBlur);
  }
  if (patch.position !== undefined) merged.position = patch.position;
  if (patch.positionOffset !== undefined) {
    merged.positionOffset = clonePositionOffset(patch.positionOffset);
  }
  if (patch.zIndex !== undefined) merged.zIndex = patch.zIndex;
  if (patch.grid !== undefined) {
    merged.grid = mergeGridPatch(merged.grid, patch.grid);
  }
  if (patch.flex !== undefined) {
    merged.flex = mergeFlexPatch(merged.flex, patch.flex);
  }

  return merged;
}

export function resolveResponsiveStyles(
  styles: Readonly<ResponsiveStyles>,
  viewport: Viewport,
): StyleValues {
  let resolved = cloneStyleValues(styles.base);

  if (viewport === "tablet" || viewport === "mobile") {
    resolved = mergeStylePatch(resolved, styles.tablet);
  }

  if (viewport === "mobile") {
    resolved = mergeStylePatch(resolved, styles.mobile);
  }

  return resolved;
}
