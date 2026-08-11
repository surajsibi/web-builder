import type {
  BlockDefinition,
  ComponentTemplate,
} from "@/builder/registry/define-block-registry";
import { InputIcon } from "@/builder/registry/components/component-icons";

export const INPUT_PRESET_CATALOG = [
  {
    blockType: "input-password-reveal",
  },
] as const satisfies readonly { blockType: string }[];

export const passwordRevealInputBlockDefinition: BlockDefinition = {
  label: "Password reveal",
  category: "Input presets",
  icon: InputIcon,
  createTemplate: (): ComponentTemplate => ({
    type: "input",
    props: {
      label: "Password",
      controlId: "",
      name: "password",
      inputType: "password",
      allowPasswordReveal: true,
      placeholder: "Enter password",
      defaultValue: "",
      required: false,
      disabled: false,
    },
  }),
};
