import {
  defineComponentRegistry,
  type ComponentEditorMetadata,
  type ComponentNodeReferenceMetadata,
} from "./define-component-registry";
import {
  booleanStateDefinition,
  buttonDefinition,
  cardDefinition,
  checkboxGroupDefinition,
  checkboxDefinition,
  containerDefinition,
  conditionalContentDefinition,
  dropdownDefinition,
  formDefinition,
  headingDefinition,
  imageDefinition,
  inputDefinition,
  labelDefinition,
  linkDefinition,
  radioGroupDefinition,
  sectionDefinition,
  stateActionDefinition,
  textDefinition,
  textareaDefinition,
} from "./components/component-definitions";
import {
  drawerCloseDefinition,
  drawerPanelDefinition,
  drawerTriggerDefinition,
} from "./components/drawer-definitions";

export const componentRegistry = defineComponentRegistry({
  section: sectionDefinition,
  container: containerDefinition,
  "boolean-state": booleanStateDefinition,
  "state-action": stateActionDefinition,
  "conditional-content": conditionalContentDefinition,
  "drawer-trigger": drawerTriggerDefinition,
  "drawer-panel": drawerPanelDefinition,
  "drawer-close": drawerCloseDefinition,
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

export function componentUsesDirectInteraction(type: ComponentType): boolean {
  const definition = componentRegistry[type] as {
    editor?: ComponentEditorMetadata;
  };

  return definition.editor?.directInteraction === true;
}

export function requiredAncestorTypeForComponent(
  type: ComponentType,
): ComponentType | null {
  const definition = componentRegistry[type] as {
    editor?: ComponentEditorMetadata<ComponentType>;
  };

  return definition.editor?.requiredAncestorType ?? null;
}

export function referencesForComponentType(
  type: ComponentType,
): readonly ComponentNodeReferenceMetadata<string, ComponentType>[] {
  const definition = componentRegistry[type] as {
    references?: readonly ComponentNodeReferenceMetadata<
      string,
      ComponentType
    >[];
  };

  return definition.references ?? [];
}

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
