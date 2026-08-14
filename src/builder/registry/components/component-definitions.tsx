import { useState, type MouseEvent } from "react";
import { z } from "zod";

import {
  useBooleanStateRuntime,
} from "@/builder/interaction/boolean-state-runtime";
import { asNodeId } from "@/builder/model/ids";
import { isJsonObject } from "@/builder/model/json";
import type {
  ComponentDefinition,
  ContainerRendererProps,
  LeafRendererProps,
  StyleInspectorCapability,
} from "@/builder/registry/define-component-registry";
import type { ResponsiveStyles } from "@/builder/styles/types";
import { isSafeImageSource } from "@/builder/styles/schema";

import {
  ButtonIcon,
  BooleanStateIcon,
  CardIcon,
  CheckboxGroupIcon,
  CheckboxIcon,
  ContainerIcon,
  DropdownIcon,
  FormIcon,
  HeadingIcon,
  ImageIcon,
  InputIcon,
  LabelIcon,
  LinkIcon,
  RadioGroupIcon,
  SectionIcon,
  TextIcon,
  TextareaIcon,
} from "./component-icons";
import {
  BUTTON_ICON_NAMES,
  BUTTON_ICON_OPTIONS,
  ButtonContentIcon,
} from "./button-icons";
import { PasswordVisibilityIcon } from "./input-icons";
import { nodeReferenceIdSchema } from "./reference-schemas";
import { px, spacing } from "./style-defaults";

export type V1ComponentType =
  | "section"
  | "container"
  | "boolean-state"
  | "heading"
  | "text"
  | "label"
  | "card"
  | "image"
  | "link"
  | "button"
  | "form"
  | "input"
  | "textarea"
  | "dropdown"
  | "radio-group"
  | "checkbox"
  | "checkbox-group";

const anchorIdSchema = z
  .string()
  .refine(
    (value) => value === "" || /^[A-Za-z][A-Za-z0-9_:.-]*$/.test(value),
    "Anchor ID must be empty or a valid HTML id",
  );

const controlIdSchema = z
  .string()
  .trim()
  .max(100)
  .refine(
    (value) => value === "" || /^[A-Za-z][A-Za-z0-9_:.-]*$/.test(value),
    "Control ID must be empty or a valid HTML id",
  );

const labelTargetIdSchema = z
  .string()
  .trim()
  .min(1)
  .max(100)
  .regex(
    /^[A-Za-z][A-Za-z0-9_:.-]*$/,
    "Label target must be a valid HTML id",
  );

export const sectionPropsSchema = z
  .object({
    semanticTag: z.enum(["section", "header", "main", "footer", "aside"]),
    anchorId: anchorIdSchema,
  })
  .strict();

export type SectionProps = z.infer<typeof sectionPropsSchema>;

export function SectionRenderer({
  props,
  style,
  className,
  rootRef,
  rootAttributes,
  children,
}: ContainerRendererProps<SectionProps>) {
  const Root = props.semanticTag;

  return (
    <Root
      {...rootAttributes}
      className={className}
      id={props.anchorId || undefined}
      ref={rootRef}
      style={style}
    >
      {children}
    </Root>
  );
}

const sectionStyles = {
  base: {
    display: "block",
    width: { mode: "fill" },
    height: { mode: "auto" },
    padding: spacing(48, 24, 48, 24),
    backgroundColor: "transparent",
    position: "static",
    zIndex: "auto",
  },
} satisfies ResponsiveStyles;

export const sectionDefinition = {
  version: 1,
  library: {
    label: "Section",
    category: "Layout",
    icon: SectionIcon,
  },
  defaults: {
    props: {
      semanticTag: "section",
      anchorId: "",
    },
    styles: sectionStyles,
  },
  children: { allowed: true, accepts: "any" },
  propsSchema: sectionPropsSchema,
  inspector: {
    props: [
      {
        path: "semanticTag",
        label: "Element",
        control: "select",
        options: [
          { label: "Section", value: "section" },
          { label: "Header", value: "header" },
          { label: "Main", value: "main" },
          { label: "Footer", value: "footer" },
          { label: "Aside", value: "aside" },
        ],
      },
      { path: "anchorId", label: "Anchor ID", control: "text" },
    ],
    styles: [
      "sizing",
      "spacing",
      "background",
      "backgroundImage",
      "border",
      "layout",
      "positioning",
    ],
  },
  render: SectionRenderer,
} satisfies ComponentDefinition<SectionProps, V1ComponentType>;

export const containerPropsSchema = z
  .object({
    semanticTag: z.enum([
      "div",
      "main",
      "nav",
      "header",
      "footer",
      "aside",
      "details",
      "summary",
    ]),
  })
  .strict();

export type ContainerProps = z.infer<typeof containerPropsSchema>;

export function ContainerRenderer({
  props,
  style,
  className,
  rootRef,
  rootAttributes,
  children,
}: ContainerRendererProps<ContainerProps>) {
  const Root = props.semanticTag;
  const semanticClassName =
    props.semanticTag === "details"
      ? "builder-disclosure"
      : props.semanticTag === "summary"
        ? "builder-disclosure-summary"
        : undefined;
  const resolvedClassName = [semanticClassName, className]
    .filter(Boolean)
    .join(" ");

  return (
    <Root
      {...rootAttributes}
      className={resolvedClassName || undefined}
      ref={rootRef}
      style={style}
    >
      {children}
    </Root>
  );
}

const containerStyles = {
  base: {
    display: "block",
    width: { mode: "fill" },
    height: { mode: "auto" },
    minWidth: px(0),
    maxWidth: px(1440),
    margin: {
      top: px(0),
      right: { keyword: "auto" },
      bottom: px(0),
      left: { keyword: "auto" },
    },
    padding: spacing(0, 24, 0, 24),
    position: "static",
    zIndex: "auto",
  },
  tablet: { padding: spacing(0, 20, 0, 20) },
  mobile: { padding: spacing(0, 16, 0, 16) },
} satisfies ResponsiveStyles;

export const containerDefinition = {
  version: 3,
  library: {
    label: "Container",
    category: "Layout",
    icon: ContainerIcon,
  },
  defaults: {
    props: { semanticTag: "div" },
    styles: containerStyles,
  },
  children: { allowed: true, accepts: "any" },
  propsSchema: containerPropsSchema,
  migrations: [
    {
      fromVersion: 1,
      toVersion: 2,
      migrate: (value) => {
        const props = containerPropsSchema.parse(value.props);
        const styles = structuredClone(value.styles);
        const base = styles.base;

        if (isJsonObject(base)) {
          const maxWidth = base.maxWidth;
          if (
            isJsonObject(maxWidth) &&
            maxWidth.value === 72 &&
            maxWidth.unit === "rem"
          ) {
            base.maxWidth = { value: 100, unit: "%" };
          }
        }

        return { props, styles };
      },
    },
    {
      fromVersion: 2,
      toVersion: 3,
      migrate: (value) => {
        const props = containerPropsSchema.parse(value.props);
        const styles = structuredClone(value.styles);
        const base = styles.base;

        if (isJsonObject(base)) {
          const maxWidth = base.maxWidth;
          if (
            isJsonObject(maxWidth) &&
            maxWidth.value === 100 &&
            maxWidth.unit === "%"
          ) {
            base.maxWidth = { value: 1440, unit: "px" };
          }
        }

        return { props, styles };
      },
    },
  ],
  inspector: {
    props: [
      {
        path: "semanticTag",
        label: "Element",
        control: "select",
        options: [
          { label: "Div", value: "div" },
          { label: "Main", value: "main" },
          { label: "Navigation", value: "nav" },
          { label: "Header", value: "header" },
          { label: "Footer", value: "footer" },
          { label: "Aside", value: "aside" },
          { label: "Disclosure", value: "details" },
          { label: "Disclosure summary", value: "summary" },
        ],
      },
    ],
    styles: [
      "sizing",
      "spacing",
      "background",
      "backgroundImage",
      "border",
      "layout",
      "positioning",
    ],
  },
  render: ContainerRenderer,
} satisfies ComponentDefinition<ContainerProps, V1ComponentType>;

export const booleanStatePropsSchema = z
  .object({
    defaultValue: z.boolean(),
  })
  .strict();

export type BooleanStateProps = z.infer<typeof booleanStatePropsSchema>;

export function BooleanStateRenderer(): null {
  return null;
}

const booleanStateStyles = {
  base: {
    display: "block",
    width: { mode: "fit" },
    height: { mode: "auto" },
    position: "static",
    zIndex: "auto",
  },
} satisfies ResponsiveStyles;

export const booleanStateDefinition = {
  version: 1,
  library: {
    label: "Boolean State",
    category: "Interactions",
    icon: BooleanStateIcon,
    searchTerms: ["toggle", "logic", "on off", "condition"],
  },
  defaults: {
    props: { defaultValue: false },
    styles: booleanStateStyles,
  },
  children: { allowed: false },
  propsSchema: booleanStatePropsSchema,
  inspector: {
    props: [
      {
        path: "defaultValue",
        label: "Default value",
        control: "boolean",
      },
    ],
    styles: [] as readonly StyleInspectorCapability[],
  },
  render: BooleanStateRenderer,
} satisfies ComponentDefinition<BooleanStateProps, V1ComponentType>;

export const headingPropsSchema = z
  .object({
    text: z.string(),
    level: z.enum(["h1", "h2", "h3", "h4", "h5", "h6"]),
  })
  .strict();

export type HeadingProps = z.infer<typeof headingPropsSchema>;

export const HEADING_LEVEL_FONT_SIZE_PX = {
  h1: 40,
  h2: 32,
  h3: 28,
  h4: 24,
  h5: 20,
  h6: 16,
} as const satisfies Readonly<Record<HeadingProps["level"], number>>;

export function HeadingRenderer({
  props,
  style,
  className,
  rootRef,
  rootAttributes,
}: LeafRendererProps<HeadingProps>) {
  const Root = props.level;

  return (
    <Root {...rootAttributes} className={className} ref={rootRef} style={style}>
      {props.text}
    </Root>
  );
}

const headingStyles = {
  base: {
    display: "block",
    width: { mode: "fill" },
    height: { mode: "auto" },
    margin: spacing(0, 0, 0, 0),
    backgroundColor: "transparent",
    color: "#0f172a",
    fontSize: px(HEADING_LEVEL_FONT_SIZE_PX.h2),
    fontWeight: 700,
    lineHeight: 1.2,
    position: "static",
    zIndex: "auto",
  },
} satisfies ResponsiveStyles;

export const headingDefinition = {
  version: 1,
  library: {
    label: "Heading",
    category: "Typography",
    icon: HeadingIcon,
  },
  defaults: {
    props: { text: "Heading", level: "h2" },
    styles: headingStyles,
  },
  children: { allowed: false },
  propsSchema: headingPropsSchema,
  inspector: {
    props: [
      { path: "text", label: "Text", control: "text" },
      {
        path: "level",
        label: "Level",
        control: "select",
        options: [
          { label: "H1", value: "h1" },
          { label: "H2", value: "h2" },
          { label: "H3", value: "h3" },
          { label: "H4", value: "h4" },
          { label: "H5", value: "h5" },
          { label: "H6", value: "h6" },
        ],
      },
    ],
    styles: [
      "sizing",
      "spacing",
      "background",
      "typography",
      "positioning",
    ],
  },
  render: HeadingRenderer,
} satisfies ComponentDefinition<HeadingProps, V1ComponentType>;

export const textPropsSchema = z
  .object({
    text: z.string(),
    semanticTag: z.enum(["p", "span"]),
  })
  .strict();

export type TextProps = z.infer<typeof textPropsSchema>;

export function TextRenderer({
  props,
  style,
  className,
  rootRef,
  rootAttributes,
}: LeafRendererProps<TextProps>) {
  const Root = props.semanticTag;

  return (
    <Root {...rootAttributes} className={className} ref={rootRef} style={style}>
      {props.text}
    </Root>
  );
}

const textStyles = {
  base: {
    display: "block",
    width: { mode: "fill" },
    height: { mode: "auto" },
    backgroundColor: "transparent",
    color: "#475569",
    fontSize: px(16),
    fontWeight: 400,
    lineHeight: 1.6,
    position: "static",
    zIndex: "auto",
  },
} satisfies ResponsiveStyles;

export const textDefinition = {
  version: 1,
  library: {
    label: "Text",
    category: "Typography",
    icon: TextIcon,
  },
  defaults: {
    props: { text: "Text", semanticTag: "p" },
    styles: textStyles,
  },
  children: { allowed: false },
  propsSchema: textPropsSchema,
  inspector: {
    props: [
      { path: "text", label: "Text", control: "textarea" },
      {
        path: "semanticTag",
        label: "Element",
        control: "select",
        options: [
          { label: "Paragraph", value: "p" },
          { label: "Span", value: "span" },
        ],
      },
    ],
    styles: [
      "sizing",
      "spacing",
      "background",
      "typography",
      "positioning",
    ],
  },
  render: TextRenderer,
} satisfies ComponentDefinition<TextProps, V1ComponentType>;

export const labelPropsSchema = z
  .object({
    text: z.string().trim().min(1),
    forId: labelTargetIdSchema,
  })
  .strict();

export type LabelProps = z.infer<typeof labelPropsSchema>;

export function LabelRenderer({
  props,
  style,
  className,
  rootRef,
  rootAttributes,
}: LeafRendererProps<LabelProps>) {
  return (
    <label
      {...rootAttributes}
      className={className}
      htmlFor={props.forId}
      ref={rootRef}
      style={style}
    >
      {props.text}
    </label>
  );
}

const labelStyles = {
  base: {
    display: "flex",
    width: { mode: "fit" },
    height: { mode: "auto" },
    backgroundColor: "transparent",
    color: "#0f172a",
    fontSize: px(14),
    fontWeight: 500,
    lineHeight: 1.4,
    position: "static",
    zIndex: "auto",
  },
} satisfies ResponsiveStyles;

export const labelDefinition = {
  version: 1,
  library: {
    label: "Label",
    category: "Typography",
    icon: LabelIcon,
    searchTerms: ["field label", "form label", "caption"],
  },
  defaults: {
    props: { text: "Label", forId: "field" },
    styles: labelStyles,
  },
  children: { allowed: false },
  propsSchema: labelPropsSchema,
  inspector: {
    props: [
      { path: "text", label: "Text", control: "text" },
      { path: "forId", label: "For control ID", control: "text" },
    ],
    styles: [
      "sizing",
      "spacing",
      "background",
      "border",
      "typography",
      "positioning",
    ],
  },
  render: LabelRenderer,
} satisfies ComponentDefinition<LabelProps, V1ComponentType>;

export const cardPropsSchema = z
  .object({
    semanticTag: z.enum(["article", "div", "aside"]),
  })
  .strict();

export type CardProps = z.infer<typeof cardPropsSchema>;

export function CardRenderer({
  props,
  style,
  className,
  rootRef,
  rootAttributes,
  children,
}: ContainerRendererProps<CardProps>) {
  const Root = props.semanticTag;

  return (
    <Root {...rootAttributes} className={className} ref={rootRef} style={style}>
      {children}
    </Root>
  );
}

const cardStyles = {
  base: {
    display: "flex",
    width: { mode: "fill" },
    height: { mode: "auto" },
    minWidth: px(0),
    maxWidth: { value: 100, unit: "%" },
    padding: spacing(24, 24, 24, 24),
    backgroundColor: "transparent",
    borderRadius: px(12),
    flex: {
      direction: "column",
      wrap: "nowrap",
      justifyContent: "flex-start",
      alignItems: "stretch",
      gap: px(16),
    },
    position: "static",
    zIndex: "auto",
  },
  tablet: { padding: spacing(20, 20, 20, 20) },
  mobile: { padding: spacing(16, 16, 16, 16) },
} satisfies ResponsiveStyles;

export const cardDefinition = {
  version: 1,
  library: {
    label: "Card",
    category: "Layout",
    icon: CardIcon,
  },
  defaults: {
    props: { semanticTag: "article" },
    styles: cardStyles,
  },
  children: { allowed: true, accepts: "any" },
  propsSchema: cardPropsSchema,
  inspector: {
    props: [
      {
        path: "semanticTag",
        label: "Element",
        control: "select",
        options: [
          { label: "Article", value: "article" },
          { label: "Div", value: "div" },
          { label: "Aside", value: "aside" },
        ],
      },
    ],
    styles: [
      "sizing",
      "spacing",
      "background",
      "backgroundImage",
      "border",
      "layout",
      "positioning",
    ],
  },
  render: CardRenderer,
} satisfies ComponentDefinition<CardProps, V1ComponentType>;

const safeHrefSchema = z.string().refine((value) => {
  if (value === "") return true;

  return /^(?:\/(?!\/)|#|https?:\/\/|mailto:|tel:)/i.test(value);
}, "Link must be empty or use a safe URL scheme");

export const imagePropsSchema = z
  .object({
    src: z.string().refine(isSafeImageSource, {
      message: "Image source must be a safe HTTPS URL or root-relative path",
    }),
    alt: z.string().max(500),
    href: safeHrefSchema,
    openInNewTab: z.boolean(),
    fit: z.enum(["contain", "cover", "fill"]),
  })
  .strict()
  .superRefine((props, context) => {
    if (props.href === "" && props.openInNewTab) {
      context.addIssue({
        code: "custom",
        path: ["openInNewTab"],
        message: "An image without a link cannot open in a new tab",
      });
    }

    if (props.href !== "" && props.alt.trim() === "") {
      context.addIssue({
        code: "custom",
        path: ["alt"],
        message: "A linked image requires alternative text",
      });
    }
  });

export type ImageProps = z.infer<typeof imagePropsSchema>;

export function ImageRenderer({
  props,
  style,
  className,
  rootRef,
  rootAttributes,
}: LeafRendererProps<ImageProps>) {
  if (props.href === "") {
    return (
      // Author-controlled sources are not compatible with a build-time remote host allowlist.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        {...rootAttributes}
        alt={props.alt}
        className={className}
        ref={rootRef}
        src={props.src}
        style={{ ...style, objectFit: props.fit }}
      />
    );
  }

  return (
    <a
      {...rootAttributes}
      className={className}
      href={props.href}
      ref={rootRef}
      rel={props.openInNewTab ? "noopener noreferrer" : undefined}
      style={style}
      target={props.openInNewTab ? "_blank" : undefined}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        alt={props.alt}
        src={props.src}
        style={{ display: "block", height: "100%", objectFit: props.fit, width: "100%" }}
      />
    </a>
  );
}

const imageStyles = {
  base: {
    display: "block",
    width: { mode: "fixed", value: 240, unit: "px" },
    height: { mode: "fixed", value: 160, unit: "px" },
    maxWidth: { value: 100, unit: "%" },
    margin: spacing(0, 0, 0, 0),
    padding: spacing(0, 0, 0, 0),
    backgroundColor: "transparent",
    borderWidth: { value: 0, unit: "px" },
    borderStyle: "none",
    borderColor: "transparent",
    borderRadius: px(0),
    position: "static",
    zIndex: "auto",
  },
} satisfies ResponsiveStyles;

export const imageDefinition = {
  version: 1,
  library: {
    label: "Image",
    category: "Media",
    icon: ImageIcon,
    searchTerms: ["logo", "picture", "photo", "svg"],
  },
  defaults: {
    props: {
      src: "/saturn-mark.svg",
      alt: "Image",
      href: "",
      openInNewTab: false,
      fit: "contain",
    },
    styles: imageStyles,
  },
  children: { allowed: false },
  propsSchema: imagePropsSchema,
  inspector: {
    props: [
      { path: "src", label: "Image source", control: "url" },
      { path: "alt", label: "Alternative text", control: "text" },
      { path: "href", label: "Link", control: "url" },
      {
        path: "openInNewTab",
        label: "Open in new tab",
        control: "boolean",
      },
      {
        path: "fit",
        label: "Fit",
        control: "select",
        options: [
          { label: "Contain", value: "contain" },
          { label: "Cover", value: "cover" },
          { label: "Fill", value: "fill" },
        ],
      },
    ],
    styles: [
      "sizing",
      "spacing",
      "background",
      "border",
      "positioning",
    ],
  },
  render: ImageRenderer,
} satisfies ComponentDefinition<ImageProps, V1ComponentType>;

export const linkPropsSchema = z
  .object({
    text: z.string().min(1),
    href: safeHrefSchema.refine(
      (value) => value !== "",
      "A link requires a destination",
    ),
    openInNewTab: z.boolean(),
  })
  .strict();

export type LinkProps = z.infer<typeof linkPropsSchema>;

export function LinkRenderer({
  props,
  style,
  className,
  rootRef,
  rootAttributes,
}: LeafRendererProps<LinkProps>) {
  return (
    <a
      {...rootAttributes}
      className={className}
      href={props.href}
      ref={rootRef}
      rel={props.openInNewTab ? "noopener noreferrer" : undefined}
      style={style}
      target={props.openInNewTab ? "_blank" : undefined}
    >
      {props.text}
    </a>
  );
}

const linkStyles = {
  base: {
    display: "flex",
    width: { mode: "fit" },
    height: { mode: "auto" },
    padding: spacing(8, 4, 8, 4),
    backgroundColor: "transparent",
    color: "#0f172a",
    fontSize: px(16),
    fontWeight: 500,
    lineHeight: 1.2,
    letterSpacing: px(0),
    textDecoration: "underline",
    position: "static",
    zIndex: "auto",
  },
} satisfies ResponsiveStyles;

export const linkDefinition = {
  version: 1,
  library: {
    label: "Link",
    category: "Actions",
    icon: LinkIcon,
  },
  defaults: {
    props: {
      text: "Link",
      href: "#",
      openInNewTab: false,
    },
    styles: linkStyles,
  },
  children: { allowed: false },
  propsSchema: linkPropsSchema,
  inspector: {
    props: [
      { path: "text", label: "Text", control: "text" },
      { path: "href", label: "Link", control: "url" },
      {
        path: "openInNewTab",
        label: "Open in new tab",
        control: "boolean",
      },
    ],
    styles: [
      "sizing",
      "spacing",
      "background",
      "border",
      "typography",
      "positioning",
    ],
  },
  render: LinkRenderer,
} satisfies ComponentDefinition<LinkProps, V1ComponentType>;

const buttonV1PropsSchema = z
  .object({
    text: z.string().min(1),
    href: safeHrefSchema,
    openInNewTab: z.boolean(),
  })
  .strict()
  .superRefine((props, context) => {
    if (props.href === "" && props.openInNewTab) {
      context.addIssue({
        code: "custom",
        path: ["openInNewTab"],
        message: "A button without a link cannot open in a new tab",
      });
    }
  });

const buttonV2PropsSchema = z
  .object({
    text: z.string().min(1),
    href: safeHrefSchema,
    openInNewTab: z.boolean(),
    icon: z.enum(BUTTON_ICON_NAMES).nullable(),
    iconPosition: z.enum(["start", "end"]),
  })
  .strict()
  .superRefine((props, context) => {
    if (props.href === "" && props.openInNewTab) {
      context.addIssue({
        code: "custom",
        path: ["openInNewTab"],
        message: "A button without a link cannot open in a new tab",
      });
    }
  });

const buttonV3PropsSchema = z
  .object({
    text: z.string().min(1),
    href: safeHrefSchema,
    openInNewTab: z.boolean(),
    icon: z.enum(BUTTON_ICON_NAMES).nullable(),
    iconPosition: z.enum(["start", "end"]),
    behavior: z.enum(["button", "submit"]),
  })
  .strict()
  .superRefine((props, context) => {
    if (props.href === "" && props.openInNewTab) {
      context.addIssue({
        code: "custom",
        path: ["openInNewTab"],
        message: "A button without a link cannot open in a new tab",
      });
    }

    if (props.href !== "" && props.behavior === "submit") {
      context.addIssue({
        code: "custom",
        path: ["behavior"],
        message: "A linked button cannot submit a form",
      });
    }
  });

const buttonV4PropsSchema = z
  .object({
    text: z.string().min(1),
    href: safeHrefSchema,
    openInNewTab: z.boolean(),
    icon: z.enum(BUTTON_ICON_NAMES).nullable(),
    iconPosition: z.enum(["start", "end"]),
    iconAnimation: z.enum(["none", "shift-right"]),
    behavior: z.enum(["button", "submit"]),
  })
  .strict()
  .superRefine((props, context) => {
    if (props.href === "" && props.openInNewTab) {
      context.addIssue({
        code: "custom",
        path: ["openInNewTab"],
        message: "A button without a link cannot open in a new tab",
      });
    }

    if (props.href !== "" && props.behavior === "submit") {
      context.addIssue({
        code: "custom",
        path: ["behavior"],
        message: "A linked button cannot submit a form",
      });
    }
  });

export const buttonPropsSchema = z
  .object({
    text: z.string().min(1),
    href: safeHrefSchema,
    openInNewTab: z.boolean(),
    icon: z.enum(BUTTON_ICON_NAMES).nullable(),
    iconPosition: z.enum(["start", "end"]),
    iconAnimation: z.enum(["none", "shift-right"]),
    behavior: z.enum(["button", "submit"]),
    targetStateNodeId: nodeReferenceIdSchema,
    stateAction: z.enum(["none", "turn-on", "turn-off", "toggle"]),
  })
  .strict()
  .superRefine((props, context) => {
    if (props.href === "" && props.openInNewTab) {
      context.addIssue({
        code: "custom",
        path: ["openInNewTab"],
        message: "A button without a link cannot open in a new tab",
      });
    }

    if (props.href !== "" && props.behavior === "submit") {
      context.addIssue({
        code: "custom",
        path: ["behavior"],
        message: "A linked button cannot submit a form",
      });
    }

    if (props.stateAction !== "none" && props.href !== "") {
      context.addIssue({
        code: "custom",
        path: ["stateAction"],
        message: "A linked button cannot run a Boolean State action",
      });
    }

    if (props.stateAction !== "none" && props.behavior !== "button") {
      context.addIssue({
        code: "custom",
        path: ["stateAction"],
        message: "A submit button cannot run a Boolean State action",
      });
    }

    if (props.stateAction === "none" && props.targetStateNodeId !== "") {
      context.addIssue({
        code: "custom",
        path: ["targetStateNodeId"],
        message: "A button without a state action cannot keep a state target",
      });
    }
  });

export type ButtonProps = z.infer<typeof buttonPropsSchema>;

export function ButtonRenderer({
  props,
  style,
  className,
  rootRef,
  rootAttributes,
  runtime,
}: LeafRendererProps<ButtonProps>) {
  const stateRuntime = useBooleanStateRuntime();
  const stateNodeId = asNodeId(props.targetStateNodeId);
  const hasStateAction = props.stateAction !== "none";
  const stateTargetExists =
    hasStateAction &&
    props.targetStateNodeId !== "" &&
    stateRuntime?.has(stateNodeId) === true;
  const handleClick = (event: MouseEvent<HTMLElement>) => {
    if (!hasStateAction) {
      if (runtime?.mode === "editor") event.preventDefault();
      return;
    }

    event.preventDefault();
    if (!stateRuntime || !stateTargetExists) return;
    if (props.stateAction === "toggle") {
      stateRuntime.dispatch({ kind: "boolean.toggle", stateNodeId });
      return;
    }
    stateRuntime.dispatch({
      kind: "boolean.set",
      stateNodeId,
      value: props.stateAction === "turn-on",
    });
  };
  const content = (
    <>
      {props.icon !== null && props.iconPosition === "start" ? (
        <ButtonContentIcon name={props.icon} />
      ) : null}
      <span>{props.text}</span>
      {props.icon !== null && props.iconPosition === "end" ? (
        <ButtonContentIcon name={props.icon} />
      ) : null}
    </>
  );

  if (props.href === "") {
    return (
      <button
        {...rootAttributes}
        aria-disabled={hasStateAction && !stateTargetExists}
        className={className}
        data-button-icon-animation={props.iconAnimation}
        data-state-target-status={
          hasStateAction
            ? stateTargetExists
              ? "resolved"
              : "unresolved"
            : undefined
        }
        onClick={handleClick}
        ref={rootRef}
        style={style}
        type={props.behavior}
      >
        {content}
      </button>
    );
  }

  return (
    <a
      {...rootAttributes}
      className={className}
      data-button-icon-animation={props.iconAnimation}
      href={props.href}
      onClick={handleClick}
      ref={rootRef}
      rel={props.openInNewTab ? "noopener noreferrer" : undefined}
      style={style}
      target={props.openInNewTab ? "_blank" : undefined}
    >
      {content}
    </a>
  );
}

const buttonStyles = {
  base: {
    display: "flex",
    width: { mode: "fit" },
    height: { mode: "auto" },
    padding: spacing(12, 20, 12, 20),
    backgroundColor: "#6d5dfc",
    color: "#ffffff",
    fontSize: px(16),
    fontWeight: 650,
    lineHeight: 1.2,
    letterSpacing: px(0),
    borderWidth: { value: 0, unit: "px" },
    borderStyle: "none",
    borderColor: "transparent",
    borderRadius: px(8),
    flex: {
      direction: "row",
      wrap: "nowrap",
      justifyContent: "center",
      alignItems: "center",
      gap: px(8),
    },
    position: "static",
    zIndex: "auto",
  },
  mobile: { width: { mode: "fill" } },
} satisfies ResponsiveStyles;

export const buttonDefinition = {
  version: 5,
  library: {
    label: "Button",
    category: "Actions",
    icon: ButtonIcon,
  },
  defaults: {
    props: {
      text: "Button",
      href: "",
      openInNewTab: false,
      icon: null,
      iconPosition: "start",
      iconAnimation: "none",
      behavior: "button",
      targetStateNodeId: "",
      stateAction: "none",
    },
    styles: buttonStyles,
  },
  children: { allowed: false },
  editor: { directInteraction: true },
  propsSchema: buttonPropsSchema,
  references: [
    {
      path: "targetStateNodeId",
      targetType: "boolean-state",
      scope: "page",
      onDuplicate: "remap-if-target-cloned",
    },
  ],
  migrations: [
    {
      fromVersion: 1,
      toVersion: 2,
      migrate: (value) => {
        const props = buttonV1PropsSchema.parse(value.props);

        return {
          props: { ...props, icon: null, iconPosition: "start" },
          styles: { ...value.styles },
        };
      },
    },
    {
      fromVersion: 2,
      toVersion: 3,
      migrate: (value) => {
        const props = buttonV2PropsSchema.parse(value.props);

        return {
          props: { ...props, behavior: "button" },
          styles: { ...value.styles },
        };
      },
    },
    {
      fromVersion: 3,
      toVersion: 4,
      migrate: (value) => {
        const props = buttonV3PropsSchema.parse(value.props);

        return {
          props: { ...props, iconAnimation: "none" },
          styles: { ...value.styles },
        };
      },
    },
    {
      fromVersion: 4,
      toVersion: 5,
      migrate: (value) => {
        const props = buttonV4PropsSchema.parse(value.props);

        return {
          props: {
            ...props,
            targetStateNodeId: "",
            stateAction: "none",
          },
          styles: { ...value.styles },
        };
      },
    },
  ],
  inspector: {
    props: [
      { path: "text", label: "Text", control: "text" },
      {
        path: "icon",
        label: "Icon",
        control: "select",
        options: BUTTON_ICON_OPTIONS,
      },
      {
        path: "iconPosition",
        label: "Icon position",
        control: "select",
        options: [
          { label: "Before text", value: "start" },
          { label: "After text", value: "end" },
        ],
      },
      {
        path: "iconAnimation",
        label: "Icon animation",
        control: "select",
        options: [
          { label: "None", value: "none" },
          { label: "Shift right on hover", value: "shift-right" },
        ],
      },
      {
        path: "behavior",
        label: "Behavior",
        control: "select",
        options: [
          { label: "Regular button", value: "button" },
          { label: "Submit form", value: "submit" },
        ],
      },
      { path: "href", label: "Link", control: "url" },
      {
        path: "openInNewTab",
        label: "Open in new tab",
        control: "boolean",
      },
    ],
    styles: [
      "sizing",
      "spacing",
      "background",
      "border",
      "typography",
      "positioning",
    ],
  },
  render: ButtonRenderer,
} satisfies ComponentDefinition<ButtonProps, V1ComponentType>;

export const formPropsSchema = z
  .object({
    label: z.string().trim().min(1),
    name: z
      .string()
      .trim()
      .min(1)
      .max(100)
      .regex(
        /^[A-Za-z][A-Za-z0-9_-]*$/,
        "Form name must start with a letter and use only letters, numbers, underscores, or hyphens",
      ),
    successMessage: z.string().trim().min(1),
    errorMessage: z.string().trim().min(1),
  })
  .strict();

export type FormProps = z.infer<typeof formPropsSchema>;

export function FormRenderer({
  props,
  style,
  className,
  rootRef,
  rootAttributes,
  runtime,
  children,
}: ContainerRendererProps<FormProps>) {
  return (
    <form
      {...rootAttributes}
      aria-label={props.label}
      className={className}
      method="post"
      name={props.name}
      onSubmit={(event) => event.preventDefault()}
      ref={rootRef}
      style={style}
    >
      {children}
      {runtime?.mode === "preview" && runtime.formSubmissionNotice ? (
        <p className="form-submission-notice" role="note">
          {runtime.formSubmissionNotice}
        </p>
      ) : null}
    </form>
  );
}

const formStyles = {
  base: {
    display: "flex",
    width: { mode: "fill" },
    height: { mode: "auto" },
    minWidth: px(0),
    padding: spacing(24, 24, 24, 24),
    flex: {
      direction: "column",
      wrap: "nowrap",
      justifyContent: "flex-start",
      alignItems: "stretch",
      gap: px(16),
    },
    position: "static",
    zIndex: "auto",
  },
} satisfies ResponsiveStyles;

export const formDefinition = {
  version: 1,
  library: {
    label: "Form",
    category: "Forms",
    icon: FormIcon,
  },
  defaults: {
    props: {
      label: "Form",
      name: "form",
      successMessage: "Thanks! Your submission was received.",
      errorMessage: "Unable to submit the form. Please try again.",
    },
    styles: formStyles,
  },
  children: {
    allowed: true,
    accepts: [
      "heading",
      "text",
      "label",
      "link",
      "button",
      "input",
      "textarea",
      "dropdown",
      "radio-group",
      "checkbox",
      "checkbox-group",
    ],
  },
  propsSchema: formPropsSchema,
  inspector: {
    props: [
      { path: "label", label: "Accessible label", control: "text" },
      { path: "name", label: "Form name", control: "text" },
    ],
    styles: [
      "sizing",
      "spacing",
      "background",
      "backgroundImage",
      "border",
      "layout",
      "positioning",
    ],
  },
  render: FormRenderer,
} satisfies ComponentDefinition<FormProps, V1ComponentType>;

const inputV1PropsSchema = z
  .object({
    label: z.string().trim().min(1),
    name: z.string().trim(),
    inputType: z.enum(["text", "email", "tel", "url", "password", "number"]),
    placeholder: z.string(),
    defaultValue: z.string(),
    required: z.boolean(),
    disabled: z.boolean(),
  })
  .strict();

const inputV2PropsSchema = inputV1PropsSchema
  .extend({
    allowPasswordReveal: z.boolean(),
  })
  .strict();

export const inputPropsSchema = inputV2PropsSchema
  .extend({
    controlId: controlIdSchema,
  })
  .strict();

export type InputProps = z.infer<typeof inputPropsSchema>;

type PasswordRevealInputProps = LeafRendererProps<InputProps> & {
  value: string;
  onValueChange: (value: string) => void;
};

function PasswordRevealInput({
  props,
  style,
  className,
  rootRef,
  runtime,
  rootAttributes,
  value,
  onValueChange,
}: PasswordRevealInputProps) {
  const [passwordIsVisible, setPasswordIsVisible] = useState(false);
  const toggleLabel = `${passwordIsVisible ? "Hide" : "Show"} ${props.label}`;

  return (
    <span
      {...rootAttributes}
      className={["password-input-shell", className]
        .filter(Boolean)
        .join(" ")}
      data-disabled={props.disabled ? "true" : undefined}
      ref={rootRef}
      style={style}
    >
      <span className="password-input-control">
        <input
          aria-label={props.controlId === "" ? props.label : undefined}
          disabled={props.disabled}
          id={props.controlId || undefined}
          name={props.name || undefined}
          onChange={(event) => onValueChange(event.currentTarget.value)}
          placeholder={props.placeholder}
          required={props.required}
          type={passwordIsVisible ? "text" : "password"}
          value={value}
        />
        <button
          aria-label={toggleLabel}
          className="password-visibility-toggle"
          disabled={props.disabled}
          onClick={() => {
            if (runtime?.mode !== "editor") {
              setPasswordIsVisible((current) => !current);
            }
          }}
          title={toggleLabel}
          type="button"
        >
          <PasswordVisibilityIcon visible={passwordIsVisible} />
        </button>
      </span>
    </span>
  );
}

export function InputRenderer({
  props,
  style,
  className,
  rootRef,
  runtime,
  rootAttributes,
}: LeafRendererProps<InputProps>) {
  const valueKey = JSON.stringify([props.defaultValue, props.inputType]);
  const [liveValue, setLiveValue] = useState({
    key: valueKey,
    value: props.defaultValue,
  });
  const value = liveValue.key === valueKey ? liveValue.value : props.defaultValue;
  const canRevealPassword =
    props.inputType === "password" && props.allowPasswordReveal;

  if (canRevealPassword) {
    return (
      <PasswordRevealInput
        className={className}
        onValueChange={(nextValue) =>
          setLiveValue({ key: valueKey, value: nextValue })
        }
        props={props}
        rootAttributes={rootAttributes}
        rootRef={rootRef}
        runtime={runtime}
        style={style}
        value={value}
      />
    );
  }

  return (
    <input
      {...rootAttributes}
      aria-label={props.controlId === "" ? props.label : undefined}
      className={className}
      disabled={props.disabled}
      id={props.controlId || undefined}
      name={props.name || undefined}
      onChange={(event) =>
        setLiveValue({ key: valueKey, value: event.currentTarget.value })
      }
      placeholder={props.placeholder}
      ref={rootRef}
      required={props.required}
      style={style}
      type={props.inputType}
      value={value}
    />
  );
}

const inputStyles = {
  base: {
    display: "block",
    width: { mode: "fill" },
    height: { mode: "auto" },
    minWidth: px(0),
    padding: spacing(10, 12, 10, 12),
    backgroundColor: "#ffffff",
    color: "#0f172a",
    fontSize: px(16),
    fontWeight: 400,
    lineHeight: 1.4,
    borderWidth: { value: 1, unit: "px" },
    borderStyle: "solid",
    borderColor: "#cbd5e1",
    borderRadius: px(8),
    position: "static",
    zIndex: "auto",
  },
} satisfies ResponsiveStyles;

export const inputDefinition = {
  version: 3,
  library: {
    label: "Input",
    category: "Inputs",
    icon: InputIcon,
  },
  defaults: {
    props: {
      label: "Input",
      controlId: "",
      name: "",
      inputType: "text",
      allowPasswordReveal: false,
      placeholder: "Enter text",
      defaultValue: "",
      required: false,
      disabled: false,
    },
    styles: inputStyles,
  },
  children: { allowed: false },
  propsSchema: inputPropsSchema,
  migrations: [
    {
      fromVersion: 1,
      toVersion: 2,
      migrate: (value) => {
        const props = inputV1PropsSchema.parse(value.props);

        return {
          props: { ...props, allowPasswordReveal: false },
          styles: { ...value.styles },
        };
      },
    },
    {
      fromVersion: 2,
      toVersion: 3,
      migrate: (value) => {
        const props = inputV2PropsSchema.parse(value.props);

        return {
          props: { ...props, controlId: "" },
          styles: { ...value.styles },
        };
      },
    },
  ],
  inspector: {
    props: [
      { path: "label", label: "Accessible label", control: "text" },
      { path: "controlId", label: "Control ID (for Label)", control: "text" },
      { path: "name", label: "Form field name", control: "text" },
      {
        path: "inputType",
        label: "Input type",
        control: "select",
        options: [
          { label: "Text", value: "text" },
          { label: "Email", value: "email" },
          { label: "Phone", value: "tel" },
          { label: "URL", value: "url" },
          { label: "Password", value: "password" },
          { label: "Number", value: "number" },
        ],
      },
      {
        path: "allowPasswordReveal",
        label: "Allow password reveal",
        control: "boolean",
      },
      { path: "placeholder", label: "Placeholder", control: "text" },
      { path: "defaultValue", label: "Default value", control: "text" },
      { path: "required", label: "Required", control: "boolean" },
      { path: "disabled", label: "Disabled", control: "boolean" },
    ],
    styles: [
      "sizing",
      "spacing",
      "background",
      "border",
      "typography",
      "positioning",
    ],
  },
  render: InputRenderer,
} satisfies ComponentDefinition<InputProps, V1ComponentType>;

const textareaV1PropsSchema = z
  .object({
    label: z.string().trim().min(1),
    name: z.string().trim(),
    placeholder: z.string(),
    defaultValue: z.string(),
    rows: z.number().int().min(2).max(20),
    required: z.boolean(),
    disabled: z.boolean(),
  })
  .strict();

export const textareaPropsSchema = textareaV1PropsSchema
  .extend({
    controlId: controlIdSchema,
  })
  .strict();

export type TextareaProps = z.infer<typeof textareaPropsSchema>;

export function TextareaRenderer({
  props,
  style,
  className,
  rootRef,
  rootAttributes,
}: LeafRendererProps<TextareaProps>) {
  const valueKey = props.defaultValue;
  const [liveValue, setLiveValue] = useState({
    key: valueKey,
    value: props.defaultValue,
  });
  const value = liveValue.key === valueKey ? liveValue.value : props.defaultValue;

  return (
    <textarea
      {...rootAttributes}
      aria-label={props.controlId === "" ? props.label : undefined}
      className={className}
      disabled={props.disabled}
      id={props.controlId || undefined}
      name={props.name || undefined}
      onChange={(event) =>
        setLiveValue({ key: valueKey, value: event.currentTarget.value })
      }
      placeholder={props.placeholder}
      ref={rootRef}
      required={props.required}
      rows={props.rows}
      style={{ ...style, resize: "none" }}
      value={value}
    />
  );
}

const textareaStyles = {
  base: {
    display: "block",
    width: { mode: "fill" },
    height: { mode: "auto" },
    minWidth: px(0),
    padding: spacing(10, 12, 10, 12),
    backgroundColor: "#ffffff",
    color: "#0f172a",
    fontSize: px(16),
    fontWeight: 400,
    lineHeight: 1.4,
    borderWidth: { value: 1, unit: "px" },
    borderStyle: "solid",
    borderColor: "#cbd5e1",
    borderRadius: px(8),
    position: "static",
    zIndex: "auto",
  },
} satisfies ResponsiveStyles;

export const textareaDefinition = {
  version: 2,
  library: {
    label: "Textarea",
    category: "Inputs",
    icon: TextareaIcon,
    searchTerms: ["multiline", "text area"],
  },
  defaults: {
    props: {
      label: "Textarea",
      controlId: "",
      name: "",
      placeholder: "Enter text",
      defaultValue: "",
      rows: 4,
      required: false,
      disabled: false,
    },
    styles: textareaStyles,
  },
  children: { allowed: false },
  propsSchema: textareaPropsSchema,
  migrations: [
    {
      fromVersion: 1,
      toVersion: 2,
      migrate: (value) => {
        const props = textareaV1PropsSchema.parse(value.props);

        return {
          props: { ...props, controlId: "" },
          styles: { ...value.styles },
        };
      },
    },
  ],
  inspector: {
    props: [
      { path: "label", label: "Accessible label", control: "text" },
      { path: "controlId", label: "Control ID (for Label)", control: "text" },
      { path: "name", label: "Form field name", control: "text" },
      { path: "placeholder", label: "Placeholder", control: "text" },
      { path: "defaultValue", label: "Default value", control: "textarea" },
      { path: "rows", label: "Rows", control: "number" },
      { path: "required", label: "Required", control: "boolean" },
      { path: "disabled", label: "Disabled", control: "boolean" },
    ],
    styles: [
      "sizing",
      "spacing",
      "background",
      "border",
      "typography",
      "positioning",
    ],
  },
  render: TextareaRenderer,
} satisfies ComponentDefinition<TextareaProps, V1ComponentType>;

const dropdownV1PropsBaseSchema = z
  .object({
    label: z.string().trim().min(1),
    name: z.string().trim(),
    options: z.array(z.string().trim().min(1)).min(1),
    placeholder: z.string(),
    defaultValue: z.string(),
    required: z.boolean(),
    disabled: z.boolean(),
  })
  .strict();

type DropdownV1Props = z.infer<typeof dropdownV1PropsBaseSchema>;

function dropdownValidationIssues(props: DropdownV1Props) {
  const issues: { path: (string | number)[]; message: string }[] = [];
  const optionValues = new Set<string>();

  props.options.forEach((option, index) => {
    if (optionValues.has(option)) {
      issues.push({
        path: ["options", index],
        message: "Dropdown options must be unique",
      });
    }
    optionValues.add(option);
  });

  if (props.defaultValue !== "" && !optionValues.has(props.defaultValue)) {
    issues.push({
      path: ["defaultValue"],
      message: "Dropdown default value must reference an option",
    });
  }

  return issues;
}

const dropdownV1PropsSchema = dropdownV1PropsBaseSchema.superRefine(
  (props, context) => {
    dropdownValidationIssues(props).forEach((issue) => {
      context.addIssue({ code: "custom", ...issue });
    });
  },
);

export const dropdownPropsSchema = dropdownV1PropsBaseSchema
  .extend({
    controlId: controlIdSchema,
  })
  .strict()
  .superRefine((props, context) => {
    dropdownValidationIssues(props).forEach((issue) => {
      context.addIssue({ code: "custom", ...issue });
    });
  });

export type DropdownProps = z.infer<typeof dropdownPropsSchema>;

export function DropdownRenderer({
  props,
  style,
  className,
  rootRef,
  rootAttributes,
}: LeafRendererProps<DropdownProps>) {
  const selectionKey = JSON.stringify([props.defaultValue, props.options]);
  const [selection, setSelection] = useState({
    key: selectionKey,
    value: props.defaultValue,
  });
  const selectedValue =
    selection.key === selectionKey ? selection.value : props.defaultValue;

  return (
    <select
      {...rootAttributes}
      aria-label={props.controlId === "" ? props.label : undefined}
      className={["dropdown-control", className].filter(Boolean).join(" ")}
      disabled={props.disabled}
      id={props.controlId || undefined}
      name={props.name || undefined}
      onChange={(event) =>
        setSelection({ key: selectionKey, value: event.currentTarget.value })
      }
      ref={rootRef}
      required={props.required}
      style={style}
      value={selectedValue}
    >
      {props.placeholder !== "" ? (
        <option disabled key="placeholder" value="">
          {props.placeholder}
        </option>
      ) : null}
      {props.options.map((option) => (
        <option key={`option:${option}`} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}

const dropdownStyles = {
  base: {
    display: "block",
    width: { mode: "fill" },
    height: { mode: "auto" },
    minWidth: px(0),
    padding: spacing(10, 12, 10, 12),
    backgroundColor: "#ffffff",
    color: "#0f172a",
    fontSize: px(16),
    fontWeight: 400,
    lineHeight: 1.4,
    borderWidth: { value: 1, unit: "px" },
    borderStyle: "solid",
    borderColor: "#cbd5e1",
    borderRadius: px(8),
    position: "static",
    zIndex: "auto",
  },
} satisfies ResponsiveStyles;

export const dropdownDefinition = {
  version: 2,
  library: {
    label: "Dropdown",
    category: "Selectors",
    icon: DropdownIcon,
    searchTerms: ["select"],
  },
  defaults: {
    props: {
      label: "Dropdown",
      controlId: "",
      name: "",
      options: ["Option one", "Option two", "Option three"],
      placeholder: "Choose an option",
      defaultValue: "",
      required: false,
      disabled: false,
    },
    styles: dropdownStyles,
  },
  children: { allowed: false },
  propsSchema: dropdownPropsSchema,
  migrations: [
    {
      fromVersion: 1,
      toVersion: 2,
      migrate: (value) => {
        const props = dropdownV1PropsSchema.parse(value.props);

        return {
          props: { ...props, controlId: "" },
          styles: { ...value.styles },
        };
      },
    },
  ],
  inspector: {
    props: [
      { path: "label", label: "Accessible label", control: "text" },
      { path: "controlId", label: "Control ID (for Label)", control: "text" },
      { path: "name", label: "Form name", control: "text" },
      { path: "options", label: "Options", control: "string-list" },
      { path: "placeholder", label: "Placeholder", control: "text" },
      { path: "defaultValue", label: "Default value", control: "text" },
      { path: "required", label: "Required", control: "boolean" },
      { path: "disabled", label: "Disabled", control: "boolean" },
    ],
    styles: [
      "sizing",
      "spacing",
      "background",
      "border",
      "typography",
      "positioning",
    ],
  },
  render: DropdownRenderer,
} satisfies ComponentDefinition<DropdownProps, V1ComponentType>;

export const radioGroupPropsSchema = z
  .object({
    label: z.string().trim().min(1),
    name: z.string().trim().min(1).max(100),
    options: z.array(z.string().trim().min(1)).min(1).max(100),
    defaultValue: z.string(),
    orientation: z.enum(["vertical", "horizontal"]),
    required: z.boolean(),
    disabled: z.boolean(),
  })
  .strict()
  .superRefine((props, context) => {
    const optionValues = new Set<string>();

    props.options.forEach((option, index) => {
      if (optionValues.has(option)) {
        context.addIssue({
          code: "custom",
          path: ["options", index],
          message: "Radio Group options must be unique",
        });
      }
      optionValues.add(option);
    });

    if (props.defaultValue !== "" && !optionValues.has(props.defaultValue)) {
      context.addIssue({
        code: "custom",
        path: ["defaultValue"],
        message: "Radio Group default value must reference an option",
      });
    }
  });

export type RadioGroupProps = z.infer<typeof radioGroupPropsSchema>;

export function RadioGroupRenderer({
  props,
  style,
  className,
  rootRef,
  rootAttributes,
}: LeafRendererProps<RadioGroupProps>) {
  const selectionKey = JSON.stringify([props.defaultValue, props.options]);
  const [selection, setSelection] = useState({
    key: selectionKey,
    value: props.defaultValue,
  });
  const selectedValue =
    selection.key === selectionKey ? selection.value : props.defaultValue;

  return (
    <fieldset
      {...rootAttributes}
      className={["radio-group", className].filter(Boolean).join(" ")}
      data-orientation={props.orientation}
      disabled={props.disabled}
      ref={rootRef}
      style={style}
    >
      <legend>{props.label}</legend>
      <span className="radio-group-options">
        {props.options.map((option) => (
          <label className="radio-group-option" key={option}>
            <input
              checked={selectedValue === option}
              disabled={props.disabled}
              name={props.name}
              onChange={(event) => {
                if (event.currentTarget.checked) {
                  setSelection({ key: selectionKey, value: option });
                }
              }}
              required={props.required}
              type="radio"
              value={option}
            />
            <span>{option}</span>
          </label>
        ))}
      </span>
    </fieldset>
  );
}

const radioGroupStyles = {
  base: {
    display: "block",
    width: { mode: "fill" },
    height: { mode: "auto" },
    minWidth: px(0),
    padding: spacing(16, 16, 16, 16),
    backgroundColor: "#ffffff",
    color: "#0f172a",
    fontSize: px(16),
    fontWeight: 400,
    lineHeight: 1.4,
    borderWidth: { value: 1, unit: "px" },
    borderStyle: "solid",
    borderColor: "#cbd5e1",
    borderRadius: px(8),
    position: "static",
    zIndex: "auto",
  },
} satisfies ResponsiveStyles;

export const radioGroupDefinition = {
  version: 1,
  library: {
    label: "Radio Group",
    category: "Choices",
    icon: RadioGroupIcon,
    searchTerms: ["radio", "choice", "options"],
  },
  defaults: {
    props: {
      label: "Choose an option",
      name: "choice",
      options: ["Option one", "Option two", "Option three"],
      defaultValue: "",
      orientation: "vertical",
      required: false,
      disabled: false,
    },
    styles: radioGroupStyles,
  },
  children: { allowed: false },
  propsSchema: radioGroupPropsSchema,
  inspector: {
    props: [
      { path: "label", label: "Group label", control: "text" },
      { path: "name", label: "Form field name", control: "text" },
      { path: "options", label: "Options", control: "string-list" },
      { path: "defaultValue", label: "Default value", control: "text" },
      {
        path: "orientation",
        label: "Orientation",
        control: "select",
        options: [
          { label: "Vertical", value: "vertical" },
          { label: "Horizontal", value: "horizontal" },
        ],
      },
      { path: "required", label: "Required", control: "boolean" },
      { path: "disabled", label: "Disabled", control: "boolean" },
    ],
    styles: [
      "sizing",
      "spacing",
      "background",
      "border",
      "typography",
      "positioning",
    ],
  },
  render: RadioGroupRenderer,
} satisfies ComponentDefinition<RadioGroupProps, V1ComponentType>;

export const checkboxPropsSchema = z
  .object({
    label: z.string().trim().min(1),
    name: z.string().trim(),
    value: z.string().trim().min(1).max(10_000),
    defaultChecked: z.boolean(),
    required: z.boolean(),
    disabled: z.boolean(),
  })
  .strict();

export type CheckboxProps = z.infer<typeof checkboxPropsSchema>;

export function CheckboxRenderer({
  props,
  style,
  className,
  rootRef,
  rootAttributes,
}: LeafRendererProps<CheckboxProps>) {
  const checkedKey = props.defaultChecked ? "checked" : "unchecked";
  const [liveChecked, setLiveChecked] = useState({
    key: checkedKey,
    value: props.defaultChecked,
  });
  const checked =
    liveChecked.key === checkedKey ? liveChecked.value : props.defaultChecked;

  return (
    <label
      {...rootAttributes}
      className={["checkbox-control", className].filter(Boolean).join(" ")}
      data-disabled={props.disabled}
      ref={rootRef}
      style={style}
    >
      <input
        checked={checked}
        disabled={props.disabled}
        name={props.name || undefined}
        onChange={(event) => {
          setLiveChecked({
            key: checkedKey,
            value: event.currentTarget.checked,
          });
        }}
        required={props.required}
        type="checkbox"
        value={props.value}
      />
      <span>{props.label}</span>
    </label>
  );
}

const checkboxStyles = {
  base: {
    display: "flex",
    width: { mode: "fit" },
    height: { mode: "auto" },
    minWidth: px(0),
    padding: spacing(8, 10, 8, 10),
    backgroundColor: "#ffffff",
    color: "#0f172a",
    fontSize: px(16),
    fontWeight: 400,
    lineHeight: 1.4,
    borderWidth: { value: 1, unit: "px" },
    borderStyle: "solid",
    borderColor: "#cbd5e1",
    borderRadius: px(8),
    position: "static",
    zIndex: "auto",
  },
} satisfies ResponsiveStyles;

export const checkboxDefinition = {
  version: 1,
  library: {
    label: "Checkbox",
    category: "Choices",
    icon: CheckboxIcon,
    searchTerms: ["check", "boolean", "consent"],
  },
  defaults: {
    props: {
      label: "Checkbox",
      name: "",
      value: "on",
      defaultChecked: false,
      required: false,
      disabled: false,
    },
    styles: checkboxStyles,
  },
  children: { allowed: false },
  propsSchema: checkboxPropsSchema,
  inspector: {
    props: [
      { path: "label", label: "Label", control: "text" },
      { path: "name", label: "Form field name", control: "text" },
      { path: "value", label: "Submitted value", control: "text" },
      {
        path: "defaultChecked",
        label: "Checked by default",
        control: "boolean",
      },
      { path: "required", label: "Required", control: "boolean" },
      { path: "disabled", label: "Disabled", control: "boolean" },
    ],
    styles: [
      "sizing",
      "spacing",
      "background",
      "border",
      "typography",
      "positioning",
    ],
  },
  render: CheckboxRenderer,
} satisfies ComponentDefinition<CheckboxProps, V1ComponentType>;

export const checkboxGroupPropsSchema = z
  .object({
    label: z.string().trim().min(1),
    name: z.string().trim().min(1).max(100),
    options: z.array(z.string().trim().min(1)).min(1).max(100),
    defaultValues: z.array(z.string().trim().min(1)).max(100),
    orientation: z.enum(["vertical", "horizontal"]),
    required: z.boolean(),
    disabled: z.boolean(),
  })
  .strict()
  .superRefine((props, context) => {
    const optionValues = new Set<string>();

    props.options.forEach((option, index) => {
      if (optionValues.has(option)) {
        context.addIssue({
          code: "custom",
          path: ["options", index],
          message: "Checkbox Group options must be unique",
        });
      }
      optionValues.add(option);
    });

    const defaultValues = new Set<string>();
    props.defaultValues.forEach((defaultValue, index) => {
      if (defaultValues.has(defaultValue)) {
        context.addIssue({
          code: "custom",
          path: ["defaultValues", index],
          message: "Checkbox Group default values must be unique",
        });
      }
      defaultValues.add(defaultValue);

      if (!optionValues.has(defaultValue)) {
        context.addIssue({
          code: "custom",
          path: ["defaultValues", index],
          message: "Checkbox Group default values must reference options",
        });
      }
    });
  });

export type CheckboxGroupProps = z.infer<typeof checkboxGroupPropsSchema>;

export function CheckboxGroupRenderer({
  props,
  style,
  className,
  rootRef,
  rootAttributes,
}: LeafRendererProps<CheckboxGroupProps>) {
  const selectionKey = JSON.stringify([props.defaultValues, props.options]);
  const [selection, setSelection] = useState({
    key: selectionKey,
    value: props.defaultValues,
  });
  const selectedValues =
    selection.key === selectionKey ? selection.value : props.defaultValues;
  const selectedValueSet = new Set(selectedValues);

  return (
    <fieldset
      {...rootAttributes}
      aria-required={props.required}
      className={["checkbox-group", className].filter(Boolean).join(" ")}
      data-orientation={props.orientation}
      disabled={props.disabled}
      ref={rootRef}
      style={style}
    >
      <legend>{props.label}</legend>
      <span className="checkbox-group-options">
        {props.options.map((option, optionIndex) => (
          <label className="checkbox-group-option" key={option}>
            <input
              checked={selectedValueSet.has(option)}
              disabled={props.disabled}
              name={props.name}
              onChange={(event) => {
                const nextSelectedValues = event.currentTarget.checked
                  ? props.options.filter(
                      (candidate) =>
                        candidate === option || selectedValueSet.has(candidate),
                    )
                  : selectedValues.filter((value) => value !== option);
                setSelection({ key: selectionKey, value: nextSelectedValues });
              }}
              required={
                props.required &&
                selectedValues.length === 0 &&
                optionIndex === 0
              }
              type="checkbox"
              value={option}
            />
            <span>{option}</span>
          </label>
        ))}
      </span>
    </fieldset>
  );
}

const checkboxGroupStyles = {
  base: {
    display: "block",
    width: { mode: "fill" },
    height: { mode: "auto" },
    minWidth: px(0),
    padding: spacing(16, 16, 16, 16),
    backgroundColor: "#ffffff",
    color: "#0f172a",
    fontSize: px(16),
    fontWeight: 400,
    lineHeight: 1.4,
    borderWidth: { value: 1, unit: "px" },
    borderStyle: "solid",
    borderColor: "#cbd5e1",
    borderRadius: px(8),
    position: "static",
    zIndex: "auto",
  },
} satisfies ResponsiveStyles;

export const checkboxGroupDefinition = {
  version: 1,
  library: {
    label: "Checkbox Group",
    category: "Choices",
    icon: CheckboxGroupIcon,
    searchTerms: ["checkboxes", "multiple", "multi-select", "choice", "options"],
  },
  defaults: {
    props: {
      label: "Choose options",
      name: "choices",
      options: ["Option one", "Option two", "Option three"],
      defaultValues: [],
      orientation: "vertical",
      required: false,
      disabled: false,
    },
    styles: checkboxGroupStyles,
  },
  children: { allowed: false },
  propsSchema: checkboxGroupPropsSchema,
  inspector: {
    props: [
      { path: "label", label: "Group label", control: "text" },
      { path: "name", label: "Form field name", control: "text" },
      { path: "options", label: "Options", control: "string-list" },
      {
        path: "defaultValues",
        label: "Default selections",
        control: "string-multi-select",
        optionsPath: "options",
      },
      {
        path: "orientation",
        label: "Orientation",
        control: "select",
        options: [
          { label: "Vertical", value: "vertical" },
          { label: "Horizontal", value: "horizontal" },
        ],
      },
      { path: "required", label: "Required", control: "boolean" },
      { path: "disabled", label: "Disabled", control: "boolean" },
    ],
    styles: [
      "sizing",
      "spacing",
      "background",
      "border",
      "typography",
      "positioning",
    ],
  },
  render: CheckboxGroupRenderer,
} satisfies ComponentDefinition<CheckboxGroupProps, V1ComponentType>;
