import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { asNodeId, asPageId } from "@/builder/model/ids";
import { buildProjectParentIndex } from "@/builder/project/tree";
import { createTestProject } from "@/builder/testing/project-fixtures";
import { EditorBreadcrumbs } from "@/builder/ui/editor-breadcrumbs";

afterEach(cleanup);

describe("EditorBreadcrumbs", () => {
  it("should expose the selected ancestry and select an ancestor", () => {
    const project = createTestProject();
    const page = project.pages[asPageId("page-home")];
    const index = buildProjectParentIndex(project);
    if (!index.success) throw new Error(index.issue.reason);
    const onSelectNode = vi.fn();

    render(
      <EditorBreadcrumbs
        onSelectNode={onSelectNode}
        page={page}
        parentById={index.parentById}
        selectedNodeId={asNodeId("node-text")}
      />,
    );

    const section = screen.getByRole("button", { name: "Section fixture" });
    const card = screen.getByRole("button", { name: "Card fixture" });
    const text = screen.getByRole("button", { name: "Text fixture" });
    expect(section.compareDocumentPosition(card)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(card.compareDocumentPosition(text)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(text).toHaveAttribute("aria-current", "page");

    fireEvent.click(card);
    expect(onSelectNode).toHaveBeenCalledWith(asNodeId("node-card"));
  });
});
