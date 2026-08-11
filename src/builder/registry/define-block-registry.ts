import type React from "react";

import { isJsonObject } from "@/builder/model/json";
import type { JsonObject } from "@/builder/model/json";
import {
  canPlaceType,
  componentRegistry,
  type ComponentType,
} from "@/builder/registry/component-registry";
import {
  responsiveStylesSchema,
  stylePatchSchema,
} from "@/builder/styles/schema";
import type {
  ResponsiveStyles,
  StylePatch,
} from "@/builder/styles/types";

export type ComponentTemplateStyleOverrides = {
  base?: StylePatch;
  tablet?: StylePatch;
  mobile?: StylePatch;
};

export type ComponentTemplate = {
  type: ComponentType;
  props?: JsonObject;
  styles?: ComponentTemplateStyleOverrides;
  children?: readonly ComponentTemplate[];
};

export type BlockDefinition = {
  label: string;
  category: string;
  icon: React.ComponentType;
  createTemplate: () => ComponentTemplate;
};

export type ResolvedComponentTemplate = {
  type: ComponentType;
  componentVersion: number;
  props: JsonObject;
  styles: ResponsiveStyles;
  children: readonly ResolvedComponentTemplate[];
};

type RegistryEntry = BlockDefinition;

const TEMPLATE_STYLE_LAYERS = new Set(["base", "tablet", "mobile"]);
const NESTED_STYLE_KEYS = new Set(["margin", "padding", "grid", "flex"]);

function mergeStylePatches(
  current: Readonly<StylePatch> | undefined,
  override: Readonly<StylePatch> | undefined,
): StylePatch | undefined {
  if (!current && !override) return undefined;

  const merged = structuredClone(current ?? {}) as Record<string, unknown>;
  for (const [key, value] of Object.entries(override ?? {})) {
    const previous = merged[key];
    merged[key] =
      NESTED_STYLE_KEYS.has(key) &&
      typeof previous === "object" &&
      previous !== null &&
      typeof value === "object" &&
      value !== null
        ? { ...previous, ...structuredClone(value) }
        : structuredClone(value);
  }

  return merged as StylePatch;
}

function resolveTemplateStyles(
  defaults: Readonly<ResponsiveStyles>,
  overrides: ComponentTemplateStyleOverrides | undefined,
  path: string,
): ResponsiveStyles {
  if (overrides !== undefined) {
    if (!isJsonObject(overrides)) {
      throw new Error(`${path} styles must be a JSON object`);
    }
    for (const layer of Object.keys(overrides)) {
      if (!TEMPLATE_STYLE_LAYERS.has(layer)) {
        throw new Error(`${path} styles contain an unknown layer: ${layer}`);
      }
    }
    for (const layer of ["base", "tablet", "mobile"] as const) {
      if (overrides[layer] === undefined) continue;
      if (!stylePatchSchema.safeParse(overrides[layer]).success) {
        throw new Error(`${path} ${layer} style overrides are invalid`);
      }
    }
  }

  const base = mergeStylePatches(defaults.base, overrides?.base);
  const tablet = mergeStylePatches(defaults.tablet, overrides?.tablet);
  const mobile = mergeStylePatches(defaults.mobile, overrides?.mobile);
  const candidate = {
    base: base ?? {},
    ...(tablet && { tablet }),
    ...(mobile && { mobile }),
  };
  const parsed = responsiveStylesSchema.safeParse(candidate);
  if (!parsed.success) {
    throw new Error(`${path} styles are invalid`);
  }
  return parsed.data;
}

function resolveTemplateNode(
  template: ComponentTemplate,
  path: string,
  ancestors: WeakSet<object>,
): ResolvedComponentTemplate {
  if (typeof template !== "object" || template === null) {
    throw new Error(`${path} must be a component template object`);
  }
  if (ancestors.has(template)) {
    throw new Error(`${path} contains a recursive template reference`);
  }
  ancestors.add(template);

  if (!Object.hasOwn(componentRegistry, template.type)) {
    throw new Error(
      `${path} references unknown component type: ${String(template.type)}`,
    );
  }
  const type = template.type as ComponentType;
  const definition = componentRegistry[type];

  if (template.props !== undefined && !isJsonObject(template.props)) {
    throw new Error(`${path} props must be a JSON object`);
  }
  const props = {
    ...structuredClone(definition.defaults.props),
    ...structuredClone(template.props ?? {}),
  } as JsonObject;
  try {
    definition.propsSchema.parse(props);
  } catch {
    throw new Error(`${path} props are invalid`);
  }

  if (template.children !== undefined && !Array.isArray(template.children)) {
    throw new Error(`${path} children must be an array`);
  }
  const children = (template.children ?? []).map((child, index) => {
    const childPath = `${path}.children[${index}]`;
    const resolved = resolveTemplateNode(child, childPath, ancestors);
    if (!canPlaceType(type, resolved.type)) {
      throw new Error(
        `${childPath} cannot place ${resolved.type} inside ${type}`,
      );
    }
    return resolved;
  });

  ancestors.delete(template);
  return {
    type,
    componentVersion: definition.version,
    props,
    styles: resolveTemplateStyles(definition.defaults.styles, template.styles, path),
    children,
  };
}

export function resolveComponentTemplate(
  template: ComponentTemplate,
  path = "root",
): ResolvedComponentTemplate {
  return resolveTemplateNode(template, path, new WeakSet<object>());
}

export function validateBlockRegistry(
  registry: Readonly<Record<string, RegistryEntry>>,
): void {
  for (const [blockType, definition] of Object.entries(registry)) {
    if (definition.label.trim() === "") {
      throw new Error(`${blockType}.label must not be empty`);
    }
    if (definition.category.trim() === "") {
      throw new Error(`${blockType}.category must not be empty`);
    }
    if (typeof definition.icon !== "function") {
      throw new Error(`${blockType}.icon must be a component`);
    }
    if (typeof definition.createTemplate !== "function") {
      throw new Error(`${blockType}.createTemplate must be a function`);
    }

    resolveComponentTemplate(definition.createTemplate(), `${blockType}.root`);
  }
}

export function defineBlockRegistry<
  const Registry extends Record<string, RegistryEntry>,
>(registry: Registry): Readonly<Registry> {
  validateBlockRegistry(registry);
  return Object.freeze(registry);
}
