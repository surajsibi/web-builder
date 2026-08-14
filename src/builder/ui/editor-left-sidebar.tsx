import { useRef, useState } from "react";

import type { EditorDragSource } from "@/builder/interaction/types";
import type { NodeId, PageId } from "@/builder/model/ids";
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
import { PagesPanel } from "@/builder/ui/pages-panel";

type LeftPanelTab = "components" | "layers" | "pages";

const LEFT_PANEL_TABS: readonly LeftPanelTab[] = [
  "components",
  "layers",
  "pages",
];

type EditorLeftSidebarProps = {
  collapsed: boolean;
  activePageId: PageId;
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
  onCreatePage: (name: string) => boolean;
  onDeletePage: (pageId: PageId) => boolean;
  onDuplicatePage: (pageId: PageId) => boolean;
  onRenamePage: (pageId: PageId, name: string) => boolean;
  onSelectPage: (pageId: PageId) => void;
  onSetHomePage: (pageId: PageId) => boolean;
  onSelectNode: (nodeId: NodeId) => void;
  onCollapsedChange: (collapsed: boolean, panelName: string) => void;
};

export function EditorLeftSidebar(props: EditorLeftSidebarProps) {
  const [tab, setTab] = useState<LeftPanelTab>("components");
  const tabRefs = useRef(new Map<LeftPanelTab, HTMLButtonElement>());
  const selectTab = (nextTab: LeftPanelTab) => {
    setTab(nextTab);
    if (props.collapsed) {
      const nextPanelName =
        nextTab === "components"
          ? "Component Library"
          : nextTab === "layers"
            ? "Layers"
            : "Pages";
      props.onCollapsedChange(false, nextPanelName);
    }
  };
  const panelName =
    tab === "components" ? "Component Library" : tab === "layers" ? "Layers" : "Pages";

  const handleTabKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const currentIndex = LEFT_PANEL_TABS.indexOf(tab);
    let nextIndex: number | null = null;

    if (event.key === "ArrowRight") {
      nextIndex = (currentIndex + 1) % LEFT_PANEL_TABS.length;
    } else if (event.key === "ArrowLeft") {
      nextIndex =
        (currentIndex - 1 + LEFT_PANEL_TABS.length) % LEFT_PANEL_TABS.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = LEFT_PANEL_TABS.length - 1;
    }

    if (nextIndex !== null) {
      event.preventDefault();
      const nextTab = LEFT_PANEL_TABS[nextIndex];
      selectTab(nextTab);
      tabRefs.current.get(nextTab)?.focus();
    }
  };

  return (
    <aside
      aria-label="Editor navigation"
      className={`editor-sidebar library-panel${props.collapsed ? " is-collapsed" : ""}`}
    >
      <div
        aria-label="Left panel"
        className="left-panel-tabs"
        onKeyDown={handleTabKeyDown}
        role="tablist"
      >
        <button
          aria-controls="editor-left-panel-content"
          aria-selected={tab === "components"}
          id="editor-left-tab-components"
          onClick={() => selectTab("components")}
          ref={(button) => {
            if (button) tabRefs.current.set("components", button);
            else tabRefs.current.delete("components");
          }}
          role="tab"
          tabIndex={tab === "components" ? 0 : -1}
          type="button"
        >
          <span aria-hidden="true" className="left-panel-tab-icon">+</span>
          <span>Components</span>
        </button>
        <button
          aria-controls="editor-left-panel-content"
          aria-selected={tab === "layers"}
          id="editor-left-tab-layers"
          onClick={() => selectTab("layers")}
          ref={(button) => {
            if (button) tabRefs.current.set("layers", button);
            else tabRefs.current.delete("layers");
          }}
          role="tab"
          tabIndex={tab === "layers" ? 0 : -1}
          type="button"
        >
          <span aria-hidden="true" className="left-panel-tab-icon">◇</span>
          <span>Layers</span>
        </button>
        <button
          aria-controls="editor-left-panel-content"
          aria-selected={tab === "pages"}
          id="editor-left-tab-pages"
          onClick={() => selectTab("pages")}
          ref={(button) => {
            if (button) tabRefs.current.set("pages", button);
            else tabRefs.current.delete("pages");
          }}
          role="tab"
          tabIndex={tab === "pages" ? 0 : -1}
          type="button"
        >
          <span aria-hidden="true" className="left-panel-tab-icon">
            <svg viewBox="0 0 24 24">
              <path d="M6 3.5h9l3 3V20.5H6z" />
              <path d="M15 3.5v3h3M9 11h6M9 15h6" />
            </svg>
          </span>
          <span>Pages</span>
        </button>
      </div>

      <button
        aria-controls="editor-left-panel-content"
        aria-expanded={!props.collapsed}
        aria-label={
          props.collapsed
            ? `Expand ${panelName}`
            : `Collapse ${panelName}`
        }
        className="left-panel-collapse-toggle"
        onClick={() => props.onCollapsedChange(!props.collapsed, panelName)}
        title={
          props.collapsed
            ? `Expand ${panelName}`
            : `Collapse ${panelName}`
        }
        type="button"
      >
        <span aria-hidden="true">{props.collapsed ? "›" : "‹"}</span>
      </button>

      <div
        aria-labelledby={`editor-left-tab-${tab}`}
        className="left-panel-content"
        hidden={props.collapsed}
        id="editor-left-panel-content"
        role="tabpanel"
      >
        {tab === "components" ? (
          <ComponentLibrary
            getBlockInsertionLabel={props.getBlockInsertionLabel}
            getComponentInsertionLabel={props.getComponentInsertionLabel}
            onInsertBlock={props.onInsertBlock}
            onInsertComponent={props.onInsertComponent}
          />
        ) : tab === "layers" ? (
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
        ) : (
          <PagesPanel
            activePageId={props.activePageId}
            document={props.document}
            onCreatePage={props.onCreatePage}
            onDeletePage={props.onDeletePage}
            onDuplicatePage={props.onDuplicatePage}
            onRenamePage={props.onRenamePage}
            onSelectPage={props.onSelectPage}
            onSetHomePage={props.onSetHomePage}
          />
        )}
      </div>
    </aside>
  );
}
