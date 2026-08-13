import type { CSSProperties } from "react";
import { createPortal } from "react-dom";
import { z } from "zod";

import { evaluateBooleanCondition, useBooleanStateRuntime } from "@/builder/interaction/boolean-state-runtime";
import {
  DrawerPanelScope,
  useDrawerModalLifecycle,
  useDrawerPanelNodeId,
  useDrawerRuntime,
} from "@/builder/interaction/drawer-runtime";
import { asNodeId } from "@/builder/model/ids";
import type {
  ComponentDefinition,
  ContainerRendererProps,
  LeafRendererProps,
} from "@/builder/registry/define-component-registry";
import type { ResponsiveStyles } from "@/builder/styles/types";

import type { V1ComponentType } from "./component-definitions";
import {
  DrawerCloseIcon,
  DrawerPanelIcon,
  DrawerTriggerIcon,
} from "./component-icons";
import { nodeReferenceIdSchema } from "./reference-schemas";
import { px, spacing } from "./style-defaults";

export const drawerTriggerPropsSchema = z
  .object({
    text: z.string().trim().min(1).max(100),
    targetDrawerNodeId: nodeReferenceIdSchema,
    disabled: z.boolean(),
  })
  .strict();

export type DrawerTriggerProps = z.infer<typeof drawerTriggerPropsSchema>;

export function DrawerTriggerRenderer({
  props,
  style,
  className,
  rootRef,
  rootAttributes,
}: LeafRendererProps<DrawerTriggerProps>) {
  const drawerRuntime = useDrawerRuntime();
  const panelNodeId = asNodeId(props.targetDrawerNodeId);
  const panel =
    props.targetDrawerNodeId === ""
      ? null
      : drawerRuntime?.getPanel(panelNodeId) ?? null;
  const available = panel?.available === true;
  const status = panel === null ? "unresolved" : available ? "resolved" : "unavailable";

  return (
    <button
      {...rootAttributes}
      aria-controls={panel?.dialogId}
      aria-disabled={props.disabled || !available}
      aria-expanded={panel?.open ?? false}
      className={["drawer-trigger-control", className].filter(Boolean).join(" ")}
      data-drawer-target-status={status}
      disabled={props.disabled}
      onClick={(event) => {
        if (props.disabled || !available || !drawerRuntime) return;
        drawerRuntime.openPanel(panelNodeId, event.currentTarget);
      }}
      ref={rootRef}
      style={style}
      type="button"
    >
      {props.text}
    </button>
  );
}

const drawerControlStyles = {
  base: {
    display: "block",
    width: { mode: "fit" },
    height: { mode: "auto" },
    padding: spacing(10, 16, 10, 16),
    backgroundColor: "#172033",
    color: "#ffffff",
    borderColor: "#172033",
    borderStyle: "solid",
    borderWidth: { value: 1, unit: "px" },
    borderRadius: px(8),
    fontSize: px(14),
    fontWeight: 600,
    lineHeight: 1.2,
    position: "static",
    zIndex: "auto",
  },
} satisfies ResponsiveStyles;

export const drawerTriggerDefinition = {
  version: 1,
  library: {
    label: "Drawer Trigger",
    category: "Interactions",
    icon: DrawerTriggerIcon,
    searchTerms: ["drawer", "open", "sidebar", "overlay"],
  },
  defaults: {
    props: {
      text: "Open drawer",
      targetDrawerNodeId: "",
      disabled: false,
    },
    styles: drawerControlStyles,
  },
  children: { allowed: false },
  editor: { directInteraction: true },
  propsSchema: drawerTriggerPropsSchema,
  references: [
    {
      path: "targetDrawerNodeId",
      targetType: "drawer-panel",
      scope: "page",
      onDuplicate: "remap-if-target-cloned",
    },
  ],
  inspector: {
    props: [
      { path: "text", label: "Label", control: "text" },
      {
        path: "targetDrawerNodeId",
        label: "Drawer Panel",
        control: "node-reference",
      },
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
  render: DrawerTriggerRenderer,
} satisfies ComponentDefinition<DrawerTriggerProps, V1ComponentType>;

export const drawerPanelPropsSchema = z
  .object({
    targetStateNodeId: nodeReferenceIdSchema,
    side: z.enum(["left", "right", "top", "bottom"]),
    sizePx: z.number().finite().int().min(160).max(2000),
    dialogLabel: z.string().trim().min(1).max(160),
    zIndex: z.number().finite().int().min(0).max(2_147_483_647),
  })
  .strict();

export type DrawerPanelProps = z.infer<typeof drawerPanelPropsSchema>;

function drawerPlacementStyle(
  side: DrawerPanelProps["side"],
  sizePx: number,
): CSSProperties {
  const size = `min(${sizePx}px, 100%)`;
  if (side === "left") {
    return { height: "100%", marginRight: "auto", width: size };
  }
  if (side === "right") {
    return { height: "100%", marginLeft: "auto", width: size };
  }
  if (side === "top") {
    return { height: size, marginBottom: "auto", width: "100%" };
  }
  return { height: size, marginTop: "auto", width: "100%" };
}

export function DrawerPanelRenderer({
  props,
  style,
  className,
  rootRef,
  rootAttributes,
  runtime,
  children,
}: ContainerRendererProps<DrawerPanelProps>) {
  const booleanRuntime = useBooleanStateRuntime();
  const drawerRuntime = useDrawerRuntime();
  const panelNodeId = runtime?.nodeId ? asNodeId(runtime.nodeId) : null;
  const open =
    panelNodeId !== null &&
    props.targetStateNodeId !== "" &&
    evaluateBooleanCondition(booleanRuntime, {
      stateNodeId: asNodeId(props.targetStateNodeId),
      equals: true,
    });
  const { dialogRef, layerRef } = useDrawerModalLifecycle(
    panelNodeId ?? asNodeId("unresolved-drawer-panel"),
    open && drawerRuntime?.portalHost !== null,
  );

  if (!open || panelNodeId === null || !drawerRuntime?.portalHost) return null;

  return createPortal(
    <div
      className="drawer-layer"
      data-drawer-layer="true"
      data-drawer-mode={drawerRuntime.mode}
      ref={layerRef}
      style={{ zIndex: props.zIndex }}
    >
      <div
        aria-hidden="true"
        className="drawer-backdrop"
        data-drawer-backdrop="true"
        onClick={() => {
          if (drawerRuntime.isTopLayer(panelNodeId)) {
            drawerRuntime.closePanel(panelNodeId);
          }
        }}
      />
      <DrawerPanelScope panelNodeId={panelNodeId}>
        <div
          {...rootAttributes}
          aria-label={props.dialogLabel}
          aria-modal={drawerRuntime.mode === "preview" ? true : undefined}
          className={["drawer-panel-surface", className]
            .filter(Boolean)
            .join(" ")}
          data-drawer-side={props.side}
          id={drawerRuntime.getPanel(panelNodeId)?.dialogId}
          ref={(element) => {
            dialogRef.current = element;
            rootRef?.(element);
          }}
          role="dialog"
          style={{
            ...style,
            ...drawerPlacementStyle(props.side, props.sizePx),
            boxSizing: "border-box",
            overflowY: "auto",
            position: "relative",
          }}
          tabIndex={-1}
        >
          {children}
        </div>
      </DrawerPanelScope>
    </div>,
    drawerRuntime.portalHost,
  );
}

const drawerPanelStyles = {
  base: {
    display: "block",
    width: { mode: "fill" },
    height: { mode: "auto" },
    minWidth: px(0),
    padding: spacing(24, 24, 24, 24),
    backgroundColor: "#ffffff",
    color: "#172033",
    borderColor: "#dfe4ec",
    borderStyle: "solid",
    borderWidth: { value: 1, unit: "px" },
    position: "static",
    zIndex: "auto",
  },
} satisfies ResponsiveStyles;

export const drawerPanelDefinition = {
  version: 1,
  library: {
    label: "Drawer Panel",
    category: "Interactions",
    icon: DrawerPanelIcon,
    searchTerms: ["drawer", "panel", "sidebar", "modal", "overlay"],
  },
  defaults: {
    props: {
      targetStateNodeId: "",
      side: "left",
      sizePx: 320,
      dialogLabel: "Drawer",
      zIndex: 1000,
    },
    styles: drawerPanelStyles,
  },
  children: { allowed: true, accepts: "any" },
  propsSchema: drawerPanelPropsSchema,
  references: [
    {
      path: "targetStateNodeId",
      targetType: "boolean-state",
      scope: "page",
      onDuplicate: "remap-if-target-cloned",
    },
  ],
  inspector: {
    props: [
      {
        path: "targetStateNodeId",
        label: "Boolean State",
        control: "node-reference",
      },
      {
        path: "side",
        label: "Side",
        control: "select",
        options: [
          { label: "Left", value: "left" },
          { label: "Right", value: "right" },
          { label: "Top", value: "top" },
          { label: "Bottom", value: "bottom" },
        ],
      },
      { path: "sizePx", label: "Panel size (px)", control: "number" },
      { path: "dialogLabel", label: "Accessible label", control: "text" },
      { path: "zIndex", label: "Layer z-index", control: "number" },
    ],
    styles: ["spacing", "background", "backgroundImage", "border", "typography"],
  },
  render: DrawerPanelRenderer,
} satisfies ComponentDefinition<DrawerPanelProps, V1ComponentType>;

export const drawerClosePropsSchema = z
  .object({
    text: z.string().trim().min(1).max(100),
    disabled: z.boolean(),
  })
  .strict();

export type DrawerCloseProps = z.infer<typeof drawerClosePropsSchema>;

export function DrawerCloseRenderer({
  props,
  style,
  className,
  rootRef,
  rootAttributes,
}: LeafRendererProps<DrawerCloseProps>) {
  const drawerRuntime = useDrawerRuntime();
  const panelNodeId = useDrawerPanelNodeId();
  const available = panelNodeId !== null && drawerRuntime !== null;

  return (
    <button
      {...rootAttributes}
      aria-disabled={props.disabled || !available}
      className={["drawer-close-control", className].filter(Boolean).join(" ")}
      data-drawer-close-control="true"
      data-drawer-close-status={available ? "resolved" : "orphaned"}
      disabled={props.disabled}
      onClick={() => {
        if (props.disabled || panelNodeId === null || !drawerRuntime) return;
        drawerRuntime.closePanel(panelNodeId);
      }}
      ref={rootRef}
      style={style}
      type="button"
    >
      {props.text}
    </button>
  );
}

export const drawerCloseDefinition = {
  version: 1,
  library: {
    label: "Drawer Close",
    category: "Interactions",
    icon: DrawerCloseIcon,
    searchTerms: ["drawer", "close", "dismiss", "modal"],
  },
  defaults: {
    props: { text: "Close drawer", disabled: false },
    styles: drawerControlStyles,
  },
  children: { allowed: false },
  editor: {
    directInteraction: true,
    requiredAncestorType: "drawer-panel",
  },
  propsSchema: drawerClosePropsSchema,
  inspector: {
    props: [
      { path: "text", label: "Label", control: "text" },
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
  render: DrawerCloseRenderer,
} satisfies ComponentDefinition<DrawerCloseProps, V1ComponentType>;
