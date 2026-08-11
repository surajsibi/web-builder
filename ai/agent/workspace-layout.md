## Workspace Layout

The development environment consists of two complementary parts:

- Project Git repositories (for example `arvasit-ui` and `platform`), which contain application source code.
- The agent workspace (`ai/`, `workspaces/`, `branches/`, and `archive/`), which stores planning, project knowledge, repository execution state, and supporting artifacts for those repositories.

The agent workspace is organized into four logical areas:

- `ai/` stores global AI configuration, stable project context, and shared learned rules.
- `workspaces/` stores feature-level planning, research, reports, and supporting documentation.
- `branches/` stores repository-specific branch context and execution state.
- `archive/` stores completed feature and repository branch workspaces that are no longer active.

```
agent-workspace/
├── ai/
│   ├── context.md
│   └── learned-rules.md
├── workspaces/
│   └── <feature>/
│       ├── workspace.md
│       ├── plan/
│       ├── research/
│       ├── review/
│       ├── reports/
│       ├── assets/
│       └── notes/
├── branches/
│   └── <repository>/
│       └── <normalized-branch>/
│           ├── README.md
│           ├── overlay.md
│           └── journal.md
└── archive/
    ├── workspaces/
    │   └── <feature>/
    └── branches/
        └── <repository>/
            └── <normalized-branch>/
```

For the contents and responsibilities of individual context files, see [Context Responsibilities](feature-branch-workspaces.md#context-responsibilities). `archive/` contains recoverable completed workspaces and is excluded from active context discovery and loading.
