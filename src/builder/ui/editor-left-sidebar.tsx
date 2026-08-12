import { useState } from "react";

import type { EditorDragSource } from "@/builder/interaction/types";
import type { NodeId } from "@/builder/model/ids";
import type {
  PageDocument,
  ProjectDocument,
} from "@/builder/model/project-document";
import type { ParentById } from "@/builder/project/tree";
import type { BlockType } from "@/builder/registry/block-registry";
import type { ComponentType } from "@/builder/registry/component-registry";
import type { Viewport } from "@/builder/styles/types";
import { ComponentLibrary } from "@/builder/ui/component-library";
import { LayersPanel } from "@/builder/ui/layers-panel";

type EditorLeftSidebarProps = {
  document: ProjectDocument;
  page: Readonly<PageDocument>;
  parentById: Readonly<ParentById>;
  viewport: Viewport;
  selectedNodeId: NodeId | null;
  dragSource: EditorDragSource | null;
  getComponentInsertionLabel: (type: ComponentType) => string;
  getBlockInsertionLabel: (type: BlockType) => string;
  onInsertComponent: (type: ComponentType) => void;
  onInsertBlock: (type: BlockType) => void;
  onSelectNode: (nodeId: NodeId) => void;
};

export function EditorLeftSidebar(props: EditorLeftSidebarProps) {
  const [tab, setTab] = useState<"components" | "layers">("components");

  return (
    <aside aria-label="Editor navigation" className="editor-sidebar library-panel">
      <div aria-label="Left panel" className="left-panel-tabs" role="tablist">
        <button
          aria-selected={tab === "components"}
          onClick={() => setTab("components")}
          role="tab"
          type="button"
        >
          <span aria-hidden="true" className="left-panel-tab-icon">+</span>
          <span>Components</span>
        </button>
        <button
          aria-selected={tab === "layers"}
          onClick={() => setTab("layers")}
          role="tab"
          type="button"
        >
          <span aria-hidden="true" className="left-panel-tab-icon">◇</span>
          <span>Layers</span>
        </button>
      </div>

      <div className="left-panel-content" role="tabpanel">
        {tab === "components" ? (
          <ComponentLibrary
            getBlockInsertionLabel={props.getBlockInsertionLabel}
            getComponentInsertionLabel={props.getComponentInsertionLabel}
            onInsertBlock={props.onInsertBlock}
            onInsertComponent={props.onInsertComponent}
          />
        ) : (
          <LayersPanel
            document={props.document}
            dragSource={props.dragSource}
            key={props.page.id}
            onSelectNode={props.onSelectNode}
            page={props.page}
            parentById={props.parentById}
            selectedNodeId={props.selectedNodeId}
            viewport={props.viewport}
          />
        )}
      </div>
    </aside>
  );
}
