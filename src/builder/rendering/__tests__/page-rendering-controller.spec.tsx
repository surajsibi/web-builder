import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import { executeEditorCommand } from "@/builder/commands/execute-command";
import { asNodeId, asPageId } from "@/builder/model/ids";
import { prepareProjectHydration } from "@/builder/project/hydration";
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

function createDisclosurePage() {
  const project = createTestProject();
  const sourcePage = project.pages[asPageId("page-home")];
  sourcePage.rootIds.splice(0);
  for (const nodeId of Object.keys(sourcePage.nodes)) {
    delete sourcePage.nodes[asNodeId(nodeId)];
  }
  const prepared = prepareProjectHydration(project);
  if (!prepared.success) throw new Error(prepared.error.reason);
  const generatedIds = [
    "disclosure-root",
    "disclosure-toggle",
    "disclosure-content",
    "disclosure-copy",
    "disclosure-state",
  ];
  const result = executeEditorCommand(
    {
      document: prepared.value.document,
      parentById: prepared.value.parentById,
      activePageId: asPageId("page-home"),
      selectedNodeId: null,
    },
    {
      kind: "block.insert",
      pageId: asPageId("page-home"),
      blockType: "disclosure",
      destination: { parentId: null, index: 0 },
    },
    { idGenerator: () => generatedIds.shift() ?? "unexpected-node" },
  );
  if (result.status !== "applied") {
    throw new Error(
      `Expected Disclosure insertion: ${
        result.status === "rejected" ? result.error.reason : result.reason
      }`,
    );
  }
  const page = result.candidate.document.pages[asPageId("page-home")];
  const root = page.nodes[asNodeId("disclosure-root")];
  const toggle = page.nodes[asNodeId("disclosure-toggle")];
  const content = page.nodes[asNodeId("disclosure-content")];
  const state = page.nodes[asNodeId("disclosure-state")];

  return {
    content,
    page,
    root,
    state,
    toggle,
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

  it("should keep aria-expanded truthful through pointer activation without mutating the page", async () => {
    const user = userEvent.setup();
    const { page } = createDisclosurePage();
    const original = structuredClone(page);

    render(<PageRenderingController page={page} viewport="desktop" />);

    const button = screen.getByRole("button", { name: "Show details" });
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(
      screen.queryByText("Replace this text with your details."),
    ).not.toBeInTheDocument();

    await user.click(button);

    expect(button).toHaveAttribute("aria-expanded", "true");
    expect(
      screen.getByText("Replace this text with your details."),
    ).toBeInTheDocument();
    expect(page).toEqual(original);
  });

  it.each([
    ["Enter", "{Enter}"],
    ["Space", " "],
  ])("should preserve native %s activation for Disclosure", async (_name, key) => {
    const user = userEvent.setup();
    const { page } = createDisclosurePage();

    render(<PageRenderingController page={page} viewport="desktop" />);
    const button = screen.getByRole("button", { name: "Show details" });
    button.focus();

    await user.keyboard(key);

    expect(button).toHaveAttribute("aria-expanded", "true");
    expect(button).toHaveFocus();
  });

  it("should omit aria-expanded when the controlled content is independently hidden", () => {
    const { content, page } = createDisclosurePage();
    content.styles.base.display = "none";

    render(<PageRenderingController page={page} viewport="desktop" />);

    expect(screen.getByRole("button", { name: "Show details" })).not.toHaveAttribute(
      "aria-expanded",
    );
  });

  it("should omit collapsed semantics while Editor authoring keeps inactive content visible", () => {
    const { page } = createDisclosurePage();

    render(
      <PageRenderingController
        page={page}
        runtime={{ mode: "editor" }}
        viewport="desktop"
      />,
    );

    expect(screen.getByRole("button", { name: "Show details" })).not.toHaveAttribute(
      "aria-expanded",
    );
    expect(
      screen.getByText("Replace this text with your details.").parentElement,
    ).toHaveAttribute("data-state-visibility", "inactive");
  });
});
