import { useState, type ReactNode } from "react";

import type { StyleChange } from "@/builder/commands/types";
import { asNodeId } from "@/builder/model/ids";
import type { JsonObject, JsonValue } from "@/builder/model/json";
import type {
  BuilderNode,
  PageDocument,
  ProjectDocument,
} from "@/builder/model/project-document";
import type { BooleanStateBinding } from "@/builder/model/state-binding";
import {
  listNodeReferenceCandidates,
  resolveNodeReference,
} from "@/builder/project/node-references";
import {
  componentRegistry,
  referencesForComponentType,
} from "@/builder/registry/component-registry";
import { resolveResponsiveStyles } from "@/builder/styles/resolve";
import { isSafeBackgroundImageSource } from "@/builder/styles/schema";
import type {
  BackgroundImageValue,
  BoxShadowValue,
  BorderStyle,
  BorderWidthUnit,
  BorderWidthValue,
  DimensionUnit,
  DimensionValue,
  EffectLengthValue,
  EffectUnit,
  LengthValue,
  LinearGradientValue,
  SpacingValue,
  StyleValues,
  TextDecoration,
  Viewport,
} from "@/builder/styles/types";
import {
  DEFAULT_FLEX_CONFIG,
  DEFAULT_GRID_CONFIG,
  INSPECTOR_UNITS,
  layoutModeStyleChanges,
  spacingSidesForMode,
  spacingStyleChanges,
  type InspectorUnit,
  type SpacingMode,
  type SpacingProperty,
  type SpacingSide,
  type VisualOverlayMode,
} from "@/builder/ui/visual-editing";

type InspectorPanelProps = {
  document: Readonly<ProjectDocument>;
  page: Readonly<PageDocument>;
  node: Readonly<BuilderNode> | null;
  isRoot: boolean;
  viewport: Viewport;
  visualMode: VisualOverlayMode;
  spacingModes: Readonly<Record<SpacingProperty, SpacingMode>>;
  onVisualModeChange: (mode: VisualOverlayMode) => void;
  onSpacingModeChange: (property: SpacingProperty, mode: SpacingMode) => void;
  onDelete: () => void;
  onRename: (name: string) => void;
  onUpdateProps: (nextProps: JsonObject) => void;
  onUpdateStateBinding: (binding: BooleanStateBinding | null) => void;
  onCreateStateAndConnect: (name: string, defaultValue: boolean) => void;
  onUpdateStyles: (changes: readonly [StyleChange, ...StyleChange[]]) => void;
};

type DimensionProperty = "width" | "height";

const ZERO_SPACING_VALUE: LengthValue = { value: 0, unit: "px" };
const DEFAULT_BORDER_WIDTH: BorderWidthValue = { value: 0, unit: "px" };
const DEFAULT_BORDER_COLOR = "#000000";
const BORDER_WIDTH_UNITS: readonly BorderWidthUnit[] = ["px", "rem", "em"];
const BORDER_STYLE_OPTIONS: readonly { label: string; value: BorderStyle }[] = [
  { label: "None", value: "none" },
  { label: "Solid", value: "solid" },
  { label: "Dashed", value: "dashed" },
  { label: "Dotted", value: "dotted" },
];
const EFFECT_UNITS: readonly EffectUnit[] = ["px", "rem", "em"];
const MAX_BOX_SHADOWS = 4;
const DEFAULT_BOX_SHADOW: BoxShadowValue = {
  offsetX: 0,
  offsetY: 8,
  blurRadius: 24,
  spreadRadius: 0,
  unit: "px",
  color: "#0f172a26",
  inset: false,
};
const DEFAULT_BACKDROP_BLUR: EffectLengthValue = { value: 0, unit: "px" };
type ActiveBackgroundImage = Extract<
  BackgroundImageValue,
  { kind: "image" }
>;
const DEFAULT_BACKGROUND_IMAGE: ActiveBackgroundImage = {
  kind: "image",
  source: "",
  size: "cover",
  positionX: "center",
  positionY: "center",
  repeat: "no-repeat",
};
const DEFAULT_LINEAR_GRADIENT: LinearGradientValue = {
  kind: "linear-gradient",
  angle: 135,
  startColor: "#7c3aed",
  endColor: "#2563eb",
};
const DEFAULT_FONT_FAMILY =
  'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
const FONT_FAMILY_OPTIONS: readonly { label: string; value: string }[] = [
  { label: "Inter", value: DEFAULT_FONT_FAMILY },
  {
    label: "System UI",
    value:
      'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  { label: "Arial", value: "Arial, Helvetica, sans-serif" },
  { label: "Georgia", value: 'Georgia, "Times New Roman", serif' },
  {
    label: "Times New Roman",
    value: '"Times New Roman", Times, serif',
  },
  { label: "Verdana", value: "Verdana, Geneva, sans-serif" },
  {
    label: "Trebuchet MS",
    value: '"Trebuchet MS", Arial, sans-serif',
  },
  {
    label: "Courier New",
    value: '"Courier New", Courier, monospace',
  },
];
const TEXT_DECORATION_OPTIONS: readonly {
  label: string;
  value: TextDecoration;
}[] = [
  { label: "None", value: "none" },
  { label: "Underline", value: "underline" },
  { label: "Overline", value: "overline" },
  { label: "Line through", value: "line-through" },
];

type PropField = {
  path: string;
  label: string;
  control:
    | "text"
    | "textarea"
    | "url"
    | "boolean"
    | "number"
    | "select"
    | "node-reference"
    | "string-list"
    | "string-multi-select";
  optionsPath?: string;
  options?: readonly { label: string; value: JsonValue }[];
};

type NodeReferenceControlData = {
  invalid: boolean;
  message?: string;
  options: readonly { label: string; value: string }[];
};

function titleCase(value: string): string {
  return value.replace(/([A-Z])/g, " $1").replace(/^./, (letter) => letter.toUpperCase());
}

function asStringArray(value: JsonValue | undefined): readonly string[] | undefined {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : undefined;
}

function fontFamilyOptions(
  currentValue: string,
): readonly { label: string; value: string }[] {
  if (FONT_FAMILY_OPTIONS.some((option) => option.value === currentValue)) {
    return FONT_FAMILY_OPTIONS;
  }

  return [{ label: currentValue, value: currentValue }, ...FONT_FAMILY_OPTIONS];
}

function isSupportedUnit(value: string): value is InspectorUnit {
  return (INSPECTOR_UNITS as readonly string[]).includes(value);
}

function InspectorGroup({
  title,
  children,
  suffix,
}: {
  title: string;
  children: ReactNode;
  suffix?: ReactNode;
}) {
  return (
    <details className="inspector-section inspector-disclosure">
      <summary>
        <span>{title}</span>
        {suffix}
      </summary>
      <div className="inspector-group-content">{children}</div>
    </details>
  );
}

function NodeNameDraft({
  disabled,
  name,
  onCommit,
}: {
  disabled: boolean;
  name: string;
  onCommit: (name: string) => void;
}) {
  const [draft, setDraft] = useState(name);

  const commitDraft = () => {
    const nextName = draft.trim();
    if (nextName === "" || nextName === name) {
      setDraft(name);
      return;
    }
    onCommit(nextName);
  };

  return (
    <input
      aria-label="Component name"
      className="node-name-input"
      disabled={disabled}
      onBlur={commitDraft}
      onChange={(event) => setDraft(event.currentTarget.value)}
      onKeyDown={(event) => {
        if (event.key !== "Enter") return;
        event.preventDefault();
        event.currentTarget.blur();
      }}
      type="text"
      value={draft}
    />
  );
}

function NumberDraft({
  label,
  value,
  disabled,
  min,
  max,
  step = "any",
  commitOnChange = false,
  onCommit,
}: {
  label: string;
  value: number | undefined;
  disabled: boolean;
  min?: number;
  max?: number;
  step?: number | "any";
  commitOnChange?: boolean;
  onCommit: (value: number) => void;
}) {
  const [draft, setDraft] = useState(value === undefined ? "" : String(value));
  const [previousValue, setPreviousValue] = useState(value);
  if (value !== previousValue) {
    setPreviousValue(value);
    setDraft(value === undefined ? "" : String(value));
  }

  const commitDraft = (nextDraft: string) => {
    if (nextDraft === "") return;
    const next = Number(nextDraft);
    if (Number.isFinite(next) && next !== value) onCommit(next);
  };

  return (
    <input
      aria-label={label}
      disabled={disabled}
      inputMode="decimal"
      max={max}
      min={min}
      onBlur={() => commitDraft(draft)}
      onChange={(event) => {
        const nextDraft = event.currentTarget.value;
        setDraft(nextDraft);
        if (commitOnChange) commitDraft(nextDraft);
      }}
      step={step}
      type="number"
      value={draft}
    />
  );
}

function RemoveOptionIcon() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      height="14"
      viewBox="0 0 16 16"
      width="14"
    >
      <path
        d="M3.5 4.5h9M6 4.5V3.25h4V4.5m1.5 0-.5 8.25h-6L4.5 4.5M6.75 7v3.5M9.25 7v3.5"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.25"
      />
    </svg>
  );
}

function StringListDraftControl({
  label,
  value,
  disabled,
  onCommit,
}: {
  label: string;
  value: readonly string[];
  disabled: boolean;
  onCommit: (value: string[]) => void;
}) {
  const [drafts, setDrafts] = useState<string[]>(
    value.length > 0 ? [...value] : [""],
  );
  const [error, setError] = useState<string | null>(null);

  const commitDrafts = (nextDrafts: readonly string[]) => {
    const next = nextDrafts
      .map((option) => option.trim())
      .filter((option) => option !== "");

    if (next.length === 0) {
      setDrafts([...value]);
      setError("At least one option is required.");
      return;
    }

    if (new Set(next).size !== next.length) {
      setError("Option labels must be unique.");
      return;
    }

    setDrafts(next);
    setError(null);
    if (JSON.stringify(next) !== JSON.stringify(value)) onCommit(next);
  };

  return (
    <div className="inspector-field inspector-string-list-field">
      <span>{label}</span>
      <div aria-label={label} className="inspector-string-list" role="group">
        {drafts.map((draft, index) => (
          <div className="inspector-string-list-row" key={index}>
            <input
              aria-invalid={error !== null}
              aria-label={`Option ${index + 1}`}
              disabled={disabled}
              onBlur={(event) => {
                const nextTarget = event.relatedTarget;
                if (
                  nextTarget instanceof HTMLElement &&
                  nextTarget.closest("[data-string-list-action]")
                ) {
                  return;
                }
                commitDrafts(drafts);
              }}
              onChange={(event) => {
                const nextDrafts = [...drafts];
                nextDrafts[index] = event.currentTarget.value;
                setDrafts(nextDrafts);
                setError(null);
              }}
              onKeyDown={(event) => {
                if (event.key !== "Enter") return;
                event.preventDefault();
                event.currentTarget.blur();
              }}
              type="text"
              value={draft}
            />
            <button
              aria-label={`Remove option ${index + 1}`}
              className="inspector-string-list-remove"
              data-string-list-action
              disabled={disabled || drafts.length === 1}
              onClick={() => {
                const nextDrafts = drafts.filter(
                  (_option, optionIndex) => optionIndex !== index,
                );
                commitDrafts(nextDrafts);
              }}
              title={`Remove option ${index + 1}`}
              type="button"
            >
              <RemoveOptionIcon />
            </button>
          </div>
        ))}
      </div>
      {error ? (
        <p className="inspector-field-error" role="alert">
          {error}
        </p>
      ) : null}
      <button
        className="inspector-string-list-add"
        data-string-list-action
        disabled={disabled || drafts.some((option) => option.trim() === "")}
        onClick={() => {
          setDrafts([...drafts, ""]);
          setError(null);
        }}
        type="button"
      >
        <span aria-hidden="true">+</span>
        Add option
      </button>
    </div>
  );
}

function StringMultiSelectControl({
  label,
  value,
  options,
  disabled,
  onCommit,
}: {
  label: string;
  value: readonly string[];
  options: readonly string[];
  disabled: boolean;
  onCommit: (value: string[]) => void;
}) {
  const selectedValues = new Set(value);

  return (
    <fieldset className="inspector-multi-select-field">
      <legend>{label}</legend>
      <div className="inspector-multi-select-options">
        {options.map((option) => (
          <label
            className="inspector-check-field inspector-multi-select-option"
            key={option}
          >
            <input
              aria-label={`${label}: ${option}`}
              checked={selectedValues.has(option)}
              disabled={disabled}
              onChange={(event) => {
                const next = event.currentTarget.checked
                  ? options.filter(
                      (candidate) =>
                        candidate === option || selectedValues.has(candidate),
                    )
                  : value.filter((selected) => selected !== option);
                onCommit(next);
              }}
              type="checkbox"
            />
            <span>{option}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function NodeReferenceControl({
  data,
  disabled,
  label,
  onCommit,
  value,
}: {
  data: NodeReferenceControlData;
  disabled: boolean;
  label: string;
  onCommit: (value: string) => void;
  value: string;
}) {
  return (
    <label className="inspector-field">
      <span>{label}</span>
      <select
        aria-invalid={data.invalid || undefined}
        aria-label={label}
        disabled={disabled}
        onChange={(event) => onCommit(event.currentTarget.value)}
        value={value}
      >
        {data.options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {data.message ? (
        <span
          className={
            data.invalid ? "inspector-field-error" : "inspector-help"
          }
          role={data.invalid ? "alert" : undefined}
        >
          {data.message}
        </span>
      ) : null}
    </label>
  );
}

function PropDraftControl({
  field,
  value,
  dependentOptions,
  nodeReference,
  disabled,
  onCommit,
}: {
  field: PropField;
  value: JsonValue;
  dependentOptions?: readonly string[];
  nodeReference?: NodeReferenceControlData;
  disabled: boolean;
  onCommit: (value: JsonValue) => void;
}) {
  const accessibleLabel = field.path === "text" ? "Text content" : field.label;
  const visibleLabel = field.path === "text" ? "Text content" : field.label;
  const [draft, setDraft] = useState(
    typeof value === "string" || typeof value === "number" ? String(value) : "",
  );

  if (field.control === "boolean") {
    return (
      <label className="inspector-check-field">
        <input
          aria-label={accessibleLabel}
          checked={value === true}
          disabled={disabled}
          onChange={(event) => onCommit(event.currentTarget.checked)}
          type="checkbox"
        />
        <span>{field.label}</span>
      </label>
    );
  }

  if (field.control === "select") {
    return (
      <label className="inspector-field">
        <span>{field.label}</span>
        <select
          aria-label={accessibleLabel}
          disabled={disabled}
          onChange={(event) => {
            const option = field.options?.find(
              (candidate) => String(candidate.value) === event.currentTarget.value,
            );
            if (option) onCommit(option.value);
          }}
          value={String(value)}
        >
          {field.options?.map((option) => (
            <option key={String(option.value)} value={String(option.value)}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    );
  }

  if (field.control === "node-reference") {
    return (
      <NodeReferenceControl
        data={
          nodeReference ?? {
            invalid: true,
            message: "Reference metadata is unavailable.",
            options: [{ label: "Unavailable", value: String(value) }],
          }
        }
        disabled={disabled}
        label={visibleLabel}
        onCommit={onCommit}
        value={typeof value === "string" ? value : ""}
      />
    );
  }

  if (field.control === "string-list") {
    const options = Array.isArray(value)
      ? value.filter((item): item is string => typeof item === "string")
      : [];

    return (
      <StringListDraftControl
        disabled={disabled}
        label={visibleLabel}
        onCommit={onCommit}
        value={options}
      />
    );
  }

  if (field.control === "string-multi-select") {
    const selectedValues = Array.isArray(value)
      ? value.filter((item): item is string => typeof item === "string")
      : [];

    return (
      <StringMultiSelectControl
        disabled={disabled}
        label={visibleLabel}
        onCommit={onCommit}
        options={dependentOptions ?? []}
        value={selectedValues}
      />
    );
  }

  const commitDraft = () => {
    if (field.control === "number") {
      const next = Number(draft);
      if (Number.isFinite(next) && next !== value) onCommit(next);
      return;
    }
    if (draft !== value) onCommit(draft);
  };

  return (
    <label className="inspector-field">
      <span>{visibleLabel}</span>
      {field.path === "text" || field.control === "textarea" ? (
        <textarea
          aria-label={accessibleLabel}
          disabled={disabled}
          onBlur={commitDraft}
          onChange={(event) => setDraft(event.currentTarget.value)}
          rows={3}
          value={draft}
        />
      ) : (
        <input
          aria-label={accessibleLabel}
          disabled={disabled}
          inputMode={field.control === "number" ? "decimal" : undefined}
          onBlur={commitDraft}
          onChange={(event) => setDraft(event.currentTarget.value)}
          type={field.control === "url" ? "url" : field.control === "number" ? "number" : "text"}
          value={draft}
        />
      )}
    </label>
  );
}

function fixedDimension(
  property: DimensionProperty,
  current: DimensionValue | undefined,
): Extract<DimensionValue, { mode: "fixed" }> {
  if (current?.mode === "fixed") return current;
  return {
    mode: "fixed",
    value: property === "width" ? 320 : 180,
    unit: "px",
  };
}

function UnitSelect({
  label,
  unit,
  disabled,
  onChange,
}: {
  label: string;
  unit: DimensionUnit;
  disabled: boolean;
  onChange: (unit: InspectorUnit) => void;
}) {
  const legacyUnit = !isSupportedUnit(unit) ? unit : null;
  return (
    <select
      aria-label={`${label} unit`}
      disabled={disabled}
      onChange={(event) => onChange(event.currentTarget.value as InspectorUnit)}
      value={unit}
    >
      {legacyUnit ? (
        <option disabled value={legacyUnit}>{legacyUnit} (existing)</option>
      ) : null}
      {INSPECTOR_UNITS.map((candidate) => (
        <option key={candidate} value={candidate}>{candidate}</option>
      ))}
    </select>
  );
}

function DimensionControl({
  property,
  value,
  disabled,
  isRoot,
  onChange,
}: {
  property: DimensionProperty;
  value: DimensionValue | undefined;
  disabled: boolean;
  isRoot: boolean;
  onChange: (change: StyleChange) => void;
}) {
  const label = titleCase(property);
  const mode = value?.mode ?? "auto";
  const fixed = fixedDimension(property, value);
  return (
    <div className="dimension-control">
      <label className="inspector-field">
        <span>{label}</span>
        <select
          aria-label={label}
          disabled={disabled}
          onChange={(event) => {
            const nextMode = event.currentTarget.value as DimensionValue["mode"];
            const nextValue: DimensionValue =
              nextMode === "fixed" ? fixed : { mode: nextMode };
            onChange({ target: { property }, value: nextValue });
          }}
          value={mode}
        >
          <option value="fill">
            {isRoot ? "Fill page" : "Fill parent"}
          </option>
          {isRoot && property === "height" ? (
            <option value="viewport">Fill viewport</option>
          ) : null}
          <option value="fit">Fit</option>
          <option value="auto">Auto</option>
          <option value="fixed">Fixed</option>
        </select>
      </label>
      {mode === "fixed" ? (
        <label className="inspector-field compact">
          <span>{label} value</span>
          <div className="value-with-select">
            <NumberDraft
              disabled={disabled || !isSupportedUnit(fixed.unit)}
              key={`${property}:${fixed.value}:${fixed.unit}`}
              label={`${label} value`}
              min={0}
              onCommit={(number) =>
                onChange({
                  target: { property },
                  value: { mode: "fixed", value: Math.max(0, number), unit: fixed.unit },
                })
              }
              value={fixed.value}
            />
            <UnitSelect
              disabled={disabled}
              label={label}
              onChange={(unit) =>
                onChange({
                  target: { property },
                  value: { mode: "fixed", value: fixed.value, unit },
                })
              }
              unit={fixed.unit}
            />
          </div>
        </label>
      ) : null}
    </div>
  );
}

function LengthControl({
  label,
  value,
  disabled,
  allowAuto = false,
  allowContentKeywords = false,
  commitOnChange = false,
  min,
  onCommit,
}: {
  label: string;
  value: LengthValue | undefined;
  disabled: boolean;
  allowAuto?: boolean;
  allowContentKeywords?: boolean;
  commitOnChange?: boolean;
  min?: number;
  onCommit: (value: LengthValue) => void;
}) {
  const numeric = value && "value" in value ? value : { value: 0, unit: "px" as const };
  const mode = value && "keyword" in value ? value.keyword : numeric.unit;
  const legacyUnit = "value" in numeric && !isSupportedUnit(numeric.unit) ? numeric.unit : null;
  return (
    <label className="inspector-field compact">
      <span>{label}</span>
      <div className="value-with-select">
        <NumberDraft
          commitOnChange={commitOnChange}
          disabled={disabled || (value !== undefined && "keyword" in value) || Boolean(legacyUnit)}
          label={label}
          min={min}
          onCommit={(number) => onCommit({ value: min === undefined ? number : Math.max(min, number), unit: numeric.unit })}
          value={value && "value" in value ? value.value : undefined}
        />
        <select
          aria-label={`${label} unit`}
          disabled={disabled}
          onChange={(event) => {
            const next = event.currentTarget.value;
            if (isSupportedUnit(next)) onCommit({ value: numeric.value, unit: next });
            else onCommit({ keyword: next as Extract<LengthValue, { keyword: string }>["keyword"] });
          }}
          value={mode}
        >
          {legacyUnit ? <option disabled value={legacyUnit}>{legacyUnit} (existing)</option> : null}
          {INSPECTOR_UNITS.map((unit) => <option key={unit} value={unit}>{unit}</option>)}
          {allowAuto ? <option value="auto">auto</option> : null}
          {allowContentKeywords ? (
            <>
              <option value="fit-content">fit-content</option>
              <option value="max-content">max-content</option>
              <option value="min-content">min-content</option>
            </>
          ) : null}
        </select>
      </div>
    </label>
  );
}

function BorderWidthControl({
  value,
  disabled,
  onCommit,
}: {
  value: BorderWidthValue | undefined;
  disabled: boolean;
  onCommit: (value: BorderWidthValue) => void;
}) {
  const width = value ?? DEFAULT_BORDER_WIDTH;

  return (
    <label className="inspector-field compact">
      <span>Border width</span>
      <div className="value-with-select">
        <NumberDraft
          disabled={disabled}
          label="Border width"
          min={0}
          onCommit={(number) =>
            onCommit({ value: Math.max(0, number), unit: width.unit })
          }
          value={width.value}
        />
        <select
          aria-label="Border width unit"
          disabled={disabled}
          onChange={(event) =>
            onCommit({
              value: width.value,
              unit: event.currentTarget.value as BorderWidthUnit,
            })
          }
          value={width.unit}
        >
          {BORDER_WIDTH_UNITS.map((unit) => (
            <option key={unit} value={unit}>{unit}</option>
          ))}
        </select>
      </div>
    </label>
  );
}

function BackgroundImageControl({
  value,
  disabled,
  onCommit,
}: {
  value: BackgroundImageValue | undefined;
  disabled: boolean;
  onCommit: (value: BackgroundImageValue) => void;
}) {
  const image = value?.kind === "image" ? value : null;
  const source = image?.source ?? "";
  const [draft, setDraft] = useState(source);
  const [previousSource, setPreviousSource] = useState(source);
  const [error, setError] = useState<string | null>(null);

  if (source !== previousSource) {
    setPreviousSource(source);
    setDraft(source);
    setError(null);
  }

  const applySource = () => {
    const nextSource = draft.trim();
    if (!isSafeBackgroundImageSource(nextSource)) {
      setError(
        "Use an HTTPS URL or a root-relative path. Temporary, embedded, and insecure URLs are not supported.",
      );
      return;
    }

    setDraft(nextSource);
    setError(null);
    if (image?.source === nextSource) return;
    onCommit({ ...(image ?? DEFAULT_BACKGROUND_IMAGE), source: nextSource });
  };

  const updateImage = (changes: Partial<ActiveBackgroundImage>) => {
    if (!image) return;
    onCommit({ ...image, ...changes });
  };

  return (
    <div className="background-image-control inspector-control-stack">
      <label className="inspector-field">
        <span>Background image URL</span>
        <input
          aria-describedby="background-image-source-help"
          aria-invalid={error !== null}
          aria-label="Background image URL"
          disabled={disabled}
          inputMode="url"
          onChange={(event) => {
            setDraft(event.currentTarget.value);
            setError(null);
          }}
          onKeyDown={(event) => {
            if (event.key !== "Enter") return;
            event.preventDefault();
            applySource();
          }}
          type="text"
          value={draft}
        />
      </label>
      {error ? <p className="inspector-field-error" role="alert">{error}</p> : null}
      <button
        className="inline-value-button"
        disabled={disabled || draft.trim() === ""}
        onClick={applySource}
        type="button"
      >
        {image
          ? "Replace background image"
          : value?.kind === "linear-gradient"
            ? "Replace gradient with background image"
            : "Add background image"}
      </button>

      {image ? (
        <>
          <div className="inspector-two-column">
            <label className="inspector-field compact">
              <span>Fit</span>
              <select
                aria-label="Background image fit"
                disabled={disabled}
                onChange={(event) =>
                  updateImage({
                    size: event.currentTarget.value as ActiveBackgroundImage["size"],
                  })
                }
                value={image.size}
              >
                <option value="cover">Cover</option>
                <option value="contain">Contain</option>
                <option value="auto">Auto</option>
              </select>
            </label>
            <label className="inspector-field compact">
              <span>Repeat</span>
              <select
                aria-label="Background image repeat"
                disabled={disabled}
                onChange={(event) =>
                  updateImage({
                    repeat: event.currentTarget.value as ActiveBackgroundImage["repeat"],
                  })
                }
                value={image.repeat}
              >
                <option value="no-repeat">No repeat</option>
                <option value="repeat">Repeat</option>
                <option value="repeat-x">Repeat horizontally</option>
                <option value="repeat-y">Repeat vertically</option>
              </select>
            </label>
            <label className="inspector-field compact">
              <span>Horizontal position</span>
              <select
                aria-label="Background image horizontal position"
                disabled={disabled}
                onChange={(event) =>
                  updateImage({
                    positionX: event.currentTarget.value as ActiveBackgroundImage["positionX"],
                  })
                }
                value={image.positionX}
              >
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
            </label>
            <label className="inspector-field compact">
              <span>Vertical position</span>
              <select
                aria-label="Background image vertical position"
                disabled={disabled}
                onChange={(event) =>
                  updateImage({
                    positionY: event.currentTarget.value as ActiveBackgroundImage["positionY"],
                  })
                }
                value={image.positionY}
              >
                <option value="top">Top</option>
                <option value="center">Center</option>
                <option value="bottom">Bottom</option>
              </select>
            </label>
          </div>
          <button
            className="background-image-remove-button"
            disabled={disabled}
            onClick={() => onCommit({ kind: "none" })}
            type="button"
          >
            Remove background image
          </button>
        </>
      ) : null}

      <p className="inspector-help" id="background-image-source-help">
        Background images are decorative. Use an Image component for meaningful content that needs alternative text.
      </p>
    </div>
  );
}

function BackgroundGradientControl({
  value,
  disabled,
  onCommit,
}: {
  value: BackgroundImageValue | undefined;
  disabled: boolean;
  onCommit: (value: BackgroundImageValue) => void;
}) {
  const gradient = value?.kind === "linear-gradient" ? value : null;

  return (
    <div className="background-gradient-control inspector-control-stack">
      {gradient ? (
        <>
          <ColorControl
            disabled={disabled}
            label="Gradient start color"
            onCommit={(startColor) => onCommit({ ...gradient, startColor })}
            value={gradient.startColor}
          />
          <ColorControl
            disabled={disabled}
            label="Gradient end color"
            onCommit={(endColor) => onCommit({ ...gradient, endColor })}
            value={gradient.endColor}
          />
          <label className="inspector-field compact">
            <span>Angle</span>
            <div className="value-with-suffix">
              <NumberDraft
                disabled={disabled}
                label="Gradient angle"
                max={360}
                min={0}
                onCommit={(angle) =>
                  onCommit({
                    ...gradient,
                    angle: Math.min(360, Math.max(0, angle)),
                  })
                }
                value={gradient.angle}
              />
              <span aria-hidden="true">deg</span>
            </div>
          </label>
          <button
            className="background-image-remove-button"
            disabled={disabled}
            onClick={() => onCommit({ kind: "none" })}
            type="button"
          >
            Remove gradient
          </button>
        </>
      ) : (
        <button
          className="inline-value-button"
          disabled={disabled}
          onClick={() => onCommit(DEFAULT_LINEAR_GRADIENT)}
          type="button"
        >
          {value?.kind === "image"
            ? "Replace background image with gradient"
            : "Add gradient"}
        </button>
      )}
      <p className="inspector-help">
        Gradients use two colors and replace the active background image layer.
      </p>
    </div>
  );
}

function SpacingControl({
  node,
  viewport,
  property,
  value,
  disabled,
  spacingMode,
  visualMode,
  onSpacingModeChange,
  onVisualModeChange,
  onChange,
}: {
  node: Readonly<BuilderNode>;
  viewport: Viewport;
  property: SpacingProperty;
  value: SpacingValue | undefined;
  disabled: boolean;
  spacingMode: SpacingMode;
  visualMode: VisualOverlayMode;
  onSpacingModeChange: (property: SpacingProperty, mode: SpacingMode) => void;
  onVisualModeChange: (mode: VisualOverlayMode) => void;
  onChange: (changes: readonly [StyleChange, ...StyleChange[]]) => void;
}) {
  const sides: readonly SpacingSide[] = ["top", "right", "bottom", "left"];
  const commit = (side: SpacingSide, next: LengthValue) => {
    const linkedSides = spacingSidesForMode(spacingMode, side);
    const updates = Object.fromEntries(linkedSides.map((candidate) => [candidate, next]));
    onChange(spacingStyleChanges(node.styles, viewport, property, updates));
  };
  const modes: readonly SpacingMode[] = ["axes", "all"];
  const fields: readonly {
    key: string;
    label: string;
    side: SpacingSide;
    value: LengthValue | undefined;
  }[] =
    spacingMode === "axes"
      ? [
          {
            key: "x",
            label: `${titleCase(property)} X`,
            side: "left",
            value: value?.left ?? ZERO_SPACING_VALUE,
          },
          {
            key: "y",
            label: `${titleCase(property)} Y`,
            side: "top",
            value: value?.top ?? ZERO_SPACING_VALUE,
          },
        ]
      : sides.map((side) => ({
          key: side,
          label: `${titleCase(property)} ${side}`,
          side,
          value: value?.[side] ?? ZERO_SPACING_VALUE,
        }));
  return (
    <fieldset className="spacing-control" disabled={disabled}>
      <div className="spacing-control-heading">
        <legend>{titleCase(property)}</legend>
        <button
          aria-pressed={visualMode === property}
          className="inspector-overlay-toggle"
          onClick={() => onVisualModeChange(visualMode === property ? "none" : property)}
          type="button"
        >
          Edit on canvas
        </button>
      </div>
      <div
        aria-label={`${titleCase(property)} mode`}
        className="link-mode-switcher"
        role="group"
      >
        {modes.map((mode) => (
          <button
            aria-pressed={spacingMode === mode}
            key={mode}
            onClick={() => onSpacingModeChange(property, mode)}
            type="button"
          >
            {mode === "axes" ? "Axes" : "All"}
          </button>
        ))}
      </div>
      <div className="spacing-grid">
        {fields.map((field) => (
          <LengthControl
            allowAuto={property === "margin"}
            commitOnChange
            disabled={disabled}
            key={field.key}
            label={field.label}
            min={property === "padding" ? 0 : undefined}
            onCommit={(next) => commit(field.side, next)}
            value={field.value}
          />
        ))}
      </div>
    </fieldset>
  );
}

function SelectField({
  label,
  value,
  disabled,
  options,
  onChange,
}: {
  label: string;
  value: string;
  disabled: boolean;
  options: readonly { label: string; value: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="inspector-field">
      <span>{label}</span>
      <select aria-label={label} disabled={disabled} onChange={(event) => onChange(event.currentTarget.value)} value={value}>
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  );
}

function LayoutControl({
  resolved,
  disabled,
  visualMode,
  onVisualModeChange,
  onChange,
}: {
  resolved: Readonly<StyleValues>;
  disabled: boolean;
  visualMode: VisualOverlayMode;
  onVisualModeChange: (mode: VisualOverlayMode) => void;
  onChange: (changes: readonly [StyleChange, ...StyleChange[]]) => void;
}) {
  const display = resolved.display === "flex" || resolved.display === "grid" ? resolved.display : "block";
  const flex = resolved.flex ?? DEFAULT_FLEX_CONFIG;
  const grid = resolved.grid ?? DEFAULT_GRID_CONFIG;
  const updateNested = (property: "flex" | "grid", field: string, value: JsonValue) =>
    onChange([{ target: { property, field } as StyleChange["target"], value }]);
  return (
    <div className="layout-controls">
      <div className="layout-heading-row">
        <SelectField
          disabled={disabled}
          label="Display"
          onChange={(next) => onChange(layoutModeStyleChanges(next as "block" | "flex" | "grid", resolved))}
          options={[
            { label: "Block", value: "block" },
            { label: "Flex", value: "flex" },
            { label: "Grid", value: "grid" },
          ]}
          value={display}
        />
        <button
          aria-pressed={visualMode === "layout"}
          className="inspector-overlay-toggle"
          disabled={disabled}
          onClick={() => onVisualModeChange(visualMode === "layout" ? "none" : "layout")}
          type="button"
        >
          Layout guides
        </button>
      </div>
      {display === "flex" ? (
        <div className="layout-config-grid">
          <SelectField disabled={disabled} label="Direction" value={flex.direction} onChange={(value) => updateNested("flex", "direction", value)} options={[
            { label: "Row", value: "row" }, { label: "Column", value: "column" },
            { label: "Row reverse", value: "row-reverse" }, { label: "Column reverse", value: "column-reverse" },
          ]} />
          <SelectField disabled={disabled} label="Wrap" value={flex.wrap} onChange={(value) => updateNested("flex", "wrap", value)} options={[
            { label: "No wrap", value: "nowrap" }, { label: "Wrap", value: "wrap" }, { label: "Wrap reverse", value: "wrap-reverse" },
          ]} />
          <SelectField disabled={disabled} label="Justify content" value={flex.justifyContent} onChange={(value) => updateNested("flex", "justifyContent", value)} options={[
            "flex-start", "center", "flex-end", "space-between", "space-around", "space-evenly",
          ].map((value) => ({ label: titleCase(value.replace("-", " ")), value }))} />
          <SelectField disabled={disabled} label="Align items" value={flex.alignItems} onChange={(value) => updateNested("flex", "alignItems", value)} options={[
            "stretch", "flex-start", "center", "flex-end", "baseline",
          ].map((value) => ({ label: titleCase(value.replace("-", " ")), value }))} />
          <LengthControl disabled={disabled} label="Flex gap" min={0} onCommit={(value) => updateNested("flex", "gap", value)} value={flex.gap} />
        </div>
      ) : null}
      {display === "grid" ? (
        <div className="layout-config-grid">
          <label className="inspector-field compact"><span>Columns</span><NumberDraft disabled={disabled} label="Grid columns" min={1} onCommit={(value) => updateNested("grid", "columns", Math.max(1, Math.round(value)))} step={1} value={grid.columns} /></label>
          <label className="inspector-field compact"><span>Rows</span><NumberDraft disabled={disabled} label="Grid rows" min={1} onCommit={(value) => updateNested("grid", "rows", Math.max(1, Math.round(value)))} step={1} value={grid.rows} /></label>
          <LengthControl disabled={disabled} label="Column gap" min={0} onCommit={(value) => updateNested("grid", "columnGap", value)} value={grid.columnGap} />
          <LengthControl disabled={disabled} label="Row gap" min={0} onCommit={(value) => updateNested("grid", "rowGap", value)} value={grid.rowGap} />
          <SelectField disabled={disabled} label="Justify items" value={grid.justifyItems ?? "stretch"} onChange={(value) => updateNested("grid", "justifyItems", value)} options={["start", "center", "end", "stretch"].map((value) => ({ label: titleCase(value), value }))} />
          <SelectField disabled={disabled} label="Grid align items" value={grid.alignItems ?? "stretch"} onChange={(value) => updateNested("grid", "alignItems", value)} options={["start", "center", "end", "stretch"].map((value) => ({ label: titleCase(value), value }))} />
          <p className="inspector-help">Grid rows can be added in Phase 5; reset to automatic remains deferred with reset/unset controls.</p>
        </div>
      ) : null}
    </div>
  );
}

type EditableColor = {
  hex: string;
  opacity: number;
  source: "hex" | "transparent";
};

function parseEditableColor(value: string): EditableColor | null {
  const normalized = value.trim().toLowerCase();
  if (normalized === "transparent") {
    return { hex: "#000000", opacity: 0, source: "transparent" };
  }

  if (!/^#[0-9a-f]+$/.test(normalized)) return null;
  const digits = normalized.slice(1);
  if (![3, 4, 6, 8].includes(digits.length)) return null;

  const isShort = digits.length <= 4;
  const colorDigits = digits.slice(0, isShort ? 3 : 6);
  const alphaDigits = digits.slice(isShort ? 3 : 6);
  const expandedColor = isShort
    ? colorDigits.split("").map((digit) => `${digit}${digit}`).join("")
    : colorDigits;
  const expandedAlpha = alphaDigits.length === 1
    ? `${alphaDigits}${alphaDigits}`
    : alphaDigits;
  const opacity = expandedAlpha
    ? Math.round((Number.parseInt(expandedAlpha, 16) / 255) * 100)
    : 100;

  return { hex: `#${expandedColor}`, opacity, source: "hex" };
}

function colorWithOpacity(hex: string, opacity: number): string {
  const normalizedOpacity = Math.min(100, Math.max(0, Math.round(opacity)));
  if (normalizedOpacity === 100) return hex;

  const alpha = Math.round((normalizedOpacity / 100) * 255)
    .toString(16)
    .padStart(2, "0");
  return `${hex}${alpha}`;
}

function ColorControl({
  label,
  value,
  disabled,
  onCommit,
}: {
  label: string;
  value: string | undefined;
  disabled: boolean;
  onCommit: (value: string) => void;
}) {
  const [previousValue, setPreviousValue] = useState(value);
  const [draft, setDraft] = useState(value ?? "");
  if (value !== previousValue) {
    setPreviousValue(value);
    setDraft(value ?? "");
  }
  const editableColor = parseEditableColor(draft);
  const colorValue = editableColor?.hex ?? "#000000";
  const opacity = editableColor?.opacity ?? 100;
  const commitDraft = (next: string) => {
    setDraft(next);
    onCommit(next);
  };
  return (
    <label className="inspector-field">
      <span>{label}</span>
      <div className="color-control">
        <input
          aria-label={`${label} picker`}
          disabled={disabled}
          onChange={(event) => {
            const nextHex = event.currentTarget.value;
            const next = editableColor?.source === "hex"
              ? colorWithOpacity(nextHex, opacity)
              : nextHex;
            commitDraft(next);
          }}
          type="color"
          value={colorValue}
        />
        <input aria-label={label} disabled={disabled} onBlur={() => { if (draft && draft !== value) onCommit(draft); }} onChange={(event) => setDraft(event.currentTarget.value)} type="text" value={draft} />
        <div className="color-opacity-control">
          <span>Opacity</span>
          <input
            aria-label={`${label} opacity`}
            aria-valuetext={`${opacity}%`}
            disabled={disabled || editableColor === null}
            max={100}
            min={0}
            onChange={(event) => {
              if (!editableColor) return;
              commitDraft(colorWithOpacity(editableColor.hex, Number(event.currentTarget.value)));
            }}
            type="range"
            value={opacity}
          />
          <span aria-hidden="true" className="color-opacity-value">
            {editableColor ? `${opacity}%` : "Custom"}
          </span>
        </div>
      </div>
    </label>
  );
}

function BorderControlGroup({
  resolved,
  disabled,
  onChange,
}: {
  resolved: Readonly<StyleValues>;
  disabled: boolean;
  onChange: (changes: readonly [StyleChange, ...StyleChange[]]) => void;
}) {
  const borderStyle = resolved.borderStyle ?? "none";
  const borderVisible = borderStyle !== "none";
  const dependentControlsDisabled = disabled || !borderVisible;
  const changeStyle = (nextStyle: BorderStyle) => {
    const changes: [StyleChange, ...StyleChange[]] = [
      { target: { property: "borderStyle" }, value: nextStyle },
    ];

    if (nextStyle !== "none") {
      if (resolved.borderWidth === undefined || resolved.borderWidth.value === 0) {
        changes.push({
          target: { property: "borderWidth" },
          value: { value: 1, unit: "px" },
        });
      }
      if (resolved.borderColor === undefined) {
        changes.push({
          target: { property: "borderColor" },
          value: DEFAULT_BORDER_COLOR,
        });
      }
    }

    onChange(changes);
  };

  return (
    <div className="inspector-control-stack">
      <SelectField
        disabled={disabled}
        label="Border style"
        onChange={(value) => changeStyle(value as BorderStyle)}
        options={BORDER_STYLE_OPTIONS}
        value={borderStyle}
      />
      <BorderWidthControl
        disabled={dependentControlsDisabled}
        onCommit={(value) =>
          onChange([{ target: { property: "borderWidth" }, value }])
        }
        value={resolved.borderWidth}
      />
      <ColorControl
        disabled={dependentControlsDisabled}
        label="Border color"
        onCommit={(value) =>
          onChange([{ target: { property: "borderColor" }, value }])
        }
        value={resolved.borderColor ?? DEFAULT_BORDER_COLOR}
      />
      <LengthControl
        disabled={disabled}
        label="Border radius"
        min={0}
        onCommit={(value) =>
          onChange([{ target: { property: "borderRadius" }, value }])
        }
        value={resolved.borderRadius}
      />
    </div>
  );
}

function EffectLengthControl({
  label,
  value,
  disabled,
  onCommit,
}: {
  label: string;
  value: EffectLengthValue | undefined;
  disabled: boolean;
  onCommit: (value: EffectLengthValue) => void;
}) {
  const current = value ?? DEFAULT_BACKDROP_BLUR;

  return (
    <label className="inspector-field compact">
      <span>{label}</span>
      <div className="value-with-select">
        <NumberDraft
          disabled={disabled}
          label={label}
          min={0}
          onCommit={(number) =>
            onCommit({ value: Math.max(0, number), unit: current.unit })
          }
          value={current.value}
        />
        <select
          aria-label={`${label} unit`}
          disabled={disabled}
          onChange={(event) =>
            onCommit({
              value: current.value,
              unit: event.currentTarget.value as EffectUnit,
            })
          }
          value={current.unit}
        >
          {EFFECT_UNITS.map((unit) => (
            <option key={unit} value={unit}>
              {unit}
            </option>
          ))}
        </select>
      </div>
    </label>
  );
}

function BoxShadowControl({
  value,
  disabled,
  onCommit,
}: {
  value: readonly BoxShadowValue[];
  disabled: boolean;
  onCommit: (value: BoxShadowValue[]) => void;
}) {
  const updateShadow = (index: number, patch: Partial<BoxShadowValue>) => {
    onCommit(
      value.map((shadow, shadowIndex) =>
        shadowIndex === index ? { ...shadow, ...patch } : { ...shadow },
      ),
    );
  };

  return (
    <div className="box-shadow-control inspector-control-stack">
      {value.length === 0 ? (
        <p className="inspector-help">No shadows at this breakpoint.</p>
      ) : null}
      {value.map((shadow, index) => {
        const label = `Shadow ${index + 1}`;
        const fields: readonly {
          label: string;
          property: "offsetX" | "offsetY" | "blurRadius" | "spreadRadius";
          value: number;
        }[] = [
          { label: "Horizontal offset", property: "offsetX", value: shadow.offsetX },
          { label: "Vertical offset", property: "offsetY", value: shadow.offsetY },
          { label: "Blur radius", property: "blurRadius", value: shadow.blurRadius },
          { label: "Spread radius", property: "spreadRadius", value: shadow.spreadRadius },
        ];
        return (
          <fieldset className="effect-shadow-card" disabled={disabled} key={index}>
            <div className="effect-shadow-heading">
              <legend>{label}</legend>
              <button
                aria-label={`Remove ${label.toLowerCase()}`}
                className="effect-shadow-remove"
                onClick={() =>
                  onCommit(value.filter((_entry, shadowIndex) => shadowIndex !== index))
                }
                type="button"
              >
                Remove
              </button>
            </div>
            <label className="inspector-check-field">
              <input
                aria-label={`${label} inset`}
                checked={shadow.inset}
                onChange={(event) =>
                  updateShadow(index, { inset: event.currentTarget.checked })
                }
                type="checkbox"
              />
              <span>Inset shadow</span>
            </label>
            <div className="inspector-two-column effect-shadow-values">
              {fields.map((field) => (
                <label className="inspector-field compact" key={field.property}>
                  <span>{field.label}</span>
                  <NumberDraft
                    disabled={disabled}
                    label={`${label} ${field.label.toLowerCase()}`}
                    min={field.property === "blurRadius" ? 0 : undefined}
                    onCommit={(next) =>
                      updateShadow(index, {
                        [field.property]:
                          field.property === "blurRadius" ? Math.max(0, next) : next,
                      })
                    }
                    value={field.value}
                  />
                </label>
              ))}
            </div>
            <SelectField
              disabled={disabled}
              label={`${label} unit`}
              onChange={(unit) => updateShadow(index, { unit: unit as EffectUnit })}
              options={EFFECT_UNITS.map((unit) => ({ label: unit, value: unit }))}
              value={shadow.unit}
            />
            <ColorControl
              disabled={disabled}
              label={`${label} color`}
              onCommit={(color) => updateShadow(index, { color })}
              value={shadow.color}
            />
          </fieldset>
        );
      })}
      <button
        className="inline-value-button"
        disabled={disabled || value.length >= MAX_BOX_SHADOWS}
        onClick={() =>
          onCommit([
            ...value.map((shadow) => ({ ...shadow })),
            { ...DEFAULT_BOX_SHADOW },
          ])
        }
        type="button"
      >
        Add shadow
      </button>
    </div>
  );
}

function EffectsControl({
  resolved,
  disabled,
  onChange,
}: {
  resolved: Readonly<StyleValues>;
  disabled: boolean;
  onChange: (changes: readonly [StyleChange, ...StyleChange[]]) => void;
}) {
  return (
    <div className="effects-controls inspector-control-stack">
      <BoxShadowControl
        disabled={disabled}
        onCommit={(value) =>
          onChange([{ target: { property: "boxShadow" }, value }])
        }
        value={resolved.boxShadow ?? []}
      />
      <EffectLengthControl
        disabled={disabled}
        label="Backdrop blur"
        onCommit={(value) =>
          onChange([{ target: { property: "backdropBlur" }, value }])
        }
        value={resolved.backdropBlur}
      />
      <p className="inspector-help">
        Effects use the shared responsive style system and render identically on the Canvas and in Preview.
      </p>
    </div>
  );
}

type StateControlsProps = {
  node: Readonly<BuilderNode>;
  page: Readonly<PageDocument>;
  disabled: boolean;
  onCreateStateAndConnect: (name: string, defaultValue: boolean) => void;
  onUpdateProps: (nextProps: JsonObject) => void;
  onUpdateStateBinding: (binding: BooleanStateBinding | null) => void;
};

function booleanStateOptions(page: Readonly<PageDocument>) {
  const candidates = Object.values(page.nodes).filter(
    (candidate) => candidate.type === "boolean-state",
  );
  const nameCounts = new Map<string, number>();
  for (const candidate of candidates) {
    nameCounts.set(
      candidate.meta.name,
      (nameCounts.get(candidate.meta.name) ?? 0) + 1,
    );
  }

  return candidates.map((candidate) => ({
    label:
      (nameCounts.get(candidate.meta.name) ?? 0) > 1
        ? `${candidate.meta.name} (${candidate.id})`
        : candidate.meta.name,
    value: candidate.id,
  }));
}

function StateControls({
  node,
  page,
  disabled,
  onCreateStateAndConnect,
  onUpdateProps,
  onUpdateStateBinding,
}: StateControlsProps) {
  const [newStateName, setNewStateName] = useState(`${node.meta.name} visible`);
  const [newStateDefault, setNewStateDefault] = useState(false);
  const options = booleanStateOptions(page);
  const binding = node.stateBinding;
  const connectedState = binding
    ? page.nodes[binding.stateNodeId] ?? null
    : null;
  const visibilityOptions = [
    { label: "Show", value: "show" },
    { label: "Hide", value: "hide" },
  ];
  const action =
    node.type === "button" &&
    (node.props.stateAction === "turn-on" ||
      node.props.stateAction === "turn-off" ||
      node.props.stateAction === "toggle")
      ? node.props.stateAction
      : "none";
  const actionTarget =
    node.type === "button" && typeof node.props.targetStateNodeId === "string"
      ? node.props.targetStateNodeId
      : "";
  const buttonCanRunStateAction =
    node.type === "button" &&
    node.props.href === "" &&
    node.props.behavior === "button";

  if (node.type === "boolean-state") {
    return (
      <section className="inspector-section inspector-state-panel">
        <h3>Boolean State</h3>
        <p className="inspector-help">
          This component stores an On or Off value. Connect ordinary components
          and Buttons to it from their State tab.
        </p>
      </section>
    );
  }

  return (
    <>
      <section className="inspector-section inspector-state-panel">
        <div className="inspector-section-heading">
          <h3>Visibility connection</h3>
          <span>{binding ? "Connected" : "Not connected"}</span>
        </div>
        <p className="inspector-help">
          Use one Boolean State to decide whether this component is shown or hidden.
        </p>

        <SelectField
          disabled={disabled || options.length === 0}
          label="Boolean State"
          onChange={(stateNodeId) => {
            if (stateNodeId === "") {
              onUpdateStateBinding(null);
              return;
            }
            onUpdateStateBinding({
              stateNodeId: asNodeId(stateNodeId),
              on: binding?.on ?? "show",
              off: binding?.off ?? "hide",
            });
          }}
          options={[
            {
              label:
                options.length === 0
                  ? "No Boolean States on this page"
                  : "Not connected",
              value: "",
            },
            ...options,
            ...(binding && !page.nodes[binding.stateNodeId]
              ? [
                  {
                    label: `Unavailable (${binding.stateNodeId})`,
                    value: binding.stateNodeId,
                  },
                ]
              : []),
          ]}
          value={binding?.stateNodeId ?? ""}
        />

        {binding ? (
          <>
            {!connectedState ? (
              <p className="inspector-field-error" role="alert">
                The connected Boolean State no longer exists. Choose another state
                or disconnect this component.
              </p>
            ) : null}
            <div className="inspector-two-column">
              <SelectField
                disabled={disabled}
                label="When On"
                onChange={(value) =>
                  onUpdateStateBinding({
                    ...binding,
                    on: value as BooleanStateBinding["on"],
                  })
                }
                options={visibilityOptions}
                value={binding.on}
              />
              <SelectField
                disabled={disabled}
                label="When Off"
                onChange={(value) =>
                  onUpdateStateBinding({
                    ...binding,
                    off: value as BooleanStateBinding["off"],
                  })
                }
                options={visibilityOptions}
                value={binding.off}
              />
            </div>
            <p className="inspector-help">
              Keep any Button that controls this state outside components the
              state can hide, so the control stays available.
            </p>
          </>
        ) : (
          <div className="state-create-card">
            <strong>Create a new Boolean State</strong>
            <label className="inspector-field">
              <span>Name</span>
              <input
                disabled={disabled}
                onChange={(event) => setNewStateName(event.target.value)}
                value={newStateName}
              />
            </label>
            <label className="inspector-toggle-row">
              <input
                checked={newStateDefault}
                disabled={disabled}
                onChange={(event) => setNewStateDefault(event.target.checked)}
                type="checkbox"
              />
              <span>Start On</span>
            </label>
            <button
              className="state-primary-button"
              disabled={disabled || newStateName.trim() === ""}
              onClick={() =>
                onCreateStateAndConnect(newStateName, newStateDefault)
              }
              type="button"
            >
              Create state &amp; connect
            </button>
          </div>
        )}
      </section>

      {node.type === "button" ? (
        <section className="inspector-section inspector-state-panel">
          <h3>Button state action</h3>
          <p className="inspector-help">
            This ordinary Button can turn a Boolean State On, Off, or toggle it.
          </p>
          {!buttonCanRunStateAction ? (
            <p className="inspector-field-error" role="alert">
              State actions require a regular Button without a link.
            </p>
          ) : null}
          <SelectField
            disabled={disabled || !buttonCanRunStateAction}
            label="On click"
            onChange={(value) =>
              onUpdateProps({
                ...node.props,
                stateAction: value,
                targetStateNodeId: value === "none" ? "" : actionTarget,
              })
            }
            options={[
              { label: "No state action", value: "none" },
              { label: "Turn On", value: "turn-on" },
              { label: "Turn Off", value: "turn-off" },
              { label: "Toggle", value: "toggle" },
            ]}
            value={action}
          />
          <SelectField
            disabled={
              disabled ||
              !buttonCanRunStateAction ||
              action === "none" ||
              options.length === 0
            }
            label="Action Boolean State"
            onChange={(targetStateNodeId) =>
              onUpdateProps({ ...node.props, targetStateNodeId })
            }
            options={[
              {
                label:
                  options.length === 0
                    ? "No Boolean States on this page"
                    : "Select Boolean State",
                value: "",
              },
              ...options,
              ...(actionTarget && !page.nodes[asNodeId(actionTarget)]
                ? [
                    {
                      label: `Unavailable (${actionTarget})`,
                      value: actionTarget,
                    },
                  ]
                : []),
            ]}
            value={actionTarget}
          />
        </section>
      ) : null}
    </>
  );
}

export function InspectorPanel({
  document,
  page,
  node,
  isRoot,
  viewport,
  spacingModes,
  visualMode,
  onSpacingModeChange,
  onVisualModeChange,
  onDelete,
  onRename,
  onCreateStateAndConnect,
  onUpdateProps,
  onUpdateStateBinding,
  onUpdateStyles,
}: InspectorPanelProps) {
  const [activeTab, setActiveTab] = useState<"design" | "state">("design");

  if (!node) {
    return (
      <aside aria-labelledby="inspector-title" className="editor-sidebar inspector-panel">
        <div className="panel-heading"><div><p className="panel-eyebrow">Edit</p><h2 id="inspector-title">Inspector</h2></div></div>
        <div className="inspector-empty"><span aria-hidden="true">◇</span><strong>No component selected</strong><p>Select a component on the canvas to edit its content and layout.</p></div>
      </aside>
    );
  }

  const definition = componentRegistry[node.type];
  const resolved = resolveResponsiveStyles(node.styles, viewport);
  const resolvedDefaults = resolveResponsiveStyles(
    definition.defaults.styles,
    viewport,
  );
  const capabilities = new Set(definition.inspector.styles);
  const disabled = node.meta.locked;
  const propFields = definition.inspector.props as readonly PropField[];
  const references = referencesForComponentType(node.type);
  const hasTextContent = propFields.some((field) => field.path === "text");
  const fontFamily =
    resolved.fontFamily ?? resolvedDefaults.fontFamily ?? DEFAULT_FONT_FAMILY;
  const fontSize = resolved.fontSize ?? resolvedDefaults.fontSize;
  const fontWeight = resolved.fontWeight ?? resolvedDefaults.fontWeight;
  const lineHeight =
    typeof resolved.lineHeight === "number"
      ? resolved.lineHeight
      : resolved.lineHeight === undefined &&
          typeof resolvedDefaults.lineHeight === "number"
        ? resolvedDefaults.lineHeight
        : undefined;
  const letterSpacing =
    resolved.letterSpacing ?? resolvedDefaults.letterSpacing;
  const updateOne = (property: keyof StyleValues, value: JsonValue) =>
    onUpdateStyles([{ target: { property }, value }]);
  const contentControls = (
    <div className="inspector-control-stack">
      {propFields.map((field) => (
        <PropDraftControl
          dependentOptions={
            field.optionsPath === undefined
              ? undefined
              : asStringArray(node.props[field.optionsPath])
          }
          disabled={disabled}
          field={field}
          key={`${node.id}:${field.path}:${JSON.stringify(node.props[field.path])}`}
          nodeReference={(() => {
            if (field.control !== "node-reference") return undefined;
            const reference = references.find(
              (candidate) => candidate.path === field.path,
            );
            if (!reference) return undefined;

            const rawValue = node.props[field.path];
            const value = typeof rawValue === "string" ? rawValue : "";
            const targetLabel =
              componentRegistry[reference.targetType].library.label;
            const candidates = listNodeReferenceCandidates(
              document,
              page.id,
              reference,
            );
            const nameCounts = new Map<string, number>();
            for (const candidate of candidates) {
              nameCounts.set(
                candidate.meta.name,
                (nameCounts.get(candidate.meta.name) ?? 0) + 1,
              );
            }
            const options = [
              { label: `Select ${targetLabel}`, value: "" },
              ...candidates.map((candidate) => ({
                label:
                  (nameCounts.get(candidate.meta.name) ?? 0) > 1
                    ? `${candidate.meta.name} (${candidate.id})`
                    : candidate.meta.name,
                value: candidate.id,
              })),
            ];
            const resolution = resolveNodeReference(
              document,
              page.id,
              value,
              reference,
            );

            if (
              value !== "" &&
              !options.some((option) => option.value === value)
            ) {
              options.push({ label: `Unavailable (${value})`, value });
            }

            if (resolution.status === "empty") {
              return {
                invalid: false,
                message: `Choose a ${targetLabel} on this page.`,
                options,
              };
            }
            if (resolution.status === "valid") {
              return { invalid: false, options };
            }
            if (resolution.status === "cross-page") {
              return {
                invalid: true,
                message: `The selected ${targetLabel} belongs to another page.`,
                options,
              };
            }
            if (resolution.status === "wrong-type") {
              return {
                invalid: true,
                message: `The selected node is not a ${targetLabel}.`,
                options,
              };
            }
            return {
              invalid: true,
              message: `The selected ${targetLabel} no longer exists.`,
              options,
            };
          })()}
          onCommit={(value) => {
            const nextProps = { ...node.props, [field.path]: value };
            const defaultValue = nextProps.defaultValue;
            if (field.path === "options" && Array.isArray(value)) {
              if (
                typeof defaultValue === "string" &&
                defaultValue !== "" &&
                !value.includes(defaultValue)
              ) {
                nextProps.defaultValue = "";
              }
              if (Array.isArray(nextProps.defaultValues)) {
                nextProps.defaultValues = nextProps.defaultValues.filter(
                  (candidate): candidate is string =>
                    typeof candidate === "string" && value.includes(candidate),
                );
              }
            }
            onUpdateProps(nextProps);
          }}
          value={node.props[field.path]}
        />
      ))}
    </div>
  );

  return (
    <aside aria-labelledby="inspector-title" className="editor-sidebar inspector-panel">
      <div className="panel-heading"><div><p className="panel-eyebrow">Edit</p><h2 id="inspector-title">Inspector</h2></div><span className="component-type-badge">{definition.library.label}</span></div>

      <div aria-label="Inspector tabs" className="inspector-tabs" role="tablist">
        <button
          aria-selected={activeTab === "design"}
          className={activeTab === "design" ? "active" : undefined}
          onClick={() => setActiveTab("design")}
          role="tab"
          type="button"
        >
          Design
        </button>
        <button
          aria-selected={activeTab === "state"}
          className={activeTab === "state" ? "active" : undefined}
          onClick={() => setActiveTab("state")}
          role="tab"
          type="button"
        >
          State
        </button>
      </div>

      <section className="inspector-section inspector-selection">
        <div className="inspector-section-heading"><h3>Selection</h3><span>{viewport} values</span></div>
        <dl className="node-metadata">
          <div>
            <dt>Name</dt>
            <dd>
              <NodeNameDraft
                disabled={disabled}
                key={`${node.id}:${node.meta.name}`}
                name={node.meta.name}
                onCommit={onRename}
              />
            </dd>
          </div>
          <div><dt>Type</dt><dd>{node.type}</dd></div>
        </dl>
        <button
          aria-label={`Delete ${node.meta.name}`}
          className="inspector-delete-button"
          disabled={disabled}
          onClick={onDelete}
          title={
            disabled
              ? "Unlock this component before deleting it"
              : `Delete ${node.meta.name}`
          }
          type="button"
        >
          Delete component
        </button>
      </section>

      {activeTab === "design" ? (
        <>
      {propFields.length > 0 ? (
        hasTextContent ? (
          <section className="inspector-section inspector-content">
            <h3>Content</h3>
            {contentControls}
          </section>
        ) : (
          <InspectorGroup title="Content">{contentControls}</InspectorGroup>
        )
      ) : null}

      {capabilities.has("typography") ? (
        <InspectorGroup title="Typography">
          <div className="inspector-control-stack">
            <ColorControl disabled={disabled} label="Text color" onCommit={(value) => updateOne("color", value)} value={resolved.color} />
            <SelectField disabled={disabled} label="Font family" onChange={(value) => updateOne("fontFamily", value)} options={fontFamilyOptions(fontFamily)} value={fontFamily} />
            <div className="inspector-two-column">
              <LengthControl disabled={disabled} label="Font size" min={0} onCommit={(value) => updateOne("fontSize", value)} value={fontSize} />
              <label className="inspector-field compact"><span>Font weight</span><NumberDraft disabled={disabled} label="Font weight" min={1} onCommit={(value) => updateOne("fontWeight", value)} value={fontWeight} /></label>
              <label className="inspector-field compact"><span>Line height</span><NumberDraft disabled={disabled} label="Line height" min={0} onCommit={(value) => updateOne("lineHeight", value)} value={lineHeight} /></label>
              <LengthControl disabled={disabled} label="Letter spacing" onCommit={(value) => updateOne("letterSpacing", value)} value={letterSpacing} />
            </div>
            <SelectField disabled={disabled} label="Text align" onChange={(value) => updateOne("textAlign", value)} options={["left", "center", "right", "justify"].map((value) => ({ label: titleCase(value), value }))} value={resolved.textAlign ?? "left"} />
            {node.type === "link" ? (
              <SelectField
                disabled={disabled}
                label="Text decoration"
                onChange={(value) => updateOne("textDecoration", value)}
                options={TEXT_DECORATION_OPTIONS}
                value={
                  resolved.textDecoration ??
                  resolvedDefaults.textDecoration ??
                  "underline"
                }
              />
            ) : null}
          </div>
        </InspectorGroup>
      ) : null}

      {capabilities.has("sizing") ? (
        <InspectorGroup title="Sizing" suffix={<span className="responsive-layer-badge">{viewport}</span>}>
          <div className="sizing-controls">
            <div className="inspector-two-column">
              <DimensionControl disabled={disabled} isRoot={isRoot} key="width" onChange={(change) => onUpdateStyles([change])} property="width" value={resolved.width} />
              <DimensionControl disabled={disabled} isRoot={isRoot} key="height" onChange={(change) => onUpdateStyles([change])} property="height" value={resolved.height} />
            </div>
            {isRoot ? (
              <p className="inspector-help sizing-help">
                Fill viewport keeps the page at least one viewport tall while allowing content to grow.
              </p>
            ) : null}
          </div>
        </InspectorGroup>
      ) : null}

      {capabilities.has("spacing") ? (
        <InspectorGroup title="Spacing">
          <SpacingControl disabled={disabled} node={node} onChange={onUpdateStyles} onSpacingModeChange={onSpacingModeChange} onVisualModeChange={onVisualModeChange} property="padding" spacingMode={spacingModes.padding} value={resolved.padding} viewport={viewport} visualMode={visualMode} />
          <SpacingControl disabled={disabled} node={node} onChange={onUpdateStyles} onSpacingModeChange={onSpacingModeChange} onVisualModeChange={onVisualModeChange} property="margin" spacingMode={spacingModes.margin} value={resolved.margin} viewport={viewport} visualMode={visualMode} />
        </InspectorGroup>
      ) : null}

      {capabilities.has("layout") ? (
        <InspectorGroup title="Layout"><LayoutControl disabled={disabled} onChange={onUpdateStyles} onVisualModeChange={onVisualModeChange} resolved={resolved} visualMode={visualMode} /></InspectorGroup>
      ) : null}

      {capabilities.has("background") || capabilities.has("backgroundImage") ? (
        <InspectorGroup title="Background">
          <div className="inspector-control-stack">
            {capabilities.has("background") ? (
              <ColorControl disabled={disabled} label="Background color" onCommit={(value) => updateOne("backgroundColor", value)} value={resolved.backgroundColor} />
            ) : null}
            {capabilities.has("backgroundImage") ? (
              <>
                <BackgroundGradientControl disabled={disabled} onCommit={(value) => updateOne("backgroundImage", value)} value={resolved.backgroundImage} />
                <BackgroundImageControl disabled={disabled} onCommit={(value) => updateOne("backgroundImage", value)} value={resolved.backgroundImage} />
              </>
            ) : null}
          </div>
        </InspectorGroup>
      ) : null}

      {capabilities.has("border") ? (
        <InspectorGroup title="Border">
          <BorderControlGroup
            disabled={disabled}
            onChange={onUpdateStyles}
            resolved={resolved}
          />
        </InspectorGroup>
      ) : null}

      <InspectorGroup
        suffix={<span className="responsive-layer-badge">{viewport}</span>}
        title="Effects"
      >
        <EffectsControl
          disabled={disabled}
          onChange={onUpdateStyles}
          resolved={resolved}
        />
      </InspectorGroup>

      {capabilities.has("positioning") ? (
        <InspectorGroup title="Position">
          <div className="inspector-two-column position-controls">
            <SelectField disabled={disabled} label="Position" onChange={(value) => updateOne("position", value)} options={["static", "relative", "absolute", "fixed", "sticky"].map((value) => ({ label: titleCase(value), value }))} value={resolved.position ?? "static"} />
            <label className="inspector-field compact"><span>Z index</span><NumberDraft disabled={disabled || resolved.zIndex === "auto"} label="Z index" onCommit={(value) => updateOne("zIndex", value)} value={typeof resolved.zIndex === "number" ? resolved.zIndex : undefined} /><button className="inline-value-button" disabled={disabled} onClick={() => updateOne("zIndex", resolved.zIndex === "auto" ? 0 : "auto")} type="button">{resolved.zIndex === "auto" ? "Use number" : "Use auto"}</button></label>
          </div>
        </InspectorGroup>
      ) : null}
        </>
      ) : (
        <StateControls
          disabled={disabled}
          key={node.id}
          node={node}
          onCreateStateAndConnect={onCreateStateAndConnect}
          onUpdateProps={onUpdateProps}
          onUpdateStateBinding={onUpdateStateBinding}
          page={page}
        />
      )}

      {disabled ? <p className="inspector-lock-note">Unlock this component before changing its name, content, or styles.</p> : null}
    </aside>
  );
}
