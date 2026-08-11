---
doc_id: WEB-BUILDER-PHASE-1-FOUNDATION-SUMMARY
type: D5
scope: Web builder Phase 1 component registry, renderer boundary, placement rules, responsive styles, and tests
authority: Derived report; Project.md owns architectural intent and the linked source and tests own implemented behavior
owner: Unassigned; accountable project owner required before promotion from draft
lifecycle: draft
freshness: Verified against the workspace source and test results on 2026-08-07; invalidated by changes to any linked implementation, test, or Project.md section
---

# Phase 1 foundation summary

Phase 1 establishes a static six-component registry, strict props schemas, pure semantic renderers, responsive style resolution and compilation, placement validation, and 19 tests.

Implementation source: [component-definitions.tsx](src/builder/registry/components/component-definitions.tsx)

## Component definitions

The notation below mirrors the implementation:

```ts
px(n) = { value: n, unit: "px" }

spacing(top, right, bottom, left) = {
  top: px(top),
  right: px(right),
  bottom: px(bottom),
  left: px(left)
}
```

| Component | Default props | Children | Prop inspector controls | Style capabilities |
| --- | --- | --- | --- | --- |
| Section | `{ semanticTag: "section", anchorId: "" }` | Container; accepts `"any"` registered type | Element: select; Anchor ID: text | sizing, spacing, background, border, layout, positioning |
| Container | `{ semanticTag: "div" }` | Container; accepts `"any"` registered type | Element: select | sizing, spacing, background, border, layout, positioning |
| Heading | `{ text: "Heading", level: "h2" }` | Leaf; no children | Text: text; Level: select | sizing, spacing, typography, positioning |
| Text | `{ text: "Text", semanticTag: "p" }` | Leaf; no children | Text: textarea; Element: select | sizing, spacing, typography, positioning |
| Card | `{ semanticTag: "article" }` | Container; accepts `"any"` registered type | Element: select | sizing, spacing, background, border, layout, positioning |
| Button | `{ text: "Button", href: "", openInNewTab: false }` | Leaf; no children | Text: text; Link: URL; Open in new tab: boolean | sizing, spacing, background, border, typography, positioning |

None of the six definitions declares `allowedParents`, so all six types may be placed at the page root. Parent-side rules still prevent placing children inside Heading, Text, or Button.

### Section

Default props:

```ts
{
  semanticTag: "section",
  anchorId: ""
}
```

Default responsive styles:

```ts
{
  base: {
    display: "block",
    width: { mode: "fill" },
    height: { mode: "auto" },
    padding: spacing(48, 24, 48, 24),
    backgroundColor: "transparent",
    position: "static",
    zIndex: "auto"
  }
  // tablet: absent
  // mobile: absent
}
```

Children rule:

```ts
{ allowed: true, accepts: "any" }
```

Inspector configuration:

- Props:
  - `semanticTag`: select with `section`, `header`, `main`, `footer`, and `aside`.
  - `anchorId`: text control. The value must be empty or a valid HTML identifier.
- Styles: `sizing`, `spacing`, `background`, `border`, `layout`, and `positioning`.

### Container

Default props:

```ts
{
  semanticTag: "div"
}
```

Default responsive styles:

```ts
{
  base: {
    display: "block",
    width: { mode: "fill" },
    height: { mode: "auto" },
    minWidth: px(0),
    maxWidth: { value: 72, unit: "rem" },
    margin: {
      top: px(0),
      right: { keyword: "auto" },
      bottom: px(0),
      left: { keyword: "auto" }
    },
    position: "static",
    zIndex: "auto"
  }
  // tablet: absent
  // mobile: absent
}
```

Children rule:

```ts
{ allowed: true, accepts: "any" }
```

Inspector configuration:

- Props:
  - `semanticTag`: select with `div`, `main`, `nav`, `header`, `footer`, and `aside`.
- Styles: `sizing`, `spacing`, `background`, `border`, `layout`, and `positioning`.

### Heading

Default props:

```ts
{
  text: "Heading",
  level: "h2"
}
```

Default responsive styles:

```ts
{
  base: {
    display: "block",
    width: { mode: "fill" },
    height: { mode: "auto" },
    color: "#0f172a",
    fontSize: px(32),
    fontWeight: 700,
    lineHeight: 1.2,
    position: "static",
    zIndex: "auto"
  }
  // tablet: absent
  // mobile: absent
}
```

Children rule:

```ts
{ allowed: false }
```

Inspector configuration:

- Props:
  - `text`: text control.
  - `level`: select with `h1` through `h6`.
- Styles: `sizing`, `spacing`, `typography`, and `positioning`.

### Text

Default props:

```ts
{
  text: "Text",
  semanticTag: "p"
}
```

Default responsive styles:

```ts
{
  base: {
    display: "block",
    width: { mode: "fill" },
    height: { mode: "auto" },
    color: "#475569",
    fontSize: px(16),
    fontWeight: 400,
    lineHeight: 1.6,
    position: "static",
    zIndex: "auto"
  }
  // tablet: absent
  // mobile: absent
}
```

Children rule:

```ts
{ allowed: false }
```

Inspector configuration:

- Props:
  - `text`: textarea control.
  - `semanticTag`: select with `p` and `span`.
- Styles: `sizing`, `spacing`, `typography`, and `positioning`.

### Card

Default props:

```ts
{
  semanticTag: "article"
}
```

Default responsive styles:

```ts
{
  base: {
    display: "flex",
    width: { mode: "fill" },
    height: { mode: "auto" },
    minWidth: px(0),
    maxWidth: { value: 100, unit: "%" },
    padding: spacing(24, 24, 24, 24),
    backgroundColor: "#ffffff",
    borderRadius: px(12),
    flex: {
      direction: "column",
      wrap: "nowrap",
      justifyContent: "flex-start",
      alignItems: "stretch",
      gap: px(16)
    },
    position: "static",
    zIndex: "auto"
  },
  tablet: {
    padding: spacing(20, 20, 20, 20)
  },
  mobile: {
    padding: spacing(16, 16, 16, 16)
  }
}
```

Children rule:

```ts
{ allowed: true, accepts: "any" }
```

Inspector configuration:

- Props:
  - `semanticTag`: select with `article`, `div`, and `aside`.
- Styles: `sizing`, `spacing`, `background`, `border`, `layout`, and `positioning`.

### Button

Default props:

```ts
{
  text: "Button",
  href: "",
  openInNewTab: false
}
```

Default responsive styles:

```ts
{
  base: {
    display: "block",
    width: { mode: "fit" },
    height: { mode: "auto" },
    padding: spacing(12, 20, 12, 20),
    backgroundColor: "#2563eb",
    color: "#ffffff",
    borderRadius: px(8),
    position: "static",
    zIndex: "auto"
  },
  mobile: {
    width: { mode: "fill" }
  }
  // tablet: absent
}
```

Children rule:

```ts
{ allowed: false }
```

Inspector configuration:

- Props:
  - `text`: text control.
  - `href`: URL control.
  - `openInNewTab`: boolean control.
- Styles: `sizing`, `spacing`, `background`, `border`, `typography`, and `positioning`.

Button rendering depends only on validated props:

- Empty `href`: renders `<button type="button">`.
- Non-empty `href`: renders `<a>`.
- New-tab links receive `target="_blank"` and `rel="noopener noreferrer"`.
- Accepted destinations are root-relative paths, fragments, HTTP(S), `mailto:`, and `tel:`.
- `javascript:` and similar schemes are rejected.
- `openInNewTab: true` is rejected when `href` is empty.

## Implemented `ComponentDefinition` contract

Source: [define-component-registry.ts](src/builder/registry/define-component-registry.ts)

```ts
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
  | "select";

type ComponentPropInspectorField<Props extends JsonObject> = {
  [Key in Extract<keyof Props, string>]: {
    path: Key;
    label: string;
    control: ComponentPropInspectorControl;
    options?: readonly {
      label: string;
      value: Props[Key];
    }[];
  };
}[Extract<keyof Props, string>];

type ComponentPropsInspectorConfig<Props extends JsonObject> =
  readonly ComponentPropInspectorField<Props>[];

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

The concrete catalog is:

```ts
export const componentRegistry = defineComponentRegistry({
  section: sectionDefinition,
  container: containerDefinition,
  heading: headingDefinition,
  text: textDefinition,
  card: cardDefinition,
  button: buttonDefinition,
});

export type ComponentType = keyof typeof componentRegistry;
```

## Implemented `canPlaceType`

Source: [component-registry.ts](src/builder/registry/component-registry.ts)

```ts
type PlacementDefinition = {
  allowedParents?: readonly ComponentType[];
  children:
    | { allowed: false }
    | {
        allowed: true;
        accepts: "any" | readonly ComponentType[];
      };
};

function includesComponentType(
  candidates: readonly string[],
  candidate: ComponentType,
): boolean {
  return candidates.includes(candidate);
}

export function canPlaceType(
  parentType: ComponentType | null,
  childType: ComponentType,
): boolean {
  const child = componentRegistry[childType] as PlacementDefinition;
  const { allowedParents } = child;

  if (parentType === null) {
    return allowedParents === undefined;
  }

  const parent = componentRegistry[parentType] as PlacementDefinition;

  if (!parent.children.allowed) {
    return false;
  }

  const parentAllowsChild =
    parent.children.accepts === "any" ||
    includesComponentType(parent.children.accepts, childType);

  const childAllowsParent =
    allowedParents === undefined ||
    includesComponentType(allowedParents, parentType);

  return parentAllowsChild && childAllowsParent;
}
```

Behaviorally, this matches the predicate in [Project.md](Project.md): root placement is governed by `allowedParents`, while nested placement must satisfy both parent- and child-side rules.

## Responsive resolution and CSS compilation example

Input:

```ts
const styles: ResponsiveStyles = {
  base: {
    display: "grid",
    padding: {
      top: px(24),
      right: px(24),
      bottom: px(24),
      left: px(24)
    },
    grid: {
      columns: 4,
      columnGap: px(24),
      rowGap: px(24),
      alignItems: "stretch"
    }
  },
  tablet: {
    padding: {
      right: px(16),
      left: px(16)
    },
    grid: {
      columns: 2
    }
  },
  mobile: {
    padding: {
      top: px(12),
      bottom: px(12)
    },
    grid: {
      rowGap: px(12)
    }
  }
};
```

Resolving for `mobile` applies `base -> tablet -> mobile`:

```ts
{
  display: "grid",
  padding: {
    top: px(12),
    right: px(16),
    bottom: px(12),
    left: px(16)
  },
  grid: {
    columns: 2,
    columnGap: px(24),
    rowGap: px(12),
    alignItems: "stretch"
  }
}
```

Compiled `React.CSSProperties`:

```ts
{
  display: "grid",
  paddingTop: "12px",
  paddingRight: "16px",
  paddingBottom: "12px",
  paddingLeft: "16px",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  columnGap: "24px",
  rowGap: "12px",
  alignItems: "stretch"
}
```

The compiler ignores retained flex configuration when `display` resolves to `grid`, and ignores retained grid configuration when it resolves to `flex`.

## Test inventory

All five test files passed in the verification run: 19 tests total.

- [component-registry.spec.tsx](src/builder/registry/__tests__/component-registry.spec.tsx) — 7 tests:
  - Registry contains exactly the six V1 primitives.
  - Every definition has schema-valid default props and version `1`.
  - Card renders one semantic root with children, class, style, and root ref.
  - Empty-destination Button renders a native button.
  - New-tab Button links receive safe target and relationship attributes.
  - Unsafe URL schemes and invalid empty-link state are rejected.
  - Root/container placement is accepted, while leaf-parent placement is rejected.

- [define-component-registry.spec.tsx](src/builder/registry/__tests__/define-component-registry.spec.tsx) — 5 tests:
  - Valid registries are accepted and the registry lookup is frozen.
  - Schema-invalid default props are rejected.
  - Unknown child placement references are rejected.
  - Duplicate style capabilities are rejected.
  - Incomplete migration paths are rejected.

- [resolve.spec.ts](src/builder/styles/__tests__/resolve.spec.ts) — 2 tests:
  - Base, tablet, and mobile layers cascade with side- and field-level merging.
  - Resolved objects are cloned without mutating persisted layers.

- [compile.spec.ts](src/builder/styles/__tests__/compile.spec.ts) — 2 tests:
  - Dimensions and active grid configuration compile correctly.
  - Active flex configuration compiles without leaking retained grid CSS.

- [schema.spec.ts](src/builder/styles/__tests__/schema.spec.ts) — 3 tests:
  - Complete base values and valid partial responsive patches are accepted.
  - Unknown fields and non-finite values are rejected.
  - Nested patches that cannot resolve into complete structured values are rejected.

## Conformance with `Project.md`

The implementation substantially matches the finalized architecture, but it does not match it exactly.

### Confirmed matches

- Registry keys are canonical component identities; definitions contain no duplicate `type`.
- The registry is static, explicit, typed, and not serializable project data.
- Props schemas are required, strict, non-defaulting, and non-coercing.
- Props and style defaults are required.
- `allowedParents` and migrations are optional.
- Leaf/container definitions use a discriminated children union.
- Leaf renderers cannot receive children; container renderers require a child slot.
- Renderers receive validated props and compiled `React.CSSProperties`, not builder-native style values.
- Renderers receive no mode, node ID, registry, parent data, Zustand state, or editor commands.
- Every renderer produces one semantic root and applies `className`, `style`, and `rootRef` to it.
- Button accessibility and safe-link semantics live in the renderer.
- Card uses the required Fill/Auto sizing with `minWidth: 0` and `maxWidth: 100%`.
- All components default to `position: static` and `zIndex: auto`.
- Responsive resolution follows the desktop-first `base -> tablet -> mobile` cascade.
- Spacing, grid, and flex patches merge by known subfield.
- Only the active grid or flex configuration compiles to CSS.
- `canPlaceType` applies both parent and child placement rules.

### Known mismatches or incomplete enforcement

1. **Defaults are not deeply immutable at runtime.**

   `Project.md` calls defaults immutable application-code templates. The implementation freezes only the outer registry object with `Object.freeze(registry)`. Nested definitions, props, styles, inspector arrays, and defaults remain mutable at runtime.

2. **Inspector option values are not fully validated during registry initialization.**

   TypeScript checks inspector paths and option value types for normal source code. Runtime initialization verifies that paths exist, controls are recognized, and paths and capabilities are not duplicated. It does not parse each inspector option value through the relevant props schema or require select-valid option arrays.

3. **Validator test coverage is representative rather than exhaustive.**

   The implementation contains checks for empty placement arrays, unknown parent references, invalid capabilities, invalid styles, non-positive versions, and broken or overlapping migrations, but the tests do not exercise every one of those rejection branches.

### Compatible implementation choices not prescribed as exact defaults

`Project.md` defines the architecture and includes a customized persisted-document example, but it does not declare that example's values as the catalog defaults. Therefore these are implementation choices, not direct architecture violations:

- Section defaults to 48/24 padding and a transparent background instead of the example Hero Section's responsive padding and `#f8fafc`.
- Container defaults to block layout instead of the example Hero Container's responsive grid.
- Heading defaults to 32px without responsive overrides instead of the example Hero Heading's 48/40/32px values.
- Button defaults to an empty `href`, producing a native button, instead of the example instance's `/builder` link.
- Button URL allowlisting and the empty-link/new-tab cross-field rule refine the documented semantic and security boundary without coupling the renderer to editor state.

## Verification evidence

The Phase 1 verification completed successfully on 2026-08-07:

| Check | Result |
| --- | --- |
| Vitest | 5 files passed; 19 tests passed |
| TypeScript | `pnpm typecheck` passed |
| ESLint | `pnpm lint` passed |
| Next.js production build | `pnpm build` passed |

The source code, tests, and [Project.md](Project.md) remain authoritative over this derived report.
