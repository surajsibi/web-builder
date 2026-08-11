import {
  defineBlockRegistry,
  resolveComponentTemplate,
} from "./define-block-registry";
import {
  buttonArrowShiftBlockDefinition,
  buttonGlassBlockDefinition,
  buttonGlowBlockDefinition,
  buttonGradientBlockDefinition,
  buttonOutlineBlockDefinition,
  buttonRaised3dBlockDefinition,
  buttonSoftPillBlockDefinition,
} from "./blocks/button-preset-blocks";
import { passwordRevealInputBlockDefinition } from "./blocks/input-preset-blocks";
import { commerceNavbarBlockDefinition } from "./blocks/commerce-navbar-block";
import { navbarBlockDefinition } from "./blocks/navbar-block";

export const blockRegistry = defineBlockRegistry({
  navbar: navbarBlockDefinition,
  "commerce-navbar": commerceNavbarBlockDefinition,
  "button-outline": buttonOutlineBlockDefinition,
  "button-soft-pill": buttonSoftPillBlockDefinition,
  "button-arrow-shift": buttonArrowShiftBlockDefinition,
  "button-raised-3d": buttonRaised3dBlockDefinition,
  "button-gradient": buttonGradientBlockDefinition,
  "button-glass": buttonGlassBlockDefinition,
  "button-glow": buttonGlowBlockDefinition,
  "input-password-reveal": passwordRevealInputBlockDefinition,
});

export type BlockType = keyof typeof blockRegistry;

export function resolveBlockTemplate(blockType: BlockType) {
  const definition = blockRegistry[blockType];
  return resolveComponentTemplate(
    definition.createTemplate(),
    `${blockType}.root`,
  );
}
