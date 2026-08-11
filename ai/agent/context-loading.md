## Context Loading

Before planning or implementation, load project context using the sequence below. For the contents and responsibilities of individual context files, see [Context Responsibilities](feature-branch-workspaces.md#context-responsibilities).

- If continuing work on a logical feature, bug, enhancement, investigation, or task, resolve its canonical feature workspace using [Workspace Discovery](feature-branch-workspaces.md#workspace-discovery), then load:
  1. `workspaces/<feature>/workspace.md`.
  2. Additional documents under `workspaces/<feature>/` as needed.

- For each participating repository whose current branch is **not** `dev`, resolve its branch workspace using [Workspace Discovery](feature-branch-workspaces.md#workspace-discovery), then load:
  1. `branches/<repository>/<normalized-branch>/overlay.md`.
  2. `branches/<repository>/<normalized-branch>/journal.md`.

- Resolve branch workspace directory names using the collision-safe normalization procedure under [Repository Branch Workspace](feature-branch-workspaces.md#repository-branch-workspace).

Always load context in the following order:

1. `ai/context.md`
2. `ai/learned-rules.md`
3. `workspaces/<feature>/workspace.md` (if applicable)
4. Additional feature workspace documents as needed
5. `branches/<repository>/<normalized-branch>/overlay.md` for each applicable repository
6. `branches/<repository>/<normalized-branch>/journal.md` for each applicable repository

Loading order determines when context is read, not which information is authoritative. Use [Context Authority](core-context-rules.md#context-authority) to resolve conflicts.
