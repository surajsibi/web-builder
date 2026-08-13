import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { Profiler } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { asNodeId, asPageId } from "@/builder/model/ids";
import { createNewProject } from "@/builder/project/factory";
import { createBuilderStore } from "@/builder/store/builder-store";
import { editorStore } from "@/builder/store/editor-store";
import { createMemoryPreviewStorage } from "@/builder/testing/memory-preview-storage";
import { takePreviewSnapshot } from "@/builder/preview/preview-snapshot";
import { EditorShell } from "@/builder/ui/editor-shell";

afterEach(() => {
  cleanup();
  window.localStorage.removeItem(
    "canvas-studio:editor-panel-preferences:v1",
  );
});

function createEditorTestStore() {
  let nodeCounter = 0;
  const project = createNewProject({
    name: "Editor Test Project",
    now: "2026-08-07T00:00:00.000Z",
    idGenerator: (prefix) =>
      prefix === "project" ? "project-editor-test" : "page-editor-test",
  });

  return createBuilderStore({
    initialDocument: project,
    idGenerator: (prefix) => {
      if (prefix === "node") {
        nodeCounter += 1;
        return "node-editor-" + nodeCounter;
      }
      return prefix + "-editor-generated";
    },
  });
}

describe("EditorShell", () => {
  it("should not rerender the shell when only the active drop target changes", () => {
    const store = createEditorTestStore();
    let commits = 0;
    render(
      <Profiler id="editor-shell" onRender={() => commits++}>
        <EditorShell store={store} />
      </Profiler>,
    );
    act(() => {
      store.getState().setDragSession({
        source: { kind: "component", componentType: "text" },
      });
    });
    commits = 0;

    act(() => {
      store.getState().setActiveDropTarget({
        surface: "canvas",
        intent: "root",
        targetNodeId: null,
        destination: { parentId: null, index: 0 },
        label: "Page root",
      });
    });

    expect(commits).toBe(0);
  });

  it("should render the intended default project name in the toolbar", () => {
    render(<EditorShell store={editorStore} />);

    expect(screen.getByText("Make It Yours")).toBeInTheDocument();
  });

  it("should render the toolbar, component library, empty canvas, and empty Inspector", () => {
    const previewStorage = createMemoryPreviewStorage();

    render(
      <EditorShell
        previewStorage={previewStorage}
        store={createEditorTestStore()}
      />,
    );

    expect(screen.getByText("Canvas Studio")).toBeInTheDocument();
    expect(screen.getByText("Editor Test Project")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Components" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(screen.getByText("Your page is empty")).toBeInTheDocument();
    expect(screen.getByText("No component selected")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Desktop" }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(
      screen.getByRole("button", { name: "Add Section" }),
    ).toBeInTheDocument();
    const previewLink = screen.getByRole("link", { name: "Preview" });
    expect(previewLink).toHaveAttribute(
      "href",
      "/preview?snapshot=project-editor-test%3Apage-editor-test%3A0",
    );
    expect(previewLink).toHaveAttribute("target", "_blank");
    expect(previewLink).toHaveAttribute("rel", "noopener noreferrer");

    previewLink.addEventListener("click", (event) => event.preventDefault());
    fireEvent.click(previewLink);
    expect(
      takePreviewSnapshot(
        previewStorage,
        "project-editor-test:page-editor-test:0",
      ),
    ).toMatchObject({
      activePageId: "page-editor-test",
      document: { projectId: "project-editor-test" },
    });
  });

  it("should independently collapse, restore, and remember both editor panels", async () => {
    render(<EditorShell store={createEditorTestStore()} />);

    const workspace = document.querySelector(".editor-workspace");
    expect(workspace).toHaveAttribute("data-left-panel-collapsed", "false");
    expect(workspace).toHaveAttribute("data-inspector-collapsed", "false");

    fireEvent.click(
      screen.getByRole("button", { name: "Collapse Component Library" }),
    );
    expect(workspace).toHaveAttribute("data-left-panel-collapsed", "true");
    expect(
      screen.getByRole("button", { name: "Expand Component Library" }),
    ).toHaveAttribute("aria-expanded", "false");
    expect(
      screen.queryByRole("heading", { name: "Components" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("main")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "Components" }));
    expect(workspace).toHaveAttribute("data-left-panel-collapsed", "false");
    expect(
      screen.getByRole("heading", { name: "Components" }),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Collapse Component Library" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Collapse Inspector" }));
    expect(workspace).toHaveAttribute("data-inspector-collapsed", "true");
    expect(
      screen.getByRole("button", { name: "Expand Inspector" }),
    ).toHaveAttribute("aria-expanded", "false");

    expect(
      JSON.parse(
        window.localStorage.getItem(
          "canvas-studio:editor-panel-preferences:v1",
        ) ?? "null",
      ),
    ).toEqual({
      inspectorCollapsed: true,
      leftPanelCollapsed: true,
    });

    cleanup();
    render(<EditorShell store={createEditorTestStore()} />);

    expect(
      await screen.findByRole("button", { name: "Expand Component Library" }),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole("button", { name: "Expand Inspector" }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Expand Inspector" }));
    expect(
      screen.getByRole("heading", { name: "Inspector" }),
    ).toBeInTheDocument();
  });

  it("should keep the editor open and announce when preview storage is unavailable", () => {
    render(
      <EditorShell
        previewStorage={{
          setItem: () => {
            throw new Error("Storage unavailable");
          },
        }}
        store={createEditorTestStore()}
      />,
    );

    const previewLink = screen.getByRole("link", { name: "Preview" });

    expect(fireEvent.click(previewLink)).toBe(false);
    expect(
      screen.getByText(
        "Preview could not open because browser storage is unavailable.",
      ),
    ).toBeInTheDocument();
  });

  it("should filter Button presets and insert a Raised 3D preset as one editable Button", () => {
    render(<EditorShell store={createEditorTestStore()} />);

    fireEvent.click(screen.getByRole("button", { name: /Buttons/ }));
    fireEvent.click(screen.getByRole("button", { name: "3D" }));

    expect(
      screen.getByRole("button", { name: "Add Raised 3D button" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Add Button" }),
    ).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Add Raised 3D button" }),
    );

    expect(
      screen.getByRole("button", { name: "Start building" }),
    ).toHaveStyle({
      backgroundColor: "#f7c84c",
      borderColor: "#9f7118",
      borderStyle: "solid",
      borderWidth: "2px",
    });
    expect(screen.getByRole("status")).toHaveTextContent(
      "Added Raised 3D at Page root.",
    );

    fireEvent.click(screen.getByRole("button", { name: "Undo" }));

    expect(
      screen.queryByRole("button", { name: "Start building" }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Your page is empty")).toBeInTheDocument();
  });

  it("should insert the Password reveal preset as one editable Input", () => {
    const store = createEditorTestStore();
    render(<EditorShell store={store} />);

    fireEvent.click(screen.getByRole("button", { name: /Inputs/ }));
    fireEvent.click(
      screen.getByRole("button", { name: "Add Password reveal input" }),
    );

    const input = screen.getByLabelText("Password");
    expect(input).toHaveAttribute("type", "password");
    expect(
      screen.getByRole("button", { name: "Show Password" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("checkbox", { name: "Allow password reveal" }),
    ).toBeChecked();
    expect(
      store.getState().document?.pages[asPageId("page-editor-test")].nodes[
        asNodeId("node-editor-1")
      ].props,
    ).toMatchObject({
      label: "Password",
      name: "password",
      inputType: "password",
      allowPasswordReveal: true,
    });
    expect(screen.getByRole("status")).toHaveTextContent(
      "Added Password reveal at Page root.",
    );

    fireEvent.click(screen.getByRole("button", { name: "Show Password" }));

    expect(input).toHaveAttribute("type", "password");
  });

  it("should search within the active component family and show an empty result", () => {
    render(<EditorShell store={createEditorTestStore()} />);
    fireEvent.click(screen.getByRole("button", { name: /Buttons/ }));
    const search = screen.getByRole("searchbox", { name: "Search components" });

    fireEvent.change(search, { target: { value: "glow" } });

    expect(
      screen.getByRole("button", { name: "Add Soft glow button" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Add Raised 3D button" }),
    ).not.toBeInTheDocument();

    fireEvent.change(search, { target: { value: "not-a-component" } });

    expect(screen.getByText("No matching components")).toBeInTheDocument();
    expect(screen.getByText("0 shown")).toBeInTheDocument();
  });

  it("should insert a library component through the command dispatcher and select it", () => {
    const store = createEditorTestStore();
    const dispatch = vi.fn(store.getState().dispatchEditorCommand);
    store.setState({ dispatchEditorCommand: dispatch });
    render(<EditorShell store={store} />);

    fireEvent.click(screen.getByRole("button", { name: "Add Section" }));

    expect(dispatch).toHaveBeenCalledWith({
      kind: "node.insert",
      pageId: "page-editor-test",
      componentType: "section",
      destination: { parentId: null, index: 0 },
    });
    expect(store.getState().selectedNodeId).toBe("node-editor-1");
    expect(document.querySelector(".canvas-selection-outline")).toHaveTextContent(
      "Section 1",
    );
    expect(screen.getByRole("status")).toHaveTextContent(
      "Added section at Page root.",
    );
    expect(screen.getAllByText("Section 1").length).toBeGreaterThan(0);
  });

  it("should rename a selected component from the Inspector and update Layers", () => {
    const store = createEditorTestStore();
    render(<EditorShell store={store} />);
    fireEvent.click(screen.getByRole("button", { name: "Add Section" }));
    const historyBeforeRename = store.getState().history.past.length;
    const nameInput = screen.getByRole("textbox", { name: "Component name" });

    nameInput.focus();
    fireEvent.change(nameInput, { target: { value: "  Navbar  " } });
    fireEvent.keyDown(nameInput, { key: "Enter" });

    expect(store.getState().history.past).toHaveLength(historyBeforeRename + 1);
    expect(
      store.getState().document?.pages[asPageId("page-editor-test")].nodes[
        asNodeId("node-editor-1")
      ].meta.name,
    ).toBe("Navbar");
    fireEvent.click(screen.getByRole("tab", { name: "Layers" }));
    expect(
      screen.getByRole("button", { name: "Select Navbar" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Component name" })).toHaveValue(
      "Navbar",
    );
    expect(screen.getByRole("status")).toHaveTextContent(
      "Renamed Section 1 to Navbar.",
    );

    fireEvent.click(screen.getByRole("button", { name: "Undo" }));

    expect(
      screen.getByRole("button", { name: "Select Section 1" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Component name" })).toHaveValue(
      "Section 1",
    );
  });

  it("should keep the current component name when the Inspector draft is blank", () => {
    const store = createEditorTestStore();
    render(<EditorShell store={store} />);
    fireEvent.click(screen.getByRole("button", { name: "Add Section" }));
    const historyBeforeEdit = store.getState().history.past.length;
    const nameInput = screen.getByRole("textbox", { name: "Component name" });

    fireEvent.change(nameInput, { target: { value: "   " } });
    fireEvent.blur(nameInput);

    expect(nameInput).toHaveValue("Section 1");
    expect(store.getState().history.past).toHaveLength(historyBeforeEdit);
    expect(
      store.getState().document?.pages[asPageId("page-editor-test")].nodes[
        asNodeId("node-editor-1")
      ].meta.name,
    ).toBe("Section 1");
  });

  it("should insert and configure a linked SVG Image through the Inspector", () => {
    const store = createEditorTestStore();
    render(<EditorShell store={store} />);

    fireEvent.click(screen.getByRole("button", { name: /Media/ }));
    fireEvent.click(screen.getByRole("button", { name: "Add Image" }));

    expect(screen.getByRole("img", { name: "Image" })).toHaveAttribute(
      "src",
      "/saturn-mark.svg",
    );

    const source = screen.getByRole("textbox", { name: "Image source" });
    fireEvent.change(source, {
      target: { value: "/commerce-navbar/bag.svg" },
    });
    fireEvent.blur(source);

    const alternativeText = screen.getByRole("textbox", {
      name: "Alternative text",
    });
    fireEvent.change(alternativeText, { target: { value: "Store home" } });
    fireEvent.blur(alternativeText);

    const destination = screen.getByRole("textbox", { name: "Link" });
    fireEvent.change(destination, { target: { value: "/" } });
    fireEvent.blur(destination);
    fireEvent.click(screen.getByRole("checkbox", { name: "Open in new tab" }));
    fireEvent.change(screen.getByRole("combobox", { name: "Fit" }), {
      target: { value: "cover" },
    });

    const link = screen.getByRole("link", { name: "Store home" });
    expect(link).toHaveAttribute("href", "/");
    expect(link).toHaveAttribute("target", "_blank");
    expect(within(link).getByRole("img", { name: "Store home" })).toHaveAttribute(
      "src",
      "/commerce-navbar/bag.svg",
    );
    expect(
      store.getState().document?.pages[asPageId("page-editor-test")].nodes[
        asNodeId("node-editor-1")
      ].props,
    ).toEqual({
      src: "/commerce-navbar/bag.svg",
      alt: "Store home",
      href: "/",
      openInNewTab: true,
      fit: "cover",
    });
  });

  it("should insert a semantic responsive Navbar block as one editable subtree", () => {
    const store = createEditorTestStore();
    const dispatch = vi.fn(store.getState().dispatchEditorCommand);
    store.setState({ dispatchEditorCommand: dispatch });
    render(<EditorShell store={store} />);

    fireEvent.click(screen.getByRole("button", { name: "Add Navbar block" }));

    expect(dispatch).toHaveBeenCalledWith({
      kind: "block.insert",
      pageId: "page-editor-test",
      blockType: "navbar",
      destination: { parentId: null, index: 0 },
    });
    expect(store.getState().history.past).toHaveLength(1);
    expect(store.getState().selectedNodeId).toBe("node-editor-1");
    expect(
      Object.keys(
        store.getState().document?.pages[asPageId("page-editor-test")].nodes ?? {},
      ),
    ).toHaveLength(9);
    expect(document.querySelector("header.canvas-node")).toBeInTheDocument();
    const navigation = document.querySelector("nav.canvas-node");
    expect(navigation).toBeInTheDocument();
    expect(navigation).toHaveStyle({
      display: "flex",
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#202020",
      borderRadius: "999px",
    });
    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute(
      "href",
      "#top",
    );
    expect(screen.getByRole("link", { name: "Work" })).toHaveAttribute(
      "href",
      "#work",
    );
    expect(screen.getByRole("link", { name: "About" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Playground" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Resource" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "ihyaet@gmail.com" })).toHaveAttribute(
      "href",
      "mailto:ihyaet@gmail.com",
    );
    expect(screen.getByRole("status")).toHaveTextContent(
      "Added Navbar at Page root.",
    );

    fireEvent.click(screen.getByRole("button", { name: "Mobile" }));

    expect(navigation).toHaveStyle({
      flexDirection: "column",
      alignItems: "stretch",
    });
    expect(screen.getByRole("link", { name: "Work" })).toHaveStyle({
      width: "100%",
    });
  });

  it("should restrict a block root while allowing an eligible block-created leaf offset", () => {
    const store = createEditorTestStore();
    render(<EditorShell store={store} />);
    fireEvent.click(screen.getByRole("button", { name: "Add Navbar block" }));
    fireEvent.click(screen.getByText("Position", { selector: "summary > span" }));

    expect(screen.getByLabelText("Offset X")).toBeDisabled();
    expect(
      screen.getByText(/Root positioning remains disabled until container verification passes/),
    ).toBeVisible();

    fireEvent.click(screen.getByRole("tab", { name: "Layers" }));
    const layers = screen.getByRole("tree", { name: "Page layers" });
    fireEvent.click(
      within(layers).getAllByRole("button", { name: /Select Link/ })[0],
    );

    const offsetX = screen.getByLabelText("Offset X");
    expect(offsetX).toBeEnabled();
    fireEvent.change(offsetX, { target: { value: "18" } });
    fireEvent.blur(offsetX);
    const offsetY = screen.getByLabelText("Offset Y");
    fireEvent.change(offsetY, { target: { value: "-6" } });
    fireEvent.blur(offsetY);

    expect(screen.getByRole("link", { name: "Work" })).toHaveStyle({
      translate: "18px -6px",
    });
    expect(
      store.getState().document?.pages[asPageId("page-editor-test")].nodes[
        asNodeId("node-editor-5")
      ].styles.base.positionOffset,
    ).toEqual({
      x: { value: 18, unit: "px" },
      y: { value: -6, unit: "px" },
    });
  });

  it("should insert the Commerce Navbar without replacing the original Navbar block", () => {
    const store = createEditorTestStore();
    const dispatch = vi.fn(store.getState().dispatchEditorCommand);
    store.setState({ dispatchEditorCommand: dispatch });
    render(<EditorShell store={store} />);

    expect(
      screen.getByRole("button", { name: "Add Navbar block" }),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Add Commerce Navbar block" }),
    );

    expect(dispatch).toHaveBeenCalledWith({
      kind: "block.insert",
      pageId: "page-editor-test",
      blockType: "commerce-navbar",
      destination: { parentId: null, index: 0 },
    });
    expect(store.getState().history.past).toHaveLength(1);
    expect(store.getState().selectedNodeId).toBe("node-editor-1");
    expect(
      Object.keys(
        store.getState().document?.pages[asPageId("page-editor-test")].nodes ?? {},
      ),
    ).toHaveLength(70);
    expect(screen.getByRole("link", { name: "Brandname" })).toHaveAttribute(
      "href",
      "#top",
    );
    expect(screen.getByRole("textbox", { name: "Find product" })).toHaveAttribute(
      "placeholder",
      "Find product",
    );
    expect(
      screen.getAllByRole("link", { name: "Electronics" })[0],
    ).toHaveAttribute("href", "#electronics");
    expect(screen.getByRole("link", { name: "Smartphones" })).toHaveAttribute(
      "href",
      "#smartphones",
    );
    expect(screen.getByRole("status")).toHaveTextContent(
      "Added Commerce Navbar at Page root.",
    );

    const categorySummary = within(screen.getByLabelText("Page canvas"))
      .getByText("All category")
      .closest("summary");
    const categoryDisclosure = categorySummary?.closest("details");
    const megaMenu = categorySummary?.nextElementSibling;
    if (!categorySummary || !categoryDisclosure || !megaMenu) {
      throw new Error("Expected the All category disclosure and mega menu");
    }

    expect(categoryDisclosure).not.toHaveAttribute("open");
    expect(megaMenu).toHaveStyle({ position: "absolute" });

    fireEvent.click(categorySummary);

    expect(categoryDisclosure).toHaveAttribute("open");

    fireEvent.click(screen.getByRole("button", { name: "Mobile" }));

    expect(megaMenu).toHaveStyle({
      position: "static",
      gridTemplateColumns: "repeat(1, minmax(0, 1fr))",
    });

    fireEvent.click(categorySummary);

    expect(categoryDisclosure).not.toHaveAttribute("open");
  });

  it("should insert inside the selected container and keep a two-card selection summary", () => {
    render(<EditorShell store={createEditorTestStore()} />);

    fireEvent.click(screen.getByRole("button", { name: "Add Section" }));
    fireEvent.click(screen.getByRole("button", { name: "Add Container" }));

    expect(screen.getByText("Empty Container")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(
      "Added container at Inside Section 1.",
    );
    expect(screen.getAllByText("Container 1").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Section 1").length).toBeGreaterThan(0);
    expect(
      Array.from(document.querySelectorAll(".node-metadata dt")).map(
        (term) => term.textContent,
      ),
    ).toEqual(["Name", "Type"]);
  });

  it("should select the deepest rendered node when it is clicked", () => {
    render(<EditorShell store={createEditorTestStore()} />);
    fireEvent.click(screen.getByRole("button", { name: "Add Section" }));
    fireEvent.click(screen.getByRole("button", { name: "Add Text" }));
    const textNode = screen.getByText("Text", { selector: "p" });
    const section = textNode.closest("section");
    if (!section) throw new Error("Expected Text to render inside Section");

    fireEvent.click(section);
    fireEvent.click(textNode);

    expect(document.querySelector(".canvas-selection-outline")).toHaveTextContent(
      "Text 1",
    );
    expect(screen.getByRole("status")).toHaveTextContent("Selected Text 1.");
  });

  it("should switch the canvas and rendered values to the mobile viewport", () => {
    render(<EditorShell store={createEditorTestStore()} />);
    fireEvent.click(screen.getByRole("button", { name: "Add Button" }));
    const renderedButton = screen.getByRole("button", { name: "Button" });

    expect(renderedButton).toHaveStyle({ width: "fit-content" });
    fireEvent.click(screen.getByRole("button", { name: "Mobile" }));

    expect(screen.getByRole("button", { name: "Mobile" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(renderedButton).toHaveStyle({ width: "100%" });
    expect(
      screen.getByLabelText("Home canvas, mobile viewport"),
    ).toBeInTheDocument();
  });

  it("should configure a trailing Button icon from the Inspector", () => {
    const store = createEditorTestStore();
    render(<EditorShell store={store} />);
    fireEvent.click(screen.getByRole("button", { name: "Add Button" }));

    fireEvent.change(screen.getByLabelText("Icon"), {
      target: { value: "arrow-right" },
    });
    fireEvent.change(screen.getByLabelText("Icon position"), {
      target: { value: "end" },
    });

    const renderedButton = screen.getByRole("button", { name: "Button" });
    const icon = renderedButton.querySelector("svg");

    expect(renderedButton.lastElementChild).toBe(icon);
    expect(icon).toHaveAttribute("aria-hidden", "true");
    expect(
      store.getState().document?.pages[asPageId("page-editor-test")].nodes[
        asNodeId("node-editor-1")
      ].props,
    ).toEqual({
      text: "Button",
      href: "",
      openInNewTab: false,
      icon: "arrow-right",
      iconPosition: "end",
      iconAnimation: "none",
      behavior: "button",
    });
  });

  it("should update text content from the Inspector through a complete props command", () => {
    render(<EditorShell store={createEditorTestStore()} />);
    fireEvent.click(screen.getByRole("button", { name: "Add Text" }));
    const control = screen.getByLabelText("Text content");

    fireEvent.change(control, { target: { value: "Hello from the editor" } });
    fireEvent.blur(control);

    expect(
      screen.getByText("Hello from the editor", { selector: "p" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(
      "Updated Text 1 content.",
    );
    expect(screen.getByRole("button", { name: "Undo" })).toBeEnabled();
  });

  it("should insert and configure an Input through the Inspector", () => {
    const store = createEditorTestStore();
    render(<EditorShell store={store} />);

    fireEvent.click(screen.getByRole("button", { name: "Add Input" }));
    fireEvent.change(screen.getByLabelText("Accessible label"), {
      target: { value: "Email address" },
    });
    fireEvent.blur(screen.getByLabelText("Accessible label"));
    fireEvent.change(screen.getByLabelText("Form field name"), {
      target: { value: "email" },
    });
    fireEvent.blur(screen.getByLabelText("Form field name"));
    fireEvent.change(screen.getByRole("combobox", { name: "Input type" }), {
      target: { value: "email" },
    });
    fireEvent.change(screen.getByLabelText("Placeholder"), {
      target: { value: "you@example.com" },
    });
    fireEvent.blur(screen.getByLabelText("Placeholder"));
    fireEvent.change(screen.getByLabelText("Default value"), {
      target: { value: "ada@example.com" },
    });
    fireEvent.blur(screen.getByLabelText("Default value"));
    fireEvent.click(screen.getByRole("checkbox", { name: "Required" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Disabled" }));

    const input = screen.getByRole("textbox", { name: "Email address" });

    expect(input).toHaveAttribute("type", "email");
    expect(input).toHaveAttribute("name", "email");
    expect(input).toHaveAttribute("placeholder", "you@example.com");
    expect(input).toHaveValue("ada@example.com");
    expect(input).toBeRequired();
    expect(input).toBeDisabled();
    expect(
      store.getState().document?.pages[asPageId("page-editor-test")].nodes[
        asNodeId("node-editor-1")
      ].props,
    ).toEqual({
      label: "Email address",
      controlId: "",
      name: "email",
      inputType: "email",
      allowPasswordReveal: false,
      placeholder: "you@example.com",
      defaultValue: "ada@example.com",
      required: true,
      disabled: true,
    });
  });

  it("should associate a configured Label and Input through their control IDs", () => {
    const store = createEditorTestStore();
    render(<EditorShell store={store} />);

    fireEvent.click(screen.getByRole("button", { name: "Add Label" }));
    fireEvent.change(screen.getByLabelText("Text content"), {
      target: { value: "Email address" },
    });
    fireEvent.blur(screen.getByLabelText("Text content"));
    fireEvent.change(screen.getByLabelText("For control ID"), {
      target: { value: "email-field" },
    });
    fireEvent.blur(screen.getByLabelText("For control ID"));

    fireEvent.click(screen.getByRole("button", { name: "Add Input" }));
    fireEvent.change(screen.getByLabelText("Control ID (for Label)"), {
      target: { value: "email-field" },
    });
    fireEvent.blur(screen.getByLabelText("Control ID (for Label)"));

    const label = screen.getByText("Email address", { selector: "label" });
    const input = screen.getByRole("textbox", { name: "Email address" });

    expect(label).toHaveAttribute("for", "email-field");
    expect(input).toHaveAttribute("id", "email-field");
    expect(input).not.toHaveAttribute("aria-label");
    expect(
      store.getState().document?.pages[asPageId("page-editor-test")].nodes[
        asNodeId("node-editor-1")
      ].props,
    ).toEqual({ text: "Email address", forId: "email-field" });
  });

  it("should insert and configure a Textarea through the Inspector", () => {
    const store = createEditorTestStore();
    render(<EditorShell store={store} />);

    fireEvent.click(screen.getByRole("button", { name: "Add Textarea" }));
    fireEvent.change(screen.getByLabelText("Accessible label"), {
      target: { value: "Message" },
    });
    fireEvent.blur(screen.getByLabelText("Accessible label"));
    fireEvent.change(screen.getByLabelText("Form field name"), {
      target: { value: "message" },
    });
    fireEvent.blur(screen.getByLabelText("Form field name"));
    fireEvent.change(screen.getByLabelText("Placeholder"), {
      target: { value: "How can we help?" },
    });
    fireEvent.blur(screen.getByLabelText("Placeholder"));
    fireEvent.change(screen.getByLabelText("Default value"), {
      target: { value: "Line one\nLine two" },
    });
    fireEvent.blur(screen.getByLabelText("Default value"));
    fireEvent.change(screen.getByRole("spinbutton", { name: "Rows" }), {
      target: { value: "6" },
    });
    fireEvent.blur(screen.getByRole("spinbutton", { name: "Rows" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Required" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Disabled" }));

    const textarea = screen.getByRole("textbox", { name: "Message" });

    expect(textarea.tagName).toBe("TEXTAREA");
    expect(textarea).toHaveAttribute("name", "message");
    expect(textarea).toHaveAttribute("placeholder", "How can we help?");
    expect(textarea).toHaveAttribute("rows", "6");
    expect(textarea).toHaveValue("Line one\nLine two");
    expect(textarea).toBeRequired();
    expect(textarea).toBeDisabled();
    expect(
      store.getState().document?.pages[asPageId("page-editor-test")].nodes[
        asNodeId("node-editor-1")
      ].props,
    ).toEqual({
      label: "Message",
      controlId: "",
      name: "message",
      placeholder: "How can we help?",
      defaultValue: "Line one\nLine two",
      rows: 6,
      required: true,
      disabled: true,
    });
  });

  it("should insert and configure a Dropdown through the Inspector", () => {
    const store = createEditorTestStore();
    render(<EditorShell store={store} />);

    fireEvent.click(screen.getByRole("button", { name: "Add Dropdown" }));
    fireEvent.change(screen.getByLabelText("Accessible label"), {
      target: { value: "Country" },
    });
    fireEvent.blur(screen.getByLabelText("Accessible label"));
    fireEvent.change(screen.getByRole("textbox", { name: "Option 1" }), {
      target: { value: "India" },
    });
    fireEvent.blur(screen.getByRole("textbox", { name: "Option 1" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Option 2" }), {
      target: { value: "Canada" },
    });
    fireEvent.blur(screen.getByRole("textbox", { name: "Option 2" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Option 3" }), {
      target: { value: "Japan" },
    });
    fireEvent.blur(screen.getByRole("textbox", { name: "Option 3" }));
    fireEvent.change(screen.getByLabelText("Default value"), {
      target: { value: "Canada" },
    });
    fireEvent.blur(screen.getByLabelText("Default value"));
    fireEvent.click(screen.getByRole("checkbox", { name: "Required" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Disabled" }));

    const dropdown = screen.getByRole("combobox", { name: "Country" });

    expect(dropdown).toHaveValue("Canada");
    expect(dropdown).toBeRequired();
    expect(dropdown).toBeDisabled();
    expect(
      screen.getByRole("option", { name: "Japan" }),
    ).toBeInTheDocument();
    expect(
      store.getState().document?.pages[asPageId("page-editor-test")].nodes[
        asNodeId("node-editor-1")
      ].props,
    ).toEqual({
      label: "Country",
      controlId: "",
      name: "",
      options: ["India", "Canada", "Japan"],
      placeholder: "Choose an option",
      defaultValue: "Canada",
      required: true,
      disabled: true,
    });
  });

  it("should add and remove individual Dropdown option rows", () => {
    const store = createEditorTestStore();
    render(<EditorShell store={store} />);

    fireEvent.click(screen.getByRole("button", { name: "Add Dropdown" }));
    fireEvent.change(screen.getByLabelText("Default value"), {
      target: { value: "Option two" },
    });
    fireEvent.blur(screen.getByLabelText("Default value"));

    fireEvent.click(screen.getByRole("button", { name: "Add option" }));
    const newOption = screen.getByRole("textbox", { name: "Option 4" });
    fireEvent.change(newOption, { target: { value: "Option four" } });
    fireEvent.blur(newOption);

    expect(
      screen.getByRole("option", { name: "Option four" }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Remove option 2" }));

    expect(
      screen.queryByRole("option", { name: "Option two" }),
    ).not.toBeInTheDocument();
    expect(screen.getAllByRole("textbox", { name: /^Option \d+$/ })).toHaveLength(3);
    expect(
      store.getState().document?.pages[asPageId("page-editor-test")].nodes[
        asNodeId("node-editor-1")
      ].props,
    ).toMatchObject({
      options: ["Option one", "Option three", "Option four"],
      defaultValue: "",
    });
  });

  it("should keep duplicate Dropdown option labels out of the document", () => {
    const store = createEditorTestStore();
    render(<EditorShell store={store} />);

    fireEvent.click(screen.getByRole("button", { name: "Add Dropdown" }));
    const secondOption = screen.getByRole("textbox", { name: "Option 2" });
    fireEvent.change(secondOption, { target: { value: "Option one" } });
    fireEvent.blur(secondOption);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Option labels must be unique.",
    );
    expect(
      store.getState().document?.pages[asPageId("page-editor-test")].nodes[
        asNodeId("node-editor-1")
      ].props.options,
    ).toEqual(["Option one", "Option two", "Option three"]);
  });

  it("should insert and configure a Radio Group through the Inspector", () => {
    const store = createEditorTestStore();
    render(<EditorShell store={store} />);

    fireEvent.click(screen.getByRole("button", { name: "Add Radio Group" }));
    fireEvent.change(screen.getByLabelText("Group label"), {
      target: { value: "Preferred contact method" },
    });
    fireEvent.blur(screen.getByLabelText("Group label"));
    fireEvent.change(screen.getByLabelText("Form field name"), {
      target: { value: "contactMethod" },
    });
    fireEvent.blur(screen.getByLabelText("Form field name"));
    fireEvent.change(screen.getByRole("textbox", { name: "Option 1" }), {
      target: { value: "Email" },
    });
    fireEvent.blur(screen.getByRole("textbox", { name: "Option 1" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Option 2" }), {
      target: { value: "Phone" },
    });
    fireEvent.blur(screen.getByRole("textbox", { name: "Option 2" }));
    fireEvent.change(screen.getByLabelText("Default value"), {
      target: { value: "Phone" },
    });
    fireEvent.blur(screen.getByLabelText("Default value"));
    fireEvent.change(screen.getByRole("combobox", { name: "Orientation" }), {
      target: { value: "horizontal" },
    });
    fireEvent.click(screen.getByRole("checkbox", { name: "Required" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Disabled" }));

    const group = screen.getByRole("group", {
      name: "Preferred contact method",
    });
    const phone = screen.getByRole("radio", { name: "Phone" });

    expect(group).toHaveAttribute("data-orientation", "horizontal");
    expect(group).toBeDisabled();
    expect(phone).toBeChecked();
    expect(phone).toBeRequired();
    expect(
      store.getState().document?.pages[asPageId("page-editor-test")].nodes[
        asNodeId("node-editor-1")
      ].props,
    ).toEqual({
      label: "Preferred contact method",
      name: "contactMethod",
      options: ["Email", "Phone", "Option three"],
      defaultValue: "Phone",
      orientation: "horizontal",
      required: true,
      disabled: true,
    });
  });

  it("should insert and configure a Checkbox through the Inspector", () => {
    const store = createEditorTestStore();
    render(<EditorShell store={store} />);

    fireEvent.click(screen.getByRole("button", { name: "Add Checkbox" }));
    fireEvent.change(screen.getByLabelText("Label"), {
      target: { value: "Accept terms" },
    });
    fireEvent.blur(screen.getByLabelText("Label"));
    fireEvent.change(screen.getByLabelText("Form field name"), {
      target: { value: "terms" },
    });
    fireEvent.blur(screen.getByLabelText("Form field name"));
    fireEvent.change(screen.getByLabelText("Submitted value"), {
      target: { value: "accepted" },
    });
    fireEvent.blur(screen.getByLabelText("Submitted value"));
    fireEvent.click(
      screen.getByRole("checkbox", { name: "Checked by default" }),
    );
    fireEvent.click(screen.getByRole("checkbox", { name: "Required" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Disabled" }));

    const checkbox = screen.getByRole("checkbox", { name: "Accept terms" });

    expect(checkbox).toHaveAttribute("name", "terms");
    expect(checkbox).toHaveAttribute("value", "accepted");
    expect(checkbox).toBeChecked();
    expect(checkbox).toBeRequired();
    expect(checkbox).toBeDisabled();
    expect(
      store.getState().document?.pages[asPageId("page-editor-test")].nodes[
        asNodeId("node-editor-1")
      ].props,
    ).toEqual({
      label: "Accept terms",
      name: "terms",
      value: "accepted",
      defaultChecked: true,
      required: true,
      disabled: true,
    });
  });

  it("should insert and configure a Checkbox Group through the Inspector", () => {
    const store = createEditorTestStore();
    render(<EditorShell store={store} />);

    fireEvent.click(screen.getByRole("button", { name: "Add Checkbox Group" }));
    fireEvent.change(screen.getByLabelText("Group label"), {
      target: { value: "Interests" },
    });
    fireEvent.blur(screen.getByLabelText("Group label"));
    fireEvent.change(screen.getByLabelText("Form field name"), {
      target: { value: "interests" },
    });
    fireEvent.blur(screen.getByLabelText("Form field name"));
    fireEvent.change(screen.getByRole("textbox", { name: "Option 1" }), {
      target: { value: "Design" },
    });
    fireEvent.blur(screen.getByRole("textbox", { name: "Option 1" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Option 2" }), {
      target: { value: "Research" },
    });
    fireEvent.blur(screen.getByRole("textbox", { name: "Option 2" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Option 3" }), {
      target: { value: "Development" },
    });
    fireEvent.blur(screen.getByRole("textbox", { name: "Option 3" }));
    fireEvent.click(
      screen.getByRole("checkbox", { name: "Default selections: Design" }),
    );
    fireEvent.click(
      screen.getByRole("checkbox", {
        name: "Default selections: Development",
      }),
    );
    fireEvent.change(screen.getByRole("combobox", { name: "Orientation" }), {
      target: { value: "horizontal" },
    });
    fireEvent.click(screen.getByRole("checkbox", { name: "Required" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Disabled" }));

    const group = screen.getByRole("group", { name: "Interests" });
    const design = screen.getByRole("checkbox", { name: "Design" });
    const research = screen.getByRole("checkbox", { name: "Research" });
    const development = screen.getByRole("checkbox", { name: "Development" });

    expect(screen.getByRole("group", { name: "Default selections" })).toBeInTheDocument();
    expect(group).toHaveAttribute("data-orientation", "horizontal");
    expect(group).toHaveAttribute("aria-required", "true");
    expect(group).toBeDisabled();
    expect(design).toBeChecked();
    expect(research).not.toBeChecked();
    expect(development).toBeChecked();
    expect(design).toBeDisabled();
    expect(
      store.getState().document?.pages[asPageId("page-editor-test")].nodes[
        asNodeId("node-editor-1")
      ].props,
    ).toEqual({
      label: "Interests",
      name: "interests",
      options: ["Design", "Research", "Development"],
      defaultValues: ["Design", "Development"],
      orientation: "horizontal",
      required: true,
      disabled: true,
    });
  });

  it("should prune Checkbox Group defaults when an option is removed", () => {
    const store = createEditorTestStore();
    render(<EditorShell store={store} />);

    fireEvent.click(screen.getByRole("button", { name: "Add Checkbox Group" }));
    fireEvent.click(
      screen.getByRole("checkbox", {
        name: "Default selections: Option two",
      }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Remove option 2" }));

    expect(
      screen.queryByRole("checkbox", { name: "Option two" }),
    ).not.toBeInTheDocument();
    expect(
      store.getState().document?.pages[asPageId("page-editor-test")].nodes[
        asNodeId("node-editor-1")
      ].props,
    ).toMatchObject({
      options: ["Option one", "Option three"],
      defaultValues: [],
    });
  });

  it("should edit a selected Heading with Enter and commit one undoable content change", () => {
    const store = createEditorTestStore();
    render(<EditorShell store={store} />);
    fireEvent.click(screen.getByRole("button", { name: "Add Heading" }));
    const historyBeforeEdit = store.getState().history.past.length;

    fireEvent.keyDown(window, { key: "Enter" });
    const editor = screen.getByRole("textbox", {
      name: "Edit Heading 1 text",
    });
    editor.textContent = "A title edited on the canvas";
    fireEvent.input(editor);
    fireEvent.keyDown(editor, { key: "Enter" });

    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "A title edited on the canvas",
      }),
    ).toBeInTheDocument();
    expect(store.getState().history.past).toHaveLength(historyBeforeEdit + 1);

    fireEvent.click(screen.getByRole("button", { name: "Undo" }));
    expect(
      screen.getByRole("heading", { level: 2, name: "Heading" }),
    ).toBeInTheDocument();
  });

  it("should edit Text on double-click and commit the draft when focus leaves", () => {
    const store = createEditorTestStore();
    render(<EditorShell store={store} />);
    fireEvent.click(screen.getByRole("button", { name: "Add Text" }));
    const historyBeforeEdit = store.getState().history.past.length;

    fireEvent.doubleClick(screen.getByText("Text", { selector: "p" }));
    const editor = screen.getByRole("textbox", { name: "Edit Text 1 text" });
    editor.textContent = "Paragraph edited directly";
    fireEvent.input(editor);
    fireEvent.blur(editor);

    expect(
      screen.getByText("Paragraph edited directly", { selector: "p" }),
    ).toBeInTheDocument();
    expect(store.getState().history.past).toHaveLength(historyBeforeEdit + 1);
    expect(screen.getByRole("status")).toHaveTextContent(
      "Updated Text 1 content.",
    );
  });

  it("should edit Link text on double-click without changing its destination", () => {
    const store = createEditorTestStore();
    render(<EditorShell store={store} />);
    fireEvent.click(screen.getByRole("button", { name: "Add Link" }));
    const historyBeforeEdit = store.getState().history.past.length;

    fireEvent.doubleClick(screen.getByRole("link", { name: "Link" }));
    const editor = screen.getByRole("textbox", { name: "Edit Link 1 text" });
    expect(fireEvent.click(editor)).toBe(false);
    editor.textContent = "Read the docs";
    fireEvent.input(editor);
    fireEvent.keyDown(editor, { key: "Enter" });

    expect(screen.getByRole("link", { name: "Read the docs" })).toHaveAttribute(
      "href",
      "#",
    );
    expect(store.getState().history.past).toHaveLength(historyBeforeEdit + 1);
    expect(screen.getByRole("status")).toHaveTextContent(
      "Updated Link 1 content.",
    );
  });

  it("should edit Label text inline without changing its control target", () => {
    const store = createEditorTestStore();
    render(<EditorShell store={store} />);
    fireEvent.click(screen.getByRole("button", { name: "Add Label" }));
    const historyBeforeEdit = store.getState().history.past.length;

    fireEvent.doubleClick(screen.getByText("Label", { selector: "label" }));
    const editor = screen.getByRole("textbox", { name: "Edit Label 1 text" });
    editor.textContent = "Email address";
    fireEvent.input(editor);
    fireEvent.keyDown(editor, { key: "Enter" });

    expect(screen.getByText("Email address", { selector: "label" })).toHaveAttribute(
      "for",
      "field",
    );
    expect(store.getState().history.past).toHaveLength(historyBeforeEdit + 1);
  });

  it("should restore the original canvas text when inline editing is canceled", () => {
    const store = createEditorTestStore();
    render(<EditorShell store={store} />);
    fireEvent.click(screen.getByRole("button", { name: "Add Text" }));
    const historyBeforeEdit = store.getState().history.past.length;

    fireEvent.keyDown(window, { key: "Enter" });
    const editor = screen.getByRole("textbox", { name: "Edit Text 1 text" });
    editor.textContent = "Discard this draft";
    fireEvent.input(editor);
    fireEvent.keyDown(editor, { key: "Escape" });

    expect(screen.getByText("Text", { selector: "p" })).toBeInTheDocument();
    expect(
      screen.queryByRole("textbox", { name: "Edit Text 1 text" }),
    ).not.toBeInTheDocument();
    expect(store.getState().history.past).toHaveLength(historyBeforeEdit);
    expect(screen.getByRole("status")).toHaveTextContent(
      "Canceled editing Text 1.",
    );
  });

  it("should keep editor removal and duplication shortcuts inactive during inline text editing", () => {
    const store = createEditorTestStore();
    render(<EditorShell store={store} />);
    fireEvent.click(screen.getByRole("button", { name: "Add Text" }));
    const nodeId = store.getState().selectedNodeId;
    const historyBeforeShortcuts = store.getState().history.past.length;
    fireEvent.keyDown(window, { key: "Enter" });
    const editor = screen.getByRole("textbox", { name: "Edit Text 1 text" });

    fireEvent.keyDown(editor, { key: "d", ctrlKey: true });
    fireEvent.keyDown(editor, { key: "Delete" });

    expect(
      store.getState().document?.pages[asPageId("page-editor-test")].nodes[
        nodeId!
      ],
    ).toBeDefined();
    expect(store.getState().history.past).toHaveLength(historyBeforeShortcuts);
  });

  it("should keep locked Heading content read-only for Enter and double-click", () => {
    const store = createEditorTestStore();
    render(<EditorShell store={store} />);
    fireEvent.click(screen.getByRole("button", { name: "Add Heading" }));
    const nodeId = store.getState().selectedNodeId;
    if (!nodeId) throw new Error("Expected the inserted Heading to be selected");
    store.getState().dispatchEditorCommand({
      kind: "node.lock",
      pageId: asPageId("page-editor-test"),
      nodeId,
      locked: true,
    });

    fireEvent.keyDown(window, { key: "Enter" });
    fireEvent.doubleClick(
      screen.getByRole("heading", { level: 2, name: "Heading" }),
    );

    expect(
      screen.queryByRole("textbox", { name: "Edit Heading 1 text" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: "Heading" }),
    ).toBeInTheDocument();
  });

  it("should visibly update a Heading level and undo the level edit in one step", () => {
    const store = createEditorTestStore();
    render(<EditorShell store={store} />);
    fireEvent.click(screen.getByRole("button", { name: "Add Heading" }));
    const historyBeforeLevelChange = store.getState().history.past.length;

    fireEvent.change(screen.getByLabelText("Level"), {
      target: { value: "h1" },
    });

    expect(screen.getByRole("heading", { level: 1, name: "Heading" })).toHaveStyle({
      fontSize: "40px",
    });
    expect(store.getState().history.past).toHaveLength(
      historyBeforeLevelChange + 1,
    );
    expect(screen.getByRole("status")).toHaveTextContent(
      "Updated Heading 1 level.",
    );

    fireEvent.click(screen.getByRole("button", { name: "Undo" }));

    expect(screen.getByRole("heading", { level: 2, name: "Heading" })).toHaveStyle({
      fontSize: "32px",
    });
  });

  it("should preserve a custom Heading font size when its semantic level changes", () => {
    render(<EditorShell store={createEditorTestStore()} />);
    fireEvent.click(screen.getByRole("button", { name: "Add Heading" }));
    fireEvent.click(screen.getByText("Typography", { selector: "summary > span" }));
    const fontSize = screen.getByLabelText("Font size");
    fireEvent.change(fontSize, { target: { value: "52" } });
    fireEvent.blur(fontSize);

    fireEvent.change(screen.getByLabelText("Level"), {
      target: { value: "h3" },
    });

    expect(screen.getByRole("heading", { level: 3, name: "Heading" })).toHaveStyle({
      fontSize: "52px",
    });
  });

  it("should update width, padding, and margin through responsive style commands", () => {
    render(<EditorShell store={createEditorTestStore()} />);
    fireEvent.click(screen.getByRole("button", { name: "Add Section" }));

    fireEvent.change(screen.getByLabelText("Width"), {
      target: { value: "fixed" },
    });
    const widthValue = screen.getByLabelText("Width value");
    fireEvent.change(widthValue, { target: { value: "420" } });
    fireEvent.blur(widthValue);

    fireEvent.change(screen.getByLabelText("Height"), {
      target: { value: "fixed" },
    });
    const heightValue = screen.getByLabelText("Height value");
    fireEvent.change(heightValue, { target: { value: "260" } });
    fireEvent.blur(heightValue);

    const paddingY = screen.getByLabelText("Padding Y");
    fireEvent.change(paddingY, { target: { value: "64" } });
    fireEvent.blur(paddingY);
    expect(screen.getByRole("status")).toHaveTextContent(
      "Updated Section 1 desktop styles.",
    );

    const marginX = screen.getByLabelText("Margin X");
    fireEvent.change(marginX, { target: { value: "12" } });
    fireEvent.blur(marginX);

    const section = document.querySelector(".canvas-node");
    expect(section).toHaveStyle({
      width: "420px",
      height: "260px",
      padding: "64px 24px",
      margin: "0px 12px",
    });
    expect(screen.getByRole("status")).toHaveTextContent(
      "Updated Section 1 desktop styles.",
    );
  });

  it("should keep mobile Inspector overrides separate from desktop values", () => {
    render(<EditorShell store={createEditorTestStore()} />);
    fireEvent.click(screen.getByRole("button", { name: "Add Section" }));
    fireEvent.click(screen.getByRole("button", { name: "Mobile" }));

    const mobilePaddingY = screen.getByLabelText("Padding Y");
    fireEvent.change(mobilePaddingY, { target: { value: "20" } });
    fireEvent.blur(mobilePaddingY);
    const section = document.querySelector(".canvas-node");
    expect(section).toHaveStyle({ padding: "20px 24px" });

    fireEvent.click(screen.getByRole("button", { name: "Desktop" }));

    expect(section).toHaveStyle({ padding: "48px 24px" });
  });

  it("should clear selection from canvas space and reselect an empty container", () => {
    render(<EditorShell store={createEditorTestStore()} />);
    fireEvent.click(screen.getByRole("button", { name: "Add Container" }));

    fireEvent.click(screen.getByLabelText("Page canvas"));
    expect(screen.getByText("No component selected")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Select empty Container 1" }));
    expect(screen.getAllByText("Container 1").length).toBeGreaterThan(0);
    expect(screen.getByRole("status")).toHaveTextContent(
      "Selected Container 1.",
    );
  });

  it("should render responsive Container gutters and limit its empty minimum to the editor", () => {
    const store = createEditorTestStore();
    render(<EditorShell store={store} />);
    fireEvent.click(screen.getByRole("button", { name: "Add Section" }));
    fireEvent.click(screen.getByRole("button", { name: "Add Container" }));

    const container = document.querySelector(
      "section.canvas-node > div.canvas-node",
    );
    if (!(container instanceof HTMLElement)) {
      throw new Error("Expected Container to render inside Section");
    }

    expect(container).toHaveStyle({
      minHeight: "48px",
      maxWidth: "1440px",
      paddingLeft: "24px",
      paddingRight: "24px",
      paddingTop: "0px",
      paddingBottom: "0px",
    });
    expect(
      store.getState().document?.pages[asPageId("page-editor-test")].nodes[
        asNodeId("node-editor-2")
      ].styles.base.minHeight,
    ).toBeUndefined();

    fireEvent.click(screen.getByRole("button", { name: "Tablet" }));
    expect(container).toHaveStyle({
      minHeight: "48px",
      paddingLeft: "20px",
      paddingRight: "20px",
    });

    fireEvent.click(screen.getByRole("button", { name: "Mobile" }));
    expect(container).toHaveStyle({
      minHeight: "48px",
      paddingLeft: "16px",
      paddingRight: "16px",
    });

    fireEvent.click(screen.getByRole("button", { name: "Add Text" }));
    expect(container).not.toHaveStyle({ minHeight: "48px" });
    expect(container).toContainElement(
      screen.getByText("Text", { selector: "p" }),
    );
  });

  it("should align an empty Card prompt with its minimum selection hit area", () => {
    render(<EditorShell store={createEditorTestStore()} />);
    fireEvent.click(screen.getByRole("button", { name: "Add Section" }));
    fireEvent.click(screen.getByRole("button", { name: "Add Card" }));

    const prompt = screen.getByRole("button", {
      name: "Select empty Card 1",
    });
    const selectionOutline = document.querySelector(
      ".canvas-selection-outline",
    );

    expect(prompt).toHaveStyle({ height: "48px" });
    expect(selectionOutline).toHaveStyle({ height: "48px" });
  });

  it("should let an empty Card reveal its parent background by default", () => {
    render(<EditorShell store={createEditorTestStore()} />);
    fireEvent.click(screen.getByRole("button", { name: "Add Section" }));
    fireEvent.change(screen.getByLabelText("Background color picker"), {
      target: { value: "#ffea00" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Add Card" }));

    const section = document.querySelector("section.canvas-node");
    const card = document.querySelector("section.canvas-node > article.canvas-node");
    if (!(section instanceof HTMLElement) || !(card instanceof HTMLElement)) {
      throw new Error("Expected Card to render inside Section");
    }

    expect(section).toHaveStyle({ backgroundColor: "#ffea00" });
    expect(getComputedStyle(card).backgroundColor).toBe("rgba(0, 0, 0, 0)");
  });

  it("should navigate to a parent, duplicate a subtree, and undo and redo it as one command", () => {
    const store = createEditorTestStore();
    render(<EditorShell store={store} />);
    fireEvent.click(screen.getByRole("button", { name: "Add Section" }));
    fireEvent.click(screen.getByRole("button", { name: "Add Card" }));
    fireEvent.click(screen.getByRole("button", { name: "Add Text" }));

    fireEvent.keyDown(window, { key: "Escape" });
    expect(store.getState().selectedNodeId).toBe("node-editor-2");
    expect(screen.getByRole("status")).toHaveTextContent(
      "Selected parent Card 1.",
    );

    const historyBeforeDuplicate = store.getState().history.past.length;
    fireEvent.keyDown(window, { key: "d", ctrlKey: true });

    const duplicateId = store.getState().selectedNodeId;
    expect(duplicateId).toBe("node-editor-4");
    expect(store.getState().history.past).toHaveLength(
      historyBeforeDuplicate + 1,
    );
    expect(
      store.getState().document?.pages[asPageId("page-editor-test")].nodes[duplicateId!]
        .childIds,
    ).toEqual(["node-editor-5"]);

    fireEvent.click(screen.getByRole("button", { name: "Undo" }));
    expect(
      store.getState().document?.pages[asPageId("page-editor-test")].nodes[duplicateId!],
    ).toBeUndefined();
    fireEvent.click(screen.getByRole("button", { name: "Redo" }));
    expect(
      store.getState().document?.pages[asPageId("page-editor-test")].nodes[duplicateId!],
    ).toBeDefined();
  });

  it("should delete the selected component from the Inspector and select its parent", () => {
    const store = createEditorTestStore();
    render(<EditorShell store={store} />);
    fireEvent.click(screen.getByRole("button", { name: "Add Section" }));
    fireEvent.click(screen.getByRole("button", { name: "Add Text" }));
    const selectedId = store.getState().selectedNodeId;
    const historyBefore = store.getState().history.past.length;

    fireEvent.click(screen.getByRole("button", { name: "Delete Text 1" }));

    expect(
      store.getState().document?.pages[asPageId("page-editor-test")].nodes[
        selectedId!
      ],
    ).toBeUndefined();
    expect(store.getState().selectedNodeId).toBe("node-editor-1");
    expect(store.getState().history.past).toHaveLength(historyBefore + 1);
    expect(screen.getByRole("status")).toHaveTextContent("Deleted Text 1.");
  });

  it("should delete with Backspace outside text controls and keep removal shortcuts inactive inside them", () => {
    const store = createEditorTestStore();
    render(<EditorShell store={store} />);
    fireEvent.click(screen.getByRole("button", { name: "Add Text" }));
    const deleteTargetId = store.getState().selectedNodeId;
    const historyBefore = store.getState().history.past.length;
    const textControl = screen.getByLabelText("Text content");

    fireEvent.keyDown(textControl, {
      key: "d",
      ctrlKey: true,
    });
    fireEvent.keyDown(textControl, { key: "Delete" });
    fireEvent.keyDown(textControl, { key: "Backspace" });
    expect(store.getState().history.past).toHaveLength(historyBefore);
    expect(
      store.getState().document?.pages[asPageId("page-editor-test")].nodes[
        deleteTargetId!
      ],
    ).toBeDefined();

    fireEvent.keyDown(window, { key: "Backspace" });

    expect(store.getState().history.past).toHaveLength(historyBefore + 1);
    expect(
      store.getState().document?.pages[asPageId("page-editor-test")].nodes[
        deleteTargetId!
      ],
    ).toBeUndefined();
    expect(store.getState().selectedNodeId).toBeNull();
    expect(screen.getByRole("status")).toHaveTextContent("Deleted Text 1.");
  });
});
