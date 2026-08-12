import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { StrictMode } from "react";

import { asNodeId } from "@/builder/model/ids";
import { PreviewShell } from "@/builder/preview/preview-shell";
import { storePreviewSnapshot } from "@/builder/preview/preview-snapshot";
import { createBuilderStore } from "@/builder/store/builder-store";
import { createMemoryPreviewStorage } from "@/builder/testing/memory-preview-storage";
import {
  createTestNode,
  createTestProject,
} from "@/builder/testing/project-fixtures";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    value: 1024,
  });
});

describe("PreviewShell", () => {
  it("should render the active page without editor chrome", () => {
    const store = createBuilderStore({ initialDocument: createTestProject() });

    const { container } = render(<PreviewShell store={store} />);

    expect(screen.getByLabelText("Home preview")).toBeInTheDocument();
    expect(screen.getByRole("article")).toContainElement(screen.getByText("Text"));
    expect(container.querySelector(".editor-toolbar")).not.toBeInTheDocument();
    expect(container.querySelector(".editor-sidebar")).not.toBeInTheDocument();
    expect(container.querySelector(".canvas-stage")).not.toBeInTheDocument();
    expect(container.querySelector(".canvas-interaction-overlay")).not.toBeInTheDocument();
    expect(screen.queryByText("Your page is empty")).not.toBeInTheDocument();
  });

  it("should resolve responsive styles from the real browser width", async () => {
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: 390,
    });
    const store = createBuilderStore({ initialDocument: createTestProject() });

    render(<PreviewShell store={store} />);

    await waitFor(() => {
      expect(screen.getByLabelText("Home preview")).toHaveAttribute(
        "data-preview-viewport",
        "mobile",
      );
    });
    expect(screen.getByRole("article")).toHaveStyle({ padding: "16px" });

    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: 1280,
    });
    fireEvent.resize(window);

    await waitFor(() => {
      expect(screen.getByLabelText("Home preview")).toHaveAttribute(
        "data-preview-viewport",
        "desktop",
      );
    });
    expect(screen.getByRole("article")).toHaveStyle({ padding: "24px" });
  });

  it("should label forms non-persistent without sending or logging visitor values", () => {
    const project = createTestProject();
    const page = project.pages[project.homePageId];
    const input = createTestNode("input", "node-email");
    input.props = {
      ...input.props,
      label: "Email",
      name: "email",
      inputType: "email",
      required: true,
    };
    const textarea = createTestNode("textarea", "node-message");
    textarea.props = {
      ...textarea.props,
      label: "Message",
      name: "message",
      required: true,
    };
    const dropdown = createTestNode("dropdown", "node-country");
    dropdown.props = {
      ...dropdown.props,
      label: "Country",
      name: "country",
      options: ["India", "Canada"],
    };
    const radioGroup = createTestNode("radio-group", "node-contact-method");
    radioGroup.props = {
      ...radioGroup.props,
      label: "Preferred contact method",
      name: "contactMethod",
      options: ["Email", "Phone"],
    };
    const checkbox = createTestNode("checkbox", "node-terms");
    checkbox.props = {
      ...checkbox.props,
      label: "Accept terms",
      name: "terms",
      value: "accepted",
    };
    const checkboxGroup = createTestNode("checkbox-group", "node-interests");
    checkboxGroup.props = {
      ...checkboxGroup.props,
      label: "Interests",
      name: "interests",
      options: ["Design", "Research", "Development"],
    };
    const button = createTestNode("button", "node-submit");
    button.props = {
      ...button.props,
      text: "Send",
      behavior: "submit",
    };
    const form = createTestNode("form", "node-contact-form", [
      input.id,
      textarea.id,
      dropdown.id,
      radioGroup.id,
      checkbox.id,
      checkboxGroup.id,
      button.id,
    ]);
    form.props = {
      ...form.props,
      label: "Contact form",
      name: "contactForm",
    };
    page.rootIds.push(form.id);
    page.nodes[form.id] = form;
    page.nodes[input.id] = input;
    page.nodes[textarea.id] = textarea;
    page.nodes[dropdown.id] = dropdown;
    page.nodes[radioGroup.id] = radioGroup;
    page.nodes[checkbox.id] = checkbox;
    page.nodes[checkboxGroup.id] = checkboxGroup;
    page.nodes[button.id] = button;
    const fetchMock = vi.fn();
    const consoleLog = vi.spyOn(console, "log").mockImplementation(() => {});
    vi.stubGlobal("fetch", fetchMock);

    render(
      <PreviewShell
        store={createBuilderStore({ initialDocument: project })}
      />,
    );
    fireEvent.change(screen.getByRole("textbox", { name: "Email" }), {
      target: { value: "ada@example.com" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: "Message" }), {
      target: { value: "Please send more information." },
    });
    fireEvent.change(screen.getByRole("combobox", { name: "Country" }), {
      target: { value: "Canada" },
    });
    fireEvent.click(screen.getByRole("radio", { name: "Phone" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Accept terms" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Design" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Development" }));
    fireEvent.click(screen.getByRole("button", { name: "Send" }));

    expect(screen.getByRole("note")).toHaveTextContent(
      "Preview only: submissions are not saved or sent.",
    );
    expect(fetchMock).not.toHaveBeenCalled();
    expect(consoleLog).not.toHaveBeenCalled();
    expect(
      screen.queryByText("Thanks! Your submission was received."),
    ).not.toBeInTheDocument();
  });

  it("should let visitors reveal and hide a password without losing its value", () => {
    const project = createTestProject();
    const page = project.pages[project.homePageId];
    const password = createTestNode("input", "node-password");
    password.props = {
      ...password.props,
      label: "Password",
      name: "password",
      inputType: "password",
      allowPasswordReveal: true,
    };
    page.rootIds.push(password.id);
    page.nodes[password.id] = password;
    render(
      <PreviewShell
        store={createBuilderStore({ initialDocument: project })}
      />,
    );
    const input = screen.getByLabelText("Password");

    fireEvent.change(input, { target: { value: "visitor-secret" } });
    fireEvent.click(screen.getByRole("button", { name: "Show Password" }));

    expect(input).toHaveAttribute("type", "text");
    expect(input).toHaveValue("visitor-secret");
    fireEvent.click(screen.getByRole("button", { name: "Hide Password" }));
    expect(input).toHaveAttribute("type", "password");
    expect(input).toHaveValue("visitor-secret");
  });

  it("should render a visible Label as the accessible name of its target control", () => {
    const project = createTestProject();
    const page = project.pages[project.homePageId];
    const label = createTestNode("label", "node-email-label");
    label.props = {
      ...label.props,
      text: "Email address",
      forId: "email-field",
    };
    const input = createTestNode("input", "node-email-input");
    input.props = {
      ...input.props,
      label: "Fallback email label",
      controlId: "email-field",
      name: "email",
      inputType: "email",
    };
    page.rootIds.push(label.id, input.id);
    page.nodes[label.id] = label;
    page.nodes[input.id] = input;

    render(
      <PreviewShell
        store={createBuilderStore({ initialDocument: project })}
      />,
    );

    const visibleLabel = screen.getByText("Email address", { selector: "label" });
    const control = screen.getByRole("textbox", { name: "Email address" });

    expect(visibleLabel).toHaveAttribute("for", "email-field");
    expect(control).toHaveAttribute("id", "email-field");
    expect(control).not.toHaveAttribute("aria-label");
  });

  it("should render background images through the shared preview style compiler", () => {
    const project = createTestProject();
    project.pages[project.homePageId].nodes[
      asNodeId("node-card")
    ].styles.base.backgroundImage = {
      kind: "image",
      source: "/images/card-texture.webp",
      size: "cover",
      positionX: "right",
      positionY: "bottom",
      repeat: "no-repeat",
    };
    const store = createBuilderStore({ initialDocument: project });

    render(<PreviewShell store={store} />);

    expect(screen.getByRole("article")).toHaveStyle({
      backgroundImage: 'url("/images/card-texture.webp")',
      backgroundSize: "cover",
      backgroundPosition: "right bottom",
      backgroundRepeat: "no-repeat",
    });
  });

  it("should render linear gradients through the shared preview style compiler", () => {
    const project = createTestProject();
    project.pages[project.homePageId].nodes[
      asNodeId("node-card")
    ].styles.base.backgroundImage = {
      kind: "linear-gradient",
      angle: 135,
      startColor: "#7c3aed",
      endColor: "#2563ebcc",
    };
    const store = createBuilderStore({ initialDocument: project });

    render(<PreviewShell store={store} />);

    expect(screen.getByRole("article")).toHaveStyle({
      backgroundImage: "linear-gradient(135deg, #7c3aed, #2563ebcc)",
    });
  });

  it("should render reusable Card effects through the shared preview style compiler", () => {
    const project = createTestProject();
    const card = project.pages[project.homePageId].nodes[asNodeId("node-card")];
    card.styles.base.boxShadow = [
      {
        offsetX: 0,
        offsetY: 8,
        blurRadius: 24,
        spreadRadius: -12,
        unit: "px",
        color: "#5b45d64d",
        inset: false,
      },
    ];
    card.styles.base.backdropBlur = { value: 12, unit: "px" };
    const store = createBuilderStore({ initialDocument: project });

    render(<PreviewShell store={store} />);

    const renderedCard = screen.getByRole("article");
    expect(renderedCard.style.boxShadow).toContain("0px 8px 24px -12px");
    expect(renderedCard.style.backdropFilter).toBe("blur(12px)");
  });

  it("should provide a recovery link when no project is hydrated", () => {
    render(<PreviewShell store={createBuilderStore()} />);

    expect(
      screen.getByRole("heading", { name: "The current page could not be loaded." }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Return to the editor" })).toHaveAttribute(
      "href",
      "/",
    );
  });

  it("should hydrate and retain a transferred preview snapshot", async () => {
    const project = createTestProject();
    const snapshotId = "current-editor-state";
    const previewStorage = createMemoryPreviewStorage();
    storePreviewSnapshot(previewStorage, snapshotId, {
      document: project,
      activePageId: project.homePageId,
    });

    render(
      <StrictMode>
        <PreviewShell
          previewStorage={previewStorage}
          snapshotId={snapshotId}
          store={createBuilderStore()}
        />
      </StrictMode>,
    );

    expect(
      await screen.findByLabelText("Home preview"),
    ).toBeInTheDocument();
    expect(screen.getByRole("article")).toContainElement(screen.getByText("Text"));
    expect(
      previewStorage.getItem("web-builder:preview:" + snapshotId),
    ).not.toBeNull();
  });

  it("should reject a missing transferred preview snapshot", async () => {
    render(
      <PreviewShell
        previewStorage={createMemoryPreviewStorage()}
        snapshotId="missing"
        store={createBuilderStore()}
      />,
    );

    expect(
      await screen.findByRole("heading", {
        name: "The current page could not be loaded.",
      }),
    ).toBeInTheDocument();
  });
});
