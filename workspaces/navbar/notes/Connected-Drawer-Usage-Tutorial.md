---
doc_id: WEB-BUILDER-CONNECTED-DRAWER-USAGE-TUTORIAL
type: L1
scope: Canvas Studio authors using Boolean State, Drawer Trigger, Drawer Panel, and Drawer Close V1 on feat/boolean-state-drawer
authority: Task-oriented draft derived from the verified component definitions, runtime behavior, and tests; code, tests, and Project.md remain authoritative for implemented behavior
owner: Unassigned; accountable project owner required before promotion from draft
lifecycle: draft
freshness: Verified against the feat/boolean-state-drawer implementation and authoring flow on 2026-08-13; invalidated by a Component Library, Inspector, insertion, Boolean State, Drawer, Editor, or Preview behavior change
---

# Tutorial: Build and use a connected Drawer

This tutorial teaches you how to build a working sidebar Drawer in Canvas Studio. When you finish, an **Open menu** button will open a modal sidebar, and a **Close menu** button inside the sidebar will close it.

> **Availability:** This tutorial describes the verified implementation on `feat/boolean-state-drawer`. The feature is still uncommitted at the time of writing.

## Understand the four components

You will use four components from the **Interactions** family:

| Component | Job |
| --- | --- |
| **Boolean State** | Stores whether the Drawer is open (`true`) or closed (`false`) at runtime |
| **Drawer Panel** | Displays the sidebar when its Boolean State is on |
| **Drawer Trigger** | Opens a selected Drawer Panel |
| **Drawer Close** | Closes the Drawer Panel that contains it |

The finished connection looks like this:

```text
Open menu (Drawer Trigger)
        |
        v
Sidebar panel (Drawer Panel) ----> Sidebar open (Boolean State)
        |
        `---- contains Close menu (Drawer Close)
```

Text equivalent: the Trigger references the Panel, the Panel references the Boolean State, and the Close control is a child of the Panel.

## Build the Drawer

### 1. Add the Boolean State

1. Open **Components**.
2. Select the **Interactions** family.
3. Add **Boolean State** to the page root.
4. In the Inspector, rename it to **Sidebar open**.
5. Open **Content** and leave **Default value** unchecked.

The state is intentionally invisible on the Canvas. With **Default value** unchecked, the Drawer starts closed whenever the page loads.

### 2. Add the Drawer Trigger

1. Add **Drawer Trigger** to the page root.
2. Rename it to **Open sidebar**.
3. Set its text or label to **Open menu**.
4. Leave **Drawer Panel** unselected for the moment.
5. Leave **Disabled** unchecked.

The button may appear unavailable until you connect it to a valid Panel in step 5. That is expected.

### 3. Add and configure the Drawer Panel

1. Add **Drawer Panel** after the Trigger at the page root.
2. Rename it to **Sidebar panel**.
3. In the Inspector, set these fields:

| Inspector field | Suggested value | Meaning |
| --- | --- | --- |
| **Boolean State** | `Sidebar open` | The state that decides whether the Panel exists |
| **Side** | `Left` | The viewport edge where the Panel appears |
| **Panel size (px)** | `320` | Panel width for left/right Drawers, or height for top/bottom Drawers |
| **Accessible label** | `Site navigation` | The name announced for the modal dialog |
| **Layer z-index** | `1000` | Places the Drawer above ordinary authored content |

You can also use the normal **Spacing**, **Background**, **Border**, and **Typography** controls to style the Panel.

The Panel remains closed because **Sidebar open** is still false.

### 4. Put the Close control and content inside the Panel

1. Open **Layers**.
2. Select **Sidebar panel**.
3. Return to **Components** and add **Drawer Close** while the Panel is the selected insertion container.
4. Rename the new control to **Close sidebar**.
5. Set its text or label to **Close menu**.
6. Select **Sidebar panel** again before adding headings, text, links, images, containers, or other content that should live inside it.

The layer structure should resemble:

```text
Page
├── Sidebar open
├── Open sidebar
└── Sidebar panel
    ├── Close sidebar
    └── Your other Drawer content
```

If the Inspector says **Place this Drawer Close inside a Drawer Panel**, the Close control was inserted at the wrong level. Move it into **Sidebar panel**, or delete it and add it again while **Sidebar panel** is selected.

### 5. Connect the Trigger to the Panel

1. Open **Layers**.
2. Select **Open sidebar**.
3. In the Inspector, find **Drawer Panel**.
4. Select **Sidebar panel**.

The complete reference chain is now:

```text
Open sidebar -> Sidebar panel -> Sidebar open
```

The Trigger should now be available.

## Test it in the Editor

1. Click **Open menu** directly on the Canvas.
2. Confirm that **Sidebar panel** opens inside the Canvas artboard.
3. Confirm that Layers and the Inspector remain usable.
4. Click **Close menu** inside the Panel.
5. Open it again and select or edit its child components.

Opening and closing changes only the runtime Boolean value. It does not change the saved **Default value** or create an authored page edit.

## Test it in Preview

1. Open **Preview**.
2. Confirm that the Drawer is initially absent when **Default value** is unchecked.
3. Activate **Open menu** with a pointer, `Enter`, or `Space`.
4. Confirm that focus moves into the Drawer, normally to **Close menu**.
5. Press `Tab` and `Shift+Tab` and confirm that focus remains inside the Drawer.
6. Close the Drawer using **Close menu**, `Escape`, or the backdrop.
7. Confirm that focus returns to **Open menu**.
8. Reload Preview and confirm that the Drawer returns to its authored default state.

Preview also locks background page scrolling and prevents background content from receiving keyboard or assistive-technology interaction while the Drawer is open.

## Customize the Drawer

### Change its placement

Use the Panel's **Side** field:

- **Left** or **Right** creates a vertical sidebar, and **Panel size (px)** controls its width.
- **Top** or **Bottom** creates a sheet, and **Panel size (px)** controls its height.

The Panel is clamped to the available viewport, so a large authored size will not make it extend beyond the viewport on a smaller screen.

### Place it above other content

Increase **Layer z-index** on **Drawer Panel**. This value belongs to the portalled Drawer layer and is the correct control for placing the sidebar above authored headers, cards, or other positioned elements.

### Start with it open

Select **Sidebar open** and check **Default value**. Preview will begin with the Drawer open.

Use this only when an initially open modal is intentional. Because no Trigger opened it, there is no Trigger to restore focus to when it closes.

### Use more than one opener

You may add multiple **Drawer Trigger** components and point all of them to **Sidebar panel**. Focus returns to whichever Trigger opened the Drawer most recently.

### Control it with generic state actions

A normal **State Action** can also target **Sidebar open**:

- **Turn On** opens the Drawer.
- **Turn Off** closes it.
- **Toggle** switches between open and closed.

This works because Boolean State—not the Drawer—is the source of the open/closed value. The same state can also control **Conditional Content** elsewhere on the page.

## Important V1 behavior

- Closing removes the Panel and its descendants from the rendered page immediately.
- Reopening creates a fresh instance. Unsaved input or local component state inside the Drawer resets.
- Authored enter and exit animations are not available in V1.
- A normal Link inside the Panel does not automatically close the Drawer. Use a **Drawer Close** control when dismissal is required.
- References are page-scoped. A Trigger or Panel cannot connect to a node on another page.
- **Drawer Close** must be inside a **Drawer Panel**.

## Troubleshooting

| Problem | What to check |
| --- | --- |
| **Open menu** is unavailable | Select the Trigger and choose a valid **Drawer Panel** |
| The Trigger is connected but nothing opens | Select the Panel and choose a valid **Boolean State** |
| **Close menu** does nothing | Confirm that Drawer Close is a descendant of the open Drawer Panel |
| The Drawer starts open unexpectedly | Uncheck the Boolean State's **Default value** |
| The Drawer appears behind authored content | Increase the Panel's **Layer z-index** |
| Content disappears after closing | This is V1's immediate unmount behavior; reopening creates a fresh instance |
| A Link navigates but leaves the state on | V1 does not automatically close on arbitrary Link activation |
| You expected a dropdown rather than a modal | Use **Conditional Content** inside a relative parent with absolute positioning and an authored z-index; Drawer adds modal behavior that dropdowns normally do not need |

## Final checklist

- [ ] Boolean State is named and has the intended **Default value**.
- [ ] Drawer Panel references that Boolean State.
- [ ] Drawer Trigger references that Drawer Panel.
- [ ] Drawer Close is inside that Drawer Panel.
- [ ] The Panel has a meaningful **Accessible label**.
- [ ] The chosen **Side**, **Panel size (px)**, and **Layer z-index** work on desktop and mobile.
- [ ] Pointer, `Enter`, `Space`, `Tab`, `Shift+Tab`, `Escape`, backdrop close, and focus return work in Preview.
- [ ] You are comfortable with immediate close and fresh content on reopen.

## Verified sources

- [Drawer component definitions and Inspector fields](../../../src/builder/registry/components/drawer-definitions.tsx)
- [Drawer runtime and modal lifecycle](../../../src/builder/interaction/drawer-runtime.tsx)
- [Drawer runtime behavior tests](../../../src/builder/interaction/__tests__/drawer-runtime.spec.tsx)
- [Editor authoring integration tests](../../../src/builder/ui/__tests__/editor-shell.spec.tsx)
- [Connected Drawer V1 implementation report](../reports/Connected-Drawer-V1-Implementation-Report.md)
- [Connected Drawer V1 architecture and execution plan](../plan/Connected-Drawer-Components-Plan.md)
