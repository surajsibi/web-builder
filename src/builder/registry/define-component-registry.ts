import type React from "react";

import { isJsonObject } from "@/builder/model/json";
import type { JsonObject, JsonValue } from "@/builder/model/json";
import { responsiveStylesSchema } from "@/builder/styles/schema";
import type { ResponsiveStyles } from "@/builder/styles/types";

export type RuntimeSchema<Value> = {
  parse(input: unknown): Value;
};

export type NonEmptyReadonlyArray<Value> = readonly [Value, ...Value[]];

export type LeafChildrenRule = {
  allowed: false;
  accepts?: never;
};

export type ContainerChildrenRule<Type extends string = string> = {
  allowed: true;
  accepts: "any" | NonEmptyReadonlyArray<Type>;
};

export type StyleInspectorCapability =
  | "sizing"
  | "spacing"
  | "background"
  | "backgroundImage"
  | "border"
  | "typography"
  | "layout"
  | "positioning";

export type ComponentPropInspectorControl =
  | "text"
  | "textarea"
  | "url"
  | "boolean"
  | "number"
  | "select"
  | "node-reference"
  | "string-list"
  | "string-multi-select";

export type ComponentNodeReferenceMetadata<
  Path extends string = string,
  Type extends string = string,
> = {
  path: Path;
  targetType: Type;
  scope: "page";
  onDuplicate: "remap-if-target-cloned";
};

export type ComponentNodeReference<
  Props extends JsonObject,
  Type extends string = string,
> = {
  [Key in Extract<keyof Props, string>]: ComponentNodeReferenceMetadata<
    Key,
    Type
  > extends infer Reference
    ? Props[Key] extends string
      ? Reference
      : never
    : never;
}[Extract<keyof Props, string>];

export type ComponentPropInspectorField<Props extends JsonObject> = {
  [Key in Extract<keyof Props, string>]: {
    path: Key;
    label: string;
    control: ComponentPropInspectorControl;
    optionsPath?: Extract<keyof Props, string>;
    options?: readonly {
      label: string;
      value: Props[Key];
    }[];
  };
}[Extract<keyof Props, string>];

export type ComponentPropsInspectorConfig<Props extends JsonObject> =
  readonly ComponentPropInspectorField<Props>[];

export type ComponentInspectorConfig<Props extends JsonObject> = {
  props: ComponentPropsInspectorConfig<Props>;
  styles: readonly StyleInspectorCapability[];
};

export type ComponentMigrationValue = {
  props: JsonObject;
  styles: JsonObject;
};

export type ComponentMigration = {
  fromVersion: number;
  toVersion: number;
  migrate: (
    value: Readonly<ComponentMigrationValue>,
  ) => ComponentMigrationValue;
};

export type RendererBaseProps<Props extends JsonObject> = {
  props: Readonly<Props>;
  style: Readonly<React.CSSProperties>;
  className?: string;
  rootRef?: React.RefCallback<HTMLElement>;
  runtime?: ComponentRendererRuntime;
  rootAttributes?: Omit<
    React.HTMLAttributes<HTMLElement>,
    "children" | "className" | "style"
  >;
};

export type ComponentRendererRuntime = {
  formSubmissionNotice?: string;
  mode: "editor" | "preview";
  nodeId: string;
};

export type LeafRendererProps<Props extends JsonObject> =
  RendererBaseProps<Props> & {
    children?: never;
  };

export type ContainerRendererProps<Props extends JsonObject> =
  RendererBaseProps<Props> & {
    children: React.ReactNode;
  };

type ComponentDefinitionBase<
  Props extends JsonObject,
  Type extends string = string,
> = {
  version: number;
  library: {
    label: string;
    category: string;
    icon: React.ComponentType;
    searchTerms?: readonly string[];
  };
  defaults: {
    props: Props;
    styles: ResponsiveStyles;
  };
  allowedParents?: NonEmptyReadonlyArray<Type>;
  propsSchema: RuntimeSchema<Props>;
  inspector: ComponentInspectorConfig<Props>;
  references?: readonly ComponentNodeReference<Props, Type>[];
  migrations?: readonly ComponentMigration[];
};

export type ComponentDefinition<
  Props extends JsonObject,
  Type extends string = string,
> = ComponentDefinitionBase<Props, Type> &
  (
    | {
        children: LeafChildrenRule;
        render: React.ComponentType<LeafRendererProps<Props>>;
      }
    | {
        children: ContainerChildrenRule<Type>;
        render: React.ComponentType<ContainerRendererProps<Props>>;
      }
  );

type RegistryEntry = {
  version: number;
  library: {
    label: string;
    category: string;
    icon: React.ComponentType;
    searchTerms?: readonly string[];
  };
  defaults: {
    props: JsonObject;
    styles: ResponsiveStyles;
  };
  allowedParents?: readonly string[];
  children:
    | LeafChildrenRule
    | {
        allowed: true;
        accepts: "any" | readonly string[];
      };
  propsSchema: RuntimeSchema<JsonObject>;
  inspector: {
    props: readonly {
      path: string;
      label: string;
      control: ComponentPropInspectorControl;
      optionsPath?: string;
      options?: readonly { label: string; value: JsonValue }[];
    }[];
    styles: readonly StyleInspectorCapability[];
  };
  references?: readonly ComponentNodeReferenceMetadata[];
  migrations?: readonly ComponentMigration[];
  render: unknown;
};

type ReferencedType<Definition> =
  | (Definition extends { allowedParents: readonly (infer Parent)[] }
      ? Parent
      : never)
  | (Definition extends {
        children: { allowed: true; accepts: readonly (infer Child)[] };
      }
      ? Child
      : never)
  | (Definition extends {
      references: readonly { targetType: infer Target }[];
    }
      ? Target
      : never);

type InvalidRegistryReference<Registry> = Exclude<
  Extract<ReferencedType<Registry[keyof Registry]>, string>,
  Extract<keyof Registry, string>
>;

type RegistryReferenceConstraint<Registry> = [
  InvalidRegistryReference<Registry>,
] extends [never]
  ? unknown
  : {
      readonly __invalidRegistryReferences__: InvalidRegistryReference<Registry>;
    };

const STYLE_CAPABILITIES = new Set<StyleInspectorCapability>([
  "sizing",
  "spacing",
  "background",
  "backgroundImage",
  "border",
  "typography",
  "layout",
  "positioning",
]);

const PROP_CONTROLS = new Set<ComponentPropInspectorControl>([
  "text",
  "textarea",
  "url",
  "boolean",
  "number",
  "select",
  "node-reference",
  "string-list",
  "string-multi-select",
]);

function assertPlacementReferences(
  type: string,
  definition: RegistryEntry,
  componentTypes: ReadonlySet<string>,
): void {
  if (definition.children.allowed) {
    const { accepts } = definition.children;

    if (accepts !== "any") {
      if (accepts.length === 0) {
        throw new Error(`${type}.children.accepts must not be empty`);
      }

      for (const childType of accepts) {
        if (!componentTypes.has(childType)) {
          throw new Error(
            `${type}.children.accepts references unknown component type: ${childType}`,
          );
        }
      }
    }
  }

  if (definition.allowedParents !== undefined) {
    if (definition.allowedParents.length === 0) {
      throw new Error(`${type}.allowedParents must not be empty`);
    }

    for (const parentType of definition.allowedParents) {
      if (!componentTypes.has(parentType)) {
        throw new Error(
          `${type}.allowedParents references unknown component type: ${parentType}`,
        );
      }
    }
  }
}

function assertInspector(type: string, definition: RegistryEntry): void {
  const styleCapabilities = new Set<string>();

  for (const capability of definition.inspector.styles) {
    if (!STYLE_CAPABILITIES.has(capability)) {
      throw new Error(
        `${type}.inspector.styles contains invalid capability: ${capability}`,
      );
    }
    if (styleCapabilities.has(capability)) {
      throw new Error(
        `${type}.inspector.styles contains duplicate capability: ${capability}`,
      );
    }
    styleCapabilities.add(capability);
  }

  const propPaths = new Set<string>();

  for (const field of definition.inspector.props) {
    if (!Object.hasOwn(definition.defaults.props, field.path)) {
      throw new Error(
        `${type}.inspector.props references unknown prop path: ${field.path}`,
      );
    }
    if (propPaths.has(field.path)) {
      throw new Error(
        `${type}.inspector.props contains duplicate prop path: ${field.path}`,
      );
    }
    if (!PROP_CONTROLS.has(field.control)) {
      throw new Error(
        `${type}.inspector.props contains invalid control: ${field.control}`,
      );
    }
    if (
      field.control === "node-reference" &&
      !definition.references?.some(
        (reference) => reference.path === field.path,
      )
    ) {
      throw new Error(
        `${type}.inspector.props node-reference requires reference metadata: ${field.path}`,
      );
    }
    if (field.control === "string-multi-select") {
      if (
        field.optionsPath === undefined ||
        !Object.hasOwn(definition.defaults.props, field.optionsPath)
      ) {
        throw new Error(
          `${type}.inspector.props requires a valid optionsPath for string-multi-select: ${field.path}`,
        );
      }
      if (
        !Array.isArray(definition.defaults.props[field.path]) ||
        !Array.isArray(definition.defaults.props[field.optionsPath])
      ) {
        throw new Error(
          `${type}.inspector.props string-multi-select paths must reference arrays: ${field.path}`,
        );
      }
    }
    propPaths.add(field.path);
  }
}

function assertReferences(
  type: string,
  definition: RegistryEntry,
  componentTypes: ReadonlySet<string>,
): void {
  const paths = new Set<string>();

  for (const reference of definition.references ?? []) {
    if (!Object.hasOwn(definition.defaults.props, reference.path)) {
      throw new Error(
        `${type}.references references unknown prop path: ${reference.path}`,
      );
    }
    if (paths.has(reference.path)) {
      throw new Error(
        `${type}.references contains duplicate prop path: ${reference.path}`,
      );
    }
    if (typeof definition.defaults.props[reference.path] !== "string") {
      throw new Error(
        `${type}.references path must have a string default: ${reference.path}`,
      );
    }
    if (!componentTypes.has(reference.targetType)) {
      throw new Error(
        `${type}.references references unknown target type: ${reference.targetType}`,
      );
    }
    if (reference.scope !== "page") {
      throw new Error(
        `${type}.references contains unsupported scope: ${reference.scope}`,
      );
    }
    if (reference.onDuplicate !== "remap-if-target-cloned") {
      throw new Error(
        `${type}.references contains unsupported duplication policy: ${reference.onDuplicate}`,
      );
    }
    paths.add(reference.path);
  }
}

function assertMigrations(type: string, definition: RegistryEntry): void {
  const migrations = [...(definition.migrations ?? [])].sort(
    (left, right) => left.fromVersion - right.fromVersion,
  );

  if (definition.version === 1 && migrations.length > 0) {
    throw new Error(`${type} version 1 must not declare migrations`);
  }

  if (definition.version > 1 && migrations.length === 0) {
    throw new Error(`${type} is missing component migrations`);
  }

  let expectedFromVersion = 1;

  for (const migration of migrations) {
    if (
      !Number.isInteger(migration.fromVersion) ||
      !Number.isInteger(migration.toVersion) ||
      migration.fromVersion !== expectedFromVersion ||
      migration.toVersion <= migration.fromVersion ||
      migration.toVersion > definition.version
    ) {
      throw new Error(`${type} has a broken or overlapping migration path`);
    }

    expectedFromVersion = migration.toVersion;
  }

  if (migrations.length > 0 && expectedFromVersion !== definition.version) {
    throw new Error(`${type} migration path does not reach its current version`);
  }
}

export function validateComponentRegistry(
  registry: Readonly<Record<string, RegistryEntry>>,
): void {
  const componentTypes = new Set(Object.keys(registry));

  for (const [type, definition] of Object.entries(registry)) {
    if (!Number.isInteger(definition.version) || definition.version <= 0) {
      throw new Error(`${type}.version must be a positive integer`);
    }

    if (!isJsonObject(definition.defaults.props)) {
      throw new Error(`${type}.defaults.props must be a JSON object`);
    }

    try {
      definition.propsSchema.parse(definition.defaults.props);
    } catch (error) {
      throw new Error(`${type}.defaults.props does not pass propsSchema`, {
        cause: error,
      });
    }

    try {
      responsiveStylesSchema.parse(definition.defaults.styles);
    } catch (error) {
      throw new Error(`${type}.defaults.styles is invalid`, { cause: error });
    }

    assertPlacementReferences(type, definition, componentTypes);
    assertReferences(type, definition, componentTypes);
    assertInspector(type, definition);
    assertMigrations(type, definition);
  }
}

export function defineComponentRegistry<
  const Registry extends Record<string, RegistryEntry>,
>(
  registry: Registry & RegistryReferenceConstraint<Registry>,
): Readonly<Registry> {
  validateComponentRegistry(registry);

  return Object.freeze(registry);
}
