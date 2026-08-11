import { defineComponentRegistry } from "./define-component-registry";
import {
  buttonDefinition,
  cardDefinition,
  checkboxGroupDefinition,
  checkboxDefinition,
  containerDefinition,
  dropdownDefinition,
  formDefinition,
  headingDefinition,
  imageDefinition,
  inputDefinition,
  labelDefinition,
  linkDefinition,
  radioGroupDefinition,
  sectionDefinition,
  textDefinition,
  textareaDefinition,
} from "./components/component-definitions";

export const componentRegistry = defineComponentRegistry({
  section: sectionDefinition,
  container: containerDefinition,
  heading: headingDefinition,
  text: textDefinition,
  label: labelDefinition,
  card: cardDefinition,
  image: imageDefinition,
  link: linkDefinition,
  button: buttonDefinition,
  form: formDefinition,
  input: inputDefinition,
  textarea: textareaDefinition,
  dropdown: dropdownDefinition,
  "radio-group": radioGroupDefinition,
  checkbox: checkboxDefinition,
  "checkbox-group": checkboxGroupDefinition,
});

export type ComponentType = keyof typeof componentRegistry;

type PlacementDefinition = {
  allowedParents?: readonly ComponentType[];
  children:
    | { allowed: false }
    | {
        allowed: true;
        accepts: "any" | readonly ComponentType[];
      };
};

function includesComponentType(
  candidates: readonly string[],
  candidate: ComponentType,
): boolean {
  return candidates.includes(candidate);
}

export function canPlaceType(
  parentType: ComponentType | null,
  childType: ComponentType,
): boolean {
  const child = componentRegistry[childType] as PlacementDefinition;
  const { allowedParents } = child;

  if (parentType === null) {
    return allowedParents === undefined;
  }

  const parent = componentRegistry[parentType] as PlacementDefinition;

  if (!parent.children.allowed) {
    return false;
  }

  const parentAllowsChild =
    parent.children.accepts === "any" ||
    includesComponentType(parent.children.accepts, childType);
  const childAllowsParent =
    allowedParents === undefined ||
    includesComponentType(allowedParents, parentType);

  return parentAllowsChild && childAllowsParent;
}
