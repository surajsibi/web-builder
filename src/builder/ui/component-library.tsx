import { useMemo, useState } from "react";
import { useDraggable } from "@dnd-kit/react";

import type { EditorDragSource } from "@/builder/interaction/types";
import {
  blockRegistry,
  resolveBlockTemplate,
  type BlockType,
} from "@/builder/registry/block-registry";
import {
  BUTTON_PRESET_CATALOG,
  type ButtonPresetGroup,
} from "@/builder/registry/blocks/button-preset-blocks";
import { INPUT_PRESET_CATALOG } from "@/builder/registry/blocks/input-preset-blocks";
import {
  componentRegistry,
  type ComponentType,
} from "@/builder/registry/component-registry";
import {
  resolveComponentTemplate,
  type ResolvedComponentTemplate,
} from "@/builder/registry/define-block-registry";
import { ButtonContentIcon } from "@/builder/registry/components/button-icons";
import { PasswordVisibilityIcon } from "@/builder/registry/components/input-icons";
import { compileStyleValues } from "@/builder/styles/compile";
import { resolveResponsiveStyles } from "@/builder/styles/resolve";

type ComponentLibraryProps = {
  getComponentInsertionLabel: (type: ComponentType) => string;
  getBlockInsertionLabel: (type: BlockType) => string;
  onInsertComponent: (type: ComponentType) => void;
  onInsertBlock: (type: BlockType) => void;
};

type LibraryFamily =
  | "all"
  | "favorites"
  | "blocks"
  | "layout"
  | "typography"
  | "buttons"
  | "media"
  | "forms"
  | "navbar"
  | "navigation";

type FormControlGroup = "inputs" | "choices" | "forms";

type LibraryEntryBase = {
  id: string;
  label: string;
  category: string;
  family: Exclude<LibraryFamily, "all" | "favorites" | "blocks">;
  icon: React.ComponentType;
  searchTerms?: readonly string[];
  previewNode?: ResolvedComponentTemplate;
  presetGroup?: ButtonPresetGroup;
  presetKind?: "button" | "input";
  formControlGroup?: FormControlGroup;
  isPreset?: boolean;
};

type ComponentLibraryEntry = LibraryEntryBase & {
  kind: "component";
  componentType: ComponentType;
};

type BlockLibraryEntry = LibraryEntryBase & {
  kind: "block";
  blockType: BlockType;
};

type LibraryEntry = ComponentLibraryEntry | BlockLibraryEntry;

const COMPONENT_TYPES = Object.keys(componentRegistry) as ComponentType[];
const BUTTON_PRESET_TYPES = new Set<BlockType>(
  BUTTON_PRESET_CATALOG.map((preset) => preset.blockType as BlockType),
);
const INPUT_PRESET_TYPES = new Set<BlockType>(
  INPUT_PRESET_CATALOG.map((preset) => preset.blockType as BlockType),
);

const COMPONENT_FAMILY: Record<
  ComponentType,
  Exclude<LibraryFamily, "all" | "favorites" | "blocks">
> = {
  section: "layout",
  container: "layout",
  card: "layout",
  image: "media",
  heading: "typography",
  text: "typography",
  label: "forms",
  button: "buttons",
  form: "forms",
  input: "forms",
  textarea: "forms",
  dropdown: "forms",
  "radio-group": "forms",
  checkbox: "forms",
  "checkbox-group": "forms",
  link: "navigation",
};

const COMPONENT_ENTRIES: readonly ComponentLibraryEntry[] = COMPONENT_TYPES.map(
  (componentType) => {
    const definition = componentRegistry[componentType];
    const isButton = componentType === "button";
    const isInput = componentType === "input";
    return {
      id: `component:${componentType}`,
      kind: "component",
      componentType,
      label: isButton
        ? "Solid primary"
        : isInput
          ? "Standard input"
          : definition.library.label,
      category: definition.library.category,
      family: COMPONENT_FAMILY[componentType],
      icon: definition.library.icon,
      searchTerms:
        "searchTerms" in definition.library
          ? definition.library.searchTerms
          : undefined,
      ...((isButton || isInput) && {
        previewNode: resolveComponentTemplate({ type: componentType }),
        isPreset: true,
      }),
      ...(isButton && {
        presetGroup: "essential" as const,
        presetKind: "button" as const,
      }),
      ...(isInput && {
        presetKind: "input" as const,
      }),
      ...((componentType === "input" || componentType === "textarea") && {
        formControlGroup: "inputs" as const,
      }),
      ...((componentType === "dropdown" ||
        componentType === "radio-group" ||
        componentType === "checkbox" ||
        componentType === "checkbox-group") && {
        formControlGroup: "choices" as const,
      }),
      ...(componentType === "form" && {
        formControlGroup: "forms" as const,
      }),
      ...(componentType === "label" && {
        formControlGroup: "forms" as const,
      }),
    };
  },
);

const BUTTON_PRESET_ENTRIES: readonly BlockLibraryEntry[] =
  BUTTON_PRESET_CATALOG.map((preset) => {
    const blockType = preset.blockType as BlockType;
    return {
      id: `block:${blockType}`,
      kind: "block",
      blockType,
      label: blockRegistry[blockType].label,
      category: blockRegistry[blockType].category,
      family: "buttons",
      icon: blockRegistry[blockType].icon,
      previewNode: resolveBlockTemplate(blockType),
      presetGroup: preset.group,
      presetKind: "button",
      isPreset: true,
    };
  });

const INPUT_PRESET_ENTRIES: readonly BlockLibraryEntry[] =
  INPUT_PRESET_CATALOG.map((preset) => {
    const blockType = preset.blockType as BlockType;
    return {
      id: `block:${blockType}`,
      kind: "block",
      blockType,
      label: blockRegistry[blockType].label,
      category: blockRegistry[blockType].category,
      family: "forms",
      icon: blockRegistry[blockType].icon,
      previewNode: resolveBlockTemplate(blockType),
      presetKind: "input",
      formControlGroup: "inputs",
      isPreset: true,
    };
  });

const STRUCTURAL_BLOCK_ENTRIES: readonly BlockLibraryEntry[] = (
  Object.keys(blockRegistry) as BlockType[]
)
  .filter(
    (blockType) =>
      !BUTTON_PRESET_TYPES.has(blockType) && !INPUT_PRESET_TYPES.has(blockType),
  )
  .map((blockType) => {
    const definition = blockRegistry[blockType];
    return {
      id: `block:${blockType}`,
      kind: "block",
      blockType,
      label: definition.label,
      category: definition.category,
      family: definition.category === "Navigation" ? "navbar" : "layout",
      icon: definition.icon,
      previewNode: resolveBlockTemplate(blockType),
    };
  });

const LIBRARY_ENTRIES: readonly LibraryEntry[] = [
  ...COMPONENT_ENTRIES,
  ...STRUCTURAL_BLOCK_ENTRIES,
  ...INPUT_PRESET_ENTRIES,
  ...BUTTON_PRESET_ENTRIES,
];

const FAMILY_META: Record<LibraryFamily, { label: string; description: string; icon: string }> = {
  all: {
    label: "All components",
    description: "Browse primitives, presets, and ready-made blocks.",
    icon: "⊞",
  },
  favorites: {
    label: "Favorites",
    description: "Your saved components and visual presets.",
    icon: "☆",
  },
  blocks: {
    label: "Blocks",
    description: "Ready-made editable sections composed from components.",
    icon: "▤",
  },
  layout: {
    label: "Layout",
    description: "Build page structure with sections and containers.",
    icon: "▦",
  },
  typography: {
    label: "Typography",
    description: "Add headings and readable body copy.",
    icon: "T",
  },
  buttons: {
    label: "Buttons",
    description: "Choose a visual preset, then customize it.",
    icon: "▭",
  },
  media: {
    label: "Media",
    description: "Add images, logos, and visual assets.",
    icon: "▣",
  },
  forms: {
    label: "Forms",
    description: "Collect information with form controls.",
    icon: "☷",
  },
  navbar: {
    label: "Navbar",
    description: "Browse prebuilt navbar blocks and customize every component.",
    icon: "\u2630",
  },
  navigation: {
    label: "Navigation",
    description: "Help visitors move through the page and site.",
    icon: "↗",
  },
};

const FAMILY_ORDER: readonly LibraryFamily[] = [
  "all",
  "favorites",
  "blocks",
  "layout",
  "typography",
  "buttons",
  "media",
  "forms",
  "navbar",
  "navigation",
];

const BUTTON_FILTERS: readonly { value: "all" | ButtonPresetGroup; label: string }[] = [
  { value: "all", label: "All" },
  { value: "essential", label: "Essential" },
  { value: "animated", label: "Animated" },
  { value: "3d", label: "3D" },
  { value: "special", label: "Special" },
];

const FORM_FILTERS: readonly {
  value: "all" | FormControlGroup;
  label: string;
}[] = [
  { value: "all", label: "All" },
  { value: "inputs", label: "Inputs" },
  { value: "choices", label: "Choices" },
  { value: "forms", label: "Forms" },
];

function entryMatchesFamily(
  entry: LibraryEntry,
  family: LibraryFamily,
  favorites: ReadonlySet<string>,
): boolean {
  if (family === "all") return true;
  if (family === "favorites") return favorites.has(entry.id);
  if (family === "blocks") return entry.kind === "block" && !entry.isPreset;
  return entry.family === family;
}

function RenderedComponentPreview({
  node,
}: {
  node: ResolvedComponentTemplate;
}) {
  const style = compileStyleValues(
    resolveResponsiveStyles(node.styles, "desktop"),
  );

  if (node.type === "button") {
    const props = componentRegistry.button.propsSchema.parse(node.props);
    const icon =
      props.icon === null ? null : <ButtonContentIcon name={props.icon} />;

    return (
      <span
        aria-hidden="true"
        className="library-rendered-component"
        data-button-icon-animation={props.iconAnimation}
        style={style}
      >
        {props.iconPosition === "start" ? icon : null}
        <span>{props.text}</span>
        {props.iconPosition === "end" ? icon : null}
      </span>
    );
  }

  if (node.type === "input") {
    const props = componentRegistry.input.propsSchema.parse(node.props);
    const showsPasswordToggle =
      props.inputType === "password" && props.allowPasswordReveal;

    return (
      <span
        aria-hidden="true"
        className="library-rendered-component password-input-shell"
        style={style}
      >
        <span className="password-input-control">
          <span className="library-password-preview-copy">
            {props.placeholder || props.label}
          </span>
          {showsPasswordToggle ? (
            <span className="password-visibility-toggle">
              <PasswordVisibilityIcon visible={false} />
            </span>
          ) : null}
        </span>
      </span>
    );
  }

  if (node.type === "image") {
    const props = componentRegistry.image.propsSchema.parse(node.props);

    return (
      // Structural previews deliberately omit authored links so the library card stays valid.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        alt=""
        aria-hidden="true"
        className="library-rendered-component"
        data-preview-component="image"
        src={props.src}
        style={{ ...style, objectFit: props.fit }}
      />
    );
  }

  let content: React.ReactNode;
  switch (node.type) {
    case "heading":
      content = componentRegistry.heading.propsSchema.parse(node.props).text;
      break;
    case "text":
      content = componentRegistry.text.propsSchema.parse(node.props).text;
      break;
    case "label":
      content = componentRegistry.label.propsSchema.parse(node.props).text;
      break;
    case "link":
      content = componentRegistry.link.propsSchema.parse(node.props).text;
      break;
    case "textarea": {
      const props = componentRegistry.textarea.propsSchema.parse(node.props);
      content = props.defaultValue || props.placeholder || props.label;
      break;
    }
    case "dropdown": {
      const props = componentRegistry.dropdown.propsSchema.parse(node.props);
      content = props.defaultValue || props.placeholder || props.options[0];
      break;
    }
    case "radio-group":
      content = componentRegistry["radio-group"].propsSchema.parse(
        node.props,
      ).label;
      break;
    case "checkbox":
      content = componentRegistry.checkbox.propsSchema.parse(node.props).label;
      break;
    case "checkbox-group":
      content = componentRegistry["checkbox-group"].propsSchema.parse(
        node.props,
      ).label;
      break;
    default:
      content = node.children.map((child, index) => (
        <RenderedComponentPreview key={`${child.type}:${index}`} node={child} />
      ));
  }

  return (
    <span
      aria-hidden="true"
      className="library-rendered-component"
      data-preview-component={node.type}
      style={style}
    >
      {content}
    </span>
  );
}

function DraggableLibraryCard({
  entry,
  insertionLabel,
  favorite,
  onFavoriteChange,
  onInsertComponent,
  onInsertBlock,
}: {
  entry: LibraryEntry;
  insertionLabel: string;
  favorite: boolean;
  onFavoriteChange: (entryId: string) => void;
  onInsertComponent: (type: ComponentType) => void;
  onInsertBlock: (type: BlockType) => void;
}) {
  const source: EditorDragSource =
    entry.kind === "component"
      ? { kind: "component", componentType: entry.componentType }
      : { kind: "block", blockType: entry.blockType };
  const { ref, isDragging } = useDraggable({
    id:
      entry.kind === "component"
        ? `drag:component:${entry.componentType}`
        : `drag:block:${entry.blockType}`,
    data: { editorSource: source },
  });
  const Icon = entry.icon;
  const hasRenderedPreview = entry.previewNode !== undefined;
  const isStructuralBlock = entry.kind === "block" && !entry.isPreset;
  const insertionName =
    entry.kind === "component" && entry.componentType === "button"
      ? "Button"
      : entry.kind === "component" && entry.componentType === "input"
        ? "Input"
        : entry.kind === "block" && entry.presetKind === "button"
          ? `${entry.label} button`
          : entry.kind === "block" && entry.presetKind === "input"
            ? `${entry.label} input`
            : entry.kind === "block"
              ? `${entry.label} block`
              : entry.label;

  return (
    <article
      className={[
        "library-card",
        isDragging ? "is-dragging" : "",
        isStructuralBlock ? "is-structural-block" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <button
        aria-label={favorite ? `Unfavorite ${entry.label}` : `Favorite ${entry.label}`}
        aria-pressed={favorite}
        className="library-favorite"
        onClick={() => onFavoriteChange(entry.id)}
        type="button"
      >
        <span aria-hidden="true">★</span>
      </button>
      <button
        aria-label={`Add ${insertionName}`}
        className="library-card-action"
        onClick={() =>
          entry.kind === "component"
            ? onInsertComponent(entry.componentType)
            : onInsertBlock(entry.blockType)
        }
        ref={ref}
        type="button"
      >
        <span
          className={
            hasRenderedPreview
              ? `library-card-preview component-preview-surface${
                  isStructuralBlock ? " is-structural-block-preview" : ""
                }`
              : "library-card-preview"
          }
        >
          {entry.previewNode ? (
            <span
              className={
                isStructuralBlock
                  ? "library-rendered-block-scale"
                  : "library-rendered-component-scale"
              }
            >
              <RenderedComponentPreview node={entry.previewNode} />
            </span>
          ) : (
            <span aria-hidden="true" className="library-preview-icon">
              <Icon />
            </span>
          )}
        </span>
        <span className="library-card-copy">
          <span className="library-card-title">{entry.label}</span>
          <span className="library-card-meta">
            {entry.presetGroup ? (
              <span className={`library-preset-tag is-${entry.presetGroup}`}>
                {entry.presetGroup === "3d"
                  ? "3D"
                  : entry.presetGroup[0].toUpperCase() + entry.presetGroup.slice(1)}
              </span>
            ) : entry.presetKind ? (
              <span>
                {entry.presetKind[0].toUpperCase() + entry.presetKind.slice(1)}
              </span>
            ) : (
              <span>{entry.kind === "block" ? "Block" : entry.category}</span>
            )}
            <span title={insertionLabel}>{insertionLabel}</span>
          </span>
        </span>
      </button>
    </article>
  );
}

export function ComponentLibrary({
  getComponentInsertionLabel,
  getBlockInsertionLabel,
  onInsertComponent,
  onInsertBlock,
}: ComponentLibraryProps) {
  const [family, setFamily] = useState<LibraryFamily>("all");
  const [buttonFilter, setButtonFilter] = useState<"all" | ButtonPresetGroup>("all");
  const [formFilter, setFormFilter] = useState<"all" | FormControlGroup>("all");
  const [query, setQuery] = useState("");
  const [favorites, setFavorites] = useState<ReadonlySet<string>>(
    () => new Set(["component:button", "block:button-raised-3d"]),
  );

  const visibleEntries = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return LIBRARY_ENTRIES.filter((entry) => {
      if (!entryMatchesFamily(entry, family, favorites)) return false;
      if (
        family === "buttons" &&
        buttonFilter !== "all" &&
        entry.presetGroup !== buttonFilter
      ) {
        return false;
      }
      if (
        family === "forms" &&
        formFilter !== "all" &&
        entry.formControlGroup !== formFilter
      ) {
        return false;
      }
      if (normalizedQuery === "") return true;
      return `${entry.label} ${entry.category} ${entry.family} ${entry.presetGroup ?? ""} ${entry.searchTerms?.join(" ") ?? ""}`
        .toLowerCase()
        .includes(normalizedQuery);
    });
  }, [buttonFilter, family, favorites, formFilter, query]);

  const toggleFavorite = (entryId: string) => {
    setFavorites((current) => {
      const next = new Set(current);
      if (next.has(entryId)) next.delete(entryId);
      else next.add(entryId);
      return next;
    });
  };

  const selectFamily = (nextFamily: LibraryFamily) => {
    setFamily(nextFamily);
    setButtonFilter("all");
    setFormFilter("all");
  };

  const familyCount = (targetFamily: LibraryFamily) => {
    if (targetFamily === "favorites") return favorites.size;
    return LIBRARY_ENTRIES.filter((entry) =>
      entryMatchesFamily(entry, targetFamily, favorites),
    ).length;
  };

  return (
    <div aria-labelledby="component-library-title" className="component-browser">
      <header className="component-browser-header">
        <div className="panel-heading">
          <div>
            <p className="panel-eyebrow">Insert</p>
            <h2 id="component-library-title">Components</h2>
          </div>
          <span className="panel-count">{LIBRARY_ENTRIES.length}</span>
        </div>
        <div className="component-search">
          <span aria-hidden="true">⌕</span>
          <label className="component-search-label" htmlFor="component-library-search">
            Search components
          </label>
          <input
            id="component-library-search"
            onChange={(event) => setQuery(event.currentTarget.value)}
            placeholder="Search buttons, 3D, forms…"
            type="search"
            value={query}
          />
          {query !== "" ? (
            <button
              aria-label="Clear component search"
              className="component-search-clear"
              onClick={() => setQuery("")}
              type="button"
            >
              <span aria-hidden="true">×</span>
            </button>
          ) : null}
        </div>
      </header>

      <div className="component-browser-body">
        <nav aria-label="Component families" className="component-family-sidebar">
          <p>Library</p>
          {FAMILY_ORDER.map((item) => {
            const meta = FAMILY_META[item];
            return (
              <button
                aria-pressed={family === item}
                className={family === item ? "component-family active" : "component-family"}
                key={item}
                onClick={() => selectFamily(item)}
                type="button"
              >
                <span aria-hidden="true" className="component-family-icon">{meta.icon}</span>
                <span>{meta.label}</span>
                <span className="component-family-count">{familyCount(item)}</span>
              </button>
            );
          })}
        </nav>

        <section aria-labelledby="component-family-title" className="component-family-results">
          <div className="component-family-heading">
            <div>
              <h3 id="component-family-title">{FAMILY_META[family].label}</h3>
              <p>{FAMILY_META[family].description}</p>
            </div>
            <span aria-atomic="true" aria-live="polite">
              {visibleEntries.length} shown
            </span>
          </div>

          {family === "buttons" ? (
            <>
              <div className="component-family-note">
                <strong>One component, many looks.</strong>
                <span>Every preset creates the same editable Button component.</span>
              </div>
              <div
                aria-label="Button style filters"
                className="component-filter-row"
                role="group"
              >
                {BUTTON_FILTERS.map((filter) => (
                  <button
                    aria-pressed={buttonFilter === filter.value}
                    key={filter.value}
                    onClick={() => setButtonFilter(filter.value)}
                    type="button"
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </>
          ) : null}

          {family === "forms" ? (
            <>
              <div className="component-family-note">
                <strong>Native controls, editable behavior.</strong>
                <span>
                  Build forms with inputs, choices, and semantic containers.
                </span>
              </div>
              <div
                aria-label="Form component filters"
                className="component-filter-row"
                role="group"
              >
                {FORM_FILTERS.map((filter) => (
                  <button
                    aria-pressed={formFilter === filter.value}
                    key={filter.value}
                    onClick={() => setFormFilter(filter.value)}
                    type="button"
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </>
          ) : null}

          {visibleEntries.length > 0 ? (
            <div className="component-card-grid">
              {visibleEntries.map((entry) => (
                <DraggableLibraryCard
                  entry={entry}
                  favorite={favorites.has(entry.id)}
                  insertionLabel={
                    entry.kind === "component"
                      ? getComponentInsertionLabel(entry.componentType)
                      : getBlockInsertionLabel(entry.blockType)
                  }
                  key={entry.id}
                  onFavoriteChange={toggleFavorite}
                  onInsertBlock={onInsertBlock}
                  onInsertComponent={onInsertComponent}
                />
              ))}
            </div>
          ) : (
            <div className="component-empty-state">
              <strong>No matching components</strong>
              <span>Try another family, style, or search term.</span>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
