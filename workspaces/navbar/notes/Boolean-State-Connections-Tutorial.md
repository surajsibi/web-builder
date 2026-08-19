---
doc_id: WEB-BUILDER-BOOLEAN-STATE-CONNECTIONS-TUTORIAL
type: L1
scope: Canvas Studio authors inserting the Disclosure block or connecting ordinary components and Buttons to page-scoped Boolean State
authority: Task-oriented guide derived from the verified Inspector, runtime, command, migration, and rendering behavior; code, tests, and Project.md remain authoritative
owner: Suraj
lifecycle: draft
freshness: Updated against the feat/connected-state-blocks working tree and Chrome 151.0.7922.138 evidence on 2026-08-18; invalidated by a Boolean State, connected block, Disclosure, State tab, Button action, duplication, rendering, migration, or Component Library behavior change
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

## Insert the ready-made Disclosure

Use the Disclosure block when you need one Button that reveals and hides one content region:

1. Open **Blocks** or **Interactive** in the Component Library.
2. Insert or drag **Disclosure** onto the page.
3. In Layers, expand the new **Disclosure** root. It owns **Show details**, **Disclosure content**, **Disclosure details**, and the nonvisual **Disclosure open** Boolean State.
4. Edit the Button label and content as ordinary components.
5. Open Preview and activate the Button with pointer, Enter, or Space. It starts collapsed, retains Button focus, and reports its current expanded state while the complete relationship remains valid.

The block is not a persisted special component. One atomic insertion creates five ordinary nodes with fresh IDs. The template's private connection keys disappear during insertion; the saved Button and visibility binding contain only the new page-local node IDs.

### Duplicate or delete the complete interaction

Duplicate the **Disclosure** root when you want an independent copy. The copied Button and content binding are remapped to the copied Boolean State, so two complete Disclosures do not share runtime state. Deleting the root also deletes its nested state.

Duplicating only the Button or only the controlled content follows the ordinary external-reference rule and keeps its existing targets. Use whole-root duplication unless sharing those targets is intentional.

### Repair a broken Disclosure relationship

Disclosure semantics require all of these conditions together:

- an unlinked, non-submit Button configured to Toggle its Boolean State;
- a controlled Container targeting that same state with On -> Show and Off -> Hide;
- the Button, Container, and Boolean State under the same Disclosure root; and
- effective content visibility that agrees with the live state at the current viewport.

Moving, deleting, reconnecting, inverting, or independently hiding one part can break that relationship. The Inspector preserves recoverable configuration, shows the reason, and offers explicit reconnection, shared-parent restoration, viewport reveal, or configuration clearing. Until repaired, rendering omits `aria-expanded` instead of exposing a potentially false state.

### Disclosure is not Accordion

Disclosure provides one Button and one controlled content region. It does not create an Accordion group, heading structure, exclusive-open behavior, arrow-key navigation, or stable `aria-controls` association. Build and verify those contracts separately before describing a group of Disclosures as an Accordion.

## Build a working example

### 1. Create the component you want to control

1. Add an ordinary component such as a **Container**.
2. Put the menu, popup, text, image, or other content inside it as usual.
3. Select that component and open the Inspector's **State** tab.

The component does not need a special-purpose interaction type.

### 2. Create and connect the Boolean State

In the **State** tab:

1. Expand **Component visibility**, which starts collapsed as **Always visible**.
2. Enter a clear name such as **Menu open**.
3. Leave **Start visible** unchecked so the Boolean State begins Off.
4. Select **Create state & connect**.
5. For this menu example, change **When Off** from **Show** to **Hide**.

This is one undoable operation: Canvas Studio creates the nonvisual Boolean State and connects the selected component together.

Every new connection initially keeps the component visible while the author chooses its behavior:

| State value | Component behavior |
| --- | --- |
| **On** | **Show** |
| **Off** | **Show** |

The menu example changes **When Off** to **Hide**, producing the On → Show and Off → Hide behavior in the diagram above.

The state is nonvisual, so it appears in **Layers** but does not add a box to the Canvas or Preview.

### 3. Add a normal trigger Button

1. Click empty Canvas space so the controlled component is no longer the insertion parent.
2. Add an ordinary **Button** outside the component that can become hidden.
3. Select the Button and open its **State** tab.
4. Under **Button action**, set **On click** to **Toggle**.
5. Set **Action Boolean State** to **Menu open**.

The separate **Button visibility** section remains collapsed as **Always visible**. Do not connect it for a normal Toggle button. Expand it only when the Button itself should show or hide based on state. Keeping the trigger outside the hidden component ensures the Button remains available when the state is Off.

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
3. Expand **Component visibility**.
4. Choose **Menu open** from **Boolean State**.
5. Choose its **When On** and **When Off** behavior.

Examples include showing a menu and backdrop together, hiding page content while a notice is active, or switching between two authored components.

To switch between two components, use opposite mappings:

| Component | When On | When Off |
| --- | --- | --- |
| Signed-in content | Show | Hide |
| Signed-out content | Hide | Show |

## Disconnect or repair a connection

- To disconnect a component, expand **Component visibility** and choose **Not connected**.
- To stop a Button action, choose **No state action** under **Button action**.
- If a referenced state is missing or points to a node that is not a Boolean State, the State tab reports it as unavailable. Choose or create a replacement, disconnect the component, or clear the Button action.
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
- [ ] **Start visible** is unchecked unless the Boolean State itself should begin On.
- [ ] **When On** and **When Off** match the intended visibility.
- [ ] The trigger is an ordinary Button with Turn On, Turn Off, or Toggle.
- [ ] A trigger needed while content is hidden sits outside that hidden content.
- [ ] Every additional connected component has the intended mapping.
- [ ] The interaction works with pointer and keyboard activation in Editor and Preview.

## Verified sources

- [Shared state-binding model](../../../src/builder/model/state-binding.ts)
- [Boolean State and ordinary Button definitions](../../../src/builder/registry/components/component-definitions.tsx)
- [Connected block contract](../../../src/builder/registry/define-block-registry.ts)
- [Disclosure block template](../../../src/builder/registry/blocks/disclosure-block.ts)
- [Disclosure effective semantics](../../../src/builder/interaction/disclosure-semantics.ts)
- [State Inspector workflow](../../../src/builder/ui/inspector-panel.tsx)
- [Visibility rendering behavior](../../../src/builder/rendering/node-rendering-controller.tsx)
- [Legacy project migration](../../../src/builder/project/migrations.ts)
- [End-to-end Editor behavior tests](../../../src/builder/ui/__tests__/editor-shell.spec.tsx)
