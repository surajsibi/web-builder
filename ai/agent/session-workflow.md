## Session Workflow

Before applying repository-scoped workflow steps, identify every project Git repository affected by the task. These are the participating repositories. Determine the set from the user's request and active workspace metadata, excluding `archive/`. If the set cannot be determined uniquely, ask the user before modifying any repository.

Run working-tree protection, branch verification, HEAD recording, and synchronization separately for every participating repository. Record and report the result for each repository; never infer the state of one repository from another. Steps 1-3 below are repository-scoped. Step 4 considers synchronized changes across all participating repositories.

1. **Protect the working tree**
   Before creating, switching, rebasing, merging, committing, or pushing:
   - Run `git status --short`.
   - If the working tree is not clean:
     - Show the modified, staged, and untracked files to the user.
     - Explain that continuing may mix unrelated work into the current task.
     - Ask the user how to proceed before creating, switching, rebasing, merging, or committing on any branch.

   - Never automatically:
     - discard user changes
     - overwrite existing modifications
     - reset files
     - stash changes
     - clean untracked files
     - resolve conflicts by deleting user work

   - Preserve all existing user changes unless the user explicitly instructs otherwise.
   - Never modify, revert, or delete unrelated files that are outside the current task.

2. **Verify the Git branch**
   - Run `git rev-parse --abbrev-ref HEAD`.
   - If the active branch is `dev`, do not stage, commit, or push changes to any project Git repository.
   - Before creating, switching, merging into, or rebasing a branch, ask the user for approval.
   - Once the branch has been created or switched, explicitly inform the user which branch is now active before proceeding.

3. **Synchronize the project**
   - Synchronization is required only when implementation depends on the latest upstream state.
   - Read-only work (inspection, review, analysis, debugging, documentation, planning) does not require synchronization.
   - Before synchronizing, record the current HEAD commit hash so the original repository state can always be identified.
   - When synchronizing the `dev` branch:
     - Fetch the latest remote changes.
     - Update `dev` using a fast-forward-only update. If a fast-forward is not possible, stop and report the situation rather than creating a merge commit.

   - When working on a feature branch:
     - Determine whether synchronization with `dev` is necessary.
     - Explain the available synchronization strategy (merge or rebase) according to the project's workflow.
     - Obtain user approval before performing any merge or rebase.

   - If synchronization produces merge or rebase conflicts:
     - Stop immediately.
     - Report the conflicting files.
     - Do not automatically resolve merge or rebase conflicts.
     - Wait for user direction before continuing.

4. **Update ai/context.md after synchronizing `dev` (when synchronization occurs)**
   - If `dev` was synchronized during this session, identify the work introduced by the synchronization using the project's Git history (commits) and associated pull request descriptions.
   - Use the commit history and pull request descriptions to identify areas that may contain new long-lived project knowledge, then verify those changes against the current codebase before updating `ai/context.md`.
   - Update only the affected sections of `ai/context.md`; do not rewrite unrelated sections.
   - Do not document temporary implementation details, branch-specific decisions, bug fixes, refactoring, styling changes, or other short-lived implementation changes.
   - Treat `ai/context.md` as a curated description of the current stable `dev` branch rather than a changelog or commit history. The merged implementation is always the source of truth; pull request descriptions and commit messages provide guidance and context.

5. **Create a plan**
   - Analyze the user's request.
   - Identify the affected files, components, systems, and dependencies.
   - Identify any risks or assumptions.
   - Determine whether sub-agents are needed.
   - If the request indicates a major architectural or workspace change, recommend a Context Rebuild before proceeding with implementation.

## Context Rebuild

A Context Rebuild is an exceptional maintenance operation rather than part of the normal session workflow.

Recommend or perform one only when:

- Workspace or repository restructuring
- Major architectural redesigns
- Large framework or technology migrations
- Extensive refactoring that changes project organization
- Any other change where maintaining the existing context becomes less reliable than rebuilding it

During a Context Rebuild:

1. Treat the verified implementation of the current stable `dev` branch as the source of truth.
2. Re-analyze the current project structure, architecture, documentation, and implementation.
3. Verify every existing section before preserving it.
4. Rewrite only verified project knowledge in `ai/context.md`.
5. Rewrite `ai/learned-rules.md` only with verified, reusable lessons that remain applicable after the rebuild.
6. Do not copy feature-specific information from the feature workspace, repository-specific information from `overlay.md`, or execution state from `journal.md`.
7. Preserve existing content only after it has been re-validated.
8. Once the rebuild is complete, resume the normal workflow using [Context Loading](context-loading.md).

The user may explicitly request a Context Rebuild at any time.
