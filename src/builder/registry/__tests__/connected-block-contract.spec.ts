import { describe, expect, it } from "vitest";

import {
  resolveComponentTemplate,
  validateBlockRegistry,
  type BlockDefinition,
  type ComponentTemplate,
} from "@/builder/registry/define-block-registry";

function TestIcon() {
  return null;
}

function createProposedDefinition(
  createTemplate: BlockDefinition["createTemplate"],
): BlockDefinition {
  return {
    library: {
      label: "Test block",
      category: "Test",
      family: "layout",
      icon: TestIcon,
    },
    createTemplate,
  };
}

function createLibraryDefinition(library: unknown): BlockDefinition {
  return {
    library,
    createTemplate: () => ({ type: "container" }),
  } as unknown as BlockDefinition;
}

describe("connected block template contracts", () => {
  describe("template-local keys", () => {
    it.each([
      ["one character", "a"],
      ["64 characters", `a${"b".repeat(63)}`],
    ])("should preserve a valid %s key", (_caseName, key) => {
      const template = resolveComponentTemplate({
        type: "container",
        key,
      });

      expect(template).toHaveProperty("key", key);
    });

    it.each([
      ["uppercase and underscore characters", "Panel_1"],
      ["a leading digit", "1panel"],
      ["more than 64 characters", `a${"b".repeat(64)}`],
    ])(
      "should reject %s with the frozen grammar and template path",
      (_caseName, key) => {
        const definition = createProposedDefinition(() => ({
          type: "container",
          key,
        }));

        expect(() =>
          validateBlockRegistry({ "invalid-key": definition }),
        ).toThrow(
          `Block "invalid-key" key "${key}" at "root" is invalid; expected /^[a-z][a-z0-9-]{0,63}$/ (1-64 characters).`,
        );
      },
    );

    it("should reject duplicate keys with both declaration paths", () => {
      const definition = createProposedDefinition(() => ({
        type: "container",
        children: [
          { type: "text", key: "panel" },
          { type: "text", key: "panel" },
        ],
      }));

      expect(() =>
        validateBlockRegistry({ "duplicate-key": definition }),
      ).toThrow(
        'Block "duplicate-key" key "panel" is duplicated; first declared at "root.children[0]" and repeated at "root.children[1]".',
      );
    });

    it("should reject an invalid prop-reference target key with its field path", () => {
      const definition = createProposedDefinition(() => ({
        type: "button",
        nodeReferences: [
          { path: "targetStateNodeId", targetKey: "Missing_State" },
        ],
      }));

      expect(() =>
        validateBlockRegistry({ "invalid-target-key": definition }),
      ).toThrow(
        'Block "invalid-target-key" key "Missing_State" at "root.nodeReferences[0].targetKey" is invalid; expected /^[a-z][a-z0-9-]{0,63}$/ (1-64 characters).',
      );
    });

    it("should reject an invalid state-binding key with its field path", () => {
      const definition = createProposedDefinition(() => ({
        type: "container",
        stateBinding: {
          stateKey: "Missing_State",
          on: "show",
          off: "hide",
        },
      }));

      expect(() =>
        validateBlockRegistry({ "invalid-state-key": definition }),
      ).toThrow(
        'Block "invalid-state-key" key "Missing_State" at "root.stateBinding.stateKey" is invalid; expected /^[a-z][a-z0-9-]{0,63}$/ (1-64 characters).',
      );
    });

    it.each([
      ["on", "invalid-on", "invalid-on.root stateBinding.on must be show or hide"],
      [
        "off",
        "invalid-off",
        "invalid-off.root stateBinding.off must be show or hide",
      ],
    ] as const)(
      "should reject an unsupported state-binding %s visibility",
      (field, blockType, expectedMessage) => {
        const definition = createProposedDefinition(
          () =>
            ({
              type: "container",
              stateBinding: {
                stateKey: "open",
                on: field === "on" ? "collapse" : "show",
                off: field === "off" ? "collapse" : "hide",
              },
            }) as unknown as ComponentTemplate,
        );

        expect(() =>
          validateBlockRegistry({ [blockType]: definition }),
        ).toThrow(expectedMessage);
      },
    );

    it.each(["   ", `a${"b".repeat(80)}`])(
      "should reject a name hint outside the trimmed 1-80 character bound",
      (nameHint) => {
        const definition = createProposedDefinition(() => ({
          type: "container",
          nameHint,
        }));

        expect(() =>
          validateBlockRegistry({ "invalid-hint": definition }),
        ).toThrow(
          "invalid-hint.root nameHint must contain 1-80 characters after trimming",
        );
      },
    );
  });

  describe("symbolic relationships", () => {
    it("should preserve valid authored metadata for later relationship resolution", () => {
      const template = resolveComponentTemplate({
        type: "container",
        key: "disclosure",
        nameHint: "  Disclosure  ",
        children: [
          {
            type: "button",
            key: "trigger",
            props: { stateAction: "toggle" },
            nodeReferences: [
              { path: "targetStateNodeId", targetKey: "open" },
            ],
          },
          {
            type: "container",
            key: "panel",
            stateBinding: { stateKey: "open", on: "show", off: "hide" },
          },
          { type: "boolean-state", key: "open" },
        ],
      });

      expect(template).toMatchObject({
        key: "disclosure",
        nameHint: "Disclosure",
        children: [
          {
            key: "trigger",
            nodeReferences: [
              { path: "targetStateNodeId", targetKey: "open" },
            ],
          },
          {
            key: "panel",
            stateBinding: { stateKey: "open", on: "show", off: "hide" },
          },
          { key: "open" },
        ],
      });
      expect(template.children[0].props.targetStateNodeId).toBe("");
    });

    it("should reject a dangling registry-declared prop reference", () => {
      const definition = createProposedDefinition(() => ({
        type: "button",
        key: "trigger",
        props: { stateAction: "toggle" },
        nodeReferences: [
          { path: "targetStateNodeId", targetKey: "missing-state" },
        ],
      }));

      expect(() =>
        validateBlockRegistry({ "dangling-reference": definition }),
      ).toThrow(
        'Block "dangling-reference" reference "targetStateNodeId" at "root" targets missing key "missing-state".',
      );
    });

    it("should reject a visibility binding whose state key is missing", () => {
      const definition = createProposedDefinition(() => ({
        type: "container",
        key: "panel",
        stateBinding: {
          stateKey: "missing-state",
          on: "show",
          off: "hide",
        },
      }));

      expect(() =>
        validateBlockRegistry({ "dangling-binding": definition }),
      ).toThrow(
        'Block "dangling-binding" state binding at "root" targets missing key "missing-state".',
      );
    });

    it("should reject a hard-coded value at a registry-declared reference path", () => {
      const definition = createProposedDefinition(() => ({
        type: "button",
        props: {
          targetStateNodeId: "state-shared",
          stateAction: "toggle",
        },
      }));

      expect(() =>
        validateBlockRegistry({ "hard-coded-reference": definition }),
      ).toThrow(
        'Block "hard-coded-reference" props at "root" contain a non-empty raw node reference "targetStateNodeId"; use nodeReferences.',
      );
    });

    it("should reject a registry-declared reference whose target has the wrong component type", () => {
      const definition = createProposedDefinition(() => ({
        type: "container",
        children: [
          {
            type: "button",
            props: { stateAction: "toggle" },
            nodeReferences: [
              { path: "targetStateNodeId", targetKey: "panel" },
            ],
          },
          { type: "container", key: "panel" },
        ],
      }));

      expect(() =>
        validateBlockRegistry({ "wrong-reference-target": definition }),
      ).toThrow(
        'Block "wrong-reference-target" reference "targetStateNodeId" at "root.children[0]" targets key "panel" with type "container"; expected "boolean-state".',
      );
    });

    it("should reject a symbolic prop path absent from the source component reference metadata", () => {
      const definition = createProposedDefinition(() => ({
        type: "container",
        children: [
          {
            type: "button",
            nodeReferences: [{ path: "href", targetKey: "open" }],
          },
          { type: "boolean-state", key: "open" },
        ],
      }));

      expect(() =>
        validateBlockRegistry({ "undeclared-reference-path": definition }),
      ).toThrow(
        'Block "undeclared-reference-path" reference "href" at "root.children[0]" is not declared by component type "button".',
      );
    });

    it("should reject more than one symbolic relationship for the same source prop path", () => {
      const definition = createProposedDefinition(() => ({
        type: "container",
        children: [
          {
            type: "button",
            props: { stateAction: "toggle" },
            nodeReferences: [
              { path: "targetStateNodeId", targetKey: "first-state" },
              { path: "targetStateNodeId", targetKey: "second-state" },
            ],
          },
          { type: "boolean-state", key: "first-state" },
          { type: "boolean-state", key: "second-state" },
        ],
      }));

      expect(() =>
        validateBlockRegistry({ "duplicate-reference-path": definition }),
      ).toThrow(
        'Block "duplicate-reference-path" reference "targetStateNodeId" at "root.children[0]" is declared more than once.',
      );
    });

    it("should reject a visibility binding whose target is not a Boolean State", () => {
      const definition = createProposedDefinition(() => ({
        type: "container",
        children: [
          {
            type: "container",
            stateBinding: {
              stateKey: "panel",
              on: "show",
              off: "hide",
            },
          },
          { type: "container", key: "panel" },
        ],
      }));

      expect(() =>
        validateBlockRegistry({ "wrong-state-target": definition }),
      ).toThrow(
        'Block "wrong-state-target" state binding at "root.children[0]" targets key "panel" with type "container"; expected "boolean-state".',
      );
    });

    it("should reject any visibility binding authored on a Boolean State", () => {
      const definition = createProposedDefinition(() => ({
        type: "container",
        children: [
          {
            type: "boolean-state",
            key: "source-state",
            stateBinding: {
              stateKey: "controller-state",
              on: "show",
              off: "hide",
            },
          },
          { type: "boolean-state", key: "controller-state" },
        ],
      }));

      expect(() =>
        validateBlockRegistry({ "state-self-visibility": definition }),
      ).toThrow(
        'Block "state-self-visibility" Boolean State at "root.children[0]" cannot declare a visibility binding.',
      );
    });

    it("should reject a nonvisual Boolean State as a registered block root", () => {
      const definition = createProposedDefinition(() => ({
        type: "boolean-state",
      }));

      expect(() =>
        validateBlockRegistry({ "nonvisual-root": definition }),
      ).toThrow(
        'Block "nonvisual-root" root must be visual; received "boolean-state".',
      );
    });

    it("should apply final strict props validation after symbolic relationships pass", () => {
      const definition = createProposedDefinition(() => ({
        type: "container",
        children: [
          {
            type: "button",
            props: { href: "/details", stateAction: "toggle" },
            nodeReferences: [
              { path: "targetStateNodeId", targetKey: "open" },
            ],
          },
          { type: "boolean-state", key: "open" },
        ],
      }));

      expect(() =>
        validateBlockRegistry({ "strict-props": definition }),
      ).toThrow("strict-props.root.children[0] props are invalid");
    });
  });

  describe("block-library metadata", () => {
    it("should accept one valid registry-owned library metadata object", () => {
      const definition = createLibraryDefinition({
        label: "Test block",
        category: "Test",
        family: "interactive",
        icon: TestIcon,
        searchTerms: ["state", "toggle"],
      });

      expect(() =>
        validateBlockRegistry({ valid: definition }),
      ).not.toThrow();
    });

    it.each([
      [
        "an empty label",
        {
          label: " ",
          category: "Test",
          family: "interactive",
          icon: TestIcon,
        },
        "invalid-library.library.label must not be empty",
      ],
      [
        "an empty category",
        {
          label: "Test block",
          category: " ",
          family: "interactive",
          icon: TestIcon,
        },
        "invalid-library.library.category must not be empty",
      ],
      [
        "an unsupported family",
        {
          label: "Test block",
          category: "Test",
          family: "menus",
          icon: TestIcon,
        },
        "invalid-library.library.family is invalid: menus",
      ],
      [
        "a non-component icon",
        {
          label: "Test block",
          category: "Test",
          family: "interactive",
          icon: null,
        },
        "invalid-library.library.icon must be a component",
      ],
      [
        "an empty search term",
        {
          label: "Test block",
          category: "Test",
          family: "interactive",
          icon: TestIcon,
          searchTerms: ["state", " "],
        },
        "invalid-library.library.searchTerms[1] must not be empty",
      ],
    ])(
      "should reject %s with its registry metadata path",
      (_caseName, library, expectedMessage) => {
        const definition = createLibraryDefinition(library);

        expect(() =>
          validateBlockRegistry({ "invalid-library": definition }),
        ).toThrow(expectedMessage);
      },
    );
  });
});
