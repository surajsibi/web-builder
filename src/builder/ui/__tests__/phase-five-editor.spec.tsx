import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { asNodeId, asPageId } from "@/builder/model/ids";
import { createNewProject } from "@/builder/project/factory";
import { componentRegistry } from "@/builder/registry/component-registry";
import { createBuilderStore } from "@/builder/store/builder-store";
import { EditorShell } from "@/builder/ui/editor-shell";

beforeAll(() => {
  HTMLElement.prototype.setPointerCapture ??= vi.fn();
  HTMLElement.prototype.releasePointerCapture ??= vi.fn();
  HTMLElement.prototype.hasPointerCapture ??= vi.fn(() => true);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function measuredRect(width: number, height: number): DOMRect {
  return {
    x: 0,
    y: 0,
    left: 0,
    top: 0,
    right: width,
    bottom: height,
    width,
    height,
    toJSON: () => ({}),
  };
}

function mockRootResizeGeometry(): void {
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(
    function getBoundingClientRect(this: HTMLElement) {
      if (this.classList.contains("canvas-artboard")) {
        return measuredRect(1_000, 672);
      }
      if (this.classList.contains("canvas-node")) {
        return measuredRect(1_000, 200);
      }
      return measuredRect(0, 0);
    },
  );
}

function createPhaseFiveStore() {
  let nodeCounter = 0;
  return createBuilderStore({
    initialDocument: createNewProject({
      name: "Phase 5 Test Project",
      now: "2026-08-07T00:00:00.000Z",
      idGenerator: (prefix) =>
        prefix === "project" ? "project-phase-five" : "page-phase-five",
    }),
    idGenerator: (prefix) => {
      if (prefix === "node") {
        nodeCounter += 1;
        return `node-phase-five-${nodeCounter}`;
      }
      return `${prefix}-phase-five`;
    },
  });
}

const FIRST_NODE_ID = asNodeId("node-phase-five-1");

function inspectorGroupNames(): string[] {
  return Array.from(document.querySelectorAll(".inspector-disclosure > summary"))
    .map((summary) => summary.firstElementChild?.textContent ?? "");
}

describe("Phase 5 editor UI", () => {
  it("should preserve the finalized component capability matrix", () => {
    expect(componentRegistry.section.inspector.styles).toEqual([
      "sizing", "spacing", "background", "backgroundImage", "border", "layout", "positioning",
    ]);
    expect(componentRegistry.container.inspector.styles).toEqual([
      "sizing", "spacing", "background", "backgroundImage", "border", "layout", "positioning",
    ]);
    expect(componentRegistry.card.inspector.styles).toEqual([
      "sizing", "spacing", "background", "backgroundImage", "border", "layout", "positioning",
    ]);
    expect(componentRegistry.heading.inspector.styles).toEqual([
      "sizing", "spacing", "background", "typography", "positioning",
    ]);
    expect(componentRegistry.text.inspector.styles).toEqual([
      "sizing", "spacing", "background", "typography", "positioning",
    ]);
    expect(componentRegistry.link.inspector.styles).toEqual([
      "sizing", "spacing", "background", "border", "typography", "positioning",
    ]);
    expect(componentRegistry.button.inspector.styles).toEqual([
      "sizing", "spacing", "background", "border", "typography", "positioning",
    ]);
  });

  it("should add a two-color linear gradient as one history entry", () => {
    const store = createPhaseFiveStore();
    render(<EditorShell store={store} />);
    fireEvent.click(screen.getByRole("button", { name: "Add Section" }));
    fireEvent.click(screen.getByText("Background", { selector: "summary > span" }));
    const historyBefore = store.getState().history.past.length;

    fireEvent.click(screen.getByRole("button", { name: "Add gradient" }));

    expect(
      store.getState().document?.pages[asPageId("page-phase-five")].nodes[
        FIRST_NODE_ID
      ].styles.base.backgroundImage,
    ).toEqual({
      kind: "linear-gradient",
      angle: 135,
      startColor: "#7c3aed",
      endColor: "#2563eb",
    });
    expect(store.getState().history.past).toHaveLength(historyBefore + 1);
    expect(document.querySelector("section.canvas-node")).toHaveStyle({
      backgroundImage: "linear-gradient(135deg, #7c3aed, #2563eb)",
    });
  });

  it("should update gradient colors, opacity, and angle from accessible controls", () => {
    const store = createPhaseFiveStore();
    render(<EditorShell store={store} />);
    fireEvent.click(screen.getByRole("button", { name: "Add Section" }));
    fireEvent.click(screen.getByText("Background", { selector: "summary > span" }));
    fireEvent.click(screen.getByRole("button", { name: "Add gradient" }));

    fireEvent.change(screen.getByLabelText("Gradient start color picker"), {
      target: { value: "#112233" },
    });
    fireEvent.change(screen.getByLabelText("Gradient end color opacity"), {
      target: { value: "50" },
    });
    fireEvent.change(screen.getByLabelText("Gradient angle"), {
      target: { value: "90" },
    });
    fireEvent.blur(screen.getByLabelText("Gradient angle"));

    expect(
      store.getState().document?.pages[asPageId("page-phase-five")].nodes[
        FIRST_NODE_ID
      ].styles.base.backgroundImage,
    ).toEqual({
      kind: "linear-gradient",
      angle: 90,
      startColor: "#112233",
      endColor: "#2563eb80",
    });
    expect(document.querySelector("section.canvas-node")).toHaveStyle({
      backgroundImage: "linear-gradient(90deg, #112233, #2563eb80)",
    });
  });

  it("should replace an active gradient with a background image", () => {
    const store = createPhaseFiveStore();
    render(<EditorShell store={store} />);
    fireEvent.click(screen.getByRole("button", { name: "Add Section" }));
    fireEvent.click(screen.getByText("Background", { selector: "summary > span" }));
    fireEvent.click(screen.getByRole("button", { name: "Add gradient" }));

    fireEvent.change(screen.getByRole("textbox", { name: "Background image URL" }), {
      target: { value: "/images/replacement.webp" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Replace gradient with background image" }),
    );

    expect(
      document.querySelector<HTMLElement>("section.canvas-node")?.style
        .backgroundImage,
    ).toBe(
      'url("/images/replacement.webp")',
    );
    expect(
      store.getState().document?.pages[asPageId("page-phase-five")].nodes[
        FIRST_NODE_ID
      ].styles.base.backgroundImage,
    ).toMatchObject({ kind: "image", source: "/images/replacement.webp" });
  });

  it("should remove a gradient at Mobile and undo to the inherited base gradient", () => {
    const store = createPhaseFiveStore();
    render(<EditorShell store={store} />);
    fireEvent.click(screen.getByRole("button", { name: "Add Section" }));
    fireEvent.click(screen.getByText("Background", { selector: "summary > span" }));
    fireEvent.click(screen.getByRole("button", { name: "Add gradient" }));
    fireEvent.click(screen.getByRole("button", { name: "Mobile" }));

    fireEvent.click(screen.getByRole("button", { name: "Remove gradient" }));

    const section = document.querySelector<HTMLElement>("section.canvas-node");
    if (!section) throw new Error("Expected the selected Section renderer");
    expect(
      store.getState().document?.pages[asPageId("page-phase-five")].nodes[
        FIRST_NODE_ID
      ].styles.mobile?.backgroundImage,
    ).toEqual({ kind: "none" });
    expect(section.style.backgroundImage).toBe("none");

    fireEvent.click(screen.getByRole("button", { name: "Undo" }));
    expect(section).toHaveStyle({
      backgroundImage: "linear-gradient(135deg, #7c3aed, #2563eb)",
    });
  });

  it("should disable every gradient control for a locked component", () => {
    const store = createPhaseFiveStore();
    render(<EditorShell store={store} />);
    fireEvent.click(screen.getByRole("button", { name: "Add Section" }));
    fireEvent.click(screen.getByText("Background", { selector: "summary > span" }));
    fireEvent.click(screen.getByRole("button", { name: "Add gradient" }));

    act(() => {
      store.getState().dispatchEditorCommand({
        kind: "node.lock",
        pageId: asPageId("page-phase-five"),
        nodeId: FIRST_NODE_ID,
        locked: true,
      });
    });

    expect(screen.getByLabelText("Gradient start color picker")).toBeDisabled();
    expect(screen.getByLabelText("Gradient start color")).toBeDisabled();
    expect(screen.getByLabelText("Gradient start color opacity")).toBeDisabled();
    expect(screen.getByLabelText("Gradient end color picker")).toBeDisabled();
    expect(screen.getByLabelText("Gradient end color")).toBeDisabled();
    expect(screen.getByLabelText("Gradient end color opacity")).toBeDisabled();
    expect(screen.getByLabelText("Gradient angle")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Remove gradient" })).toBeDisabled();
    expect(screen.getByRole("textbox", { name: "Background image URL" })).toBeDisabled();
  });

  it("should add a background image as one history entry", () => {
    const store = createPhaseFiveStore();
    render(<EditorShell store={store} />);
    fireEvent.click(screen.getByRole("button", { name: "Add Section" }));
    fireEvent.click(screen.getByText("Background", { selector: "summary > span" }));
    const imageUrl = screen.getByRole("textbox", { name: "Background image URL" });
    const historyBefore = store.getState().history.past.length;

    fireEvent.change(imageUrl, {
      target: { value: "https://cdn.example.com/hero.webp" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add background image" }));

    expect(
      store.getState().document?.pages[asPageId("page-phase-five")].nodes[
        FIRST_NODE_ID
      ].styles.base.backgroundImage,
    ).toEqual({
      kind: "image",
      source: "https://cdn.example.com/hero.webp",
      size: "cover",
      positionX: "center",
      positionY: "center",
      repeat: "no-repeat",
    });
    expect(store.getState().history.past).toHaveLength(historyBefore + 1);
    const section = document.querySelector<HTMLElement>("section.canvas-node");
    if (!section) throw new Error("Expected the selected Section renderer");
    expect(section.style.backgroundImage).toBe(
      'url("https://cdn.example.com/hero.webp")',
    );
    expect(section.style.backgroundSize).toBe("cover");
    expect(section.style.backgroundPosition).toBe("center center");
    expect(section.style.backgroundRepeat).toBe("no-repeat");

  });

  it("should configure and replace a background image", () => {
    const store = createPhaseFiveStore();
    render(<EditorShell store={store} />);
    fireEvent.click(screen.getByRole("button", { name: "Add Section" }));
    fireEvent.click(screen.getByText("Background", { selector: "summary > span" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Background image URL" }), {
      target: { value: "https://cdn.example.com/hero.webp" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add background image" }));

    const section = document.querySelector<HTMLElement>("section.canvas-node");
    if (!section) throw new Error("Expected the selected Section renderer");

    fireEvent.change(screen.getByLabelText("Background image fit"), {
      target: { value: "contain" },
    });
    fireEvent.change(screen.getByLabelText("Background image horizontal position"), {
      target: { value: "right" },
    });
    fireEvent.change(screen.getByLabelText("Background image vertical position"), {
      target: { value: "top" },
    });
    fireEvent.change(screen.getByLabelText("Background image repeat"), {
      target: { value: "repeat-x" },
    });

    expect(section).toHaveStyle({
      backgroundSize: "contain",
      backgroundPosition: "right top",
      backgroundRepeat: "repeat-x",
    });

    const replacementUrl = screen.getByRole("textbox", {
      name: "Background image URL",
    });
    fireEvent.change(replacementUrl, {
      target: { value: "/images/hero-replacement.webp" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Replace background image" }),
    );
    expect(section.style.backgroundImage).toBe(
      'url("/images/hero-replacement.webp")',
    );
  });

  it("should remove a background image at Mobile and undo to inherited base", () => {
    const store = createPhaseFiveStore();
    render(<EditorShell store={store} />);
    fireEvent.click(screen.getByRole("button", { name: "Add Section" }));
    fireEvent.click(screen.getByText("Background", { selector: "summary > span" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Background image URL" }), {
      target: { value: "/images/hero-replacement.webp" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add background image" }));

    const section = document.querySelector<HTMLElement>("section.canvas-node");
    if (!section) throw new Error("Expected the selected Section renderer");

    fireEvent.click(screen.getByRole("button", { name: "Mobile" }));
    fireEvent.click(screen.getByRole("button", { name: "Remove background image" }));

    expect(
      store.getState().document?.pages[asPageId("page-phase-five")].nodes[
        FIRST_NODE_ID
      ].styles.mobile?.backgroundImage,
    ).toEqual({ kind: "none" });
    expect(section.style.backgroundImage).toBe("none");

    fireEvent.click(screen.getByRole("button", { name: "Undo" }));
    expect(section.style.backgroundImage).toBe(
      'url("/images/hero-replacement.webp")',
    );
  });

  it("should reject an unsafe background image URL before dispatch", () => {
    const store = createPhaseFiveStore();
    render(<EditorShell store={store} />);
    fireEvent.click(screen.getByRole("button", { name: "Add Section" }));
    fireEvent.click(screen.getByText("Background", { selector: "summary > span" }));
    const historyBefore = store.getState().history.past.length;

    fireEvent.change(screen.getByRole("textbox", { name: "Background image URL" }), {
      target: { value: "data:image/png;base64,AAAA" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add background image" }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Use an HTTPS URL or a root-relative path",
    );
    expect(
      store.getState().document?.pages[asPageId("page-phase-five")].nodes[
        FIRST_NODE_ID
      ].styles.base,
    ).not.toHaveProperty("backgroundImage");
    expect(store.getState().history.past).toHaveLength(historyBefore);
  });

  it("should keep Button background controls color-only", () => {
    render(<EditorShell store={createPhaseFiveStore()} />);
    fireEvent.click(screen.getByRole("button", { name: "Add Button" }));
    fireEvent.click(screen.getByText("Background", { selector: "summary > span" }));

    expect(screen.getByLabelText("Background color picker")).toBeInTheDocument();
    expect(
      screen.queryByRole("textbox", { name: "Background image URL" }),
    ).not.toBeInTheDocument();
  });

  it.each([
    ["Heading", "h2.canvas-node"],
    ["Text", "p.canvas-node"],
  ] as const)(
    "should expose color-only background controls on %s",
    (componentLabel, canvasSelector) => {
      const store = createPhaseFiveStore();
      render(<EditorShell store={store} />);
      fireEvent.click(
        screen.getByRole("button", { name: `Add ${componentLabel}` }),
      );
      fireEvent.click(
        screen.getByText("Background", { selector: "summary > span" }),
      );
      const historyBefore = store.getState().history.past.length;

      expect(
        screen.getByLabelText("Background color", {
          selector: 'input[type="text"]',
        }),
      ).toHaveValue("transparent");
      expect(screen.getByLabelText("Background color opacity")).toHaveValue(
        "0",
      );
      expect(
        screen.queryByRole("textbox", { name: "Background image URL" }),
      ).not.toBeInTheDocument();

      fireEvent.change(screen.getByLabelText("Background color picker"), {
        target: { value: "#336699" },
      });

      expect(
        store.getState().document?.pages[asPageId("page-phase-five")].nodes[
          FIRST_NODE_ID
        ].styles.base.backgroundColor,
      ).toBe("#336699");
      expect(document.querySelector(canvasSelector)).toHaveStyle({
        backgroundColor: "#336699",
      });
      expect(store.getState().history.past).toHaveLength(historyBefore + 1);
    },
  );

  it("should show Button typography defaults that match the Canvas", () => {
    render(<EditorShell store={createPhaseFiveStore()} />);
    fireEvent.click(screen.getByRole("button", { name: "Add Button" }));
    fireEvent.click(screen.getByText("Typography", { selector: "summary > span" }));

    expect(screen.getByLabelText("Font size")).toHaveValue(16);
    expect(screen.getByLabelText("Font size unit")).toHaveValue("px");
    expect(screen.getByLabelText("Font weight")).toHaveValue(650);
    expect(screen.getByLabelText("Line height")).toHaveValue(1.2);
    expect(screen.getByLabelText("Letter spacing")).toHaveValue(0);
    expect(screen.getByLabelText("Letter spacing unit")).toHaveValue("px");
    expect(screen.getByRole("button", { name: "Button" })).toHaveStyle({
      fontSize: "16px",
      fontWeight: "650",
      lineHeight: "1.2",
      letterSpacing: "0px",
    });
  });

  it("should show canonical typography defaults for an existing sparse Button", () => {
    const store = createPhaseFiveStore();
    store.getState().dispatchEditorCommand({
      kind: "node.insert",
      pageId: asPageId("page-phase-five"),
      componentType: "button",
      destination: { parentId: null, index: 0 },
    });
    const button = store.getState().document?.pages[
      asPageId("page-phase-five")
    ].nodes[FIRST_NODE_ID];
    if (!button) throw new Error("Expected the seeded Button");
    delete button.styles.base.fontSize;
    delete button.styles.base.fontWeight;
    delete button.styles.base.lineHeight;
    delete button.styles.base.letterSpacing;

    render(<EditorShell store={store} />);
    fireEvent.click(screen.getByText("Typography", { selector: "summary > span" }));

    expect(screen.getByLabelText("Font size")).toHaveValue(16);
    expect(screen.getByLabelText("Font size unit")).toHaveValue("px");
    expect(screen.getByLabelText("Font weight")).toHaveValue(650);
    expect(screen.getByLabelText("Line height")).toHaveValue(1.2);
    expect(screen.getByLabelText("Letter spacing")).toHaveValue(0);
    expect(screen.getByLabelText("Letter spacing unit")).toHaveValue("px");
    expect(button.styles.base).not.toHaveProperty("fontSize");
    expect(button.styles.base).not.toHaveProperty("fontWeight");
    expect(button.styles.base).not.toHaveProperty("lineHeight");
    expect(button.styles.base).not.toHaveProperty("letterSpacing");
  });

  it("should author Link text decoration through Typography and render it", () => {
    const store = createPhaseFiveStore();
    render(<EditorShell store={store} />);
    fireEvent.click(screen.getByRole("button", { name: "Add Link" }));
    fireEvent.click(
      screen.getByText("Typography", { selector: "summary > span" }),
    );
    const historyBefore = store.getState().history.past.length;
    const textDecoration = screen.getByLabelText("Text decoration");

    expect(textDecoration).toHaveValue("underline");

    fireEvent.change(textDecoration, {
      target: { value: "line-through" },
    });

    expect(
      store.getState().document?.pages[asPageId("page-phase-five")].nodes[
        FIRST_NODE_ID
      ].styles.base.textDecoration,
    ).toBe("line-through");
    expect(document.querySelector("a.canvas-node")).toHaveStyle({
      textDecoration: "line-through",
    });
    expect(store.getState().history.past).toHaveLength(historyBefore + 1);
  });

  it("should omit text decoration from non-Link typography controls", () => {
    render(<EditorShell store={createPhaseFiveStore()} />);
    fireEvent.click(screen.getByRole("button", { name: "Add Heading" }));
    fireEvent.click(
      screen.getByText("Typography", { selector: "summary > span" }),
    );

    expect(
      screen.queryByLabelText("Text decoration"),
    ).not.toBeInTheDocument();
  });

  it("should disable every background layer control for a locked component", () => {
    const store = createPhaseFiveStore();
    render(<EditorShell store={store} />);
    fireEvent.click(screen.getByRole("button", { name: "Add Section" }));
    fireEvent.click(screen.getByText("Background", { selector: "summary > span" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Background image URL" }), {
      target: { value: "https://cdn.example.com/hero.webp" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add background image" }));

    act(() => {
      store.getState().dispatchEditorCommand({
        kind: "node.lock",
        pageId: asPageId("page-phase-five"),
        nodeId: FIRST_NODE_ID,
        locked: true,
      });
    });

    expect(screen.getByRole("textbox", { name: "Background image URL" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Replace background image" })).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Replace background image with gradient" }),
    ).toBeDisabled();
    expect(screen.getByLabelText("Background image fit")).toBeDisabled();
    expect(screen.getByLabelText("Background image repeat")).toBeDisabled();
    expect(screen.getByLabelText("Background image horizontal position")).toBeDisabled();
    expect(screen.getByLabelText("Background image vertical position")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Remove background image" })).toBeDisabled();
  });

  it("should initialize a visible border atomically and undo it in one step", () => {
    const store = createPhaseFiveStore();
    render(<EditorShell store={store} />);
    fireEvent.click(screen.getByRole("button", { name: "Add Section" }));
    const historyBeforeBorder = store.getState().history.past.length;
    const borderStyle = screen.getByLabelText("Border style");
    const borderWidth = screen.getByLabelText("Border width");
    const borderColor = screen.getByLabelText("Border color", {
      selector: 'input[type="text"]',
    });

    expect(borderStyle).toHaveValue("none");
    expect(borderWidth).toHaveValue(0);
    expect(borderWidth).toBeDisabled();
    expect(borderColor).toHaveValue("#000000");
    expect(borderColor).toBeDisabled();
    expect(screen.getByLabelText("Border radius")).toBeEnabled();

    fireEvent.change(borderStyle, { target: { value: "solid" } });

    expect(document.querySelector("section.canvas-node")).toHaveStyle({
      borderStyle: "solid",
      borderWidth: "1px",
      borderColor: "#000000",
    });
    expect(
      store.getState().document?.pages[asPageId("page-phase-five")].nodes[
        FIRST_NODE_ID
      ].styles.base,
    ).toMatchObject({
      borderStyle: "solid",
      borderWidth: { value: 1, unit: "px" },
      borderColor: "#000000",
    });
    expect(store.getState().history.past).toHaveLength(historyBeforeBorder + 1);

    fireEvent.click(screen.getByRole("button", { name: "Undo" }));

    expect(
      store.getState().document?.pages[asPageId("page-phase-five")].nodes[
        FIRST_NODE_ID
      ].styles.base,
    ).not.toHaveProperty("borderStyle");
    expect(screen.getByLabelText("Border style")).toHaveValue("none");
  });

  it("should preserve border width, color, and radius while the border style is None", () => {
    const store = createPhaseFiveStore();
    render(<EditorShell store={store} />);
    fireEvent.click(screen.getByRole("button", { name: "Add Section" }));
    fireEvent.change(screen.getByLabelText("Border style"), {
      target: { value: "dashed" },
    });

    const width = screen.getByLabelText("Border width");
    fireEvent.change(width, { target: { value: "3" } });
    fireEvent.blur(width);
    fireEvent.change(screen.getByLabelText("Border width unit"), {
      target: { value: "rem" },
    });
    fireEvent.change(screen.getByLabelText("Border color picker"), {
      target: { value: "#336699" },
    });
    fireEvent.change(screen.getByLabelText("Border color opacity"), {
      target: { value: "55" },
    });
    const radius = screen.getByLabelText("Border radius");
    fireEvent.change(radius, { target: { value: "20" } });
    fireEvent.blur(radius);

    fireEvent.change(screen.getByLabelText("Border style"), {
      target: { value: "none" },
    });

    expect(
      store.getState().document?.pages[asPageId("page-phase-five")].nodes[
        FIRST_NODE_ID
      ].styles.base,
    ).toMatchObject({
      borderStyle: "none",
      borderWidth: { value: 3, unit: "rem" },
      borderColor: "#3366998c",
      borderRadius: { value: 20, unit: "px" },
    });
    const section = document.querySelector<HTMLElement>("section.canvas-node");
    if (!section) throw new Error("Expected the selected Section renderer");
    expect(section.style.borderStyle).toBe("none");
    expect(section.style.borderWidth).toBe("3rem");
    expect(section.style.borderColor).toBe("rgba(51, 102, 153, 0.55)");
    expect(section.style.borderRadius).toBe("20px");
    expect(screen.getByLabelText("Border width")).toBeDisabled();
    expect(
      screen.getByLabelText("Border color", { selector: 'input[type="text"]' }),
    ).toBeDisabled();
    expect(screen.getByLabelText("Border radius")).toBeEnabled();
  });

  it("should keep text content visible directly above collapsed Typography controls", () => {
    render(<EditorShell store={createPhaseFiveStore()} />);
    fireEvent.click(screen.getByRole("button", { name: "Add Section" }));
    expect(inspectorGroupNames()).toEqual([
      "Content", "Sizing", "Spacing", "Layout", "Background", "Border", "Effects", "Position",
    ]);
    expect(
      Array.from(document.querySelectorAll(".inspector-disclosure")).every(
        (group) => !group.hasAttribute("open"),
      ),
    ).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: "Add Heading" }));
    const contentHeading = screen.getByRole("heading", { level: 3, name: "Content" });
    const textContent = screen.getByRole("textbox", { name: "Text content" });
    const typographySummary = screen.getByText("Typography", {
      selector: "summary > span",
    });

    expect(inspectorGroupNames()).toEqual([
      "Typography", "Sizing", "Spacing", "Background", "Effects", "Position",
    ]);
    expect(textContent).toBeVisible();
    expect(textContent).toHaveProperty("tagName", "TEXTAREA");
    expect(contentHeading).toAppearBefore(typographySummary);
    expect(typographySummary.closest("details")).not.toHaveAttribute("open");
  });

  it("should edit shared effects on a non-Button Card and render them on Canvas", () => {
    const store = createPhaseFiveStore();
    render(<EditorShell store={store} />);
    fireEvent.click(screen.getByRole("button", { name: "Add Card" }));
    fireEvent.click(screen.getByText("Effects", { selector: "summary > span" }));

    fireEvent.click(screen.getByRole("button", { name: "Add shadow" }));
    const blurRadius = screen.getByLabelText("Shadow 1 blur radius");
    fireEvent.change(blurRadius, { target: { value: "18" } });
    fireEvent.blur(blurRadius);
    const backdropBlur = screen.getByLabelText("Backdrop blur");
    fireEvent.change(backdropBlur, { target: { value: "10" } });
    fireEvent.blur(backdropBlur);

    expect(
      store.getState().document?.pages[asPageId("page-phase-five")].nodes[
        FIRST_NODE_ID
      ].styles.base,
    ).toMatchObject({
      boxShadow: [
        {
          offsetX: 0,
          offsetY: 8,
          blurRadius: 18,
          spreadRadius: 0,
          unit: "px",
          color: "#0f172a26",
          inset: false,
        },
      ],
      backdropBlur: { value: 10, unit: "px" },
    });
    const card = document.querySelector<HTMLElement>("article.canvas-node");
    if (!card) throw new Error("Expected the selected Card renderer");
    expect(card.style.boxShadow).toContain("0px 8px 18px 0px");
    expect(card.style.backdropFilter).toBe("blur(10px)");
  });

  it("should show populated font family presets and apply the selected family", () => {
    const store = createPhaseFiveStore();
    render(<EditorShell store={store} />);
    fireEvent.click(screen.getByRole("button", { name: "Add Heading" }));
    fireEvent.click(screen.getByText("Typography", { selector: "summary > span" }));

    const fontFamily = screen.getByRole("combobox", { name: "Font family" });
    const historyBefore = store.getState().history.past.length;

    expect(fontFamily).toHaveDisplayValue("Inter");
    expect(
      within(fontFamily).getAllByRole("option").map((option) => option.textContent),
    ).toEqual([
      "Inter",
      "System UI",
      "Arial",
      "Georgia",
      "Times New Roman",
      "Verdana",
      "Trebuchet MS",
      "Courier New",
    ]);
    expect(
      store.getState().document?.pages[asPageId("page-phase-five")].nodes[
        FIRST_NODE_ID
      ].styles.base.fontFamily,
    ).toBeUndefined();

    const georgia = within(fontFamily).getByRole("option", {
      name: "Georgia",
    }) as HTMLOptionElement;
    fireEvent.change(fontFamily, { target: { value: georgia.value } });

    expect(screen.getByRole("heading", { level: 2, name: "Heading" }).style.fontFamily)
      .toBe(georgia.value);
    expect(
      store.getState().document?.pages[asPageId("page-phase-five")].nodes[
        FIRST_NODE_ID
      ].styles.base.fontFamily,
    ).toBe(georgia.value);
    expect(store.getState().history.past).toHaveLength(historyBefore + 1);
  });

  it("should preserve an existing custom font family in the preset selector", () => {
    const store = createPhaseFiveStore();
    store.getState().dispatchEditorCommand({
      kind: "node.insert",
      pageId: asPageId("page-phase-five"),
      componentType: "heading",
      destination: { parentId: null, index: 0 },
    });
    store.getState().dispatchEditorCommand({
      kind: "node.updateStyles",
      pageId: asPageId("page-phase-five"),
      nodeId: FIRST_NODE_ID,
      viewport: "desktop",
      changes: [
        { target: { property: "fontFamily" }, value: "Papyrus, fantasy" },
      ],
    });
    render(<EditorShell store={store} />);
    fireEvent.click(screen.getByText("Typography", { selector: "summary > span" }));

    const fontFamily = screen.getByRole("combobox", { name: "Font family" });

    expect(fontFamily).toHaveDisplayValue("Papyrus, fantasy");
    expect(
      within(fontFamily).getByRole("option", { name: "Papyrus, fantasy" }),
    ).toBeInTheDocument();
  });

  it("should show the rendered Heading margin as explicit zero values", () => {
    render(<EditorShell store={createPhaseFiveStore()} />);
    fireEvent.click(screen.getByRole("button", { name: "Add Heading" }));

    expect(screen.getByRole("heading", { level: 2, name: "Heading" })).toHaveStyle({
      marginTop: "0px",
      marginRight: "0px",
      marginBottom: "0px",
      marginLeft: "0px",
    });
    expect(screen.getByLabelText("Margin X")).toHaveValue(0);
    expect(screen.getByLabelText("Margin Y")).toHaveValue(0);
  });

  it("should show zero values for spacing properties that are not saved", () => {
    const store = createPhaseFiveStore();
    render(<EditorShell store={store} />);
    fireEvent.click(screen.getByRole("button", { name: "Add Heading" }));

    expect(screen.getByLabelText("Padding X")).toHaveValue(0);
    expect(screen.getByLabelText("Padding Y")).toHaveValue(0);

    fireEvent.click(screen.getByRole("button", { name: "Add Card" }));

    expect(screen.getByLabelText("Margin X")).toHaveValue(0);
    expect(screen.getByLabelText("Margin Y")).toHaveValue(0);
    expect(
      store.getState().document?.pages[asPageId("page-phase-five")].nodes[
        asNodeId("node-phase-five-2")
      ].styles.base.margin,
    ).toBeUndefined();

    const marginMode = screen.getByRole("group", { name: "Margin mode" });
    fireEvent.click(within(marginMode).getByRole("button", { name: "All" }));
    expect(screen.getByLabelText("Margin top")).toHaveValue(0);
    expect(screen.getByLabelText("Margin right")).toHaveValue(0);
    expect(screen.getByLabelText("Margin bottom")).toHaveValue(0);
    expect(screen.getByLabelText("Margin left")).toHaveValue(0);
  });

  it("should keep the color picker active while applying continuous color updates", () => {
    const store = createPhaseFiveStore();
    render(<EditorShell store={store} />);
    fireEvent.click(screen.getByRole("button", { name: "Add Section" }));
    const picker = screen.getByLabelText("Background color picker");

    picker.focus();
    fireEvent.change(picker, { target: { value: "#b33737" } });

    expect(picker).toBeInTheDocument();
    expect(picker).toHaveFocus();

    fireEvent.change(picker, { target: { value: "#336699" } });
    expect(
      store.getState().document?.pages[asPageId("page-phase-five")].nodes[
        FIRST_NODE_ID
      ].styles.base.backgroundColor,
    ).toBe("#336699");

    fireEvent.click(screen.getByRole("button", { name: "Undo" }));
    expect(picker).toHaveValue("#b33737");
    expect(
      screen.getByLabelText("Background color", { selector: 'input[type="text"]' }),
    ).toHaveValue("#b33737");
  });

  it("should set per-color opacity and preserve it when choosing another color", () => {
    const store = createPhaseFiveStore();
    render(<EditorShell store={store} />);
    fireEvent.click(screen.getByRole("button", { name: "Add Section" }));
    const picker = screen.getByLabelText("Background color picker");
    const opacity = screen.getByLabelText("Background color opacity");

    expect(opacity).toHaveValue("0");
    fireEvent.change(picker, { target: { value: "#b33737" } });
    fireEvent.change(opacity, { target: { value: "55" } });

    expect(
      store.getState().document?.pages[asPageId("page-phase-five")].nodes[
        FIRST_NODE_ID
      ].styles.base.backgroundColor,
    ).toBe("#b337378c");
    expect(
      screen.getByLabelText("Background color", { selector: 'input[type="text"]' }),
    ).toHaveValue("#b337378c");
    expect(document.querySelector("section.canvas-node")?.getAttribute("style")).not.toContain("opacity:");

    fireEvent.change(picker, { target: { value: "#336699" } });
    expect(
      store.getState().document?.pages[asPageId("page-phase-five")].nodes[
        FIRST_NODE_ID
      ].styles.base.backgroundColor,
    ).toBe("#3366998c");
    expect(opacity).toHaveValue("55");
    expect(screen.getByText("55%")).toBeInTheDocument();

    fireEvent.change(opacity, { target: { value: "100" } });
    expect(
      store.getState().document?.pages[asPageId("page-phase-five")].nodes[
        FIRST_NODE_ID
      ].styles.base.backgroundColor,
    ).toBe("#336699");
  });

  it("should disable opacity when a custom color cannot be converted safely", () => {
    const store = createPhaseFiveStore();
    render(<EditorShell store={store} />);
    fireEvent.click(screen.getByRole("button", { name: "Add Section" }));
    const colorText = screen.getByLabelText("Background color", {
      selector: 'input[type="text"]',
    });

    fireEvent.change(colorText, { target: { value: "var(--surface-color)" } });
    fireEvent.blur(colorText);

    expect(screen.getByLabelText("Background color opacity")).toBeDisabled();
    expect(screen.getByText("Custom")).toBeInTheDocument();
    expect(
      store.getState().document?.pages[asPageId("page-phase-five")].nodes[
        FIRST_NODE_ID
      ].styles.base.backgroundColor,
    ).toBe("var(--surface-color)");
  });

  it("should offer viewport height only for page-root nodes and let content grow", () => {
    const store = createPhaseFiveStore();
    render(<EditorShell store={store} />);
    fireEvent.click(screen.getByRole("button", { name: "Add Section" }));
    fireEvent.click(screen.getByText("Sizing"));

    const rootWidth = screen.getByLabelText("Width");
    const rootHeight = screen.getByLabelText("Height");
    expect(
      Array.from(rootWidth.querySelectorAll("option")).map(
        (option) => option.textContent,
      ),
    ).toContain("Fill page");
    expect(
      Array.from(rootHeight.querySelectorAll("option")).map(
        (option) => option.textContent,
      ),
    ).toContain("Fill viewport");
    const viewportGuidance = screen.getByText(
      /Fill viewport keeps the page at least one viewport tall while allowing content to grow\./,
    );
    expect(viewportGuidance).toBeVisible();
    expect(screen.queryByLabelText("Min Width")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Min Height")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Max Width")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Max Height")).not.toBeInTheDocument();

    rootHeight.focus();
    fireEvent.change(rootHeight, { target: { value: "viewport" } });

    expect(
      store.getState().document?.pages[asPageId("page-phase-five")].nodes[
        FIRST_NODE_ID
      ].styles.base.height,
    ).toEqual({ mode: "viewport" });
    expect(screen.getByLabelText("Height")).toBe(rootHeight);
    expect(rootHeight).toHaveFocus();
    expect(
      screen.getByText(
        /Fill viewport keeps the page at least one viewport tall while allowing content to grow\./,
      ),
    ).toBe(viewportGuidance);
    expect(document.querySelector("section.canvas-node")).toHaveStyle({
      height: "auto",
      minHeight: "var(--editor-viewport-height)",
    });

    fireEvent.click(screen.getByRole("button", { name: "Add Card" }));
    const childHeight = screen.getByLabelText("Height");
    expect(
      Array.from(childHeight.querySelectorAll("option")).map(
        (option) => option.textContent,
      ),
    ).not.toContain("Fill viewport");
    expect(
      Array.from(childHeight.querySelectorAll("option")).map(
        (option) => option.textContent,
      ),
    ).toContain("Fill parent");
    expect(screen.queryByText(/Fill viewport keeps the page/)).not.toBeInTheDocument();
  });

  it("should preview a normal-flow pointer resize and commit one percentage command", () => {
    mockRootResizeGeometry();
    const store = createPhaseFiveStore();
    render(<EditorShell store={store} />);
    fireEvent.click(screen.getByRole("button", { name: "Add Section" }));
    const historyBefore = store.getState().history.past.length;
    const handle = screen.getByRole("button", { name: "Resize Section 1 east" });
    const section = document.querySelector("section.canvas-node");
    if (!section) throw new Error("Expected the selected Section renderer");

    fireEvent.pointerDown(handle, { button: 0, clientX: 500, clientY: 10, pointerId: 1 });
    fireEvent.pointerMove(handle, { clientX: 300, clientY: 10, pointerId: 1 });

    expect(section).toHaveStyle({ width: "82.64%" });
    expect(
      store.getState().document?.pages[asPageId("page-phase-five")].nodes[
        FIRST_NODE_ID
      ].styles.base.width,
    ).toEqual({ mode: "fill" });

    fireEvent.pointerUp(handle, { clientX: 300, clientY: 10, pointerId: 1 });

    expect(
      store.getState().document?.pages[asPageId("page-phase-five")].nodes[
        FIRST_NODE_ID
      ].styles.base.width,
    ).toEqual({ mode: "fixed", value: 82.64, unit: "%" });
    expect(store.getState().history.past).toHaveLength(historyBefore + 1);
  });

  it("should cancel a live resize without changing document or history", () => {
    const store = createPhaseFiveStore();
    render(<EditorShell store={store} />);
    fireEvent.click(screen.getByRole("button", { name: "Add Section" }));
    const historyBefore = store.getState().history.past.length;
    const handle = screen.getByRole("button", { name: "Resize Section 1 east" });

    fireEvent.pointerDown(handle, { button: 0, clientX: 0, clientY: 0, pointerId: 2 });
    fireEvent.pointerMove(handle, { clientX: 80, clientY: 0, pointerId: 2 });
    fireEvent.keyDown(window, { key: "Escape" });

    expect(
      store.getState().document?.pages[asPageId("page-phase-five")].nodes[
        FIRST_NODE_ID
      ].styles.base.width,
    ).toEqual({ mode: "fill" });
    expect(store.getState().history.past).toHaveLength(historyBefore);
    expect(screen.getByRole("status")).toHaveTextContent("Visual edit canceled.");
  });

  it("should preview keyboard resizing and commit it with Enter as one undoable command", () => {
    const store = createPhaseFiveStore();
    render(<EditorShell store={store} />);
    fireEvent.click(screen.getByRole("button", { name: "Add Section" }));
    const historyBefore = store.getState().history.past.length;
    const handle = screen.getByRole("button", { name: "Resize Section 1 east" });

    fireEvent.keyDown(handle, { key: "ArrowRight", shiftKey: true });
    expect(document.querySelector("section.canvas-node")).toHaveStyle({ width: "10px" });
    expect(store.getState().history.past).toHaveLength(historyBefore);
    fireEvent.keyDown(handle, { key: "Enter" });

    expect(
      store.getState().document?.pages[asPageId("page-phase-five")].nodes[
        FIRST_NODE_ID
      ].styles.base.width,
    ).toEqual({ mode: "fixed", value: 10, unit: "px" });
    expect(store.getState().history.past).toHaveLength(historyBefore + 1);

    fireEvent.click(screen.getByRole("button", { name: "Undo" }));
    expect(
      store.getState().document?.pages[asPageId("page-phase-five")].nodes[
        FIRST_NODE_ID
      ].styles.base.width,
    ).toEqual({ mode: "fill" });
  });

  it("should link opposite canvas spacing handles in axes mode and commit once", () => {
    const store = createPhaseFiveStore();
    render(<EditorShell store={store} />);
    fireEvent.click(screen.getByRole("button", { name: "Add Section" }));
    const historyBefore = store.getState().history.past.length;
    fireEvent.click(screen.getAllByRole("button", { name: "Edit on canvas" })[0]);
    const handle = screen.getByRole("button", {
      name: "Adjust Section 1 padding left",
    });

    expect(document.querySelectorAll(".canvas-padding-band")).toHaveLength(4);
    fireEvent.pointerDown(handle, { button: 0, clientX: 20, clientY: 0, pointerId: 3 });
    fireEvent.pointerMove(handle, { clientX: 30, clientY: 0, pointerId: 3 });
    expect(store.getState().history.past).toHaveLength(historyBefore);
    fireEvent.pointerUp(handle, { clientX: 30, clientY: 0, pointerId: 3 });

    expect(
      store.getState().document?.pages[asPageId("page-phase-five")].nodes[
        FIRST_NODE_ID
      ].styles.base.padding,
    ).toEqual({
      top: { value: 48, unit: "px" },
      right: { value: 34, unit: "px" },
      bottom: { value: 48, unit: "px" },
      left: { value: 34, unit: "px" },
    });
    expect(store.getState().history.past).toHaveLength(historyBefore + 1);
  });

  it("should change only the dragged canvas margin side in all mode", () => {
    const store = createPhaseFiveStore();
    render(<EditorShell store={store} />);
    fireEvent.click(screen.getByRole("button", { name: "Add Section" }));
    const historyBefore = store.getState().history.past.length;
    const marginMode = screen.getByRole("group", { name: "Margin mode" });
    fireEvent.click(within(marginMode).getByRole("button", { name: "All" }));
    fireEvent.click(screen.getAllByRole("button", { name: "Edit on canvas" })[1]);
    const handle = screen.getByRole("button", {
      name: "Adjust Section 1 margin left",
    });

    fireEvent.pointerDown(handle, { button: 0, clientX: 20, clientY: 0, pointerId: 4 });
    fireEvent.pointerMove(handle, { clientX: 10, clientY: 0, pointerId: 4 });
    expect(store.getState().history.past).toHaveLength(historyBefore);
    fireEvent.pointerUp(handle, { clientX: 10, clientY: 0, pointerId: 4 });

    expect(
      store.getState().document?.pages[asPageId("page-phase-five")].nodes[
        FIRST_NODE_ID
      ].styles.base.margin,
    ).toEqual({
      top: { value: 0, unit: "px" },
      right: { value: 0, unit: "px" },
      bottom: { value: 0, unit: "px" },
      left: { value: 10, unit: "px" },
    });
    expect(store.getState().history.past).toHaveLength(historyBefore + 1);
  });

  it("should update padding and margin on each valid numeric change before blur", () => {
    const store = createPhaseFiveStore();
    render(<EditorShell store={store} />);
    fireEvent.click(screen.getByRole("button", { name: "Add Section" }));
    const historyBefore = store.getState().history.past.length;
    const section = document.querySelector("section.canvas-node");
    if (!section) throw new Error("Expected the selected Section renderer");

    const paddingY = screen.getByLabelText("Padding Y");
    paddingY.focus();
    fireEvent.change(paddingY, { target: { value: "" } });

    expect(section).toHaveStyle({ paddingTop: "48px", paddingBottom: "48px" });
    expect(store.getState().history.past).toHaveLength(historyBefore);

    fireEvent.change(paddingY, { target: { value: "47" } });

    expect(section).toHaveStyle({ paddingTop: "47px", paddingBottom: "47px" });
    expect(screen.getByLabelText("Padding Y")).toBe(paddingY);
    expect(paddingY).toHaveFocus();
    expect(store.getState().history.past).toHaveLength(historyBefore + 1);

    const marginX = screen.getByLabelText("Margin X");
    marginX.focus();
    fireEvent.change(marginX, { target: { value: "-1" } });

    expect(section).toHaveStyle({ marginRight: "-1px", marginLeft: "-1px" });
    expect(screen.getByLabelText("Margin X")).toBe(marginX);
    expect(marginX).toHaveFocus();
    expect(store.getState().history.past).toHaveLength(historyBefore + 2);

    fireEvent.blur(marginX);
    expect(store.getState().history.past).toHaveLength(historyBefore + 2);
  });

  it("should expose axes and all padding modes with the expected edit scope", () => {
    const store = createPhaseFiveStore();
    render(<EditorShell store={store} />);
    fireEvent.click(screen.getByRole("button", { name: "Add Section" }));
    const paddingMode = screen.getByRole("group", { name: "Padding mode" });

    expect(within(paddingMode).queryByRole("button", { name: "Sides" })).not.toBeInTheDocument();
    expect(within(paddingMode).getByRole("button", { name: "Axes" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.queryByLabelText("Padding top")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Padding X")).toHaveValue(24);
    expect(screen.getByLabelText("Padding Y")).toHaveValue(48);

    const paddingY = screen.getByLabelText("Padding Y");
    fireEvent.change(paddingY, { target: { value: "2" } });
    fireEvent.blur(paddingY);
    fireEvent.change(screen.getByLabelText("Padding Y unit"), {
      target: { value: "rem" },
    });

    expect(
      store.getState().document?.pages[asPageId("page-phase-five")].nodes[
        FIRST_NODE_ID
      ].styles.base.padding,
    ).toEqual({
      top: { value: 2, unit: "rem" },
      bottom: { value: 2, unit: "rem" },
      right: { value: 24, unit: "px" },
      left: { value: 24, unit: "px" },
    });

    fireEvent.click(within(paddingMode).getByRole("button", { name: "All" }));
    expect(screen.queryByLabelText("Padding X")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Padding Y")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Padding top")).toHaveValue(2);
    expect(screen.getByLabelText("Padding right")).toHaveValue(24);
    expect(screen.getByLabelText("Padding bottom")).toHaveValue(2);
    expect(screen.getByLabelText("Padding left")).toHaveValue(24);

    const paddingRight = screen.getByLabelText("Padding right");
    fireEvent.change(paddingRight, { target: { value: "3" } });
    fireEvent.blur(paddingRight);

    expect(
      store.getState().document?.pages[asPageId("page-phase-five")].nodes[
        FIRST_NODE_ID
      ].styles.base.padding,
    ).toEqual({
      top: { value: 2, unit: "rem" },
      right: { value: 3, unit: "px" },
      bottom: { value: 2, unit: "rem" },
      left: { value: 24, unit: "px" },
    });
  });

  it("should expose axes and all margin modes with the expected edit scope", () => {
    const store = createPhaseFiveStore();
    render(<EditorShell store={store} />);
    fireEvent.click(screen.getByRole("button", { name: "Add Section" }));
    const marginMode = screen.getByRole("group", { name: "Margin mode" });

    expect(within(marginMode).queryByRole("button", { name: "Sides" })).not.toBeInTheDocument();
    expect(within(marginMode).getByRole("button", { name: "Axes" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.queryByLabelText("Margin top")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Margin X")).toBeInTheDocument();
    expect(screen.getByLabelText("Margin Y")).toBeInTheDocument();

    const marginX = screen.getByLabelText("Margin X");
    fireEvent.change(marginX, { target: { value: "12" } });
    fireEvent.blur(marginX);

    expect(
      store.getState().document?.pages[asPageId("page-phase-five")].nodes[
        FIRST_NODE_ID
      ].styles.base.margin,
    ).toEqual({
      top: { value: 0, unit: "px" },
      right: { value: 12, unit: "px" },
      bottom: { value: 0, unit: "px" },
      left: { value: 12, unit: "px" },
    });

    fireEvent.click(within(marginMode).getByRole("button", { name: "All" }));
    expect(screen.queryByLabelText("Margin X")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Margin Y")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Margin top")).toHaveValue(0);
    expect(screen.getByLabelText("Margin right")).toHaveValue(12);
    expect(screen.getByLabelText("Margin bottom")).toHaveValue(0);
    expect(screen.getByLabelText("Margin left")).toHaveValue(12);

    const marginBottom = screen.getByLabelText("Margin bottom");
    fireEvent.change(marginBottom, { target: { value: "-5" } });
    fireEvent.blur(marginBottom);

    expect(
      store.getState().document?.pages[asPageId("page-phase-five")].nodes[
        FIRST_NODE_ID
      ].styles.base.margin,
    ).toEqual({
      top: { value: 0, unit: "px" },
      right: { value: 12, unit: "px" },
      bottom: { value: -5, unit: "px" },
      left: { value: 12, unit: "px" },
    });
  });

  it("should configure flex and grid containers and show editor-only layout guides", () => {
    const store = createPhaseFiveStore();
    render(<EditorShell store={store} />);
    fireEvent.click(screen.getByRole("button", { name: "Add Section" }));
    fireEvent.change(screen.getByLabelText("Display"), { target: { value: "flex" } });
    fireEvent.change(screen.getByLabelText("Direction"), { target: { value: "column" } });
    fireEvent.click(screen.getByRole("button", { name: "Layout guides" }));

    expect(document.querySelector("section.canvas-node")).toHaveStyle({
      display: "flex",
      flexDirection: "column",
    });
    expect(screen.getByLabelText("Flex column layout guide")).toBeInTheDocument();
    expect(
      store.getState().document?.pages[asPageId("page-phase-five")].nodes[
        FIRST_NODE_ID
      ].props,
    ).not.toHaveProperty("editorOverlay");

    fireEvent.change(screen.getByLabelText("Display"), { target: { value: "grid" } });
    fireEvent.change(screen.getByLabelText("Grid columns"), { target: { value: "3" } });
    fireEvent.blur(screen.getByLabelText("Grid columns"));
    expect(document.querySelector("section.canvas-node")).toHaveStyle({
      display: "grid",
      gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    });
  });

  it("should reject invalid registry-prop combinations atomically", () => {
    const store = createPhaseFiveStore();
    render(<EditorShell store={store} />);
    fireEvent.click(screen.getByRole("button", { name: "Add Button" }));
    fireEvent.click(screen.getByLabelText("Open in new tab"));

    const node = store.getState().document?.pages[asPageId("page-phase-five")].nodes[
      FIRST_NODE_ID
    ];
    expect(node?.props).toEqual({
      text: "Button",
      href: "",
      openInNewTab: false,
      icon: null,
      iconPosition: "start",
      iconAnimation: "none",
      behavior: "button",
    });
    expect(screen.getByRole("status")).toHaveTextContent("Change rejected:");
  });
});
