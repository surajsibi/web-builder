## Feature and Repository Context

Project context is organized into stable, feature, and repository branch layers.

### Context Layers

The files in each layer have distinct responsibilities defined under [Context Responsibilities](#context-responsibilities).

- Feature work must never update `ai/context.md` directly. Record feature-level knowledge in the feature workspace, repository-specific differences in `overlay.md`, and repository execution state in `journal.md` until the work becomes part of the stable `dev` branch.

### Feature Workspace

Every active logical feature, bug, enhancement, investigation, or task has its own workspace under `workspaces/<feature>/`.

Each feature workspace follows this structure:

```
workspaces/<feature>/
├── workspace.md    # Feature overview, status, repositories, branches, and milestone
├── plan/           # PRDs, specifications, and execution plans
├── research/       # Investigation notes, findings, references, and supporting evidence
├── review/         # Design, architecture, security, and code reviews
├── reports/        # Implementation and verification reports
├── assets/         # Screenshots, diagrams, HAR files, logs, recordings, etc.
└── notes/          # Scratch notes, investigations, blockers, and miscellaneous work
```

The feature workspace is the primary location for all feature-level knowledge and may span one or many repositories.

`<feature>` is a stable, unique directory identifier recorded in `workspace.md`. It must be a single path segment and must not be `.`, `..`, or contain `/`. Use an existing project or user-provided identifier. If no identifier has been established, ask the user rather than deriving one silently from a branch name.

### Repository Branch Workspace

Every active participating repository branch has its own workspace under `branches/<repository>/<normalized-branch>/`.

Each repository branch workspace follows this structure:

```
branches/<repository>/<normalized-branch>/
├── README.md      # Repository branch overview and feature workspace reference
├── overlay.md     # Repository-specific project knowledge
└── journal.md     # Repository execution state and resume point
```

Store only `README.md`, `overlay.md`, and `journal.md` in a repository branch workspace. Plans, research, reviews, reports, assets, notes, investigations, and feature documentation belong in the feature workspace.

Resolve `<normalized-branch>` using this procedure:

1. Search active `branches/<repository>/*/README.md` files for the exact repository and exact branch name. Exclude `archive/` from this search.
2. If exactly one matching workspace exists, use its recorded normalized directory identifier and verify that it matches the actual directory name.
3. If more than one matching workspace exists, stop and report the duplicate mapping to the user.
4. If no matching workspace exists, compute the base identifier by replacing `/` characters with `-`. Do not remove leading branch types such as `feat/`, `fix/`, or `chore/`.
5. If the base directory does not exist, use the base identifier.
6. If the base directory exists and its `README.md` records the same exact repository and branch, reuse it. If branch identity metadata is missing, stop and ask the user rather than inferring ownership.
7. If the base directory exists for a different exact branch, use `<base-normalized-branch>--<hash>`, where `<hash>` is the first 12 hexadecimal characters of the SHA-256 digest of the exact branch name encoded as UTF-8.
8. Verify any hash-suffixed directory in the same way before using it. If its recorded branch differs or branch identity metadata is missing, stop and ask the user rather than merging or overwriting workspace state.

The resulting base or hash-suffixed value is `<normalized-branch>`. Always record the exact repository name, exact branch name, and `<normalized-branch>` in `README.md`.

Example:

```
feat/custom-domain
```

becomes

```
feat-custom-domain
```

A feature implemented in matching branches across `platform` and `arvasit-ui` therefore uses:

```
branches/
├── platform/
│   └── feat-custom-domain/
└── arvasit-ui/
    └── feat-custom-domain/
```

### Workspace Discovery

Workspace discovery identifies file locations only; it does not load project knowledge or change context authority. The orchestrator may perform this metadata-only discovery before the context loading order.

For each participating repository:

1. Determine the exact current branch. No repository branch workspace is required when the branch is `dev`.
2. Resolve `<normalized-branch>` using the collision-safe procedure above.
3. If the branch workspace exists, read only its `README.md` first. Verify that it records the exact repository, exact branch, normalized directory identifier, and canonical `workspaces/<feature>/` reference.
4. Verify that the referenced `workspace.md` exists and lists the same repository and exact branch. If either side of the mapping is missing or inconsistent, stop and report the conflict rather than guessing.
5. If the branch workspace does not exist, search active `workspaces/*/workspace.md` files for the exact repository and branch pair. Exclude `archive/` from this search.
   - If exactly one feature workspace matches, use that mapping and initialize the missing branch workspace according to **Branch Initialization**.
   - If no workspace matches and the user's request identifies an unambiguous feature, initialize and link that feature workspace according to **Branch Initialization**.
   - If no feature is identified or more than one workspace matches, ask the user before creating or linking any workspace.

After discovery is complete, follow [Context Loading](context-loading.md). Reading `README.md` for discovery does not give it authority over any context file.

### Context Responsibilities

Each context file has a distinct responsibility.

#### `ai/context.md`

Contains the stable project baseline.

Store:

- Architecture
- Project conventions
- Shared implementation patterns
- Stable workflows
- Long-lived technical decisions
- Other project knowledge that applies across branches

#### `ai/learned-rules.md`

Contains verified, long-lived preventive guidance derived from previous mistakes, incidents, reviews, or implementation outcomes. It does not describe the current project baseline and must not duplicate `ai/context.md`.

Store:

- Reusable preventive engineering lessons
- Common failure modes and how to avoid them
- Proven checks or practices that prevent recurrence
- The conditions under which each lesson applies

Do not store:

- Current architecture, project conventions, stable workflows, or implementation facts that belong in `ai/context.md`
- Feature-specific information
- Branch-specific implementation details
- Temporary workarounds
- Execution state
- One-off mistakes that are unlikely to recur

#### `workspace.md`

Contains the feature-level overview and shared knowledge for one logical feature, bug, enhancement, investigation, or task.

Record:

- Feature name
- Feature directory identifier
- Overall status
- Participating repositories
- Active branch for each repository
- Current milestone
- Feature-level summary

Store plans, research, design reviews, implementation reports, screenshots, HAR files, diagrams, notes, investigations, and feature documentation in the corresponding directories beside `workspace.md`.

#### `overlay.md`

Contains repository-specific project knowledge that differs from the `dev` baseline.

Store:

- Repository-specific architectural decisions
- Repository implementation differences
- Repository-specific design decisions
- New repository implementation details
- Explicitly labeled provisional assumptions, including their reason and required validation
- Constraints, labeled as verified or provisional
- Risks, labeled as verified or provisional and clearly distinguished from facts
- Any temporary project knowledge that is true only for the current repository branch

Do not store plans, research, reviews, reports, notes, assets, or other feature documents in `overlay.md`.

For conflict resolution and precedence, follow [Context Authority](core-context-rules.md#context-authority).

#### `journal.md`

Contains repository execution state only.

Use it as the repository branch's resume point.

Store:

- Current repository execution step
- Repository implementation progress
- Completed repository work
- Verification status needed to resume
- Remaining repository tasks
- Repository blockers
- Exact next repository action

Do **not** treat `journal.md` as project context or use it to store feature documents. It records **where repository work stands**, not **what is true about the project**.

### Branch Initialization

When a new repository branch is created, automatically scaffold its repository branch workspace if it does not already exist. Apply the same initialization when **Workspace Discovery** finds an existing non-`dev` branch with a uniquely identified feature workspace but no repository branch workspace.

Create:

- `branches/<repository>/<normalized-branch>/README.md`
- `branches/<repository>/<normalized-branch>/overlay.md`
- `branches/<repository>/<normalized-branch>/journal.md`

Do not create any other files or directories inside the repository branch workspace.

If the feature workspace does not already exist, create:

- `workspaces/<feature>/workspace.md`
- `workspaces/<feature>/plan/`
- `workspaces/<feature>/research/`
- `workspaces/<feature>/review/`
- `workspaces/<feature>/reports/`
- `workspaces/<feature>/assets/`
- `workspaces/<feature>/notes/`

Each feature workspace directory should contain a `.gitkeep` if empty.

Initialize:

- `workspace.md` with the feature name, feature directory identifier, overall status, participating repositories, active branch for each repository, current milestone, and feature-level summary.
- `README.md` with the exact repository name, exact branch name, normalized directory identifier, a short repository branch summary, the canonical feature workspace reference, and an index of `overlay.md` and `journal.md`.
- `overlay.md` with section headings only.
- `journal.md` using the standard project template.

If the feature workspace already exists, update `workspace.md` with the participating repository and its active branch.

Never copy content from `ai/context.md` into either workspace. The baseline is loaded separately, and duplicating it creates stale documentation. Never duplicate feature documents inside a repository branch workspace.

### Progress Journal

`journal.md` is the authoritative repository execution state and resume point for the current branch. It ensures work can continue after interruptions, new sessions, context compaction, or agent restarts.

Update `journal.md` whenever:

- A meaningful repository implementation step is completed.
- The repository execution approach changes.
- Verification changes the repository's execution state.
- A blocker is discovered or resolved.
- A work session ends.

Always keep **Last left off** accurate so work can resume immediately.

Use the following template:

```
# Progress Journal — <repository> / <branch>

**Feature workspace:**
`workspaces/<feature>/`

**Current step:**
What is currently being executed in this repository.

**Approach:**
Repository-specific implementation strategy and execution steps.

**Done:**
Completed repository work.

**Verification:**
Verification status and results required to resume work.

**Remaining:**
Outstanding repository work.

**Last left off:**
<Date> — Exact resume point, next action, and any blockers.
```

Feature plans and implementation reports belong in the feature workspace. Do not copy them into `journal.md`; record only the repository progress necessary to resume execution.
