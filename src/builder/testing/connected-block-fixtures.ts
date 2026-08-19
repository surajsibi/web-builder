import {
  resolveComponentTemplate,
  type ComponentTemplate,
} from "@/builder/registry/define-block-registry";

export type ConnectedBlockTemplateOptions = {
  rootNameHint?: string;
  triggerNameHint?: string;
  panelNameHint?: string;
  stateNameHint?: string;
};

export function createConnectedBlockTemplate(
  options?: ConnectedBlockTemplateOptions,
) {
  const template: ComponentTemplate = {
    key: "local-root",
    nameHint: options?.rootNameHint ?? "Disclosure",
    type: "container",
    children: [
      {
        key: "local-trigger",
        nameHint: options?.triggerNameHint ?? "Disclosure trigger",
        type: "button",
        props: {
          text: "Details",
          stateAction: "toggle",
        },
        nodeReferences: [
          { path: "targetStateNodeId", targetKey: "local-state" },
        ],
      },
      {
        key: "local-panel",
        nameHint: options?.panelNameHint ?? "Disclosure panel",
        type: "container",
        stateBinding: {
          stateKey: "local-state",
          on: "show",
          off: "hide",
        },
      },
      {
        key: "local-state",
        nameHint: options?.stateNameHint ?? "Disclosure state",
        type: "boolean-state",
      },
    ],
  };

  return resolveComponentTemplate(template, "navbar.root", "navbar");
}
