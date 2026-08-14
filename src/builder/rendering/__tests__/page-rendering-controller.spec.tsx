import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { PageRenderingController } from "@/builder/rendering/page-rendering-controller";
import {
  createTestNode,
  createTestPage,
  createTestProject,
} from "@/builder/testing/project-fixtures";

afterEach(cleanup);

function createStateDrivenPage() {
  const state = createTestNode("boolean-state", "menu-state");
  const toggle = createTestNode("button", "menu-toggle");
  const shownWhenOn = createTestNode("container", "shown-when-on", [
    "shown-when-on-text",
  ]);
  const shownWhenOff = createTestNode("container", "shown-when-off", [
    "shown-when-off-text",
  ]);
  const onText = createTestNode("text", "shown-when-on-text");
  const offText = createTestNode("text", "shown-when-off-text");

  state.props.defaultValue = false;
  toggle.props.text = "Toggle menu";
  toggle.props.targetStateNodeId = state.id;
  toggle.props.stateAction = "toggle";
  shownWhenOn.stateBinding = {
    stateNodeId: state.id,
    on: "show",
    off: "hide",
  };
  shownWhenOff.stateBinding = {
    stateNodeId: state.id,
    on: "hide",
    off: "show",
  };
  onText.props.text = "Menu is open";
  offText.props.text = "Menu is closed";

  return {
    page: createTestPage(
      "state-page",
      "State page",
      "/state",
      [state, toggle, shownWhenOn, shownWhenOff],
      [onText, offText],
    ),
    shownWhenOn,
    state,
  };
}

describe("PageRenderingController", () => {
  it("should render every page root without editor-only wrappers or prompts", () => {
    const project = createTestProject();
    const page = project.pages[project.homePageId];

    const { container } = render(
      <PageRenderingController page={page} viewport="desktop" />,
    );

    expect(container.children).toHaveLength(1);
    expect(container.firstElementChild?.tagName).toBe("SECTION");
    expect(screen.getByRole("article")).toContainElement(screen.getByText("Text"));
    expect(screen.queryByText(/empty/i)).not.toBeInTheDocument();
    expect(container.querySelector(".canvas-node")).not.toBeInTheDocument();
  });

  it("should render an empty page as empty runtime output", () => {
    const project = createTestProject({ includeAboutPage: true });
    const page = project.pages[project.pageOrder[1]];

    const { container } = render(
      <PageRenderingController page={page} viewport="desktop" />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("should let one ordinary Button toggle every component connected to one state", () => {
    const { page } = createStateDrivenPage();

    render(<PageRenderingController page={page} viewport="desktop" />);

    expect(screen.queryByText("Menu is open")).not.toBeInTheDocument();
    expect(screen.getByText("Menu is closed")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Toggle menu" }));

    expect(screen.getByText("Menu is open")).toBeInTheDocument();
    expect(screen.queryByText("Menu is closed")).not.toBeInTheDocument();
  });

  it("should keep an inactive connected component available for authoring", () => {
    const { page } = createStateDrivenPage();

    render(
      <PageRenderingController
        page={page}
        runtime={{ mode: "editor" }}
        viewport="desktop"
      />,
    );

    expect(screen.getByText("Menu is open").parentElement).toHaveAttribute(
      "data-state-visibility",
      "inactive",
    );
    expect(screen.getByRole("button", { name: "Toggle menu" })).toHaveAttribute(
      "data-editor-direct-interaction",
      "true",
    );
  });

  it("should hide an unresolved connected component in Preview and flag it in Editor", () => {
    const component = createTestNode("container", "unresolved-container", [
      "unresolved-text",
    ]);
    const text = createTestNode("text", "unresolved-text");
    component.stateBinding = {
      stateNodeId: "missing-state" as typeof component.id,
      on: "show",
      off: "hide",
    };
    text.props.text = "Unavailable content";
    const page = createTestPage(
      "unresolved-page",
      "Unresolved page",
      "/unresolved",
      [component],
      [text],
    );
    const preview = render(
      <PageRenderingController page={page} viewport="desktop" />,
    );

    expect(screen.queryByText("Unavailable content")).not.toBeInTheDocument();

    preview.rerender(
      <PageRenderingController
        page={page}
        runtime={{ mode: "editor" }}
        viewport="desktop"
      />,
    );

    expect(screen.getByText("Unavailable content").parentElement).toHaveAttribute(
      "data-state-connection-status",
      "unresolved",
    );
  });

  it("should reconcile a changed authored default without losing the connection", () => {
    const { page, state } = createStateDrivenPage();
    const view = render(
      <PageRenderingController page={page} viewport="desktop" />,
    );
    const updatedPage = structuredClone(page);
    updatedPage.nodes[state.id].props.defaultValue = true;

    view.rerender(
      <PageRenderingController page={updatedPage} viewport="desktop" />,
    );

    expect(screen.getByText("Menu is open")).toBeInTheDocument();
    expect(screen.queryByText("Menu is closed")).not.toBeInTheDocument();
  });
});
