---
doc_id: WEB-BUILDER-BOOLEAN-STATE-CONNECTIONS-TUTORIAL
type: L1
scope: Canvas Studio authors connecting ordinary components and Buttons to page-scoped Boolean State
authority: Task-oriented guide derived from the verified Inspector, runtime, command, migration, and rendering behavior; code, tests, and Project.md remain authoritative
owner: Unassigned; accountable project owner required before promotion from draft
lifecycle: draft
freshness: Verified against the local feat/boolean-state-drawer implementation on 2026-08-14; invalidated by a Boolean State, State tab, Button action, rendering, migration, or Component Library behavior change
---

# Tutorial: Connect components with Boolean State

Boolean State is a page-level On/Off value. You create your normal components first, then connect any of them to that value from the Inspector. A normal Button can turn the value On, turn it Off, or toggle it.

The basic connection is:

```text
Normal Button -- Toggle --> Menu open (Boolean State)
                               |            |
                               v            v
                         Menu container   Backdrop
                         On: Show        On: Show
                         Off: Hide       Off: Hide
```

One state may control any number of components. Each connected component chooses its own behavior for On and Off.

## Build a working example

### 1. Create the component you want to control

1. Add an ordinary component such as a **Container**.
2. Put the menu, popup, text, image, or other content inside it as usual.
3. Select that component and open the Inspector's **State** tab.

The component does not need a special-purpose interaction type.

### 2. Create and connect the Boolean State

In **State > Visibility connection**:

1. Enter a clear name such as **Menu open**.
2. Leave **Start On** unchecked when the component should begin hidden.
3. Select **Create state & connect**.

This is one undoable operation: Canvas Studio creates the nonvisual Boolean State and connects the selected component together.

The default visibility mapping is:

| State value | Component behavior |
| --- | --- |
| **On** | **Show** |
| **Off** | **Hide** |

The state is nonvisual, so it appears in **Layers** but does not add a box to the Canvas or Preview.

### 3. Add a normal trigger Button

1. Click empty Canvas space so the controlled component is no longer the insertion parent.
2. Add an ordinary **Button** outside the component that can become hidden.
3. Select the Button and open its **State** tab.
4. Under **Button state action**, set **On click** to **Toggle**.
5. Set **Action Boolean State** to **Menu open**.

Keeping the trigger outside the hidden component ensures the Button remains available when the state is Off.

### 4. Test the result

Activate the Button on the Canvas or in Preview:

- the first activation changes **Menu open** from Off to On and shows the component;
- the next activation changes it back to Off and hides the component;
- the live On/Off value changes only at runtime and does not create an authored edit or undo entry; and
- reloading the render session starts again from the Boolean State's authored default.

## Use separate open and close Buttons

Instead of Toggle, configure two ordinary Buttons:

| Button | On click | Action Boolean State |
| --- | --- | --- |
| **Open menu** | **Turn On** | **Menu open** |
| **Close menu** | **Turn Off** | **Menu open** |

Place **Open menu** outside the hidden component. A **Close menu** Button may live inside the component because it is needed only while that component is shown.

## Connect multiple components to one state

For every additional component:

1. Select it.
2. Open **State**.
3. Choose **Menu open** from **Visibility connection > Boolean State**.
4. Choose its **When On** and **When Off** behavior.

Examples include showing a menu and backdrop together, hiding page content while a notice is active, or switching between two authored components.

To switch between two components, use opposite mappings:

| Component | When On | When Off |
| --- | --- | --- |
| Signed-in content | Show | Hide |
| Signed-out content | Hide | Show |

## Disconnect or repair a connection

- To disconnect a component, choose **Not connected** under **Visibility connection**.
- To stop a Button action, choose **No state action** under **Button state action**.
- If a referenced state was deleted, the State tab reports it as unavailable. Choose another state or disconnect the component.
- Connections are page-scoped; a component cannot target a state on another page.

## Current boundary and future growth

The current version implements shared Boolean State, ordinary Button actions, and Show/Hide presence.

The same state connection can support later features without another state system:

- conditional background, color, opacity, or other style changes;
- component variants;
- enter and exit animations; and
- specialized accessible patterns when a popup needs focus management, Escape handling, or modal behavior.

Those behaviors are intentionally not hidden inside the current visibility setting. Each needs explicit controls and lifecycle rules before it ships.

## Final checklist

- [ ] The controlled component uses a clearly named Boolean State.
- [ ] **When On** and **When Off** match the intended visibility.
- [ ] The trigger is an ordinary Button with Turn On, Turn Off, or Toggle.
- [ ] A trigger needed while content is hidden sits outside that hidden content.
- [ ] Every additional connected component has the intended mapping.
- [ ] The interaction works with pointer and keyboard activation in Editor and Preview.

## Verified sources

- [Shared state-binding model](../../../src/builder/model/state-binding.ts)
- [Boolean State and ordinary Button definitions](../../../src/builder/registry/components/component-definitions.tsx)
- [State Inspector workflow](../../../src/builder/ui/inspector-panel.tsx)
- [Visibility rendering behavior](../../../src/builder/rendering/node-rendering-controller.tsx)
- [Legacy project migration](../../../src/builder/project/migrations.ts)
- [End-to-end Editor behavior tests](../../../src/builder/ui/__tests__/editor-shell.spec.tsx)
