import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import { PageRenderingController } from "@/builder/rendering/page-rendering-controller";
import {
  createTestNode,
  createTestPage,
  createTestProject,
} from "@/builder/testing/project-fixtures";

afterEach(cleanup);

function createTogglePage(id: string, content: string) {
  const state = createTestNode("boolean-state", `${id}-state`);
  const action = createTestNode("state-action", `${id}-action`);
  const conditional = createTestNode(
    "conditional-content",
    `${id}-conditional`,
    [`${id}-text`],
  );
  const text = createTestNode("text", `${id}-text`);

  state.props.defaultValue = false;
  action.props.targetStateNodeId = state.id;
  conditional.props.targetStateNodeId = state.id;
  text.props.text = content;

  return {
    action,
    conditional,
    page: createTestPage(id, id, `/${id}`, [state, action, conditional], [text]),
    state,
    text,
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

  it("should expose direct-interaction metadata only in Editor output", () => {
    const state = createTestNode("boolean-state", "state-editor-action");
    const action = createTestNode("state-action", "action-editor-action");
    action.props.targetStateNodeId = state.id;
    const page = createTestPage(
      "page-editor-action",
      "Editor action",
      "/editor-action",
      [state, action],
    );
    const view = render(
      <PageRenderingController
        page={page}
        runtime={{ mode: "editor" }}
        viewport="desktop"
      />,
    );

    expect(screen.getByRole("button", { name: "Toggle state" })).toHaveAttribute(
      "data-editor-direct-interaction",
      "true",
    );

    view.rerender(
      <PageRenderingController
        page={page}
        runtime={{ mode: "preview" }}
        viewport="desktop"
      />,
    );

    expect(screen.getByRole("button", { name: "Toggle state" })).not.toHaveAttribute(
      "data-editor-direct-interaction",
    );
  });

  it("should let generic actions update every conditional consumer of one Boolean State", () => {
    const state = createTestNode("boolean-state", "state-menu-open");
    const turnOn = createTestNode("state-action", "action-turn-on");
    const turnOff = createTestNode("state-action", "action-turn-off");
    const toggle = createTestNode("state-action", "action-toggle");
    const disabled = createTestNode("state-action", "action-disabled");
    const firstConsumer = createTestNode(
      "conditional-content",
      "conditional-first",
      ["text-first"],
    );
    const secondConsumer = createTestNode(
      "conditional-content",
      "conditional-second",
      ["text-second"],
    );
    const firstText = createTestNode("text", "text-first");
    const secondText = createTestNode("text", "text-second");

    state.props.defaultValue = false;
    turnOn.props = {
      ...turnOn.props,
      text: "Open",
      targetStateNodeId: state.id,
      action: "turn-on",
    };
    turnOff.props = {
      ...turnOff.props,
      text: "Close",
      targetStateNodeId: state.id,
      action: "turn-off",
    };
    toggle.props = {
      ...toggle.props,
      text: "Toggle",
      targetStateNodeId: state.id,
      action: "toggle",
    };
    disabled.props = {
      ...disabled.props,
      text: "Disabled action",
      targetStateNodeId: state.id,
      action: "turn-on",
      disabled: true,
    };
    firstConsumer.props.targetStateNodeId = state.id;
    secondConsumer.props.targetStateNodeId = state.id;
    secondConsumer.props.showWhen = false;
    firstText.props.text = "First controlled region";
    secondText.props.text = "Second controlled region";
    const page = createTestPage(
      "page-interactions",
      "Interactions",
      "/interactions",
      [
        state,
        turnOn,
        turnOff,
        toggle,
        disabled,
        firstConsumer,
        secondConsumer,
      ],
      [firstText, secondText],
    );

    render(
      <PageRenderingController
        page={page}
        runtime={{ mode: "preview" }}
        viewport="desktop"
      />,
    );

    expect(screen.queryByText("First controlled region")).not.toBeInTheDocument();
    expect(screen.getByText("Second controlled region")).toBeInTheDocument();
    const disabledAction = screen.getByRole("button", {
      name: "Disabled action",
    });
    expect(disabledAction).toBeDisabled();
    fireEvent.click(disabledAction);
    expect(screen.queryByText("First controlled region")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Open" }));
    fireEvent.click(screen.getByRole("button", { name: "Open" }));
    expect(screen.getByText("First controlled region")).toBeInTheDocument();
    expect(screen.queryByText("Second controlled region")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByText("First controlled region")).not.toBeInTheDocument();
    expect(screen.getByText("Second controlled region")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Toggle" }));
    expect(screen.getByText("First controlled region")).toBeInTheDocument();
    expect(screen.queryByText("Second controlled region")).not.toBeInTheDocument();
  });

  it("should apply a changed authored default during the active page session", () => {
    const { page, state } = createTogglePage(
      "page-default-change",
      "Default-controlled content",
    );
    const view = render(
      <PageRenderingController
        page={page}
        runtime={{ mode: "preview" }}
        viewport="desktop"
      />,
    );
    expect(
      screen.queryByText("Default-controlled content"),
    ).not.toBeInTheDocument();
    const updatedPage = structuredClone(page);
    updatedPage.nodes[state.id].props.defaultValue = true;

    view.rerender(
      <PageRenderingController
        page={updatedPage}
        runtime={{ mode: "preview" }}
        viewport="desktop"
      />,
    );

    expect(screen.getByText("Default-controlled content")).toBeInTheDocument();
  });

  it("should make consumers unavailable when their state is deleted during runtime", () => {
    const { page, state } = createTogglePage(
      "page-state-deletion",
      "Deleted-state content",
    );
    const view = render(
      <PageRenderingController
        page={page}
        runtime={{ mode: "preview" }}
        viewport="desktop"
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Toggle state" }));
    expect(screen.getByText("Deleted-state content")).toBeInTheDocument();
    const updatedPage = structuredClone(page);
    delete updatedPage.nodes[state.id];
    updatedPage.rootIds = updatedPage.rootIds.filter(
      (nodeId) => nodeId !== state.id,
    );

    view.rerender(
      <PageRenderingController
        page={updatedPage}
        runtime={{ mode: "preview" }}
        viewport="desktop"
      />,
    );

    expect(
      screen.getByRole("button", { name: "Toggle state" }),
    ).toHaveAttribute("aria-disabled", "true");
    expect(screen.queryByText("Deleted-state content")).not.toBeInTheDocument();
  });

  it("should activate a State Action with Enter and Space", async () => {
    const user = userEvent.setup();
    const { page } = createTogglePage(
      "page-keyboard-action",
      "Keyboard-controlled content",
    );
    render(
      <PageRenderingController
        page={page}
        runtime={{ mode: "preview" }}
        viewport="desktop"
      />,
    );
    const action = screen.getByRole("button", { name: "Toggle state" });
    action.focus();

    await user.keyboard("{Enter}");

    expect(screen.getByText("Keyboard-controlled content")).toBeInTheDocument();

    await user.keyboard(" ");

    expect(
      screen.queryByText("Keyboard-controlled content"),
    ).not.toBeInTheDocument();
  });

  it("should preserve live state when unrelated page content changes", () => {
    const { page, text } = createTogglePage(
      "page-unrelated-edit",
      "Original conditional copy",
    );
    const view = render(
      <PageRenderingController
        page={page}
        runtime={{ mode: "preview" }}
        viewport="desktop"
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Toggle state" }));
    expect(screen.getByText("Original conditional copy")).toBeInTheDocument();
    const updatedPage = structuredClone(page);
    updatedPage.nodes[text.id].props.text = "Updated conditional copy";

    view.rerender(
      <PageRenderingController
        page={updatedPage}
        runtime={{ mode: "preview" }}
        viewport="desktop"
      />,
    );

    expect(screen.getByText("Updated conditional copy")).toBeInTheDocument();
  });

  it("should mount a fresh conditional subtree after it becomes absent", () => {
    const state = createTestNode("boolean-state", "state-panel-open");
    const toggle = createTestNode("state-action", "action-panel-toggle");
    const conditional = createTestNode(
      "conditional-content",
      "conditional-panel",
      ["input-panel"],
    );
    const input = createTestNode("input", "input-panel");

    state.props.defaultValue = false;
    toggle.props = {
      ...toggle.props,
      text: "Toggle panel",
      targetStateNodeId: state.id,
      action: "toggle",
    };
    conditional.props.targetStateNodeId = state.id;
    input.props = {
      ...input.props,
      label: "Panel value",
      defaultValue: "Fresh value",
    };
    const page = createTestPage(
      "page-fresh-instance",
      "Fresh instance",
      "/fresh-instance",
      [state, toggle, conditional],
      [input],
    );

    render(
      <PageRenderingController
        page={page}
        runtime={{ mode: "preview" }}
        viewport="desktop"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Toggle panel" }));
    const field = screen.getByRole("textbox", { name: "Panel value" });
    fireEvent.change(field, { target: { value: "Visitor edit" } });
    expect(field).toHaveValue("Visitor edit");

    fireEvent.click(screen.getByRole("button", { name: "Toggle panel" }));
    expect(screen.queryByRole("textbox", { name: "Panel value" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Toggle panel" }));
    expect(screen.getByRole("textbox", { name: "Panel value" })).toHaveValue(
      "Fresh value",
    );
  });

  it("should keep inactive content authored in Editor while unresolved Preview content stays absent", () => {
    const action = createTestNode("state-action", "action-unresolved");
    const conditional = createTestNode(
      "conditional-content",
      "conditional-unresolved",
      ["text-unresolved"],
    );
    const text = createTestNode("text", "text-unresolved");
    action.props = {
      ...action.props,
      text: "Unavailable action",
      targetStateNodeId: "state-missing",
    };
    conditional.props.targetStateNodeId = "state-missing";
    text.props.text = "Authored hidden content";
    const page = createTestPage(
      "page-unresolved",
      "Unresolved",
      "/unresolved",
      [action, conditional],
      [text],
    );

    const preview = render(
      <PageRenderingController
        page={page}
        runtime={{ mode: "preview" }}
        viewport="desktop"
      />,
    );

    expect(
      screen.getByRole("button", { name: "Unavailable action" }),
    ).toHaveAttribute("aria-disabled", "true");
    expect(screen.queryByText("Authored hidden content")).not.toBeInTheDocument();

    preview.rerender(
      <PageRenderingController
        page={page}
        runtime={{ mode: "editor" }}
        viewport="desktop"
      />,
    );
    expect(screen.getByText("Authored hidden content").parentElement).toHaveAttribute(
      "data-conditional-content-state",
      "inactive",
    );
  });

  it("should isolate runtime values when the rendered page changes", () => {
    const firstState = createTestNode("boolean-state", "state-first-page");
    const firstAction = createTestNode("state-action", "action-first-page");
    const firstConditional = createTestNode(
      "conditional-content",
      "conditional-first-page",
      ["text-first-page"],
    );
    const firstText = createTestNode("text", "text-first-page");
    firstAction.props.targetStateNodeId = firstState.id;
    firstConditional.props.targetStateNodeId = firstState.id;
    firstText.props.text = "First page content";
    const firstPage = createTestPage(
      "page-first-runtime",
      "First runtime",
      "/first-runtime",
      [firstState, firstAction, firstConditional],
      [firstText],
    );

    const secondState = createTestNode("boolean-state", "state-second-page");
    const secondConditional = createTestNode(
      "conditional-content",
      "conditional-second-page",
      ["text-second-page"],
    );
    const secondText = createTestNode("text", "text-second-page");
    secondState.props.defaultValue = true;
    secondConditional.props.targetStateNodeId = secondState.id;
    secondText.props.text = "Second page content";
    const secondPage = createTestPage(
      "page-second-runtime",
      "Second runtime",
      "/second-runtime",
      [secondState, secondConditional],
      [secondText],
    );

    const view = render(
      <PageRenderingController
        page={firstPage}
        runtime={{ mode: "preview" }}
        viewport="desktop"
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Toggle state" }));
    expect(screen.getByText("First page content")).toBeInTheDocument();

    view.rerender(
      <PageRenderingController
        page={secondPage}
        runtime={{ mode: "preview" }}
        viewport="mobile"
      />,
    );
    expect(screen.queryByText("First page content")).not.toBeInTheDocument();
    expect(screen.getByText("Second page content")).toBeInTheDocument();

    view.rerender(
      <PageRenderingController
        page={firstPage}
        runtime={{ mode: "preview" }}
        viewport="desktop"
      />,
    );
    expect(screen.queryByText("First page content")).not.toBeInTheDocument();
  });
});
