import type React from "react";

import { isJsonObject } from "@/builder/model/json";
import type { JsonObject } from "@/builder/model/json";
import {
  canPlaceType,
  componentRegistry,
  referencesForComponentType,
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

export type ComponentTemplateNodeReference = {
  path: string;
  targetKey: string;
};

export type ComponentTemplateStateBinding = {
  stateKey: string;
  on: "show" | "hide";
  off: "show" | "hide";
};

export type ComponentTemplate = {
  key?: string;
  nameHint?: string;
  type: ComponentType;
  props?: JsonObject;
  styles?: ComponentTemplateStyleOverrides;
  nodeReferences?: readonly ComponentTemplateNodeReference[];
  stateBinding?: ComponentTemplateStateBinding;
  children?: readonly ComponentTemplate[];
};

export type BlockLibraryFamily =
  | "layout"
  | "navbar"
  | "buttons"
  | "inputs"
  | "interactive";

export type BlockLibraryMetadata = {
  label: string;
  category: string;
  family: BlockLibraryFamily;
  icon: React.ComponentType;
  searchTerms?: readonly string[];
};

export type BlockDefinition = {
  library: BlockLibraryMetadata;
  createTemplate: () => ComponentTemplate;
};

export type ResolvedComponentTemplate = {
  key?: string;
  nameHint?: string;
  type: ComponentType;
  componentVersion: number;
  props: JsonObject;
  styles: ResponsiveStyles;
  nodeReferences?: readonly ComponentTemplateNodeReference[];
  stateBinding?: ComponentTemplateStateBinding;
  children: readonly ResolvedComponentTemplate[];
};

type RegistryEntry = BlockDefinition;

type TemplateKeyDeclaration = {
  path: string;
  type: ComponentType;
};

const TEMPLATE_STYLE_LAYERS = new Set(["base", "tablet", "mobile"]);
const NESTED_STYLE_KEYS = new Set(["margin", "padding", "grid", "flex"]);
const TEMPLATE_LOCAL_KEY_PATTERN = /^[a-z][a-z0-9-]{0,63}$/;
const TEMPLATE_LOCAL_KEY_CONTRACT =
  "/^[a-z][a-z0-9-]{0,63}$/ (1-64 characters)";
const BLOCK_LIBRARY_FAMILIES = new Set<BlockLibraryFamily>([
  "layout",
  "navbar",
  "buttons",
  "inputs",
  "interactive",
]);

function validateTemplateLocalKey(
  value: unknown,
  blockType: string,
  path: string,
): asserts value is string {
  if (
    typeof value !== "string" ||
    !TEMPLATE_LOCAL_KEY_PATTERN.test(value)
  ) {
    throw new Error(
      `Block "${blockType}" key "${String(value)}" at "${path}" is invalid; expected ${TEMPLATE_LOCAL_KEY_CONTRACT}.`,
    );
  }
}

function collectTemplateMetadata(
  template: ComponentTemplate,
  resolutionPath: string,
  metadataPath: string,
  blockType: string,
  declaredKeys: Map<string, TemplateKeyDeclaration>,
  ancestors: WeakSet<object>,
): void {
  if (typeof template !== "object" || template === null) {
    throw new Error(`${resolutionPath} must be a component template object`);
  }
  if (ancestors.has(template)) {
    throw new Error(`${resolutionPath} contains a recursive template reference`);
  }
  ancestors.add(template);

  if (template.key !== undefined) {
    validateTemplateLocalKey(template.key, blockType, metadataPath);
    const firstDeclaration = declaredKeys.get(template.key);
    if (firstDeclaration !== undefined) {
      throw new Error(
        `Block "${blockType}" key "${template.key}" is duplicated; first declared at "${firstDeclaration.path}" and repeated at "${metadataPath}".`,
      );
    }
    declaredKeys.set(template.key, {
      path: metadataPath,
      type: template.type,
    });
  }

  if (template.nameHint !== undefined) {
    if (typeof template.nameHint !== "string") {
      throw new Error(
        `${resolutionPath} nameHint must contain 1-80 characters after trimming`,
      );
    }
    const nameHint = template.nameHint.trim();
    if (nameHint.length === 0 || nameHint.length > 80) {
      throw new Error(
        `${resolutionPath} nameHint must contain 1-80 characters after trimming`,
      );
    }
  }

  if (template.nodeReferences !== undefined) {
    if (!Array.isArray(template.nodeReferences)) {
      throw new Error(`${resolutionPath} nodeReferences must be an array`);
    }
    template.nodeReferences.forEach((reference, index) => {
      const referenceResolutionPath = `${resolutionPath}.nodeReferences[${index}]`;
      const referenceMetadataPath = `${metadataPath}.nodeReferences[${index}]`;
      if (
        typeof reference !== "object" ||
        reference === null ||
        Array.isArray(reference)
      ) {
        throw new Error(`${referenceResolutionPath} must be an object`);
      }
      if (
        typeof reference.path !== "string" ||
        reference.path.trim() === ""
      ) {
        throw new Error(`${referenceResolutionPath}.path must not be empty`);
      }
      validateTemplateLocalKey(
        reference.targetKey,
        blockType,
        `${referenceMetadataPath}.targetKey`,
      );
    });
  }

  if (template.stateBinding !== undefined) {
    if (
      typeof template.stateBinding !== "object" ||
      template.stateBinding === null ||
      Array.isArray(template.stateBinding)
    ) {
      throw new Error(`${resolutionPath} stateBinding must be an object`);
    }
    validateTemplateLocalKey(
      template.stateBinding.stateKey,
      blockType,
      `${metadataPath}.stateBinding.stateKey`,
    );
    if (
      template.stateBinding.on !== "show" &&
      template.stateBinding.on !== "hide"
    ) {
      throw new Error(`${resolutionPath} stateBinding.on must be show or hide`);
    }
    if (
      template.stateBinding.off !== "show" &&
      template.stateBinding.off !== "hide"
    ) {
      throw new Error(`${resolutionPath} stateBinding.off must be show or hide`);
    }
  }

  if (template.children !== undefined && !Array.isArray(template.children)) {
    throw new Error(`${resolutionPath} children must be an array`);
  }
  (template.children ?? []).forEach((child, index) => {
    collectTemplateMetadata(
      child,
      `${resolutionPath}.children[${index}]`,
      `${metadataPath}.children[${index}]`,
      blockType,
      declaredKeys,
      ancestors,
    );
  });

  ancestors.delete(template);
}

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
    ...(template.key !== undefined && { key: template.key }),
    ...(template.nameHint !== undefined && {
      nameHint: template.nameHint.trim(),
    }),
    type,
    componentVersion: definition.version,
    props,
    styles: resolveTemplateStyles(definition.defaults.styles, template.styles, path),
    ...(template.nodeReferences !== undefined && {
      nodeReferences: template.nodeReferences.map((reference) => ({
        path: reference.path,
        targetKey: reference.targetKey,
      })),
    }),
    ...(template.stateBinding !== undefined && {
      stateBinding: { ...template.stateBinding },
    }),
    children,
  };
}

function validateTemplateRelationships(
  template: ResolvedComponentTemplate,
  path: string,
  blockType: string,
  declaredKeys: ReadonlyMap<string, TemplateKeyDeclaration>,
): void {
  const referenceMetadata = referencesForComponentType(template.type);

  for (const reference of referenceMetadata) {
    const rawTarget = template.props[reference.path];
    if (typeof rawTarget === "string" && rawTarget !== "") {
      throw new Error(
        `Block "${blockType}" props at "${path}" contain a non-empty raw node reference "${reference.path}"; use nodeReferences.`,
      );
    }
  }

  const symbolicPaths = new Set<string>();
  for (const symbolicReference of template.nodeReferences ?? []) {
    if (symbolicPaths.has(symbolicReference.path)) {
      throw new Error(
        `Block "${blockType}" reference "${symbolicReference.path}" at "${path}" is declared more than once.`,
      );
    }
    symbolicPaths.add(symbolicReference.path);
  }

  for (const symbolicReference of template.nodeReferences ?? []) {
    const reference = referenceMetadata.find(
      (candidate) => candidate.path === symbolicReference.path,
    );
    if (reference === undefined) {
      throw new Error(
        `Block "${blockType}" reference "${symbolicReference.path}" at "${path}" is not declared by component type "${template.type}".`,
      );
    }

    const target = declaredKeys.get(symbolicReference.targetKey);
    if (target === undefined) {
      throw new Error(
        `Block "${blockType}" reference "${symbolicReference.path}" at "${path}" targets missing key "${symbolicReference.targetKey}".`,
      );
    }
    if (target.type !== reference.targetType) {
      throw new Error(
        `Block "${blockType}" reference "${symbolicReference.path}" at "${path}" targets key "${symbolicReference.targetKey}" with type "${target.type}"; expected "${reference.targetType}".`,
      );
    }
  }

  if (template.stateBinding !== undefined) {
    if (template.type === "boolean-state") {
      throw new Error(
        `Block "${blockType}" Boolean State at "${path}" cannot declare a visibility binding.`,
      );
    }

    const target = declaredKeys.get(template.stateBinding.stateKey);
    if (target === undefined) {
      throw new Error(
        `Block "${blockType}" state binding at "${path}" targets missing key "${template.stateBinding.stateKey}".`,
      );
    }
    if (target.type !== "boolean-state") {
      throw new Error(
        `Block "${blockType}" state binding at "${path}" targets key "${template.stateBinding.stateKey}" with type "${target.type}"; expected "boolean-state".`,
      );
    }
  }

  template.children.forEach((child, index) => {
    validateTemplateRelationships(
      child,
      `${path}.children[${index}]`,
      blockType,
      declaredKeys,
    );
  });
}

function validateResolvedTemplateProps(
  template: ResolvedComponentTemplate,
  path: string,
): void {
  const definition = componentRegistry[template.type] as (typeof componentRegistry)[
    ComponentType
  ] & {
    validateTemplateProps?: (
      props: Readonly<JsonObject>,
      context: { symbolicReferencePaths: ReadonlySet<string> },
    ) => void;
  };

  try {
    if (definition.validateTemplateProps !== undefined) {
      definition.validateTemplateProps(template.props, {
        symbolicReferencePaths: new Set(
          (template.nodeReferences ?? []).map((reference) => reference.path),
        ),
      });
    } else {
      definition.propsSchema.parse(template.props);
    }
  } catch {
    throw new Error(`${path} props are invalid`);
  }

  template.children.forEach((child, index) => {
    validateResolvedTemplateProps(child, `${path}.children[${index}]`);
  });
}

export function resolveComponentTemplate(
  template: ComponentTemplate,
  path = "root",
  blockType?: string,
): ResolvedComponentTemplate {
  const validationOwner = blockType ?? "component-template";
  const metadataPath =
    blockType !== undefined && path.startsWith(`${blockType}.`)
    ? path.slice(blockType.length + 1)
    : path;
  const declaredKeys = new Map<string, TemplateKeyDeclaration>();
  collectTemplateMetadata(
    template,
    path,
    metadataPath,
    validationOwner,
    declaredKeys,
    new WeakSet<object>(),
  );
  const resolved = resolveTemplateNode(template, path, new WeakSet<object>());
  if (blockType !== undefined && resolved.type === "boolean-state") {
    throw new Error(
      `Block "${blockType}" root must be visual; received "boolean-state".`,
    );
  }
  validateTemplateRelationships(
    resolved,
    metadataPath,
    validationOwner,
    declaredKeys,
  );
  validateResolvedTemplateProps(resolved, path);
  return resolved;
}

function validateBlockLibraryMetadata(
  blockType: string,
  library: BlockLibraryMetadata,
): void {
  if (typeof library !== "object" || library === null) {
    throw new Error(`${blockType}.library must be an object`);
  }
  if (typeof library.label !== "string" || library.label.trim() === "") {
    throw new Error(`${blockType}.library.label must not be empty`);
  }
  if (
    typeof library.category !== "string" ||
    library.category.trim() === ""
  ) {
    throw new Error(`${blockType}.library.category must not be empty`);
  }
  if (!BLOCK_LIBRARY_FAMILIES.has(library.family)) {
    throw new Error(
      `${blockType}.library.family is invalid: ${String(library.family)}`,
    );
  }
  if (typeof library.icon !== "function") {
    throw new Error(`${blockType}.library.icon must be a component`);
  }
  if (library.searchTerms !== undefined) {
    if (!Array.isArray(library.searchTerms)) {
      throw new Error(`${blockType}.library.searchTerms must be an array`);
    }
    library.searchTerms.forEach((term, index) => {
      if (typeof term !== "string" || term.trim() === "") {
        throw new Error(
          `${blockType}.library.searchTerms[${index}] must not be empty`,
        );
      }
    });
  }
}

export function validateBlockRegistry(
  registry: Readonly<Record<string, RegistryEntry>>,
): void {
  for (const [blockType, definition] of Object.entries(registry)) {
    validateBlockLibraryMetadata(blockType, definition.library);
    if (typeof definition.createTemplate !== "function") {
      throw new Error(`${blockType}.createTemplate must be a function`);
    }

    resolveComponentTemplate(
      definition.createTemplate(),
      `${blockType}.root`,
      blockType,
    );
  }
}

export function defineBlockRegistry<
  const Registry extends Record<string, RegistryEntry>,
>(registry: Registry): Readonly<Registry> {
  validateBlockRegistry(registry);
  return Object.freeze(registry);
}
