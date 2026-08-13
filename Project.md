---
doc_id: WEB-BUILDER-PROJECT-ARCHITECTURE
type: A1
scope: Product and architecture description for the web-builder application and its current V1 contracts
authority: Curated product and architecture description; approved product decisions own intent, while code, schemas, tests, configuration, and verified runtime behavior own current implementation behavior
owner: Project owner
lifecycle: maintained
freshness: Updated on 2026-08-13 with verified responsive component-positioning, document-schema-version-2, eligibility, interaction, and Canvas/Preview rendering contracts; invalidated by a relevant product decision or registry, document schema, migration, command, style, rendering, editor interaction, preview, publishing, persistence, or supported-runtime change
---

# Drag-and-Drop Website Builder

## Product Vision

Build a visual website builder where users can create their own websites by dragging components onto a canvas and customizing them without writing code.

## Technology Direction

### Core Technology Stack

The initial editor will use:

- **Next.js with TypeScript** for the application, routing, server APIs, editor pages, previews, and future publishing workflows
- **Tailwind CSS** for the editor interface and reusable component styling
- **Zustand** for centralized editor state, including the component tree, current selection, viewport, and editing actions
- **dnd-kit** through the latest `@dnd-kit/react` package for dragging, dropping, nesting, and reordering components

Each technology should have a clear responsibility:

| Technology | Primary responsibility |
| --- | --- |
| Next.js | Application shell, routing, data loading, APIs, preview, and publishing |
| TypeScript | Safe component schemas, style properties, editor commands, and drag data |
| Tailwind CSS | Editor layout, panels, controls, and predefined component appearance |
| Zustand | Component-tree state, selection state, editor actions, and history integration |
| `@dnd-kit/react` | Drag sources, nested drop targets, sortable items, sensors, and drag feedback |

Tailwind CSS should primarily style the editor interface and known component presets. Arbitrary values chosen by users, such as exact width, height, padding, color, grid columns, and z-index, should be stored as structured component style data and rendered through controlled inline styles, CSS variables, or generated CSS. The project should not depend on runtime-generated Tailwind class names for arbitrary user values.

Zustand should hold the serializable page model rather than DOM elements or React components. Editor operations such as add, move, update, duplicate, and delete should be defined as store actions so they can later participate in undo/redo history.

### Drag-and-Drop Engine

The recommended drag-and-drop foundation is the latest [`@dnd-kit/react`](https://dndkit.com/react/quickstart). It provides the low-level tools needed to create our custom editor experience without imposing a prebuilt interface.

Use it for:

- Dragging new components from the library into the canvas
- Making canvas containers valid nested drop targets
- Reordering components inside the same parent
- Moving components between different parents
- Drag overlays and visual drop feedback
- Pointer, touch, and keyboard interactions
- Collision detection and target selection

`dnd-kit` handles drag-and-drop interaction, but it is not a complete website builder. The project still needs its own:

- Serializable component-tree data model
- Selection, breadcrumb, and Layers state
- Properties inspector and style system
- Grid, flex, responsive, and nesting rules
- Undo and redo command history
- Autosave, page storage, preview, export, and publishing

The editor state should remain the source of truth. A completed drop operation updates the component tree, and the canvas renders from that tree. The DOM position alone must not be treated as saved page data.

The older `@dnd-kit/core` and `@dnd-kit/sortable` packages belong to the legacy API. A new implementation should begin with `@dnd-kit/react` and pin a tested version before production releases.

### Alternatives

- [`Puck`](https://puckeditor.com/docs) is a React visual-editor framework with component configuration, fields, nested layouts, categories, and responsive viewports. It is a good choice if faster delivery is more important than controlling every editor behavior.
- [`GrapesJS`](https://grapesjs.com/docs/) is a complete web-builder framework with blocks, components, and an editable canvas. It can accelerate an HTML/CSS-focused builder but is more opinionated than a custom React editor.
- [`Pragmatic drag and drop`](https://atlassian.design/components/pragmatic-drag-and-drop/) is a low-level, framework-independent option with explicit support for nested drop targets. It provides flexibility but requires us to build more of the editor behavior and accessibility interface ourselves.

For the custom three-panel editor and precise nested-card behavior currently planned, start with `@dnd-kit/react`. Before building the full editor, create a small proof of concept that supports adding, selecting, nesting, and reordering cards at least three levels deep.

## Component Values and Data Architecture

### Finalized Data Principles

The builder must separate component definitions, saved component instances, runtime indexes, and temporary editor state.

| Data | Purpose | Persisted? |
| --- | --- | --- |
| Component registry | Renderers, defaults, schemas, inspector capabilities, and placement rules | No |
| Project document | Pages, component instances, values, and ordered nesting | Yes |
| Runtime tree index | Fast child-to-parent lookup | No; rebuilt on load |
| Editor session | Selection, hover, active drop target, zoom, and viewport | No |

The following rules are authoritative:

1. Saved project data contains JSON-compatible values only.
2. A V1 project contains multiple pages, and each page owns one page-local node tree.
3. The persisted tree uses `rootIds` and ordered `childIds` as its single canonical relationship structure.
4. Page IDs and node IDs are stable generated identities independent of editable names and slugs. Node IDs are unique across the complete project.
5. `parentId` is not persisted on each component. The loading service derives one project-wide runtime `parentById` reverse index before atomic hydration, and command commits maintain it afterward.
6. Width and height are independent style values. There is no component-level auto/custom sizing flag.
7. Position and z-index are ordinary style values. There is no automatic/custom stacking flag or parent-based z-index calculation.
8. Only styles are responsive in V1; props remain shared across all viewports. Resolved `display` is the only component-visibility authority.
9. V1 uses the fixed desktop-first `base -> tablet -> mobile` cascade with property-specific merge rules.
10. All persisted document mutations go through the canonical editor-command dispatcher. Session actions, persistence lifecycle actions, and hydration lifecycle actions cannot mutate document content independently.
11. React components, DOM elements, functions, events, and Zustand actions are never stored in page JSON.
12. Authored form configuration is persisted, but visitor-entered values remain DOM-only and never enter the project document, Zustand history, autosave, or a submission transport.
13. Visual component movement is stored as one atomic responsive `positionOffset`; it never rewrites tree relationships, flex/grid placement, CSS `position`, or `z-index`.

### Component Registry

The V1 registry is a static, typed, application-code-only catalog. Its object keys are the canonical component types; a definition does not repeat its registry key in a `type` field. A saved node persists that key in `BuilderNode.type` and records the definition version in `componentVersion`.

Every definition provides library metadata, defaults, props validation, inspector configuration, placement capabilities, a React renderer, and optional migrations:

```ts
type JsonObject = Record<string, JsonValue>;

type RuntimeSchema<Value> = {
  parse(input: unknown): Value;
};

type NonEmptyReadonlyArray<Value> =
  readonly [Value, ...Value[]];

type LeafChildrenRule = {
  allowed: false;
  accepts?: never;
};

type ContainerChildrenRule<Type extends string = string> = {
  allowed: true;
  accepts: "any" | NonEmptyReadonlyArray<Type>;
};

type StyleInspectorCapability =
  | "sizing"
  | "spacing"
  | "background"
  | "border"
  | "typography"
  | "layout"
  | "positioning";

type ComponentPropInspectorControl =
  | "text"
  | "textarea"
  | "url"
  | "boolean"
  | "number"
  | "select"
  | "string-list"
  | "string-multi-select";

type ComponentInspectorConfig<Props extends JsonObject> = {
  props: ComponentPropsInspectorConfig<Props>;
  styles: readonly StyleInspectorCapability[];
};

type ComponentMigrationValue = {
  props: JsonObject;
  styles: JsonObject;
};

type ComponentMigration = {
  fromVersion: number;
  toVersion: number;
  migrate: (
    value: Readonly<ComponentMigrationValue>
  ) => ComponentMigrationValue;
};

type RendererBaseProps<Props extends JsonObject> = {
  props: Readonly<Props>;
  style: Readonly<React.CSSProperties>;
  className?: string;
  rootRef?: React.RefCallback<HTMLElement>;
  runtime?: ComponentRendererRuntime;
};

type ComponentRendererRuntime = {
  formSubmissionNotice?: string;
  mode: "editor" | "preview";
  nodeId: string;
};

type LeafRendererProps<Props extends JsonObject> =
  RendererBaseProps<Props> & {
    children?: never;
  };

type ContainerRendererProps<Props extends JsonObject> =
  RendererBaseProps<Props> & {
    children: React.ReactNode;
  };

type ComponentDefinitionBase<
  Props extends JsonObject,
  Type extends string = string
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

  migrations?: readonly ComponentMigration[];
};

type ComponentDefinition<
  Props extends JsonObject,
  Type extends string = string
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
```

All top-level fields are required except `allowedParents` and `migrations`. `library.searchTerms` is optional discovery metadata: the Component Library includes it in normalized search matching without changing the visible label, canonical component type, or persisted node data. `accepts` is required when `children.allowed` is `true` and forbidden when it is `false`. Inspector props may be empty, and the style-capability list may be empty, but both fields remain present so every definition has the same predictable shape.

The definition union connects placement and rendering at compile time: leaf components cannot accept rendered children, while container components receive a child slot. Both renderer variants accept only validated props and compiled presentation inputs.

`inspector.props` describes component-specific controls such as Button text and navigation values. `inspector.styles` selects centrally implemented shared style-control groups. Shared inspector infrastructure owns the controls, responsive behavior, reset behavior, ordering, and contextual parent-based fields. Style capabilities control editor exposure only; they do not become another style schema, responsive resolver, or rendering system.

The static registry is defined explicitly:

```ts
export const componentRegistry = defineComponentRegistry({
  section: sectionDefinition,
  container: containerDefinition,
  heading: headingDefinition,
  text: textDefinition,
  label: labelDefinition,
  card: cardDefinition,
  image: imageDefinition,
  link: linkDefinition,
  button: buttonDefinition,
  form: formDefinition,
  input: inputDefinition,
  textarea: textareaDefinition,
  dropdown: dropdownDefinition,
  "radio-group": radioGroupDefinition,
  checkbox: checkboxDefinition,
  "checkbox-group": checkboxGroupDefinition
});

export type ComponentType = keyof typeof componentRegistry;
```

`defineComponentRegistry` binds placement references to the registry-key union and validates the complete catalog at application startup. It rejects unknown child or parent types, empty placement lists, invalid or duplicate style capabilities, invalid defaults, non-positive versions, and broken or overlapping migration steps.

### Props Schemas and Defaults

The props architecture has three separate authorities:

| Concern | Authority |
| --- | --- |
| Valid keys, types, constraints, and relationships for the current component version | `propsSchema` |
| Initial values for new nodes and explicit reset-to-default actions | `defaults.props` |
| Labels, controls, grouping, help, and conditional editing UI | `inspector.props` |

`propsSchema` is strict, non-defaulting, and non-coercing. It rejects unknown fields, missing required fields, invalid values, and failed cross-field constraints. Props types should be inferred from the runtime schema when the selected schema library supports inference. The renderer receives only props that have passed the current definition's schema.

Current-version serialized props should use complete, explicit JSON values. A conceptually absent value uses a deliberate representation such as `null`, `false`, or an empty string when the component contract permits it; `undefined` is never persisted.

Image is a leaf primitive for meaningful image content, including logos. It stores a safe root-relative or HTTPS source, explicit alternative text, optional safe link destination and new-tab setting, and a `contain`, `cover`, or `fill` fit mode. An unlinked Image renders one native `<img>` root; a linked Image renders one protected `<a>` root containing the image. Linked images require non-empty alternative text so the image supplies the link's accessible name. Decorative unlinked images may use empty alternative text. Raw SVG markup, `data:` sources, protocol-relative URLs, and unsafe link schemes are rejected; SVG files are accepted through the same safe URL contract as other image formats. The renderer uses native image markup because user-authored remote hosts are not known at build time and therefore cannot be represented by a fixed framework-optimizer allowlist.

Button content icons follow the same serializable contract. A Button stores a curated application-owned icon ID or `null`, plus a `start` or `end` position; it never stores JSX, a React component, or raw SVG markup. The renderer resolves the ID through the static icon catalog, treats the icon as decorative while visible text supplies the accessible name, and keeps Button as a leaf component. An icon-only presentation requires a separate visible-label setting that preserves a non-empty accessible label rather than an empty `text` value.

Button also stores an explicit `button` or `submit` behavior. Existing Button versions migrate to `button`, so introducing Form cannot make an existing project submit unexpectedly. A Button with a non-empty link destination remains an anchor and cannot use submit behavior.

Label stores non-empty visible text and a valid authored control ID target. It renders one native `<label>` root whose `for` attribute points to the authored target, remains a leaf component, and supports the same Inspector and Canvas inline-text editing path as other text-bearing primitives. Label may be placed at the page root, in general-purpose containers, or directly inside Form. V1 does not validate the cross-node reference or document-wide ID uniqueness; authors keep the Label target and control ID synchronized until a shared Form Field wrapper can own that relationship.

Input stores one curated text-like HTML input type plus an accessible fallback label, optional control ID, field name, placeholder, authored default value, required/disabled state, and an opt-in password-reveal capability. Standard configurations render one native `<input>` root. A password with reveal enabled renders one styled field shell containing the native input and a non-submit visibility button; the button changes only runtime masking and never changes the authored `inputType` or visitor value. An empty control ID preserves the existing `aria-label` fallback; a non-empty control ID becomes the native `id` and defers the accessible name to its external visible Label. The renderer preserves the visitor's live value across unrelated render updates and adopts a changed authored default or input type. File, hidden, and date/time controls require separate component contracts rather than expanding this string-valued primitive. Existing Input versions migrate through an empty control ID without changing their accessible name.

Textarea stores an accessible fallback label, optional control ID, field name, placeholder, authored default value, an integer row count from 2 through 20, and required/disabled state. It renders one native `<textarea>` root, uses the same empty-ID fallback and external-Label association contract as Input, preserves the visitor's live multiline value across unrelated renderer updates, and adopts a changed authored default. Native drag-resizing is disabled so browser-local dimensions cannot diverge from persisted builder styles; `rows` supplies intrinsic height while an explicit authored height remains visually authoritative. Existing Textarea versions migrate through an empty control ID.

Dropdown stores the same accessible fallback label and optional control ID contract as Input and Textarea. Its options use a JSON string array with one non-empty unique value per native `<option>`. The Inspector's `string-list` control presents that array as individually labeled input rows with add and remove actions. It trims committed values, reports duplicate labels inline, preserves at least one option, and clears a non-empty default value when its referenced option is removed. The renderer uses a native `<select>` so keyboard interaction and form semantics do not depend on custom popup state. Existing Dropdown versions migrate through an empty control ID.

Radio Group stores one visible group label, a required non-empty field name, non-empty unique string options, an optional authored default, vertical or horizontal orientation, and required/disabled state. It renders one native `<fieldset>` root with a `<legend>` and labeled native radio inputs. The renderer preserves the visitor's mutually exclusive live selection across unrelated updates and adopts a changed authored default or option list. Option labels are also submitted values in V1, matching Dropdown's string-option contract.

Checkbox stores one visible label, an optional field name, a non-empty submitted value, an authored default checked state, and required/disabled state. It renders one native checkbox wrapped by its `<label>`, so the component owns its accessible association without requiring a separate Label primitive. The renderer preserves the visitor's live checked state across unrelated updates and adopts a changed authored default. A checked, named, enabled Checkbox contributes its configured value to native `FormData`; unchecked, unnamed, and disabled Checkboxes are omitted by browser successful-control semantics.

Checkbox Group stores one visible group label, a required non-empty field name, non-empty unique string options, unique authored default selections that must reference those options, vertical or horizontal orientation, and required/disabled state. It renders one native `<fieldset>` root with a `<legend>` and labeled native checkbox inputs. The renderer preserves the visitor's live multi-selection across unrelated updates and adopts changed authored defaults or options. Required means at least one selection: the group exposes `aria-required`, and while empty the first native checkbox carries `required`; selecting any option removes that native constraint, and removing the final selection restores it. Option labels are also submitted values in V1, matching Dropdown and Radio Group.

The Inspector's `string-multi-select` control references another string-array prop through validated `optionsPath` metadata. Checkbox Group uses it to present current options as default-selection checkboxes. When the authored option list changes, the Inspector prunes default selections that no longer reference an option before validating and committing the complete props object.

Form is a native `<form>` container with an accessible label and a stable authored form name. Legacy authored success and error messages remain schema-compatible for existing saved documents but are not exposed in the Inspector or rendered until a real delivery contract exists. Its direct child allowlist contains text content, Labels, links, Buttons, Inputs, Textareas, Dropdowns, Radio Groups, Checkboxes, and Checkbox Groups; it excludes structural containers and Form itself so a valid tree cannot contain nested forms. Named successful descendant controls retain native `FormData` semantics, while Form cancels browser submission in both editor and Preview. Unnamed and disabled controls remain excluded by browser semantics, unchecked Checkboxes are omitted, and repeated names retain authored order.

Every definition supplies a complete `defaults.props` object that satisfies the schema-derived props type and passes `propsSchema` during registry initialization. Defaults are immutable application-code templates. Creating a node clones and validates the defaults, stores the resulting props, and assigns the current definition `version` to the node's `componentVersion`.

```text
definition.defaults.props
  -> deep clone
  -> definition.propsSchema validation
  -> persisted node props
  -> componentVersion = definition.version
```

`defaults.styles` has the same creation/reset boundary. New nodes deep-clone it and validate the result with the shared current style schema; an explicit reset-style action may do the same. Rendering and ordinary loading never merge style defaults into persisted styles. A default-only style change needs no version bump, while a shared persisted style-shape change belongs to `schemaVersion` and a component-specific style-semantic change belongs to that component's `componentVersion`.

Defaults are not fallback data. Rendering and ordinary document loading must never merge current registry defaults into persisted props. Missing or invalid current-version props therefore cannot be hidden by a renderer or repaired implicitly by whichever application version loads the document. An explicit reset-to-default action may replace the selected values with a validated clone of the current defaults because that change is user-requested and undoable.

A default-only change that should affect only newly created nodes does not require a component-version bump; existing nodes retain their copied values. A persisted prop-shape change or semantic change requires a new component version and a deterministic migration. Migrations are the only mechanism for converting valid historical props into the current shape.

The current Container definition is version 2. New Containers use `maxWidth: { value: 100, unit: "%" }` so Fill parent remains full-width at desktop Preview sizes. The version-1 migration replaces only the former hidden `72rem` default with `100%`; any other explicit maximum remains unchanged.

Definitions at version 1 may omit migrations. Later versions must provide every migration required to load supported historical versions. Each migration validates the historical shape and assumptions for its exact `fromVersion` before transforming it; invalid historical input is a migration failure, not data to repair. A migration may close over an immutable historical schema for that check. Migrations transform component props and styles only, run in version order, and must not generate IDs, change tree relationships, access editor state, use network or time-dependent data, or read mutable current defaults. Values needed by a migration are frozen in that migration so its output cannot change when later defaults change.

After migrations, the final props object must pass the current strict `propsSchema`. A node whose `componentVersion` already matches the definition receives no default merge or repair before validation.

`inspector.props` remains explicit rather than being generated automatically from the schema. Schema metadata cannot fully describe editor concerns such as asset pickers, link editors, labels, grouping, help text, or conditional visibility. Inspector field paths and values are typed against the schema-derived props type and validated during registry initialization. The schema remains the validation authority; inspector constraints are user-interface assistance rather than a competing props definition.

Inspector actions validate the complete next props object before committing it to document state. Temporarily invalid control input remains local editor UI state until it can produce a valid update. Zustand, undo history, and autosave therefore observe only valid props.

If a known component still has missing, unknown, or invalid current-version props after all required migrations, the loader applies the atomic failure rules under [Loading, Migrations, and Atomic Hydration](#loading-migrations-and-atomic-hydration). It never strips, replaces, or silently repairs the invalid props. Per-node invalid-component recovery is outside V1.

The registry describes component capabilities but does not own editor or document behavior. It does not generate IDs, maintain `childIds` or `parentById`, access Zustand, handle drag events, resolve responsive styles, record undo history, autosave, or insert block templates.

### Parent and Child Placement Rules

Placement uses two complementary rules:

- `children` is the parent-side content rule: which component types the parent can contain.
- `allowedParents` is the optional child-side restriction: which component types may directly contain the child.

Omitting `allowedParents` means the component has no parent-type restriction and `canPlaceType` permits it at the page root. Providing `allowedParents` restricts the component to that non-empty list and prevents page-root placement. Separate instance-level root constraints do not create another component-type allowlist.

`children.accepts: "any"` means that the parent adds no child-type restriction. It does not override the child's `allowedParents`, accept unknown registry types, or bypass tree validation. Parent and child rules must both allow a relationship; neither rule takes precedence.

All type-level compatibility flows through one pure predicate. `null` represents the page root:

```ts
function includesComponentType(
  candidates: readonly ComponentType[],
  candidate: ComponentType
): boolean {
  return candidates.includes(candidate);
}

function canPlaceType(
  parentType: ComponentType | null,
  childType: ComponentType
): boolean {
  const child = componentRegistry[childType];

  if (parentType === null) {
    return child.allowedParents === undefined;
  }

  const parent = componentRegistry[parentType];

  if (!parent.children.allowed) {
    return false;
  }

  const parentAllowsChild =
    parent.children.accepts === "any" ||
    includesComponentType(parent.children.accepts, childType);

  const childAllowsParent =
    child.allowedParents === undefined ||
    includesComponentType(child.allowedParents, parentType);

  return parentAllowsChild && childAllowsParent;
}
```

The typed predicate assumes known `ComponentType` values. Document-loading and server-validation boundaries must reject unknown strings before evaluating placement.

The following placement fragments illustrate ordinary, leaf, and structurally restricted components:

```ts
const buttonPlacement = {
  children: { allowed: false }
} as const;

const cardPlacement = {
  children: { allowed: true, accepts: "any" }
} as const;

const containerPlacement = {
  children: { allowed: true, accepts: "any" }
} as const;

const listPlacement = {
  children: { allowed: true, accepts: ["listItem"] }
} as const;

const listItemPlacement = {
  children: { allowed: true, accepts: "any" },
  allowedParents: ["list"]
} as const;

const tablePlacement = {
  children: { allowed: true, accepts: ["tableRow"] }
} as const;

const tableRowPlacement = {
  children: { allowed: true, accepts: ["tableCell"] },
  allowedParents: ["table"]
} as const;

const tableCellPlacement = {
  children: { allowed: true, accepts: "any" },
  allowedParents: ["tableRow"]
} as const;
```

Consequently, Card and Container can contain List or Table but cannot directly contain ListItem, TableRow, or TableCell. List contains only ListItem; Table contains only TableRow; and TableRow contains only TableCell. ListItem and TableCell may contain otherwise valid normal content.

Drag-and-drop, reparenting, copy/paste, duplication, block insertion, document loading, component migration validation, and server validation must use `canPlaceType` for every parent-child edge they create or accept. Block insertion validates both its destination edge and every internal template edge before mutating the document.

`canPlaceType` handles type compatibility only. Operation-specific validation separately checks node existence, locks, cycles, insertion indexes, root constraints, maximum depth, and other instance-level invariants. V1 does not introduce placement roles or a generic policy engine.

### Primitive Components and Composed Blocks

Basic **Container** and **Card** items are primitive components. Dropping either one creates exactly one empty node with `childIds: []`.

The editor must not automatically insert Heading, Text, Button, or other content inside every new Card. Automatic children would add unwanted nodes, complicate nested-card selection, and couple a reusable layout primitive to one content structure.

The component library distinguishes primitives from ready-made blocks:

| Library item | Created result |
| --- | --- |
| Container | One empty structural container |
| Card | One empty pre-styled container |
| Content Card | Card with Heading, Text, and Button children |
| Image Card | Card with Image, Heading, and Text children |
| Pricing Card | Card with plan content, features, and Button children |

The V1 registry can register Content Card and Image Card because their primitive node types are present. Pricing Card demonstrates the same block pattern but is not a valid registry entry until every primitive component type required by its final template has been added to `componentRegistry`.

```ts
type LibraryItem =
  | {
      kind: "component";
      componentType: ComponentType;
    }
  | {
      kind: "block";
      blockType: BlockType;
    };

type ComponentTemplate = {
  type: ComponentType;
  props?: Record<string, JsonValue>;
  styles?: Partial<ResponsiveStyles>;
  children?: ComponentTemplate[];
};

type BlockDefinition = {
  label: string;
  category: string;
  createTemplate: () => ComponentTemplate;
};
```

The static `blockRegistry` key is the block type; a block definition does not repeat that identity. Block type keys exist only for library lookup and insertion because block identity is not persisted after the template becomes ordinary component nodes.

Any Component Library thumbnail that shows an authored component look must resolve the real component or block template and compile its styles through the same responsive style compiler used by Canvas and Preview. Thumbnail-only presentation may provide a neutral surface, clipping, and scale, but must not duplicate or override the component's authored colors, borders, typography, backgrounds, shadows, or blur. Semantic component interactions, such as Button icon motion, reuse the component's real markup and shared interaction selector rather than a thumbnail-specific imitation.

An empty Card should still be easy to discover as a drop target. In editor mode it displays an overlay such as:

```text
Drop components here
or
+ Add component
```

This prompt is editor UI only. It is not a child node, is not serialized, and does not appear in preview or published output.

Dropping a composed block recursively instantiates its template. The insertion process must:

1. Generate a fresh stable ID for every component in the template.
2. Copy component defaults, assign each definition's current `version` to `componentVersion`, and apply template-specific prop or style overrides.
3. Validate every final props object with its component `propsSchema` and every final style object with the shared style schema.
4. Validate the destination edge and every internal parent-child edge with `canPlaceType`.
5. Build ordered `childIds` for the complete subtree.
6. Insert the block's root node at the requested destination and index.
7. Build and verify the project-wide candidate `parentById`.
8. Return the block-root selection effect.
9. Commit the complete insertion through `dispatchEditorCommand` as one undoable, dirty transaction.

After insertion, generated children are normal independent component instances. Users can select, edit, move, duplicate, or delete them individually. Blocks are creation templates, not permanently locked compound components.

### Persisted Project Schema

```ts
type JsonPrimitive = string | number | boolean | null;

type JsonValue =
  | JsonPrimitive
  | JsonValue[]
  | { [key: string]: JsonValue };

type ProjectDocument = {
  schemaVersion: number;
  projectId: string;
  name: string;
  pages: Record<string, PageDocument>;
  pageOrder: string[];
  homePageId: string;
  createdAt: string;
  updatedAt: string;
  revision: number;
};

type PageDocument = {
  id: string;
  name: string;
  slug: string;
  rootIds: string[];
  nodes: Record<string, BuilderNode>;
};

type BuilderNode = {
  id: string;
  type: ComponentType;
  componentVersion: number;
  childIds: string[];
  props: Record<string, JsonValue>;
  styles: ResponsiveStyles;
  meta: {
    name: string;
    locked: boolean;
  };
};
```

These types describe a successfully migrated and validated current document. Raw loading types keep `node.type` as an untrusted string until registry lookup proves that it is a `ComponentType`.

Record keys are the canonical lookup keys for their embedded identities, not a second independent identity source. Each `pages` key must equal its `PageDocument.id`, each `nodes` key must equal its `BuilderNode.id`, and `pageOrder` must contain every page key exactly once. Node IDs must also be unique across all pages. Loading rejects any disagreement.

Every project has at least one page. `homePageId` must reference an existing page whose canonical slug is `/`. Non-home pages cannot use `/`, and all page slugs are unique after normalization. Page order is independent from home-page identity, so reordering pages never changes which page is home.

For V1, non-home slug validation accepts canonical single-segment paths such as `/about`, `/contact`, and `/my-projects`. The persisted `slug` remains an ordinary canonical path string rather than a single-segment-specific data type; the V1 restriction is a validation and product rule so a later document version can deliberately support nested paths without replacing the field representation.

The node ID is stable and independent of the readable component name. Renaming `Card 2` to `Pricing Card` does not change its ID or relationships.

### Canonical Tree and Runtime Parent Index

A page stores downward, ordered relationships only:

```ts
const page = {
  rootIds: ["card-1"],
  nodes: {
    "card-1": {
      id: "card-1",
      type: "card",
      childIds: ["card-2"]
    },
    "card-2": {
      id: "card-2",
      type: "card",
      childIds: ["button-1"]
    },
    "button-1": {
      id: "button-1",
      type: "button",
      childIds: []
    }
  }
};
```

Before atomic Zustand hydration, the loading service validates every page-local tree and builds one project-wide candidate reverse index:

```ts
function buildProjectParentIndex(project: ProjectDocument) {
  const parentById = Object.create(null) as Record<string, string | null>;
  const globalNodeIds = new Set<string>();

  for (const page of Object.values(project.pages)) {
    const pagePositions = new Set<string>();

    for (const nodeId of Object.keys(page.nodes)) {
      if (globalNodeIds.has(nodeId)) {
        throw new Error(`Node ID is not project-wide unique: ${nodeId}`);
      }
      globalNodeIds.add(nodeId);
    }

    for (const rootId of page.rootIds) {
      if (!Object.hasOwn(page.nodes, rootId)) {
        throw new Error(`Missing root node: ${rootId}`);
      }
      if (pagePositions.has(rootId)) {
        throw new Error(`Duplicate tree position: ${rootId}`);
      }
      pagePositions.add(rootId);
      parentById[rootId] = null;
    }

    for (const node of Object.values(page.nodes)) {
      for (const childId of node.childIds) {
        if (!Object.hasOwn(page.nodes, childId)) {
          throw new Error(`Missing child node: ${childId}`);
        }
        if (pagePositions.has(childId)) {
          throw new Error(`Node has multiple tree positions: ${childId}`);
        }
        pagePositions.add(childId);
        parentById[childId] = node.id;
      }
    }

    if (pagePositions.size !== Object.keys(page.nodes).length) {
      throw new Error(`Page contains an orphan node: ${page.id}`);
    }
  }

  return parentById;
}
```

This design provides both traversal directions at runtime without storing two competing relationship truths:

- `childIds` supports rendering order, Layers, insertion, reordering, and subtree deletion.
- `parentById` supports breadcrumbs, parent selection, nesting validation, z-index lookup, and reparenting.

Successful hydration commits the validated document and project-wide candidate index to Zustand together. Structural editor commands update `rootIds`, `childIds`, and `parentById` atomically; V1 may rebuild the index after a structural command rather than risk several incremental relationship writes. Loading, recovery, and development validation rebuild or verify the runtime index against every canonical page tree.

Tree invariants:

- Every referenced root and child exists.
- A node appears once in its page tree.
- A node ID appears in only one page in the project.
- A root is not also listed as a child.
- `parentById` matches the canonical saved tree.
- A node cannot contain itself or any ancestor.
- Child order is defined only by array position in `rootIds` or `childIds`.

### Component Value Categories

Component values are divided by responsibility:

- `props`: Content and non-visual configuration, such as button text, icon ID and placement, image URL, link target, or input label
- `styles`: Dimensions, spacing, color, typography, borders, grid, flex, position, and responsive overrides
- `meta`: Readable name and locked state
- `bindings`: Reserved for a future schema version and absent from the V1 `BuilderNode`

Selection, hover, active viewport, panel state, and zoom are temporary session state and do not belong in a component node.

V1 has no persisted `meta.hidden`. Global and responsive component visibility is derived only from the resolved `display` style. A node whose active-viewport display resolves to `none` remains in the page tree and Layers panel; Layers provides the way to select it and update or reset its display. The editor, preview, and published renderer do not apply a second metadata-based visibility rule.

### Independent Dimension Values

Width and height store their behavior directly:

```ts
type DimensionValue =
  | { mode: "fill" }
  | { mode: "fit" }
  | { mode: "auto" }
  | {
      mode: "fixed";
      value: number;
      unit: "px" | "%" | "rem" | "em" | "vw" | "vh";
    };
```

The style compiler maps these values to CSS:

| Builder value | CSS result |
| --- | --- |
| Width `fill` | `width: 100%` |
| Width `fit` | `width: fit-content` |
| Height `auto` | `height: auto` |
| Dimension `fixed` | Numeric value with its selected unit |

Width and height remain independent at every breakpoint. For example, a card can have fixed desktop width, fill tablet width, and automatic height everywhere.

A card's initial sizing values are:

```ts
{
  width: { mode: "fill" },
  height: { mode: "auto" },
  minWidth: { value: 0, unit: "px" },
  maxWidth: { value: 100, unit: "%" }
}
```

The same defaults apply at the page root and inside another component. Parent padding makes an inner card visually smaller. Reparenting preserves the current dimensions, including fixed user values. **Reset sizing** restores the registry defaults.

Grid and flex parents control child behavior using ordinary layout values such as alignment, track size, flex growth, and `align-self`; they do not change a global sizing mode.

### Structured Style Values

Complex values should be stored in a form that the inspector can safely edit and the renderer can compile to CSS.

```ts
type LengthValue =
  | { value: number; unit: "px" | "%" | "rem" | "em" | "vw" | "vh" }
  | { keyword: "auto" | "fit-content" | "max-content" | "min-content" };

type PositionOffsetValue = {
  x: { value: number; unit: "px" };
  y: { value: number; unit: "px" };
};

type SpacingValue = {
  top: LengthValue;
  right: LengthValue;
  bottom: LengthValue;
  left: LengthValue;
};

type GridConfig = {
  columns: number;
  rows?: number;
  columnGap: LengthValue;
  rowGap: LengthValue;
  justifyItems?: "start" | "center" | "end" | "stretch";
  alignItems?: "start" | "center" | "end" | "stretch";
};

type FlexConfig = {
  direction: "row" | "column" | "row-reverse" | "column-reverse";
  wrap: "nowrap" | "wrap" | "wrap-reverse";
  justifyContent: string;
  alignItems: string;
  gap: LengthValue;
};

type BorderWidthUnit = "px" | "rem" | "em";
type BorderWidthValue = {
  value: number;
  unit: BorderWidthUnit;
};
type BorderStyle = "none" | "solid" | "dashed" | "dotted";
type EffectUnit = "px" | "rem" | "em";
type EffectLengthValue = {
  value: number;
  unit: EffectUnit;
};
type BoxShadowValue = {
  offsetX: number;
  offsetY: number;
  blurRadius: number;
  spreadRadius: number;
  unit: EffectUnit;
  color: string;
  inset: boolean;
};
type TextDecoration =
  | "none"
  | "underline"
  | "overline"
  | "line-through";

type LinearGradientValue = {
  kind: "linear-gradient";
  angle: number;
  startColor: string;
  endColor: string;
};

type BackgroundImageValue =
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

type StyleValues = {
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
  positionOffset?: PositionOffsetValue;
  zIndex?: "auto" | number;
  grid?: GridConfig;
  flex?: FlexConfig;
};

type StylePatch = Omit<
  Partial<StyleValues>,
  "margin" | "padding" | "grid" | "flex"
> & {
  margin?: Partial<SpacingValue>;
  padding?: Partial<SpacingValue>;
  grid?: Partial<GridConfig>;
  flex?: Partial<FlexConfig>;
};
```

Structured dimensions and spacing allow numeric validation, unit selection, linked padding controls, and predictable CSS output. The saved page must contain semantic values rather than generated Tailwind class names.

Effects use the same responsive style contract as every other visual property. `boxShadow` is an ordered atomic list of at most four shadows; an empty list is an explicit narrower-breakpoint reset. `backdropBlur` is a finite nonnegative length. Both values are component-agnostic, pass through the shared schema, resolver, command allowlist, and CSS compiler, and render identically on the Canvas and in Preview.

`positionOffset` is also atomic within a responsive layer: X and Y are finite signed pixel lengths that validate, clone, resolve, set, reset, and enter history together. Missing means inherit through the existing cascade. Explicit `{ x: 0px, y: 0px }` overrides an inherited nonzero value, while reset deletes the current layer value. After resolution, a zero pair emits no CSS translation.

### V1 Responsive Scope

Only `styles` are responsive in V1. Component `props` remain shared across desktop, tablet, and mobile.

Shared props include:

- Text and rich-content values
- Links and `href`
- Image source and alt text
- Form labels and field configuration
- Component-specific content settings

Keeping props shared preserves consistent content, accessibility, SEO, localization, and analytics. Responsive images should later use explicit image fields such as `srcSet`, `sizes`, or `<picture>` sources rather than making all props breakpoint-aware. Alt text remains shared.

If viewport-specific content is required later, it should be introduced as a deliberate content-variant feature with its own validation and UX. It is not part of the V1 responsive schema.

### Fixed V1 Breakpoints and Cascade

V1 uses exactly three fixed viewport layers:

```ts
type Viewport = "desktop" | "tablet" | "mobile";

const BREAKPOINTS = {
  tabletMaxWidth: 1024,
  mobileMaxWidth: 767
} as const;

type ResponsiveStyles = {
  base: StyleValues;
  tablet?: StylePatch;
  mobile?: StylePatch;
};
```

`base` is the desktop/default layer. Resolution follows a desktop-first cascade:

| Viewport | Resolution order |
| --- | --- |
| Desktop | `base` |
| Tablet | `base -> tablet` |
| Mobile | `base -> tablet -> mobile` |

Tablet styles compile inside `@media (max-width: 1024px)`. Mobile styles compile afterward inside `@media (max-width: 767px)`, so mobile naturally inherits tablet overrides.

Custom breakpoint IDs, user-created breakpoints, breakpoint reordering, and per-project breakpoint values are intentionally excluded from V1. Breakpoint constants must live in one shared module so the editor preview and published CSS cannot disagree. A future generic-breakpoint schema must be introduced through `schemaVersion` migration.

### Responsive Override Semantics

- Missing property: inherit the resolved value from the previous layer.
- Explicit tablet property: override `base` for tablet and mobile unless mobile overrides it again.
- Explicit mobile property: override the resolved `base + tablet` value.
- Reset at tablet or mobile: delete that property from the current patch.
- Reset at base: restore the component registry default for that component version.
- `undefined` is never serialized.
- `null` is not used to mean inherit.
- Changing a base value affects tablet and mobile only where they have no applicable override.

The inspector indicates whether a value is a component default, explicitly set at the current layer, or inherited. Editing an inherited value creates an override at the active layer; resetting it deletes that override.

### Property-Specific Merge Rules

The resolver must use explicit merge policies rather than a generic recursive deep merge.

| Property category | Merge rule |
| --- | --- |
| Width, height, min/max dimensions | Replace the complete value |
| Display, colors, position, position offset, z-index, radius | Replace the complete value |
| Margin and padding | Merge individual edges |
| Grid configuration | Merge individual grid fields |
| Flex configuration | Merge individual flex fields |
| Transform, shadow, gradient, or other lists | Replace the complete list |
| Discriminated unions such as `DimensionValue` | Replace the complete union value |

Dimensions are atomic because merging inside `{ mode, value, unit }` could create an invalid combination such as `mode: "fill"` with a leftover fixed pixel value.

Spacing overrides merge by side. Grid and flex overrides merge by their known fields. If `display` is `grid`, the renderer compiles only the resolved grid configuration; if it is `flex`, it compiles only the flex configuration. Inactive grid or flex values may remain saved so switching layout modes does not destroy the user's previous configuration.

```ts
function resolveResponsiveStyles(
  styles: ResponsiveStyles,
  viewport: Viewport
): StyleValues {
  let resolved = cloneStyles(styles.base);

  if (viewport === "tablet" || viewport === "mobile") {
    resolved = mergeStylePatch(resolved, styles.tablet);
  }

  if (viewport === "mobile") {
    resolved = mergeStylePatch(resolved, styles.mobile);
  }

  return resolved;
}
```

`mergeStylePatch` is a builder-specific function implementing the policy table above. It must not be replaced with a general-purpose object merge utility.

Example cascade:

```ts
styles: {
  base: {
    display: "grid",
    grid: {
      columns: 4,
      columnGap: { value: 24, unit: "px" },
      rowGap: { value: 24, unit: "px" }
    },
    padding: {
      top: { value: 16, unit: "px" },
      right: { value: 16, unit: "px" },
      bottom: { value: 16, unit: "px" },
      left: { value: 16, unit: "px" }
    }
  },
  tablet: {
    grid: { columns: 2 },
    padding: {
      right: { value: 12, unit: "px" },
      left: { value: 12, unit: "px" }
    }
  },
  mobile: {
    grid: {
      columns: 1,
      columnGap: { value: 12, unit: "px" }
    },
    padding: {
      top: { value: 8, unit: "px" },
      bottom: { value: 8, unit: "px" }
    }
  }
}
```

The resolved mobile grid has one column, a `12px` column gap, and the inherited `24px` row gap. Its padding resolves to `8px 12px 8px 12px`.

### Position and Layer Values

Automatic z-index is not part of the component model. CSS z-index values are compared within stacking contexts, so calculating `parent z-index + 1` would not reliably describe the component's visual layer and could create unnecessary stacking contexts.

Components use these defaults:

```ts
{
  position: "static",
  zIndex: "auto"
}
```

Layer rules:

- Dropping, nesting, moving, or reparenting a component does not change its z-index.
- Normal document order controls ordinary stacking.
- Nested children naturally render above their parent's background without a numeric z-index.
- Users assign a numeric z-index only when elements intentionally overlap.
- **Reset layer** returns z-index to `auto`.
- Position and z-index remain ordinary style values; no `stackingMode` or other behavior flag is stored.
- Editor selection outlines, handles, and drop indicators render in a separate overlay layer and never depend on page-component z-index.

Visual positioning rules:

- An eligible component may store one responsive `positionOffset` without changing its structural parent, sibling order, flex slot, grid placement, CSS `position`, or `z-index`.
- The shared style compiler emits the individual CSS `translate` property for a resolved nonzero offset and omits translation for resolved zero.
- Canvas and Preview resolve and compile committed offsets through the same Node Rendering Controller path. A future Published renderer must reuse this path and prove Canvas/Preview/Published parity before release.
- The selected-node Canvas position handle is separate from the structural drag handle. Pointer or touch movement previews locally and commits one command at completion; arrow keys move by `1px`, Shift+arrow moves by `10px`, Enter commits, and Escape cancels.
- Inspector X/Y controls edit the active responsive layer, identify inherited values, and provide reset-based recovery when a large offset moves a node outside the visible Canvas.
- Root nodes, definitions that permit children, and nodes whose resolved position is `absolute`, `fixed`, or `sticky` remain centrally restricted. Locked nodes and definitions without the positioning capability are unsupported. A restricted or off-canvas node may still expose a safe Inspector reset so an existing offset can be removed.
- Container and root positioning may be enabled only after retained browser evidence passes sticky/fixed-descendant, stacking, overlay, portal, hit-testing, nested-transform, deep-layout, large-offset, and recovery scenarios. Failure keeps those categories restricted without blocking eligible non-container flex/grid children.

Because non-`none` translation creates a stacking context and a containing block for descendants, eligibility is enforced at the Inspector, Canvas gesture-start, and command-validation boundaries. Sibling-local **Bring forward**, **Send backward**, **Bring to front**, and **Send to back** commands remain future work and must not use parent-based automatic increments.

### Editor Command and Mutation Transactions — Frozen for V1

All persisted page and node mutations use one canonical command path:

```text
Editor entry point
  -> dispatchEditorCommand(command, options)
     -> synchronous command executor
        -> validate immutable current snapshot
        -> build and validate isolated candidate
     -> one atomic Zustand commit
        -> document + parentById + selection effect
        -> history + commitId + dirty state
```

The executor is a separate application service. It never calls Zustand `set`, never mutates the live snapshot, and never performs network work. Zustand exposes `dispatchEditorCommand` as the only public document-mutation action. Typed convenience functions may construct commands and call the dispatcher, but they cannot implement independent relationship or document mutation logic.

Raw Zustand setters remain private. Session actions update selection, hover, viewport, zoom, panels, and drag state only. Derived selectors such as breadcrumbs and Layers never mutate state. Persistence and hydration lifecycle actions have their own boundaries and cannot bypass command validation for ordinary editing.

```ts
type BuilderStore = {
  document: ProjectDocument;
  parentById: Record<string, string | null>; // project-wide

  activePageId: string;
  selectedNodeId: string | null;
  hoveredNodeId: string | null;
  activeDropTarget: NodeDestination | null;
  activeViewport: Viewport;
  zoom: number;
  dragSession: DragSession | null;

  commitId: number;
  persistence: PersistenceState;

  dispatchEditorCommand: (
    command: EditorCommand,
    options?: CommandDispatchOptions
  ) => CommandResult;

  setActivePage: (pageId: string) => SessionActionResult;
  selectNode: (nodeId: string | null) => void;
  setHoveredNode: (nodeId: string | null) => void;
  setViewport: (viewport: Viewport) => void;
  setZoom: (zoom: number) => void;
  setDragSession: (session: DragSession | null) => void;

  undo: () => void;
  redo: () => void;
};
```

The store keeps only node IDs for selection and hover. Selected nodes, parents, breadcrumbs, and Layers rows are derived from the active page and project-wide `parentById`. Canvas components subscribe to the smallest practical state slices.

#### Command Results

```ts
type CommandResult<Value = undefined> =
  | {
      status: "applied";
      commitId: number;
      value: Value;
    }
  | {
      status: "noop";
      reason:
        | "already-at-destination"
        | "value-unchanged"
        | "style-already-reset";
    }
  | {
      status: "rejected";
      error: CommandValidationError;
    }
  | {
      status: "failed";
      errorId: string;
      message: string;
    };

type CommandValidationError = {
  code:
    | "invalid-input"
    | "page-not-found"
    | "node-not-found"
    | "node-not-in-page"
    | "destination-not-found"
    | "component-type-unknown"
    | "block-type-unknown"
    | "locked"
    | "cycle"
    | "index-out-of-range"
    | "placement-rejected"
    | "props-invalid"
    | "styles-invalid"
    | "slug-invalid"
    | "slug-conflict"
    | "home-page-protected"
    | "block-invalid"
    | "id-collision"
    | "tree-invalid";
  pageId?: string;
  nodeId?: string;
  parentId?: string | null;
  path?: readonly (string | number)[];
  reason: string;
};
```

`applied` means one mutation committed. `noop` means the request was valid but already represented by current state. `rejected` is an expected domain or validation failure. `failed` is an unexpected implementation or invariant failure. Normal invalid editor operations do not throw. The dispatcher catches unexpected exceptions, reports them, returns `failed`, and leaves Zustand untouched.

#### Destination and Index Semantics

```ts
type NodeDestination = {
  parentId: string | null;
  index: number;
};
```

`parentId: null` targets that page's `rootIds`; otherwise it targets the parent's `childIds`. The index is a zero-based insertion position with inclusive range `0 <= index <= destinationLength`. For a same-parent move, the source is conceptually removed first and the index describes the final array. Moving a node back to its current final position is a no-op. Canvas drag-and-drop, Layers, and keyboard adapters must translate their visual intention into these semantics before dispatch. Cross-page node moves are outside the V1 command set.

#### Persisted Command Catalog

```ts
type StyleTarget =
  | {
      property: keyof StyleValues;
      field?: never;
    }
  | {
      property: "margin" | "padding";
      field: keyof SpacingValue;
    }
  | {
      property: "grid";
      field: keyof GridConfig;
    }
  | {
      property: "flex";
      field: keyof FlexConfig;
    };

type StyleChange = {
  target: StyleTarget;
  value: JsonValue;
};

type PageCommand =
  | {
      kind: "page.create";
      name?: string;
      slug?: string;
    }
  | {
      kind: "page.rename";
      pageId: string;
      name: string;
    }
  | {
      kind: "page.change-slug";
      pageId: string;
      slug: string;
    }
  | {
      kind: "page.remove";
      pageId: string;
    }
  | {
      kind: "page.reorder";
      pageId: string;
      index: number;
    };

type NodeCommand =
  | {
      kind: "node.add";
      pageId: string;
      componentType: ComponentType;
      destination: NodeDestination;
    }
  | {
      kind: "node.move";
      pageId: string;
      nodeId: string;
      destination: NodeDestination;
    }
  | {
      kind: "node.remove";
      pageId: string;
      nodeId: string;
    }
  | {
      kind: "node.duplicate";
      pageId: string;
      nodeId: string;
      destination: NodeDestination;
    }
  | {
      kind: "node.update-props";
      pageId: string;
      nodeId: string;
      nextProps: JsonObject;
    }
  | {
      kind: "node.update-styles";
      pageId: string;
      nodeId: string;
      viewport: Viewport;
      changes: NonEmptyReadonlyArray<StyleChange>;
    }
  | {
      kind: "node.reset-style";
      pageId: string;
      nodeId: string;
      viewport: Viewport;
      targets: NonEmptyReadonlyArray<StyleTarget>;
    }
  | {
      kind: "node.rename";
      pageId: string;
      nodeId: string;
      name: string;
    }
  | {
      kind: "node.set-locked";
      pageId: string;
      nodeId: string;
      locked: boolean;
    }
  | {
      kind: "block.insert";
      pageId: string;
      blockType: BlockType;
      destination: NodeDestination;
    };

type EditorCommand = PageCommand | NodeCommand;
```

Applied results return only command-relevant identities and locations:

| Command | Applied `value` |
| --- | --- |
| `page.create` | New `pageId` and appended index |
| `page.rename`, `page.change-slug`, `page.reorder` | Affected `pageId` |
| `page.remove` | Removed `pageId` and removed node IDs |
| `node.add` | New `nodeId` and destination |
| `node.move` | Node ID, previous destination, and final destination |
| `node.remove` | Removed root ID and all removed node IDs |
| `node.duplicate` | Source ID, duplicate root ID, and complete old-to-new ID map |
| Props, styles, reset, rename, and lock commands | Affected node ID |
| `block.insert` | Block type, inserted root ID, and all generated node IDs |

`node.add` clones and validates current registry defaults and generates a project-wide unique node ID. `node.update-props` receives the complete next props object. Style changes use typed schema-derived targets, may update several linked values atomically, and validate the complete next `ResponsiveStyles`. `node.reset-style` deletes tablet/mobile overrides or restores base defaults. Duplication and block insertion require explicit destinations and generate fresh project-wide IDs for every new node.

New primitive nodes receive page-local readable names derived from their component labels, such as `Card 1`. `node.rename` trims the value, rejects an empty name, permits duplicate readable names, and never changes identity. `node.set-locked` is the sole exception that may update an already locked node so it can be unlocked. V1 has no `node.set-hidden` command.

#### Page Commands and Active Page

A new project factory creates one empty Home page, assigns its generated ID to `homePageId`, stores `/` as its slug, and inserts it into `pageOrder`. `page.create` creates a non-home page with empty `rootIds` and `nodes`, appends it to `pageOrder`, activates it, and clears page-specific interaction state. An omitted name becomes `Untitled Page`. An omitted slug is derived from the name; generated collisions receive the smallest available numeric suffix.

Page names are trimmed, non-empty, editable, and not required to be unique. Renaming a page never changes its slug. V1 normalizes a non-home slug by trimming whitespace, rejecting a complete URL, query, or fragment, removing surrounding slashes, lowercasing, removing diacritic marks where practical, replacing each run outside `a-z` and `0-9` with `-`, collapsing and trimming hyphens, and prefixing `/`. An explicitly supplied slug that becomes empty or conflicts after normalization is rejected rather than silently rewritten. When a generated name-derived slug is empty, it uses `/page`; generated conflicts receive the smallest available suffix such as `/about-2`. The home page keeps `/`; non-home pages cannot use it. V1 validates non-home slugs as single segments, but persisted `PageDocument.slug` remains a general canonical path string so later nested-path support can be introduced as a validation/version change rather than a new field representation.

`page.remove` rejects the home page, the last remaining page, and any page containing a locked node. Removing an active page activates the page now at its former order index, otherwise the previous page, and clears selection, hover, drop-target, and drag state. Removing an inactive page preserves active-page interaction state. `page.reorder` uses final-index semantics, does not change `homePageId`, and is a no-op when order is unchanged.

`setActivePage(pageId)` is a session action, not a document command. It validates existence, changes `activePageId`, clears selection, hover, drop-target, and drag state, and preserves viewport, zoom, and panel layout. Switching pages creates no history, does not mark dirty, and does not trigger autosave.

#### Direct Structural Locking

V1 uses direct structural locking with a destructive-containment guard:

- A locked node cannot have props, styles, name, or direct structure edited and cannot itself be moved, reordered, reparented, or deleted.
- A locked container's `childIds` cannot change. Adding, inserting, removing, moving in, moving out, or reordering a direct child is rejected.
- Moving an unlocked ancestor containing locked descendants is allowed when the moved root, current parent, and destination parent are unlocked and normal placement, index, and cycle validation succeeds. The locked descendants' own data and direct relationships remain unchanged.
- Deleting a subtree or page is rejected if any contained node is locked. V1 never partially deletes around locked descendants.
- Duplication may read and clone a locked subtree when the destination structure is editable. Fresh IDs and readable names are generated, and lock flags remain preserved.
- Undo and redo replay accepted history without rerunning current lock validation.

#### Validation and Atomic Commit

Every command starts from an immutable current snapshot and follows this order:

1. Validate command shape, JSON values, required IDs, non-empty changes, and integer indexes.
2. Resolve the page and referenced component or block definition.
3. Resolve source nodes, destination parent, page membership, and current tree position.
4. Apply the direct-lock and destructive-containment checks.
5. Materialize defaults, duplicates, or block templates in isolated data; assign current component versions and collision-free project-wide IDs; validate all new props and styles.
6. Reject move cycles and other instance-level tree violations.
7. Validate the final destination index after conceptual source removal.
8. Call `canPlaceType` for the destination edge and every new internal edge. It remains the sole type-level placement authority.
9. Apply the operation to an isolated candidate document.
10. Validate final page-tree coverage, global ID uniqueness, props, styles, placement, and relationship invariants.
11. Build and verify the project-wide candidate `parentById`.

Only a fully prepared candidate reaches Zustand. The dispatcher performs one `set` that commits document content, `parentById`, the command's selection effect, history, monotonic `commitId`, and dirty state. Validation failure, no-op, or unexpected failure never partially changes live state.

Selection effects are deterministic:

| Applied operation | Selection effect |
| --- | --- |
| Add node | Select the new node |
| Move node | Select the moved subtree root |
| Remove node | Preserve outside selection; if selection is inside the removed subtree, select its former parent or `null` for a root |
| Duplicate node | Select the duplicate root |
| Insert block | Select the inserted block root |
| Update props/styles, reset style, rename, or set locked | Preserve selection |
| Create page | Activate the new page and clear node selection |
| Rename, change slug, or reorder page | Preserve active page and selection |
| Remove active page | Activate the defined neighboring fallback and clear node selection |
| No-op, rejection, or failure | Preserve session state |

If a document command targets a non-active page, its document change may apply, but active-page selection is unchanged. Normal editor entry points operate on `activePageId` and always pass that explicit `pageId`.

Canvas drag-and-drop, Layers reordering, and keyboard move controls calculate a `NodeDestination` and dispatch the same `node.move` command. The Component Library dispatches `node.add` or `block.insert`. Inspector controls dispatch `node.update-props`, `node.update-styles`, or `node.reset-style`; temporarily invalid input remains local UI state. No entry point splices `rootIds` or `childIds` directly.

Copy/paste and duplication use the same validation and transaction boundary. Internal duplication clones current validated data and revalidates its destination and edges. External clipboard or import data remains untrusted and must pass lookup, required migrations, props, styles, tree, and placement validation before atomic insertion.

### Properties Inspector Data Flow

The inspector combines:

1. Component-specific prop fields from `definition.inspector.props`
2. Shared style sections selected by `definition.inspector.styles`
3. Contextual fields derived from current values and the selected component's parent

Examples:

- Grid controls appear only when `display` is `grid`.
- Flex controls appear only when `display` is `flex`.
- Grid placement appears when the selected node belongs to a grid parent.
- Image source and alt text appear only for image components.
- Position and Layer controls manage position and z-index.
- Position Offset controls manage exact responsive X/Y values and recovery for centrally eligible or resettable nodes.

Every valid inspector change dispatches the corresponding canonical document command, rerenders affected subscribers, enters document history, and marks the document dirty for later autosave observation. Temporarily invalid input remains local control state. Typing, slider movement, color dragging, and resizing use one unique `historyGroupId` per continuous interaction so adjacent applied commands coalesce into one Undo operation.

### Rendering Boundary

The render pipeline separates document orchestration, semantic rendering, and editor interaction:

```text
Saved node
  -> Node Rendering Controller
     -> component definition lookup
     -> responsive value resolution
     -> semantic style compilation
     -> recursive child rendering
     -> Pure Component Renderer

Editor Interaction Layer
  -> root-element registration and measurement
  -> selection, hover, drag-and-drop, and overlays
```

The editor and preview use the same semantic component renderer. The controller may inject a runtime-only context containing the node ID, the editor or preview mode, and optional form-availability guidance. This context is application code, is never serialized, and exists only for environment-sensitive behavior. Ordinary semantic markup remains shared.

#### Node Rendering Controller

The Node Rendering Controller:

- Reads the node and looks up its static registry definition.
- Receives only known component types from a successfully hydrated V1 document; normal rendering has no unknown-component fallback.
- Resolves responsive `StyleValues` and compiles DOM-ready `React.CSSProperties`.
- Compiles committed `positionOffset` through the same path for Canvas and Preview; no Canvas-only persisted translation is allowed.
- Supplies a controlled `className` for known presets, generated responsive rules, pseudo-state rules, or scoped published CSS.
- Recursively renders ordered children and uses the leaf or container renderer contract selected by the definition.
- Forwards an optional `rootRef` supplied by an external consumer; it does not own registration or measurement.
- Injects the runtime-only node identity, mode, and optional form-availability guidance supplied by the owning surface.
- Applies React keys externally using stable node IDs.
- Does not mutate the document, manage selection, handle drag-and-drop, or insert blocks.

#### Pure Component Renderer

Every component renderer must produce exactly one semantic DOM root element. The renderer:

- Maps validated component props to semantic HTML and accessibility attributes.
- Applies the controlled `className` and compiled `style` to its semantic root.
- Attaches the optional `rootRef` to that same root element.
- Renders the supplied child slot only when its definition is a container.
- Produces the same authored semantic root in editor and preview; a Form may add runtime-only availability guidance in Preview.
- Does not access Zustand, parent or sibling information, registry state, editor commands, responsive resolution, drag-and-drop state, undo history, or autosave.

Leaf renderers use `LeafRendererProps<Props>` and cannot accept children. Container renderers use `ContainerRendererProps<Props>` and receive `children`, which may be `null` for an empty container.

Accessibility and real browser semantics belong to the component renderer. Examples include heading levels, landmark elements, image alternative text, form labels, button types, and safe anchor `href`, `target`, and `rel` attributes.

#### Editor Interaction Layer

The Editor Interaction Layer:

- Owns selection, hover, focus, drag-and-drop, resize state, and editor commands.
- Registers and measures renderer root elements without passing node IDs into renderers.
- Maintains an external element-to-node mapping for hit testing and selection.
- Renders selection outlines, labels, drag handles, resize handles, drop zones, and empty-container prompts in a layout-neutral overlay layer.
- Uses capture-phase interaction guards to prevent navigation, button activation, or form submission while editing.
- Supplies editor runtime mode so keyboard-triggered form submission is also prevented without relying only on pointer capture.
- Keeps editor state and overlays out of component props, saved JSON, preview markup, and published markup.

The editor must not add layout-changing wrapper elements around component renderers. The required single semantic root and optional `rootRef` provide measurement and interaction hooks without changing the component's layout or HTML structure.

Tailwind CSS styles the editor shell and known presets. Arbitrary user values are compiled into controlled inline styles, CSS variables, or generated scoped CSS before reaching the renderer.

#### Preview Runtime

The editor toolbar links to the dedicated `/preview` route with `target="_blank"` and `rel="noopener noreferrer"`, leaving the editor open in its original browser tab. Immediately before the browser opens Preview, the editor places a tokenized, one-use snapshot containing the current validated document and active page ID in same-origin browser storage. The preview tab consumes and removes that snapshot, then hydrates it into an isolated vanilla Zustand store through the normal project validation boundary.

Preview maps the active page's ordered roots through the page and node rendering controllers. It does not render the editor toolbar, sidebars, Inspector, breadcrumbs, canvas stage, selection layer, drag-and-drop targets, resize controls, or editor-only empty prompts. The route derives its active `Viewport` from the real browser width using the shared V1 breakpoint constants, then uses the existing responsive resolver and style compiler.

Committed position offsets therefore have one semantic rendering contract across Canvas and Preview. Transient gesture preview is editor-only session state, but it uses the same style-change compiler behavior and cannot become a second persisted positioning path. Published output is not implemented; when added, it must use the same resolver, compiler, and renderer and pass an explicit parity gate.

Preview does not supply a form-submission transport. Form cancels native submission and Preview supplies an accessible note that submissions are not saved or sent. The same-origin `/api/form-submissions` Route Handler remains fail-closed and returns `503 Service Unavailable` without reading or echoing the request body. Durable storage and delivery require a separately designed backend integration before submission controls or success and error states may be activated.

The snapshot is transport, not project persistence or a second canonical document format. A copied preview URL is not shareable, and refreshing a consumed preview URL shows the bounded unavailable state; clicking Preview in the editor publishes a fresh snapshot. Preview never displays stored JSON or editor chrome. Durable persistence, published routes, and source-code export remain separate concerns.

### Undo, Autosave, and Persistence

V1 history stores content-only project snapshots:

```ts
type DocumentContentSnapshot = {
  name: string;
  pages: Record<string, PageDocument>;
  pageOrder: string[];
  homePageId: string;
};

type CommandDispatchOptions = {
  historyGroupId?: string;
};
```

History excludes `parentById`, selection, hover, viewport, zoom, panels, drag state, persistence state, `projectId`, `schemaVersion`, `revision`, `createdAt`, and `updatedAt`. The excluded identity, version, and concurrency metadata cannot be rolled back to stale values by Undo.

Every applied document command creates one history transaction and clears redo. No-op, rejected, failed, session-only, persistence-lifecycle, and hydration-lifecycle actions create none. Adjacent applied commands carrying the same unique `historyGroupId` coalesce: the first captures `before`, and subsequent commands update `after`. A different or ungrouped command ends the sequence. Undo and redo replay accepted snapshots without current lock validation, atomically rebuild project-wide `parentById`, and do not create new history entries.

Selection is not history. After Undo or Redo, keep `activePageId` if the page still exists; otherwise choose the nearest surviving page by prior order and fall back to `homePageId`. Keep selection only if that node still exists on the active page; otherwise walk the prior parent chain to the nearest surviving ancestor and then use `null`. Hydration resets history.

Each applied document command and applied Undo or Redo increments a monotonic session `commitId`, marks the document dirty, and sets persistence status to dirty. Commands never perform network requests. No-op, rejection, failure, page switching, selection, hover, viewport, zoom, panels, and drag-session changes do not mark dirty.

Zustand is browser state, not permanent storage. Autosave observes committed `commitId` and dirty state, debounces independently, validates the snapshot, and sends it through a revision-checked Next.js server API. A save captures the current server revision and commit ID. On success, server-owned revision and timestamps update; the store becomes clean only if no newer commit exists. If edits occurred during the request, it remains dirty and schedules another save. Save-started, save-succeeded, and save-failed actions update persistence lifecycle state only and never enter document history.

The complete action separation is authoritative:

| Boundary | Operations | Document history? | Dirty? |
| --- | --- | --- | --- |
| Persisted document commands | Page create/rename/slug/remove/reorder; node add/move/remove/duplicate/props/styles/reset/rename/lock; block insertion | Yes when applied | Yes when applied |
| History operations | Undo and Redo | Replay existing history | Yes when applied |
| Session/UI actions | Active-page switch, selection, hover, viewport, zoom, panels, drag session, drop target | No | No |
| Persistence lifecycle | Save started, succeeded, or failed | No | Manages save state; does not create document changes |
| Hydration lifecycle | Hydration succeeded or failed | Resets or preserves history as specified | No ordinary editor mutation |

### Loading, Migrations, and Atomic Hydration

Loading transforms untrusted persisted JSON into one completely validated document and runtime tree index before either enters Zustand.

#### Version Responsibilities

| Version | Scope | Migration owner |
| --- | --- | --- |
| `ProjectDocument.schemaVersion` | Project, page, shared node envelope, canonical tree representation, and globally shared persisted structures | Document migrations |
| `BuilderNode.componentVersion` | One known component type's persisted props and component-specific style semantics | That component definition's migrations |

Document migrations run before component migrations. They may change project or page structure, shared node fields, globally shared style structures, component type keys, or tree relationships. Component migrations run only after nodes use the current document envelope and may transform only that known node's props and styles.

A component type rename requires a document migration because the old registry key cannot select the new definition's component migrations. A placement-rule change that invalidates supported existing trees also requires a document migration because component migrations do not change relationships.

All migrations are pure, deterministic application code with explicit `fromVersion` and `toVersion` values. They operate on a working candidate and do not access Zustand, the network, time-dependent data, random values, or mutable current defaults. V1 requires one unambiguous, contiguous migration path for every supported historical version.

#### Ordered Loading Pipeline

1. **Preserve the source and disable persistence.** Retain the untouched raw string or bytes, keep autosave disabled, and create a separate working candidate. Never mutate the preserved source during parsing or migration.
2. **Parse JSON and validate a minimal envelope.** Validate enough structure to read `schemaVersion`, pages, nodes, component types, component versions, props, styles, and child arrays as JSON-compatible values.
3. **Check document-version compatibility.** A current version continues directly. An older supported version requires every document migration step. A missing, ambiguous, unsupported-old, or future `schemaVersion` fails loading; V1 never guesses, skips steps, or down-migrates future data.
4. **Run document migrations.** Apply the complete ordered chain to the working candidate. A thrown error, wrong target version, or invalid intermediate shape fails the complete load.
5. **Validate the current document envelope.** Validate all current required project, page, node, metadata, ID, array, record, and JSON-value shapes before component-specific processing. Confirm that the project has at least one page, `pageOrder` contains every page exactly once, `homePageId` references an existing page with slug `/`, non-home slugs satisfy the current V1 validator and are unique, record keys match embedded IDs, and node IDs are project-wide unique. At this boundary, `node.type` is a structurally valid string; registry lookup in step 7 is what narrows it to `ComponentType`, so an unknown type remains a component-lookup error rather than a document-schema error.
6. **Validate canonical tree integrity.** For every page independently, verify all roots and children exist, every node appears exactly once in that page tree, roots are not children, children have at most one parent, order arrays contain no duplicates, no cycles or forbidden orphans exist, and size and depth limits are satisfied. A project-wide candidate reverse index may be built locally but is not committed.
7. **Migrate and validate every component.** Look up each static registry type; check `componentVersion`; run every required component migration; then validate final props with the current strict `propsSchema` and final styles with the shared current style schema. A future component version, missing step, migration failure, or invalid final value fails the complete load.
8. **Validate placement.** Call `canPlaceType(null, rootType)` for every root and `canPlaceType(parentType, childType)` for every child edge after all nodes have reached current versions. Type compatibility does not replace the separate tree checks.
9. **Finalize `parentById`.** Confirm that the project-wide candidate index assigns `null` to every page root, exactly one parent to every non-root, and covers every node across all pages. `parentById` remains runtime-only and is never accepted through last-write-wins behavior.
10. **Commit atomically.** Only after every stage succeeds, place the complete current document, project-wide `parentById`, and initial session state into Zustand in one update. `activePageId` starts at the requested existing page or falls back to `homePageId`. No partially migrated or partially validated document may enter the store.
11. **Enable revisioned persistence.** Enable editing and autosave only after successful atomic hydration. If migrations changed the candidate, mark the document as needing persistence and save it as a new revision through the normal validated, revision-checked save/autosave pipeline. Do not blindly overwrite the stored source during migration.

Block definitions do not participate in loading because block identity is not persisted. A saved block is an ordinary component subtree, so loading validates its component nodes, tree edges, and placement rules exactly like every other subtree.

#### Version and Migration Failures

The following conditions fail the entire candidate:

- Unsupported future or historical document version
- Unsupported future component version
- Missing or ambiguous document migration step
- Missing or ambiguous component migration step
- Migration exception or wrong target version
- Invalid current document envelope
- Invalid tree structure
- Unknown component type
- Invalid current props or styles after migrations
- Invalid current placement relationship

Versions advance only in the working candidate. A failure never partially rewrites the raw source, persisted document, or Zustand state.

#### Unknown Component Types

Unknown component types are fatal normal-hydration errors in V1. Without a registry definition, the loader has no authoritative props schema, migration chain, renderer, inspector, leaf/container behavior, or placement rules. It therefore cannot validate or safely edit the node.

Normal V1 editing does not introduce unknown-component placeholders or opaque nodes. Placeholder-based handling is reserved for a future recovery mode with its own validation, editing, round-trip, and publishing rules.

Unknown types and known components with invalid current props both reject normal hydration atomically. They remain distinct diagnostic failures: an unknown type fails registry lookup before component migration, while known invalid props fail current-schema validation after version handling.

#### Atomic Failure Result

Any loading failure:

- Rejects normal hydration of the complete document
- Leaves Zustand unchanged
- Keeps autosave disabled
- Preserves the untouched raw payload
- Discards the working candidate
- Never strips, repairs, replaces, or saves invalid data
- Returns structured errors with the validation stage and available document context

```ts
type HydrationError = {
  stage:
    | "json"
    | "document-version"
    | "document-migration"
    | "document-schema"
    | "tree"
    | "component-lookup"
    | "component-version"
    | "component-migration"
    | "props"
    | "styles"
    | "placement";
  pageId?: string;
  nodeId?: string;
  componentType?: string;
  schemaVersion?: number;
  componentVersion?: number;
  path?: string;
  reason: string;
};
```

Where possible, prop failures identify the page, node, component type, component version, prop path, and validation reason. The loader may collect multiple independent errors within a safe stage but must not continue into a stage whose prerequisites failed.

### Future Data Bindings and Security

The first version uses static props. A future `bindings` map can connect an approved data source and path to a prop while keeping the static prop as a fallback.

Dynamic values must not execute arbitrary JavaScript or `eval`. Client and server validation must check IDs, tree relationships, cycles, nesting rules, component schemas, style units, URLs, document size, and maximum nesting depth. Rich text or custom HTML must be sanitized.

### Complete V1 Data Reference

This section is the canonical example of the V1 boundary between persisted project data, derived runtime data, editor-session state, and application code.

| Data category | Examples | Saved in project JSON? |
| --- | --- | --- |
| Persisted document | Pages, nodes, props, responsive styles, metadata, and child order | Yes |
| Derived runtime data | `parentById`, breadcrumbs, Layers tree, and resolved styles | No |
| Editor-session state | Selection, hover, viewport, zoom, drag state, history, and save status | No |
| Registry/application code | Renderers, defaults, schemas, inspector capabilities, placement rules, breakpoints, block factories, and merge rules | No |

The reference page has this hierarchy:

```text
Home Page
└── Section
    └── Container
        ├── Heading
        └── Card
            ├── Text
            └── Button
```

#### Persisted Project JSON

```json
{
  "schemaVersion": 2,
  "projectId": "project-acme-site",
  "name": "Acme Marketing Site",
  "pageOrder": [
    "page-home"
  ],
  "homePageId": "page-home",
  "pages": {
    "page-home": {
      "id": "page-home",
      "name": "Home",
      "slug": "/",
      "rootIds": [
        "section-hero"
      ],
      "nodes": {
        "section-hero": {
          "id": "section-hero",
          "type": "section",
          "componentVersion": 1,
          "childIds": [
            "container-hero"
          ],
          "props": {
            "semanticTag": "section",
            "anchorId": "hero"
          },
          "styles": {
            "base": {
              "display": "block",
              "width": { "mode": "fill" },
              "height": { "mode": "auto" },
              "padding": {
                "top": { "value": 64, "unit": "px" },
                "right": { "value": 24, "unit": "px" },
                "bottom": { "value": 64, "unit": "px" },
                "left": { "value": 24, "unit": "px" }
              },
              "backgroundColor": "#f8fafc",
              "position": "static",
              "zIndex": "auto"
            },
            "tablet": {
              "padding": {
                "top": { "value": 48, "unit": "px" },
                "right": { "value": 20, "unit": "px" },
                "bottom": { "value": 48, "unit": "px" },
                "left": { "value": 20, "unit": "px" }
              }
            },
            "mobile": {
              "padding": {
                "top": { "value": 32, "unit": "px" },
                "right": { "value": 16, "unit": "px" },
                "bottom": { "value": 32, "unit": "px" },
                "left": { "value": 16, "unit": "px" }
              }
            }
          },
          "meta": {
            "name": "Hero Section",
            "locked": false
          }
        },
        "container-hero": {
          "id": "container-hero",
          "type": "container",
          "componentVersion": 2,
          "childIds": [
            "heading-hero",
            "card-cta"
          ],
          "props": {
            "semanticTag": "div"
          },
          "styles": {
            "base": {
              "display": "grid",
              "width": { "mode": "fill" },
              "height": { "mode": "auto" },
              "maxWidth": { "value": 72, "unit": "rem" },
              "margin": {
                "top": { "value": 0, "unit": "px" },
                "right": { "keyword": "auto" },
                "bottom": { "value": 0, "unit": "px" },
                "left": { "keyword": "auto" }
              },
              "grid": {
                "columns": 2,
                "columnGap": { "value": 32, "unit": "px" },
                "rowGap": { "value": 32, "unit": "px" },
                "justifyItems": "stretch",
                "alignItems": "center"
              },
              "position": "static",
              "zIndex": "auto"
            },
            "tablet": {
              "grid": {
                "columns": 1,
                "columnGap": { "value": 24, "unit": "px" },
                "rowGap": { "value": 24, "unit": "px" }
              }
            },
            "mobile": {
              "grid": {
                "rowGap": { "value": 16, "unit": "px" }
              }
            }
          },
          "meta": {
            "name": "Hero Content",
            "locked": false
          }
        },
        "heading-hero": {
          "id": "heading-hero",
          "type": "heading",
          "componentVersion": 1,
          "childIds": [],
          "props": {
            "text": "Build your website visually",
            "level": "h1"
          },
          "styles": {
            "base": {
              "display": "block",
              "width": { "mode": "fill" },
              "height": { "mode": "auto" },
              "fontSize": { "value": 48, "unit": "px" },
              "fontWeight": 700,
              "lineHeight": 1.1,
              "color": "#0f172a",
              "position": "static",
              "zIndex": "auto"
            },
            "tablet": {
              "fontSize": { "value": 40, "unit": "px" }
            },
            "mobile": {
              "fontSize": { "value": 32, "unit": "px" }
            }
          },
          "meta": {
            "name": "Hero Heading",
            "locked": false
          }
        },
        "card-cta": {
          "id": "card-cta",
          "type": "card",
          "componentVersion": 1,
          "childIds": [
            "text-card-description",
            "button-card-action"
          ],
          "props": {
            "semanticTag": "article"
          },
          "styles": {
            "base": {
              "display": "flex",
              "width": { "mode": "fill" },
              "height": { "mode": "auto" },
              "minWidth": { "value": 0, "unit": "px" },
              "maxWidth": { "value": 100, "unit": "%" },
              "padding": {
                "top": { "value": 24, "unit": "px" },
                "right": { "value": 24, "unit": "px" },
                "bottom": { "value": 24, "unit": "px" },
                "left": { "value": 24, "unit": "px" }
              },
              "backgroundColor": "#ffffff",
              "borderRadius": { "value": 12, "unit": "px" },
              "flex": {
                "direction": "column",
                "wrap": "nowrap",
                "justifyContent": "flex-start",
                "alignItems": "stretch",
                "gap": { "value": 16, "unit": "px" }
              },
              "position": "static",
              "zIndex": "auto"
            },
            "tablet": {
              "padding": {
                "top": { "value": 20, "unit": "px" },
                "right": { "value": 20, "unit": "px" },
                "bottom": { "value": 20, "unit": "px" },
                "left": { "value": 20, "unit": "px" }
              }
            },
            "mobile": {
              "padding": {
                "top": { "value": 16, "unit": "px" },
                "right": { "value": 16, "unit": "px" },
                "bottom": { "value": 16, "unit": "px" },
                "left": { "value": 16, "unit": "px" }
              }
            }
          },
          "meta": {
            "name": "Call to Action Card",
            "locked": false
          }
        },
        "text-card-description": {
          "id": "text-card-description",
          "type": "text",
          "componentVersion": 1,
          "childIds": [],
          "props": {
            "text": "Drag components onto the canvas and customize every part of your page.",
            "semanticTag": "p"
          },
          "styles": {
            "base": {
              "display": "block",
              "width": { "mode": "fill" },
              "height": { "mode": "auto" },
              "fontSize": { "value": 16, "unit": "px" },
              "fontWeight": 400,
              "lineHeight": 1.6,
              "color": "#475569",
              "position": "static",
              "zIndex": "auto"
            }
          },
          "meta": {
            "name": "Card Description",
            "locked": false
          }
        },
        "button-card-action": {
          "id": "button-card-action",
          "type": "button",
          "componentVersion": 2,
          "childIds": [],
          "props": {
            "text": "Start Building",
            "href": "/builder",
            "openInNewTab": false,
            "icon": "arrow-right",
            "iconPosition": "end"
          },
          "styles": {
            "base": {
              "display": "flex",
              "width": { "mode": "fit" },
              "height": { "mode": "auto" },
              "padding": {
                "top": { "value": 12, "unit": "px" },
                "right": { "value": 20, "unit": "px" },
                "bottom": { "value": 12, "unit": "px" },
                "left": { "value": 20, "unit": "px" }
              },
              "backgroundColor": "#2563eb",
              "color": "#ffffff",
              "borderRadius": { "value": 8, "unit": "px" },
              "flex": {
                "direction": "row",
                "wrap": "nowrap",
                "justifyContent": "center",
                "alignItems": "center",
                "gap": { "value": 8, "unit": "px" }
              },
              "position": "static",
              "zIndex": "auto"
            },
            "mobile": {
              "width": { "mode": "fill" }
            }
          },
          "meta": {
            "name": "Primary Action",
            "locked": false
          }
        }
      }
    }
  },
  "createdAt": "2026-08-05T10:00:00.000Z",
  "updatedAt": "2026-08-05T10:30:00.000Z",
  "revision": 12
}
```

This persisted payload intentionally contains no `parentId`, `meta.hidden`, responsive props, custom breakpoint IDs, sizing or stacking mode flags, JSX, DOM elements, selection state, empty-state placeholders, or block-template identity.

#### Derived Runtime-Only Data

The loading service builds one project-wide reverse tree index from every page's `rootIds` and `childIds` before atomic Zustand hydration. This one-page example shows the entries contributed by the Home page:

```ts
const runtimeTreeIndex = {
  parentById: {
    "section-hero": null,
    "container-hero": "section-hero",
    "heading-hero": "container-hero",
    "card-cta": "container-hero",
    "text-card-description": "card-cta",
    "button-card-action": "card-cta"
  }
};
```

The Layers tree, breadcrumbs, selected node, selected parent, and resolved responsive styles are derived through selectors. They must not be stored as duplicate project structures:

```ts
const derivedValues = {
  selectedNode: nodes[selectedNodeId],
  selectedParentId: parentById[selectedNodeId],
  breadcrumbs: deriveBreadcrumbs(selectedNodeId, parentById),
  layersTree: deriveLayersTree(rootIds, nodes),
  resolvedStyles: resolveResponsiveStyles(
    nodes[selectedNodeId].styles,
    activeViewport
  )
};
```

#### Editor-Session-Only Zustand Data

```ts
const editorSessionState = {
  activePageId: "page-home",
  selectedNodeId: "card-cta",
  hoveredNodeId: "button-card-action",
  activeViewport: "tablet",
  zoom: 0.9,
  activeDropTarget: null,
  dragSession: null,
  commitId: 42,
  panels: {
    leftCollapsed: false,
    rightCollapsed: false,
    activeLeftTab: "components",
    activeRightSection: "layout"
  },
  history: {
    past: [],
    future: []
  },
  persistence: {
    status: "saved",
    dirty: false,
    lastSavedRevision: 12,
    lastSavedAt: "2026-08-05T10:30:00.000Z"
  }
};
```

None of this session state is part of the project document. V1 Undo history holds content-only project snapshots in memory; selection, hover, zoom, panels, drag state, commit IDs, and save status are not page content.

#### Registry and Application-Code-Only Data

```ts
const BREAKPOINTS = {
  tabletMaxWidth: 1024,
  mobileMaxWidth: 767
} as const;

const componentRegistry = defineComponentRegistry({
  section: sectionDefinition,
  container: containerDefinition,
  heading: headingDefinition,
  text: textDefinition,
  card: cardDefinition,
  button: buttonDefinition,
  form: formDefinition,
  input: inputDefinition,
  dropdown: dropdownDefinition
});

const blockRegistry = {
  "content-card": {
    label: "Content Card",
    category: "Cards",
    createTemplate: createContentCardTemplate
  }
} satisfies Record<string, BlockDefinition>;

type BlockType = keyof typeof blockRegistry;

const STYLE_MERGE_POLICY = {
  width: "replace",
  height: "replace",
  display: "replace",
  color: "replace",
  position: "replace",
  positionOffset: "replace",
  zIndex: "replace",
  padding: "merge-edges",
  margin: "merge-edges",
  grid: "merge-fields",
  flex: "merge-fields",
  transform: "replace-list",
  boxShadow: "replace-list",
  backdropBlur: "replace"
};
```

React renderers, component icons, categories, props schemas, inspector definitions, defaults, placement rules, block factories, validators, migrations, the style compiler, and responsive resolver all remain application code. They are never serialized into project JSON.

### Data Architecture Acceptance Scenario

The first proof of concept must demonstrate that the architecture can:

1. Drop a primitive Card and confirm it creates one node with `childIds: []`.
2. Confirm its empty-state prompt appears only in editor mode.
3. Drop a Content Card block and confirm it creates a Card, Heading, Text, and Button subtree with fresh IDs.
4. Undo and redo the complete block insertion as one transaction.
5. Add another Card inside the outer Card and a Button inside that nested Card.
6. Select every level from the canvas, Layers tree, and breadcrumb.
7. Configure four base grid columns and a two-column tablet override; confirm mobile inherits two columns until explicitly overridden.
8. Override horizontal padding on tablet and vertical padding on mobile; confirm mobile resolves both patches correctly.
9. Change Button text, icon, and icon position; confirm the shared props appear at every viewport and the decorative icon does not replace the text-derived accessible name.
10. Confirm saved responsive data contains only `base`, `tablet`, and `mobile` style layers with no responsive props or custom breakpoint IDs.
11. Move the Button or inner Card to a different parent.
12. Preserve width, height, position, and z-index without automatic layer recalculation.
13. Undo and redo the move as one transaction.
14. Save JSON without `parentId` or editor-only empty-state nodes.
15. Reload, rebuild `parentById`, and reproduce the same page and selection targets.
16. Reject invalid cycles, structurally invalid parent-child relationships, invalid block templates, responsive values, or unsupported drops without partially changing the document.
17. Run document migrations before component migrations and validate the final current-version props, styles, tree, and placement rules before hydrating Zustand.
18. Reject unknown component types, unsupported future versions, missing migration steps, and migration failures while preserving the raw payload and keeping autosave disabled.
19. Confirm that failed hydration leaves Zustand unchanged and returns structured stage, page, node, component, version, path, and reason data where available.
20. Confirm that a successfully migrated document hydrates atomically, is marked as needing persistence, and is saved only as a new revision through the revision-checked persistence pipeline.
21. Create an additional page, confirm it receives a stable generated page ID, empty page-local tree, normalized unique slug, appended order entry, and active-page session state without changing `homePageId`.
22. Rename the page without changing its ID or slug; change its slug explicitly; reject an explicit collision; and confirm a generated collision receives a numeric suffix.
23. Switch pages and confirm selection, hover, and drag state clear without creating history, dirty state, or autosave work.
24. Reorder pages without changing home-page identity, delete an active non-home page and activate the defined neighboring fallback, and reject deletion of the home or last page.
25. Confirm every node ID is unique across all pages and rebuild one project-wide `parentById` after reload.
26. Confirm Canvas, Layers, keyboard, Component Library, and Inspector entry points dispatch canonical commands rather than mutating document arrays or values independently.
27. Confirm a locked node cannot be directly edited or moved, a locked container's direct children cannot change, and deleting a subtree or page containing a locked node is rejected.
28. Move an unlocked ancestor containing a locked descendant between unlocked parents, duplicate the locked subtree while preserving lock flags, and unlock it through `node.set-locked`.
29. Set responsive `display` to `none`, confirm the node remains available in Layers, and confirm saved JSON contains no `meta.hidden`.
30. Confirm applied, no-op, rejected, and unexpected failed command paths have distinct results; only applied document changes create history, increment `commitId`, and mark dirty.
31. Place an Input, Textarea, Dropdown, Radio Group, Checkbox, Checkbox Group, and submit Button inside Form, enter and select values in Preview, and confirm submission is canceled with an accessible unavailable notice and no network request.
32. Confirm native `FormData` preserves repeated field order and omits disabled, unnamed, or unchecked controls without serializing visitor values into application state.
33. Confirm the fail-closed backend route returns `503` without reading or echoing visitor values and unsupported nested Form placement is rejected without mutating the project document.
34. Insert the Password reveal preset as one Input node, confirm editor interaction keeps it masked, and confirm Preview can reveal and hide the same live value through an accessible non-submit button.
35. Insert and configure a Radio Group, confirm its fieldset legend names the group, its orientation and option list remain editable, keyboard and pointer interaction select only one option, disabled and required states retain native semantics, and native `FormData` includes the selected named value.
36. Insert and configure a Checkbox, confirm its visible label names the native control, its label remains independent from its configured value, pointer and Space-key interaction toggle the live checked state, required and disabled states retain native semantics, and native `FormData` includes the configured named value only while checked.
37. Insert and configure a Checkbox Group, confirm its fieldset legend names the group, its option list and default selections remain synchronized, pointer and Space-key interaction toggle independent options, required means at least one selected option, disabled state reaches every option, and native `FormData` preserves selected values in authored option order.
38. Insert a Label and one Input, Textarea, or Dropdown, assign the same valid target and control ID, confirm the visible Label supplies the control's accessible name, clicking the Label focuses the control in Preview, inline editing preserves the target, and legacy labelable controls migrate with their existing accessible-label behavior unchanged.
39. Move an eligible non-container leaf with responsive positive, negative, inherited, explicit-zero, and off-canvas offsets; confirm structural order is unchanged, one gesture creates one Undo entry, Canvas and Preview geometry match, Inspector reset recovers the leaf without Canvas hit-testing, and root/container/absolute/fixed/sticky positioning remains centrally denied.

## Editor Workspace Layout
  
The main editor will use a three-panel layout so that building and styling a page feels clear and predictable.

### Project Pages

The project-level page interface lists pages in `pageOrder`, identifies `homePageId`, and lets users create, rename, change the slug of, reorder, delete, and open pages subject to the finalized page-command rules. Opening a page calls the session-only `setActivePage`; every other persisted page change dispatches its canonical page command. The Canvas, Layers, breadcrumbs, selection, and Inspector always operate on the single `activePageId`.

### Left Panel: Component Library

The left panel contains all components that users can drag and drop onto the canvas, such as:

- Sections and containers
- Headings and text
- Images and videos
- Buttons and links
- Forms, inputs, and choices
- Navigation bars
- Cards, lists, and other reusable blocks

Components should be grouped into categories and include search so users can find them quickly. The Forms family groups Input, its presets, and Textarea under **Inputs**, Dropdown, Radio Group, Checkbox, and Checkbox Group under **Choices**, and Label with the Form container under **Forms**. Search matches visible library metadata and optional component-specific `searchTerms`, allowing aliases such as `multiline` to find Textarea, `select` to find Dropdown and Checkbox Group, `choice` to find grouped choice controls, `consent` to find Checkbox, and `caption` to find Label without renaming those components. The panel should be collapsible to provide more canvas space when needed.

The library should clearly distinguish **Components** from **Blocks**. Components are primitives such as an empty Card, Container, Heading, or Button. Blocks are ready-made editable subtrees such as Content Card, Image Card, and Pricing Card.

### Middle Panel: Design Canvas

The canvas is the main working area where users build their website. Users can:

- Drag components from the component library and drop them onto the page
- Select, visually position eligible leaf components, structurally move or reorder components, duplicate components, and delete components
- See clear drop zones and the currently selected component
- Preview the page at desktop, tablet, and mobile widths
- Zoom in or out and fit the page to the available space

The canvas should provide an accurate visual preview while keeping editing controls easy to understand.

### Right Panel: Properties Inspector

The right panel displays settings for the component currently selected on the canvas. Depending on the component, users can edit:

- Width, height, minimum size, and maximum size
- Margin, padding, gap, and alignment
- Text, font, size, weight, and line height
- Text, background, and border colors
- Border width, style, and radius
- Images, links, and other component-specific content
- Responsive settings for desktop, tablet, and mobile

Settings should be organized into clear groups such as **Content**, **Layout**, **Spacing**, **Typography**, **Style**, and **Advanced**. The panel should show a helpful empty state when no component is selected.

#### Context-Specific Component Properties

The properties inspector should adapt to the selected component. It displays shared design settings alongside controls that are relevant only to that component or layout type.

For a **grid container**, users can configure:

- Number and size of columns
- Number and size of rows
- Column and row gaps
- Item alignment and distribution
- Individual item column and row placement or span

For a **flex container**, users can configure:

- Direction: row, column, row-reverse, or column-reverse
- Wrapping behavior
- Horizontal and vertical alignment
- Space distribution between items
- Gap between items
- Individual item order, growth, shrink, and alignment

Changing a component's layout type should update the available controls immediately. Grid settings should appear only for grid layouts, flex settings only for flex layouts, and component-specific options only when the corresponding component is selected.

#### Nested Component Layering

Nested components use normal CSS painting order. A child naturally renders above its parent's background, so nesting does not assign or increment a numeric z-index.

All components default to `position: static` and `z-index: auto`. Dropping or moving a component preserves these values. The right panel includes **Position and Layer** controls for intentional overlaps, and **Reset layer** restores `z-index: auto`.

Eligible non-container leaves may also use responsive Position Offset X/Y controls and the selected-node Canvas position handle. This visual movement preserves the component's layout slot and may overlap siblings. Sections, Containers, Cards, Forms, and other child-capable wrappers remain restricted until the complete containing-block and stacking-context gate passes.

The editor's selection outlines, component labels, drag handles, and drop indicators render in a separate overlay layer so they remain visible without changing the saved page styles.

#### Nested Component Sizing

A card should use fluid width and content-based height by default in both root and nested contexts:

- Width uses **Fill**, which compiles to `width: 100%`
- Height uses **Auto**, which compiles to `height: auto`
- Maximum width is `100%`
- Minimum width is `0` so flex and grid children can shrink safely
- The parent's padding creates visible space around the nested card
- The nested component does not overflow its parent by default

Width and height are independent values. The inspector should offer **Fill**, **Fit**, **Auto**, **Fixed**, and **Reset sizing** where appropriate. The editor must not maintain a separate component-level auto/custom sizing flag.

Moving a component between the canvas root and another container must preserve its current dimensions. The editor should never silently replace a fixed value chosen by the user. **Reset sizing** restores the component's default Fill/Auto values. This makes nested cards naturally appear smaller through their parent's padding without requiring reparenting-specific sizing mutations.

#### Nested Drop Targeting and Selection

The editor should make both placing and selecting deeply nested components unambiguous.

When dragging a card over the canvas:

- Every container that can accept the card displays a highlighted inner drop zone.
- The active target uses a stronger outline and a label such as **Drop inside Card 2**.
- The highlight changes as the pointer moves between the outer card, an inner card, and the space between them.
- The card is inserted only into the target shown by the active highlight.
- Invalid targets are not highlighted and cannot accept the drop.

After cards are nested, users can select the intended card in several ways:

- Clicking the visible body of a card selects the deepest component under the pointer.
- Clicking exposed padding or empty space belonging to the outer card selects that outer card.
- A clickable breadcrumb shows the complete path, such as `Canvas > Card 1 > Card 2 > Button`; selecting any item in the path selects that component.
- A **Layers** tree shows all components and their nesting. Users can expand the tree, select a precise component, rename it, and reorder it.
- Pressing `Esc` moves the selection from the current component to its parent.
- `Ctrl+click` (`Cmd+click` on macOS) on overlapping components opens a small layer picker listing every component under the pointer.

The selected component should have a strong outline and name label, while its parent should use a lighter outline. The Layers tree, breadcrumb, canvas outline, and right-side inspector must always reflect the same current selection. Components should receive readable default names such as **Card 1** and **Card 2**, and users should be able to rename them for easier identification.

### Supporting Editor Controls

The three-panel layout should be supported by a compact top toolbar containing:

- Project and page selection
- Undo and redo
- Responsive viewport controls
- Preview
- Save status
- Publish

A small breadcrumb or layer path near the canvas can show the selected component's hierarchy, for example `Page > Section > Container > Button`. A separate layers view can be added later for selecting and reordering deeply nested components.

### Layout and Usability Guidelines

- Keep the canvas as the visual focus of the editor.
- Allow the left and right panels to collapse or resize.
- Make panel headers and editing controls consistent.
- Highlight selected components and valid drop locations clearly.
- Prevent accidental data loss with autosave and undo/redo history.
- Keep the first version focused on essential controls; advanced options can be revealed progressively.
