import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { createNewProject } from "@/builder/project/factory";
import { createBuilderStore } from "@/builder/store/builder-store";
import { PhaseTwoValidation } from "@/builder/ui/phase-two-validation";

afterEach(cleanup);

function createValidationStore() {
  let pageCounter = 0;
  let nodeCounter = 0;
  const initialIds = ["project-ui", "page-home"];

  const initialDocument = createNewProject({
    name: "UI Project",
    now: "2026-08-07T00:00:00.000Z",
    idGenerator: () => initialIds.shift() ?? "unexpected-initial-id",
  });

  return createBuilderStore({
    initialDocument,
    idGenerator: (prefix) => {
      if (prefix === "page") {
        pageCounter += 1;
        return `page-ui-${pageCounter}`;
      }
      if (prefix === "node") {
        nodeCounter += 1;
        return `node-ui-${nodeCounter}`;
      }
      return "project-ui-generated";
    },
  });
}

describe("PhaseTwoValidation", () => {
  it("should show the active page, selection state, and history status", () => {
    render(<PhaseTwoValidation store={createValidationStore()} />);

    expect(
      screen.getByRole("heading", { name: "Phase 2 state validation" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Home/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByText("No node selected.")).toBeInTheDocument();
    expect(screen.getByText("No command executed yet.")).toBeInTheDocument();
  });

  it("should execute a node command and expose undo and redo controls", () => {
    render(<PhaseTwoValidation store={createValidationStore()} />);

    fireEvent.click(screen.getByRole("button", { name: "Insert root card" }));

    expect(screen.getByRole("button", { name: /Card 1/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getAllByText("Card 1")).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Undo" })).toBeEnabled();
    expect(screen.getByRole("status")).toHaveTextContent('"status": "applied"');

    fireEvent.click(screen.getByRole("button", { name: "Undo" }));

    expect(screen.getByText("This page has no nodes.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Redo" })).toBeEnabled();
  });

  it("should create and activate a page through the command executor", () => {
    render(<PhaseTwoValidation store={createValidationStore()} />);

    fireEvent.click(screen.getByRole("button", { name: "Create page" }));

    expect(
      screen.getByRole("button", { name: /Untitled Page/ }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("This page has no nodes.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete active" })).toBeEnabled();
  });
});
