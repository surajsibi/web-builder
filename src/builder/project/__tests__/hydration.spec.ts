import { describe, expect, it } from "vitest";

import { asNodeId } from "@/builder/model/ids";
import { prepareProjectHydration } from "@/builder/project/hydration";
import {
  createTestNode,
  createTestProject,
} from "@/builder/testing/project-fixtures";

describe("prepareProjectHydration", () => {
  it("should validate a current document and build the project-wide parent index", () => {
    const input = createTestProject();
    const original = structuredClone(input);

    const result = prepareProjectHydration(input);

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.value.parentById).toEqual({
      "node-section": null,
      "node-card": "node-section",
      "node-text": "node-card",
    });
    expect(result.value.document).not.toBe(input);
    expect(input).toEqual(original);
  });

  it("should hydrate optional uniform border fields without a document migration", () => {
    const input = createTestProject();
    const card = input.pages[input.homePageId].nodes[asNodeId("node-card")];
    card.styles.base.borderWidth = { value: 1, unit: "px" };
    card.styles.base.borderStyle = "solid";
    card.styles.base.borderColor = "#2563eb";

    const result = prepareProjectHydration(input);

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.value.migrated).toBe(false);
    expect(
      result.value.document.pages[input.homePageId].nodes[asNodeId("node-card")]
        .styles.base,
    ).toMatchObject({
      borderWidth: { value: 1, unit: "px" },
      borderStyle: "solid",
      borderColor: "#2563eb",
    });
  });

  it("should hydrate an optional background image without a document migration", () => {
    const input = createTestProject();
    const card = input.pages[input.homePageId].nodes[asNodeId("node-card")];
    card.styles.base.backgroundImage = {
      kind: "image",
      source: "/images/card-texture.webp",
      size: "cover",
      positionX: "center",
      positionY: "center",
      repeat: "no-repeat",
    };

    const result = prepareProjectHydration(input);

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.value.migrated).toBe(false);
    expect(
      result.value.document.pages[input.homePageId].nodes[asNodeId("node-card")]
        .styles.base.backgroundImage,
    ).toEqual(card.styles.base.backgroundImage);
  });

  it("should hydrate an optional linear gradient without a document migration", () => {
    const input = createTestProject();
    const card = input.pages[input.homePageId].nodes[asNodeId("node-card")];
    card.styles.base.backgroundImage = {
      kind: "linear-gradient",
      angle: 135,
      startColor: "#7c3aed",
      endColor: "#2563ebcc",
    };

    const result = prepareProjectHydration(input);

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.value.migrated).toBe(false);
    expect(
      result.value.document.pages[input.homePageId].nodes[asNodeId("node-card")]
        .styles.base.backgroundImage,
    ).toEqual(card.styles.base.backgroundImage);
  });

  it("should migrate a version 1 Button to explicit static no-icon non-submit props", () => {
    const input = createTestProject();
    const page = input.pages[input.homePageId];
    const button = createTestNode("button", "node-button");
    button.componentVersion = 1;
    button.props = {
      text: "Legacy action",
      href: "",
      openInNewTab: false,
    };
    page.rootIds.push(button.id);
    page.nodes[button.id] = button;

    const result = prepareProjectHydration(input);

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.value.migrated).toBe(true);
    expect(result.value.document.pages[input.homePageId].nodes[button.id]).toMatchObject({
      componentVersion: 4,
      props: {
        text: "Legacy action",
        href: "",
        openInNewTab: false,
        icon: null,
        iconPosition: "start",
        iconAnimation: "none",
        behavior: "button",
      },
    });
    expect(input.pages[input.homePageId].nodes[button.id]).toMatchObject({
      componentVersion: 1,
      props: {
        text: "Legacy action",
        href: "",
        openInNewTab: false,
      },
    });
  });

  it("should migrate a version 3 Button to static icon behavior", () => {
    const input = createTestProject();
    const page = input.pages[input.homePageId];
    const button = createTestNode("button", "node-button-v3");
    button.componentVersion = 3;
    button.props = {
      text: "Legacy arrow",
      href: "",
      openInNewTab: false,
      icon: "arrow-right",
      iconPosition: "end",
      behavior: "button",
    };
    page.rootIds.push(button.id);
    page.nodes[button.id] = button;

    const result = prepareProjectHydration(input);

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.value.migrated).toBe(true);
    expect(result.value.document.pages[input.homePageId].nodes[button.id])
      .toMatchObject({
        componentVersion: 4,
        props: {
          text: "Legacy arrow",
          icon: "arrow-right",
          iconPosition: "end",
          iconAnimation: "none",
          behavior: "button",
        },
      });
  });

  it("should migrate a version 1 Input with password reveal disabled", () => {
    const input = createTestProject();
    const page = input.pages[input.homePageId];
    const field = createTestNode("input", "node-input-v1");
    field.componentVersion = 1;
    field.props = {
      label: "Legacy password",
      name: "password",
      inputType: "password",
      placeholder: "Enter password",
      defaultValue: "",
      required: false,
      disabled: false,
    };
    page.rootIds.push(field.id);
    page.nodes[field.id] = field;

    const result = prepareProjectHydration(input);

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.value.migrated).toBe(true);
    expect(result.value.document.pages[input.homePageId].nodes[field.id])
      .toMatchObject({
        componentVersion: 3,
        props: { allowPasswordReveal: false, controlId: "" },
      });
    expect(input.pages[input.homePageId].nodes[field.id]).toMatchObject({
      componentVersion: 1,
      props: { label: "Legacy password" },
    });
    expect(
      input.pages[input.homePageId].nodes[field.id].props,
    ).not.toHaveProperty("allowPasswordReveal");
    expect(
      input.pages[input.homePageId].nodes[field.id].props,
    ).not.toHaveProperty("controlId");
  });

  it("should migrate a version 1 Textarea to an empty control ID", () => {
    const input = createTestProject();
    const page = input.pages[input.homePageId];
    const field = createTestNode("textarea", "node-textarea-v1");
    field.componentVersion = 1;
    const legacyProps = { ...field.props };
    delete legacyProps.controlId;
    field.props = legacyProps;
    page.rootIds.push(field.id);
    page.nodes[field.id] = field;

    const result = prepareProjectHydration(input);

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.value.document.pages[input.homePageId].nodes[field.id])
      .toMatchObject({
        componentVersion: 2,
        props: { controlId: "" },
      });
    expect(input.pages[input.homePageId].nodes[field.id].props).not.toHaveProperty(
      "controlId",
    );
  });

  it("should migrate a version 1 Dropdown to an empty control ID", () => {
    const input = createTestProject();
    const page = input.pages[input.homePageId];
    const field = createTestNode("dropdown", "node-dropdown-v1");
    field.componentVersion = 1;
    const legacyProps = { ...field.props };
    delete legacyProps.controlId;
    field.props = legacyProps;
    page.rootIds.push(field.id);
    page.nodes[field.id] = field;

    const result = prepareProjectHydration(input);

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.value.document.pages[input.homePageId].nodes[field.id])
      .toMatchObject({
        componentVersion: 2,
        props: { controlId: "" },
      });
    expect(input.pages[input.homePageId].nodes[field.id].props).not.toHaveProperty(
      "controlId",
    );
  });

  it("should migrate the hidden version 1 Container width cap to the current 1440px cap", () => {
    const input = createTestProject();
    const page = input.pages[input.homePageId];
    const container = createTestNode("container", "node-container");
    container.componentVersion = 1;
    container.styles.base.maxWidth = { value: 72, unit: "rem" };
    page.rootIds.push(container.id);
    page.nodes[container.id] = container;

    const result = prepareProjectHydration(input);

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.value.migrated).toBe(true);
    expect(result.value.document.pages[input.homePageId].nodes[container.id])
      .toMatchObject({
        componentVersion: 3,
        styles: {
          base: {
            maxWidth: { value: 1440, unit: "px" },
          },
        },
      });
    expect(input.pages[input.homePageId].nodes[container.id]).toMatchObject({
      componentVersion: 1,
      styles: {
        base: {
          maxWidth: { value: 72, unit: "rem" },
        },
      },
    });
  });

  it("should migrate the version 2 Container fill width to the current 1440px cap", () => {
    const input = createTestProject();
    const page = input.pages[input.homePageId];
    const container = createTestNode("container", "node-container");
    container.componentVersion = 2;
    container.styles.base.maxWidth = { value: 100, unit: "%" };
    page.rootIds.push(container.id);
    page.nodes[container.id] = container;

    const result = prepareProjectHydration(input);

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.value.migrated).toBe(true);
    expect(result.value.document.pages[input.homePageId].nodes[container.id])
      .toMatchObject({
        componentVersion: 3,
        styles: {
          base: {
            maxWidth: { value: 1440, unit: "px" },
          },
        },
      });
    expect(input.pages[input.homePageId].nodes[container.id]).toMatchObject({
      componentVersion: 2,
      styles: {
        base: {
          maxWidth: { value: 100, unit: "%" },
        },
      },
    });
  });

  it("should hydrate supported Form children and reject nested Forms", () => {
    const input = createTestProject();
    const page = input.pages[input.homePageId];
    const visibleLabel = createTestNode("label", "node-form-label");
    const textInput = createTestNode("input", "node-form-input");
    const textarea = createTestNode("textarea", "node-form-textarea");
    const dropdown = createTestNode("dropdown", "node-form-dropdown");
    const radioGroup = createTestNode("radio-group", "node-form-radio-group");
    const checkbox = createTestNode("checkbox", "node-form-checkbox");
    const checkboxGroup = createTestNode(
      "checkbox-group",
      "node-form-checkbox-group",
    );
    const form = createTestNode("form", "node-form", [
      visibleLabel.id,
      textInput.id,
      textarea.id,
      dropdown.id,
      radioGroup.id,
      checkbox.id,
      checkboxGroup.id,
    ]);
    page.rootIds.push(form.id);
    page.nodes[form.id] = form;
    page.nodes[visibleLabel.id] = visibleLabel;
    page.nodes[textInput.id] = textInput;
    page.nodes[textarea.id] = textarea;
    page.nodes[dropdown.id] = dropdown;
    page.nodes[radioGroup.id] = radioGroup;
    page.nodes[checkbox.id] = checkbox;
    page.nodes[checkboxGroup.id] = checkboxGroup;

    expect(prepareProjectHydration(input).success).toBe(true);

    const nested = createTestNode("form", "node-nested-form");
    form.childIds.push(nested.id);
    page.nodes[nested.id] = nested;
    const result = prepareProjectHydration(input);

    expect(result).toMatchObject({
      success: false,
      error: {
        stage: "placement",
        nodeId: "node-nested-form",
        componentType: "form",
      },
    });
  });

  it("should preserve an explicit version 1 Container width cap", () => {
    const input = createTestProject();
    const page = input.pages[input.homePageId];
    const container = createTestNode("container", "node-container");
    container.componentVersion = 1;
    container.styles.base.maxWidth = { value: 60, unit: "rem" };
    page.rootIds.push(container.id);
    page.nodes[container.id] = container;

    const result = prepareProjectHydration(input);

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(
      result.value.document.pages[input.homePageId].nodes[container.id].styles
        .base.maxWidth,
    ).toEqual({ value: 60, unit: "rem" });
    expect(
      result.value.document.pages[input.homePageId].nodes[container.id]
        .componentVersion,
    ).toBe(3);
  });

  it("should reject malformed JSON while preserving the original payload", () => {
    const rawPayload = "{not-json";

    const result = prepareProjectHydration(rawPayload);

    expect(result).toMatchObject({
      success: false,
      error: { stage: "json" },
      rawPayload,
    });
  });

  it("should reject unsupported future document versions", () => {
    const input = { ...createTestProject(), schemaVersion: 2 };

    const result = prepareProjectHydration(input);

    expect(result).toMatchObject({
      success: false,
      error: {
        stage: "document-version",
        schemaVersion: 2,
      },
    });
  });

  it("should reject unknown component types at the component lookup stage", () => {
    const input = createTestProject();
    input.pages[input.homePageId].nodes[asNodeId("node-text")].type =
      "unknown" as never;

    const result = prepareProjectHydration(input);

    expect(result).toMatchObject({
      success: false,
      error: {
        stage: "component-lookup",
        pageId: "page-home",
        nodeId: "node-text",
        componentType: "unknown",
      },
    });
  });

  it("should reject invalid tree positions before component hydration", () => {
    const input = createTestProject();
    input.pages[input.homePageId].rootIds.push(
      input.pages[input.homePageId].rootIds[0],
    );

    const result = prepareProjectHydration(input);

    expect(result).toMatchObject({
      success: false,
      error: { stage: "tree", nodeId: "node-section" },
    });
  });

  it("should reject current-version props instead of merging defaults", () => {
    const input = createTestProject();
    input.pages[input.homePageId].nodes[asNodeId("node-text")].props = {};

    const result = prepareProjectHydration(input);

    expect(result).toMatchObject({
      success: false,
      error: {
        stage: "props",
        nodeId: "node-text",
        componentType: "text",
      },
    });
  });
});
