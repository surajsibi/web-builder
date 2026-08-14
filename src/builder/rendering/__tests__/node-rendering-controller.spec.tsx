import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { NodeRenderingController } from "@/builder/rendering/node-rendering-controller";
import {
  createTestNode,
  createTestPage,
  createTestProject,
} from "@/builder/testing/project-fixtures";

afterEach(cleanup);

describe("NodeRenderingController", () => {
  it("should recursively render the hydrated tree without layout wrappers", () => {
    const project = createTestProject();
    const page = project.pages[project.homePageId];

    const { container } = render(
      <NodeRenderingController
        getClassName={(node) => `rendered-${node.id}`}
        nodeId={page.rootIds[0]}
        page={page}
        viewport="desktop"
      />,
    );

    const section = container.firstElementChild;
    const card = screen.getByRole("article");
    const text = screen.getByText("Text");

    expect(section?.tagName).toBe("SECTION");
    expect(section).toHaveClass("rendered-node-section");
    expect(section).toContainElement(card);
    expect(card).toContainElement(text);
  });

  it("should resolve responsive styles before compiling the semantic root", () => {
    const button = createTestNode("button", "node-button");
    const page = createTestPage("page-home", "Home", "/", [button]);

    render(
      <NodeRenderingController
        nodeId={button.id}
        page={page}
        viewport="mobile"
      />,
    );

    expect(screen.getByRole("button", { name: "Button" })).toHaveStyle({
      width: "100%",
    });
  });

  it("should render the same committed position offset in editor and preview runtimes", () => {
    const heading = createTestNode("heading", "node-heading");
    heading.styles.base.positionOffset = {
      x: { value: 42, unit: "px" },
      y: { value: -17, unit: "px" },
    };
    const page = createTestPage("page-home", "Home", "/", [heading]);

    const { container } = render(
      <>
        <NodeRenderingController
          getClassName={() => "editor-runtime"}
          nodeId={heading.id}
          page={page}
          runtime={{ mode: "editor" }}
          viewport="desktop"
        />
        <NodeRenderingController
          getClassName={() => "preview-runtime"}
          nodeId={heading.id}
          page={page}
          runtime={{ mode: "preview" }}
          viewport="desktop"
        />
      </>,
    );

    expect(container.querySelector(".editor-runtime")).toHaveStyle({
      translate: "42px -17px",
    });
    expect(container.querySelector(".preview-runtime")).toHaveStyle({
      translate: "42px -17px",
    });
  });

  it("should expose semantic roots and editor-only empty-container content", () => {
    const card = createTestNode("card", "node-card-empty");
    const page = createTestPage("page-home", "Home", "/", [card]);
    const registerRoot = vi.fn();

    render(
      <NodeRenderingController
        nodeId={card.id}
        page={page}
        registerRoot={registerRoot}
        renderEmptyContainer={(node) => <span>Empty {node.meta.name}</span>}
        viewport="desktop"
      />,
    );

    const article = screen.getByRole("article");

    expect(article).toHaveTextContent("Empty Card fixture");
    expect(registerRoot).toHaveBeenCalledWith(card.id, article);
  });
});
