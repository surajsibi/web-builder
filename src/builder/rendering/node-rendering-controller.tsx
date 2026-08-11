import type {
  ComponentType as ReactComponentType,
  CSSProperties,
  ReactNode,
  RefCallback,
} from "react";

import type { JsonObject } from "@/builder/model/json";
import type { NodeId } from "@/builder/model/ids";
import type {
  BuilderNode,
  PageDocument,
} from "@/builder/model/project-document";
import { componentRegistry } from "@/builder/registry/component-registry";
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
  const node = page.nodes[nodeId];
  const definition = componentRegistry[node.type];
  const Renderer = definition.render as ReactComponentType<RuntimeRendererProps>;
  const style = {
    ...compileStyleValues(resolveResponsiveStyles(node.styles, viewport)),
    ...getPreviewStyle?.(node),
  };
  const rendererProps = {
    props: node.props,
    style,
    className: getClassName?.(node),
    rootAttributes: getRootAttributes?.(node),
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
