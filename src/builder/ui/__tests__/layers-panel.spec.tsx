import { DragDropProvider } from "@dnd-kit/react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { asNodeId, asPageId } from "@/builder/model/ids";
import { buildProjectParentIndex } from "@/builder/project/tree";
import { createTestProject } from "@/builder/testing/project-fixtures";
import { LayersPanel } from "@/builder/ui/layers-panel";

afterEach(cleanup);

describe("LayersPanel", () => {
  it("should render the recursive tree, selection, lock, visibility, and collapse state", () => {
    const project = createTestProject();
    const page = project.pages[asPageId("page-home")];
    page.nodes[asNodeId("node-card")].meta.locked = true;
    page.nodes[asNodeId("node-text")].styles.base.display = "none";
    const index = buildProjectParentIndex(project);
    if (!index.success) throw new Error(index.issue.reason);
    const onSelectNode = vi.fn();

    render(
      <DragDropProvider>
        <LayersPanel
          activeDropTarget={null}
          dragSource={null}
          onSelectNode={onSelectNode}
          page={page}
          parentById={index.parentById}
          selectedNodeId={asNodeId("node-card")}
          viewport="desktop"
        />
      </DragDropProvider>,
    );

    expect(screen.getAllByRole("treeitem")).toHaveLength(3);
    expect(
      screen.getByRole("button", { name: "Select Card fixture" }),
    ).toHaveAttribute("aria-current", "true");
    expect(screen.getByLabelText("Locked")).toBeInTheDocument();
    expect(screen.getByLabelText("Hidden")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Drag Card fixture" }),
    ).toBeDisabled();

    fireEvent.click(
      screen.getByRole("button", { name: "Collapse Section fixture" }),
    );
    expect(
      screen.queryByRole("button", { name: "Select Card fixture" }),
    ).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Expand Section fixture" }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Select Card fixture" }),
    );
    expect(onSelectNode).toHaveBeenCalledWith(asNodeId("node-card"));
  });
});
