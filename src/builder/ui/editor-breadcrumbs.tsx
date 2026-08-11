import type { NodeId } from "@/builder/model/ids";
import type { PageDocument } from "@/builder/model/project-document";
import type { ParentById } from "@/builder/project/tree";
import { deriveBreadcrumbs } from "@/builder/ui/tree-navigation";

type EditorBreadcrumbsProps = {
  page: Readonly<PageDocument>;
  parentById: Readonly<ParentById>;
  selectedNodeId: NodeId | null;
  onSelectNode: (nodeId: NodeId) => void;
};

export function EditorBreadcrumbs({
  page,
  parentById,
  selectedNodeId,
  onSelectNode,
}: EditorBreadcrumbsProps) {
  const breadcrumbs = deriveBreadcrumbs(page, parentById, selectedNodeId);

  return (
    <nav aria-label="Selected node breadcrumbs" className="editor-breadcrumbs">
      <span>Page</span>
      {breadcrumbs.length === 0 ? (
        <span className="breadcrumb-empty">No selection</span>
      ) : (
        breadcrumbs.map((item, index) => (
          <span className="breadcrumb-item" key={item.nodeId}>
            <span aria-hidden="true">›</span>
            <button
              aria-current={index === breadcrumbs.length - 1 ? "page" : undefined}
              onClick={() => onSelectNode(item.nodeId)}
              type="button"
            >
              {item.name}
            </button>
          </span>
        ))
      )}
    </nav>
  );
}
