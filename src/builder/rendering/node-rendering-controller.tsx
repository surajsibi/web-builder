import type {
  ComponentType as ReactComponentType,
  CSSProperties,
  ReactNode,
  RefCallback,
} from "react";

import { useBooleanStateRuntime } from "@/builder/interaction/boolean-state-runtime";
import { evaluateDisclosureSemantics } from "@/builder/interaction/disclosure-semantics";
import type { JsonObject } from "@/builder/model/json";
import type { NodeId } from "@/builder/model/ids";
import type {
  BuilderNode,
  PageDocument,
} from "@/builder/model/project-document";
import {
  componentRegistry,
  componentUsesDirectInteraction,
} from "@/builder/registry/component-registry";
import type {
  ComponentRendererRuntime,
  RendererBaseProps,
} from "@/builder/registry/define-component-registry";
import { compileStyleValues } from "@/builder/styles/compile";
import { resolveResponsiveStyles } from "@/builder/styles/resolve";
import type { Viewport } from "@/builder/styles/types";

type RuntimeRendererProps = {
  props: Readonly<JsonObject>;
  style: Readonly<CSSProperties>;
  className?: string;
  rootRef?: RefCallback<HTMLElement>;
  runtime?: ComponentRendererRuntime;
  rootAttributes?: RendererBaseProps<JsonObject>["rootAttributes"];
  children?: ReactNode;
};

export type NodeRenderingControllerProps = {
  page: Readonly<PageDocument>;
  nodeId: NodeId;
  viewport: Viewport;
  runtime?: Omit<ComponentRendererRuntime, "nodeId">;
  getClassName?: (node: Readonly<BuilderNode>) => string | undefined;
  getPreviewStyle?: (node: Readonly<BuilderNode>) => CSSProperties | undefined;
  getRootAttributes?: (
    node: Readonly<BuilderNode>,
  ) => RendererBaseProps<JsonObject>["rootAttributes"];
  registerRoot?: (nodeId: NodeId, element: HTMLElement | null) => void;
  renderEmptyContainer?: (node: Readonly<BuilderNode>) => ReactNode;
  renderChild?: (childId: NodeId) => ReactNode;
};

export function NodeRenderingController({
  page,
  nodeId,
  viewport,
  runtime,
  getClassName,
  getPreviewStyle,
  getRootAttributes,
  registerRoot,
  renderEmptyContainer,
  renderChild,
}: NodeRenderingControllerProps) {
  const stateRuntime = useBooleanStateRuntime();
  const node = page.nodes[nodeId];
  const definition = componentRegistry[node.type];
  const stateBinding = node.stateBinding;
  const stateAvailable =
    stateBinding === undefined || stateRuntime?.has(stateBinding.stateNodeId) === true;
  const stateValue =
    stateBinding && stateAvailable
      ? stateRuntime?.read(stateBinding.stateNodeId) ?? false
      : false;
  const stateVisibility = stateBinding
    ? stateValue
      ? stateBinding.on
      : stateBinding.off
    : "show";
  const stateVisible = stateAvailable && stateVisibility === "show";

  if (runtime?.mode !== "editor" && !stateVisible) return null;

  const Renderer = definition.render as ReactComponentType<RuntimeRendererProps>;
  const style = {
    ...compileStyleValues(resolveResponsiveStyles(node.styles, viewport)),
    ...getPreviewStyle?.(node),
  };
  const disclosureSemantics =
    node.type === "button"
      ? evaluateDisclosureSemantics({
          page,
          buttonNodeId: node.id,
          viewport,
          runtime: stateRuntime,
        })
      : null;
  const rootAttributes = {
    ...getRootAttributes?.(node),
    ...(runtime?.mode === "editor" && stateBinding
      ? {
          "data-state-visibility": stateVisible ? "visible" : "inactive",
          "data-state-connection-status": stateAvailable
            ? "resolved"
            : "unresolved",
        }
      : {}),
    ...(runtime?.mode === "editor" && componentUsesDirectInteraction(node)
      ? { "data-editor-direct-interaction": "true" as const }
      : {}),
    ...(disclosureSemantics?.status === "valid" &&
    (runtime?.mode !== "editor" || disclosureSemantics.expanded)
      ? { "aria-expanded": disclosureSemantics.expanded }
      : {}),
  };
  const rendererProps = {
    props: node.props,
    style,
    className: getClassName?.(node),
    rootAttributes,
    rootRef: registerRoot
      ? (element: HTMLElement | null) => registerRoot(node.id, element)
      : undefined,
    runtime: runtime ? { ...runtime, nodeId: node.id } : undefined,
  } satisfies RuntimeRendererProps;

  if (!definition.children.allowed) {
    return <Renderer {...rendererProps} />;
  }

  const children =
    node.childIds.length === 0
      ? renderEmptyContainer?.(node) ?? null
      : node.childIds.map((childId) =>
          renderChild ? (
            renderChild(childId)
          ) : (
            <NodeRenderingController
              getClassName={getClassName}
              getPreviewStyle={getPreviewStyle}
              getRootAttributes={getRootAttributes}
              key={childId}
              nodeId={childId}
              page={page}
              registerRoot={registerRoot}
              renderEmptyContainer={renderEmptyContainer}
              runtime={runtime}
              viewport={viewport}
            />
          ),
        );

  return <Renderer {...rendererProps}>{children}</Renderer>;
}
