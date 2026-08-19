import type {
  BlockDefinition,
  ComponentTemplate,
} from "@/builder/registry/define-block-registry";
import { DisclosureBlockIcon } from "@/builder/registry/blocks/block-icons";
import { px, spacing } from "@/builder/registry/components/style-defaults";

export const disclosureBlockDefinition: BlockDefinition = {
  library: {
    label: "Disclosure",
    category: "Interactive",
    family: "interactive",
    icon: DisclosureBlockIcon,
    searchTerms: ["state", "toggle", "show hide", "disclosure", "details"],
  },
  createTemplate: (): ComponentTemplate => ({
    nameHint: "Disclosure",
    type: "container",
    styles: {
      base: {
        display: "flex",
        maxWidth: px(720),
        padding: spacing(28, 28, 28, 28),
        backgroundColor: "#f8fafc",
        borderWidth: { value: 1, unit: "px" },
        borderStyle: "solid",
        borderColor: "#dbe4ee",
        borderRadius: px(16),
        flex: {
          direction: "column",
          wrap: "nowrap",
          justifyContent: "flex-start",
          alignItems: "stretch",
          gap: px(16),
        },
      },
      mobile: {
        padding: spacing(20, 20, 20, 20),
      },
    },
    children: [
      {
        nameHint: "Show details",
        type: "button",
        props: {
          text: "Show details",
          stateAction: "toggle",
          stateAccessibility: "disclosure",
        },
        styles: {
          base: {
            backgroundColor: "#17201f",
            color: "#ffffff",
            borderRadius: px(10),
          },
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
        styles: {
          base: {
            padding: spacing(20, 20, 20, 20),
            backgroundColor: "#ffffff",
            borderWidth: { value: 1, unit: "px" },
            borderStyle: "solid",
            borderColor: "#dbe4ee",
            borderRadius: px(12),
          },
        },
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
  }),
};
