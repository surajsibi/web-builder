import { BooleanStateRuntimeProvider } from "@/builder/interaction/boolean-state-runtime";
import type { PageDocument } from "@/builder/model/project-document";
import { NodeRenderingController } from "@/builder/rendering/node-rendering-controller";
import type { ComponentRendererRuntime } from "@/builder/registry/define-component-registry";
import type { Viewport } from "@/builder/styles/types";

export type PageRenderingControllerProps = {
  page: Readonly<PageDocument>;
  viewport: Viewport;
  runtime?: Omit<ComponentRendererRuntime, "nodeId">;
};

export function PageRenderingController({
  page,
  viewport,
  runtime,
}: PageRenderingControllerProps) {
  const resolvedRuntime = runtime ?? { mode: "preview" as const };

  return (
    <BooleanStateRuntimeProvider page={page}>
      {page.rootIds.map((nodeId) => (
        <NodeRenderingController
          key={nodeId}
          nodeId={nodeId}
          page={page}
          runtime={resolvedRuntime}
          viewport={viewport}
        />
      ))}
    </BooleanStateRuntimeProvider>
  );
}
