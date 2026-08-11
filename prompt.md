# Phase 4 — Drag & Drop, Tree Navigation, and Editor Interaction Layer

Before implementation, review and comply with:

* Project.md
* Phase 1 Foundation Summary
* Phase 2 Architecture Validation Report
* Phase 3 Editor UI Validation Report

All frozen architecture remains authoritative.

Do not redesign, simplify, bypass, or replace any approved architecture.

The command system, hydration pipeline, registry architecture, responsive style system, rendering boundary, placement validation, locking semantics, and history model are frozen.

---

## Phase 4 Goal

Transform the current click-insertion editor into a real visual builder by implementing:

1. Drag-and-drop
2. Reordering
3. Reparenting
4. Layers panel
5. Breadcrumb navigation
6. Parent selection
7. Duplicate node
8. Delete node
9. Drop indicators
10. Keyboard editor actions

No publishing, backend, persistence, authentication, templates, blocks, deployment, or server features.

---

# Architecture Constraints

## Command Boundary

All document mutations must continue through:

dispatchEditorCommand(...)

No direct mutation of:

* nodes
* pages
* rootIds
* childIds
* parentById
* history
* selection

Drag-and-drop must eventually produce canonical commands.

---

## Placement Validation

Every drop operation must use:

canPlaceType(...)

and continue to respect:

* parent accepts child
* child allows parent
* cycle prevention
* lock rules
* page constraints

No drag operation may bypass validation.

---

## History

Each completed drag operation must create exactly one undoable transaction.

Dragging across the canvas must not create dozens of history entries.

One drag action = one history entry.

---

# Feature 1: Layers Panel

Create a tree view representing:

Page
└─ Section
└─ Container
└─ Card
└─ Text

Requirements:

* Recursive rendering
* Expand/collapse state
* Current selection highlight
* Click node to select
* Locked indicator
* Hidden indicator
* Component icon
* Component name

Selection from layers and canvas must remain synchronized.

---

# Feature 2: Breadcrumb Navigation

When a node is selected:

Section > Container > Card > Text

Requirements:

* Click ancestor to select ancestor
* Generated from parentById
* No document mutations

---

# Feature 3: Parent Selection

Implement:

Esc

Behavior:

First press:

Text
→ Card

Second press:

Card
→ Container

Third press:

Container
→ Section

Continue until root.

No history entry.

Selection only.

---

# Feature 4: Delete Node

Implement keyboard:

Delete
Backspace

Behavior:

dispatchEditorCommand(node.remove)

Must respect:

* lock rules
* subtree lock protection
* selection fallback behavior

No direct mutation.

---

# Feature 5: Duplicate Node

Implement:

Ctrl + D

Behavior:

dispatchEditorCommand(node.duplicate)

Requirements:

* Generate new IDs
* Duplicate subtree
* Preserve props
* Preserve styles
* Preserve lock state
* Preserve responsive styles

Must create one history entry.

---

# Feature 6: Drag and Drop

Implement drag-and-drop for:

* Canvas
* Layers panel

Supported actions:

* Reorder among siblings
* Move into containers
* Move out of containers
* Move between containers
* Move page-root nodes

Do not support multi-select dragging.

---

# Feature 7: Drop Indicators

Visual indicators only.

Examples:

Before node

────────────

Inside node

┌───────────┐
│ drop here │
└───────────┘

After node

────────────

Indicators must not modify layout.

Use overlays.

---

# Feature 8: Drag Validation

While dragging:

Show valid targets.

Reject:

* cycles
* locked destinations
* invalid parent-child combinations
* forbidden placement rules

Provide visual feedback.

---

# Feature 9: Editor Interaction Layer

Move selection visuals toward a dedicated overlay system.

Selection outlines, drag indicators, and interaction affordances should be external editor UI.

Avoid coupling editor visuals to semantic component styles.

This should prepare the editor for future preview and published modes.

---

# Feature 10: Tests

Add behavior-focused tests covering:

* Layers rendering
* Expand/collapse
* Breadcrumb generation
* Esc parent selection
* Delete
* Duplicate
* Reorder
* Reparent
* Drop validation
* Lock handling
* Undo after drag
* Redo after drag

Do not reduce existing coverage.

---

# Explicitly Out Of Scope

Do NOT implement:

* Publishing
* Backend APIs
* Database
* Authentication
* Templates
* Blocks
* Asset manager
* Media library
* AI generation
* Deployment
* Real persistence
* Preview mode
* Resize handles
* Multi-select

---

# Deliverables

1. Working drag-and-drop editor
2. Layers panel
3. Breadcrumb navigation
4. Keyboard actions
5. Drop indicators
6. Updated architecture notes
7. Phase 4 Drag-and-Drop Validation Report

Do not begin Phase 5 work.
Stop after Phase 4 is complete and produce the validation report.
