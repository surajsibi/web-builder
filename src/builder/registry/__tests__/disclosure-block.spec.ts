import { describe, expect, it } from "vitest";

import {
  blockRegistry,
  resolveBlockTemplate,
} from "@/builder/registry/block-registry";
import { validateBlockRegistry } from "@/builder/registry/define-block-registry";

function TestIcon() {
  return null;
}

describe("Disclosure block", () => {
  it("should expose one Interactive block through registry-owned discovery metadata", () => {
    const registry = blockRegistry as Readonly<
      Record<string, (typeof blockRegistry)[keyof typeof blockRegistry]>
    >;

    expect(registry.disclosure?.library).toEqual({
      label: "Disclosure",
      category: "Interactive",
      family: "interactive",
      icon: expect.any(Function),
      searchTerms: ["state", "toggle", "show hide", "disclosure", "details"],
    });
  });

  it("should resolve a collapsed Disclosure recipe with both symbolic Button references", () => {
    const template = resolveBlockTemplate(
      "disclosure" as keyof typeof blockRegistry,
    );

    expect(template).toMatchObject({
      nameHint: "Disclosure",
      type: "container",
      children: [
        {
          nameHint: "Show details",
          type: "button",
          props: {
            text: "Show details",
            href: "",
            behavior: "button",
            targetStateNodeId: "",
            stateAction: "toggle",
            stateAccessibility: "disclosure",
            disclosureContentNodeId: "",
          },
          nodeReferences: [
            { path: "targetStateNodeId", targetKey: "open" },
            { path: "disclosureContentNodeId", targetKey: "content" },
          ],
        },
        {
          key: "content",
          nameHint: "Disclosure content",
          type: "container",
          stateBinding: {
            stateKey: "open",
            on: "show",
            off: "hide",
          },
          children: [
            {
              nameHint: "Disclosure details",
              type: "text",
              props: {
                text: "Replace this text with your details.",
                semanticTag: "p",
              },
            },
          ],
        },
        {
          key: "open",
          nameHint: "Disclosure open",
          type: "boolean-state",
          props: { defaultValue: false },
        },
      ],
    });
  });

  it("should reject Disclosure configuration that omits a symbolic controlled-content reference", () => {
    expect(() =>
      validateBlockRegistry({
        broken: {
          library: {
            label: "Broken Disclosure",
            category: "Interactive",
            family: "interactive",
            icon: TestIcon,
          },
          createTemplate: () => ({
            type: "container",
            children: [
              {
                type: "button",
                props: {
                  stateAction: "toggle",
                  stateAccessibility: "disclosure",
                },
                nodeReferences: [
                  { path: "targetStateNodeId", targetKey: "open" },
                ],
              },
              {
                key: "open",
                type: "boolean-state",
              },
            ],
          }),
        },
      }),
    ).toThrow("broken.root.children[0] props are invalid");
  });
});
